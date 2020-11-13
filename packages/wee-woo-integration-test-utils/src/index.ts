import spawnAsync from '@expo/spawn-async'
import getPort from 'get-port'
import { v4 } from 'uuid'
import { EventStoreConnection } from '@eventstore/db-client'
import got from 'got'

type DockerConfig = {
  name: string
  image: string
  command: string
  ports: Record<number, number>
  environment: Record<string, string>
  user?: string
}

/** Given a configuration for a docker container, give the `docker` command that will run it */
const createDockerCommand = (config: DockerConfig): string => {
  const env = Object.entries(config.environment)
    .map(([key, value]) => `-e ${key}=${value}`)
    .join(' ')

  const ports = Object.entries(config.ports)
    .map(([host, container]) => `-p ${host}:${container}`)
    .join(' ')

  const user = config.user == null ? '' : `--user ${config.user}`

  return `docker run -d --rm ${user} --name ${config.name} ${env} ${ports} ${config.image} ${config.command}`
}

export const createEventStore = async (): Promise<EventStoreForTesting> => {
  const grpcPort = await getPort()
  const containerName = 'integration-test-' + v4().slice(0, 8)

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

  await spawnAsync(command.split(' ')[0], command.split(' ').slice(1))

  const es = new EventStoreForTesting(containerName, grpcPort)
  await es.waitUntilReady()

  return es
}

export class EventStoreForTesting {
  #containerName: string
  #port: number

  constructor(containerName: string, port: number) {
    this.#containerName = containerName
    this.#port = port
  }

  get connection(): EventStoreConnection {
    return EventStoreConnection.builder()
      .insecure()
      .singleNodeConnection(this.url)
  }

  get url(): string {
    return `localhost:${this.#port}`
  }

  get healthUrl(): string {
    return `http://${this.url}/health/live`
  }

  async waitUntilReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => reject(new Error('EventStore did not start in time')),
        10000
      )

      const interval = setInterval(async () => {
        try {
          const health = await got(this.healthUrl, {
            throwHttpErrors: false,
            dnsCache: false,
          })

          if (health.statusCode >= 200 && health.statusCode < 300) {
            clearInterval(interval)
            resolve()
          }
        } catch (err) {
          // Ignore
        }
      }, 1000)
    })
  }

  async stop(): Promise<void> {
    await this.connection.close()
    await spawnAsync('docker', ['stop', this.#containerName])
  }
}
