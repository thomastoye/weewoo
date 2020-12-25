import { Firestore } from '@google-cloud/firestore'
import { EventStoreDBClient, JSONRecordedEvent } from '@eventstore/db-client'
import inquirer from 'inquirer'
import { EsdbToFirestoreProjector } from './eventstoredb-to-firestore-projector'
import { execSync } from 'child_process'

export const createProjector = async (
  connection: EventStoreDBClient,
  firestore: Firestore
): Promise<EsdbToFirestoreProjector> => {
  const handleEvent = async (
    event: JSONRecordedEvent,
    batch: FirebaseFirestore.WriteBatch
  ) => {
    if (
      event.eventType !== 'LGT92MessageReceivedWithLocation' ||
      !event.streamId.startsWith('LGT92-')
    ) {
      return
    }

    batch.set(firestore.collection('position').doc(event.streamId), {
      lastKnownPosition: (event.data as any).locationWGS84,
    })
  }

  const projector = new EsdbToFirestoreProjector(
    'custom-projector-test',
    connection,
    firestore,
    handleEvent,
    {
      maxBatchSize: 100,
      maxQueueTimeMs: 2000,
    }
  )

  return projector
}

const firestoreEmulatorAddress = process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS
const projectId = process.env.GCLOUD_PROJECT

const eventstoreConfig = JSON.parse(
  execSync(
    'yarn run --silent firebase functions:config:get --project=weewoo-prod 2>/dev/null'
  ).toString()
).eventstore

const eventstoreClient = new EventStoreDBClient(
  {
    endpoint: eventstoreConfig.host,
  },
  {},
  {
    password: eventstoreConfig.password,
    username: eventstoreConfig.username,
  }
)

if (firestoreEmulatorAddress == null) {
  throw new Error(`FIREBASE_FIRESTORE_EMULATOR_ADDRESS not set`)
}

if (projectId == null) {
  throw new Error(`GCLOUD_PROJECT not set`)
}

const firestoreEmulator = new Firestore({
  host: firestoreEmulatorAddress.split(':')[0],
  port: parseInt(firestoreEmulatorAddress.split(':')[1], 10),
  ssl: false,
  projectId,
})

;(async () => {
  const projector = await createProjector(eventstoreClient, firestoreEmulator)
  console.log(`ESDB host      : ${eventstoreConfig.host}`)
  console.log(`Emulator UI    : http://localhost:4000/firestore`)
  console.log(`Projector name : ${projector.projectorName}`)

  projector.start()

  await inquirer.prompt({
    type: 'list',
    name: 'quit',
    message: 'End emulator?',
    choices: ['Yes, quit'],
  })

  await projector.stop()
  await firestoreEmulator.terminate()
})()
