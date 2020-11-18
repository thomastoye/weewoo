import spawnAsync from '@expo/spawn-async'
import getPort from 'get-port'
import { v4 } from 'uuid'
import got from 'got'
import { createDockerCommand } from './helpers/create-docker-command'
import { Firestore } from '@google-cloud/firestore'
import { logger } from './helpers/logger'

export const createFirestore = async (): Promise<FirestoreForTesting> => {
  const firestorePort = await getPort()
  const containerName = 'weewoo-integration-test-firestore-' + v4().slice(0, 8)

  const command = createDockerCommand({
    name: containerName,
    image:
      'docker.pkg.github.com/ridedott/firestore-emulator-docker/firestore-emulator:latest',
    ports: {
      [firestorePort]: 8080,
    },
    environment: {},
  })

  logger.debug('Spawning Docker command: ', command)
  await spawnAsync(command.split(' ')[0], command.split(' ').slice(1))

  const firestore = new FirestoreForTesting(containerName, firestorePort)

  logger.debug('Waiting until Firestore is ready...')
  await firestore.waitUntilReady()
  logger.debug('Firestore is ready!')

  return firestore
}

export class FirestoreForTesting {
  #containerName: string
  #port: number
  #connection: Firestore | null = null

  constructor(containerName: string, port: number) {
    this.#containerName = containerName
    this.#port = port
  }

  get connection(): Firestore {
    if (this.#connection == null) {
      this.#connection = new Firestore({
        host: 'localhost',
        port: this.#port,
        ssl: false,
        projectId: `integration-test-${this.#containerName}`,
      })
    }

    return this.#connection
  }

  get url(): string {
    return `localhost:${this.#port}`
  }

  get healthUrl(): string {
    return `http://${this.url}/`
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
        return reject(new Error('Firestore did not start in time'))
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
          logger.silly('Firestore not ready yet...')
        }
      }, 300)
    })
  }

  async dump(): Promise<Record<string, Record<string, unknown>>> {
    const collections = await this.connection.listCollections()

    const dump = await Promise.all(
      collections.map(async (collection) => {
        return [collection.id, await this.dumpCollection(collection)]
      })
    )

    return Object.fromEntries(dump)
  }

  async stop(): Promise<void> {
    logger.debug('Stopping Firestore...')
    await this.connection.terminate()
    logger.silly('Terminated Firestore connection')
    await spawnAsync('docker', ['kill', this.#containerName])
    logger.silly(`Executed docker kill ${this.#containerName}`)
  }

  private async dumpCollection(
    collection: FirebaseFirestore.CollectionReference<
      FirebaseFirestore.DocumentData
    >
  ): Promise<Record<string, unknown>> {
    const allDocs = await Promise.all(
      (await collection.listDocuments()).map(async (reference) => {
        return [reference.id, (await reference.get()).data()]
      })
    )

    return Object.fromEntries(allDocs)
  }
}
