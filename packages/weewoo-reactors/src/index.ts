import { EventStoreDBClient } from '@eventstore/db-client'
import { Firestore } from '@google-cloud/firestore'
import { createLoraDeviceInformationProjector } from './projections/lora-device-information/lora-device-information-projector'

if (
  process.env.EVENTSTORE_HOST == null ||
  process.env.EVENTSTORE_USER == null ||
  process.env.EVENTSTORE_PASS == null ||
  process.env.GCP_PROJECT_ID == null ||
  process.env.GCP_CLIENT_EMAIL == null ||
  process.env.GCP_PRIVATE_KEY == null
) {
  throw new Error('Not all expected env vars were set!')
}

const eventStoreClient = new EventStoreDBClient(
  {
    endpoint: process.env.EVENTSTORE_HOST,
  },
  {
    insecure: false,
  },
  {
    username: process.env.EVENTSTORE_USER,
    password: process.env.EVENTSTORE_PASS,
  }
)

const firestore = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\\\/g, '\\').replace(
      /\\n/g,
      '\n'
    ),
  },
})

const deviceInformationProjector = createLoraDeviceInformationProjector(
  eventStoreClient,
  firestore
)

deviceInformationProjector.start()
