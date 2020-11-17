import spawnAsync from '@expo/spawn-async'
import getPort from 'get-port'
import { v4 } from 'uuid'
import { EventStoreConnection } from '@eventstore/db-client'
import got from 'got'
import { createDockerCommand } from './helpers/create-docker-command'
import { logger } from './helpers/logger'

export const createEventStore = async (): Promise<EventStoreForTesting> => {
  const grpcPort = await getPort()
  const containerName = 'weewoo-integration-test-eventstore-' + v4().slice(0, 8)

  const command = createDockerCommand({
    name: containerName,
    image: 'eventstore/eventstore:20.6.1-buster-slim',
    command:
      '--insecure --ext-ip 0.0.0.0 --int-ip 0.0.0.0 --enable-atom-pub-over-http',
    ports: {
      [grpcPort]: 2113,
    },
    environment: {
      EVENTSTORE_CLUSTER_SIZE: '1',
      EVENTSTORE_RUN_PROJECTIONS: 'All',
      EVENTSTORE_START_STANDARD_PROJECTIONS: 'True',
      EVENTSTORE_DB: '/var/lib/eventstore-data',
      EVENTSTORE_INDEX: '/var/lib/eventstore-index',
      EVENTSTORE_LOG: '/var/log/eventstore',
      EVENTSTORE_EXT_TCP_PORT: '1113',
      EVENTSTORE_EXT_HTTP_PORT: '2113',
    },
    user: '0:0', // TODO currently needed because the Docker image has permission issues
  })

  logger.debug('Spawning Docker command: ', command)
  await spawnAsync(command.split(' ')[0], command.split(' ').slice(1))

  const es = new EventStoreForTesting(containerName, grpcPort)

  logger.debug('Waiting until EventStore is ready...')
  await es.waitUntilReady()
  logger.debug('EventStore ready!')

  return es
}

export class EventStoreForTesting {
  #containerName: string
  #port: number
  #connection: EventStoreConnection | null = null

  constructor(containerName: string, port: number) {
    this.#containerName = containerName
    this.#port = port
  }

  get connection(): EventStoreConnection {
    if (this.#connection == null) {
      this.#connection = EventStoreConnection.builder()
        .insecure()
        .singleNodeConnection(this.url)
    }

    return this.#connection
  }

  get url(): string {
    return `localhost:${this.#port}`
  }

  get healthUrl(): string {
    return `http://${this.url}/health/live`
  }

  async waitUntilReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeout: NodeJS.Timeout | null = null
      let interval: NodeJS.Timeout | null = null

      const cleanUpTimers = () => {
        if (timeout != null) {
          clearTimeout(timeout)
        }
        if (interval != null) {
          clearInterval(interval)
        }
      }

      timeout = setTimeout(() => {
        cleanUpTimers()
        logger.error('EventStore did not start in time!')
        return reject(new Error('EventStore did not start in time'))
      }, 9000)

      interval = setInterval(async () => {
        try {
          const health = await got(this.healthUrl, {
            throwHttpErrors: false,
            dnsCache: false,
          })

          if (health.statusCode >= 200 && health.statusCode < 300) {
            cleanUpTimers()
            resolve()
          }
        } catch (err) {
          // Ignore
          logger.silly('EventStore not ready yet')
        }
      }, 1000)
    })
  }

  async stop(): Promise<void> {
    logger.debug('Stopping EventStore...')
    await this.connection.close()
    logger.silly('Closed EventStore connection')
    await spawnAsync('docker', ['stop', this.#containerName])
    logger.silly(`Executed docker stop ${this.#containerName}`)
  }
}
