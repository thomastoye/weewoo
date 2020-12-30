import { Firestore } from '@google-cloud/firestore'
import { EventStoreDBClient, JSONRecordedEvent } from '@eventstore/db-client'
import inquirer from 'inquirer'
import { execSync } from 'child_process'
import { WeewooEvent } from '@toye.io/weewoo-event-definitions'
import { EsdbToFirestoreProjector } from '@toye.io/weewoo-esdb-to-firestore-projector'

export const createProjector = async (
  connection: EventStoreDBClient,
  firestore: Firestore
): Promise<EsdbToFirestoreProjector> => {
  const handleEvent = async (
    event: JSONRecordedEvent,
    batch: FirebaseFirestore.WriteBatch
  ) => {
    if (
      ![
        'LGT92MessageReceivedWithLocation',
        'LGT92MessageReceivedWithoutLocation',
      ].includes(event.type) ||
      !event.streamId.startsWith('LGT92-')
    ) {
      return
    }

    const data = event.data as
      | WeewooEvent['LGT92MessageReceivedWithLocation']
      | WeewooEvent['LGT92MessageReceivedWithoutLocation']

    batch.set(
      firestore.collection('lora-device-information').doc(event.streamId),
      {
        batteryVoltage: data.batteryVoltage,
        isInAlarmState: data.isInAlarmState,
        lastReceivedAt: data.lora.receivedAtMs,
        lastRSSI: data.lora.baseStationRSSI,
        deviceEUI: data.lora.devEUI,
      },
      { merge: true }
    )

    if (event.type === 'LGT92MessageReceivedWithLocation') {
      const locationPayload = event.data as WeewooEvent['LGT92MessageReceivedWithLocation']

      batch.set(
        firestore.collection('lora-device-information').doc(event.streamId),
        {
          locationWGS84: {
            receivedAt: locationPayload.lora.receivedAtMs,
            lat: locationPayload.locationWGS84.lat,
            lng: locationPayload.locationWGS84.lng,
          },
        },
        { merge: true }
      )
    }
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
    `yarn run --silent firebase functions:config:get --project=weewoo-prod 2>/dev/null`
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
  console.log(`Use <arrow down> and <enter> to quit`)

  projector.start()

  await inquirer.prompt({
    type: 'list',
    name: 'quit',
    message: 'Stop projector and emulator?',
    choices: ['Yes, quit.'],
  })

  await projector.stop()
  await firestoreEmulator.terminate()
})()
