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
  logger.debug(`Firestore is ready on ${firestore.url}!`)

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
      const cleanUps: (() => void)[] = []
      const cleanUp = () => {
        logger.silly(
          `Doing ${cleanUps.length} clean-ups now that Firestore is ready...`
        )
        return cleanUps.forEach((doClean) => doClean())
      }

      const timeout = setTimeout(() => {
        cleanUp()
        return reject(new Error('Firestore did not start in time'))
      }, 9000)

      cleanUps.push(() => clearTimeout(timeout))

      const interval = setInterval(async () => {
        try {
          const req = got(this.healthUrl, {
            throwHttpErrors: false,
            dnsCache: false,
          })

          // (Cancelling a finished request does nothing)
          cleanUps.push(() => req.cancel())

          const health = await req

          if (health.statusCode >= 200 && health.statusCode < 300) {
            cleanUp()
            resolve()
          }
        } catch (err) {
          if (err.name === 'CancelError') {
            // Ignore
          } else {
            logger.silly('Firestore not ready yet...', err)
          }
        }
      }, 100)

      cleanUps.push(() => clearInterval(interval))
    })
  }

  async dumpComplete(): Promise<Record<string, Record<string, unknown>>> {
    const collections = await this.connection.listCollections()

    const dump = await Promise.all(
      collections.map(async (collection) => {
        return [collection.id, await this.dumpCollection(collection.id)]
      })
    )

    return Object.fromEntries(dump)
  }

  async stop(): Promise<void> {
    logger.debug('Stopping Firestore...')
    await this.connection.terminate()
    logger.silly('Terminated Firestore connection')
    await spawnAsync('docker', [
      'kill',
      '--signal=SIGKILL',
      this.#containerName,
    ])
    logger.silly(`Executed docker kill --signal=SIGKILL ${this.#containerName}`)
  }

  async dumpCollection(collectionId: string): Promise<Record<string, unknown>> {
    const allDocs = await Promise.all(
      (await this.connection.collection(collectionId).listDocuments()).map(
        async (reference) => {
          return [reference.id, (await reference.get()).data()]
        }
      )
    )

    return Object.fromEntries(allDocs)
  }
}
