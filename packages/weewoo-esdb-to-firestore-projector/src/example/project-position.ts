import { EventStoreDBClient, JSONRecordedEvent } from '@eventstore/db-client'
import { Firestore } from '@google-cloud/firestore'
import { EsdbToFirestoreProjector } from '../eventstoredb-to-firestore-projector'

export const projectPosition = async (
  connection: EventStoreDBClient,
  firestore: Firestore
): Promise<EsdbToFirestoreProjector> => {
  const handleEvent = async (
    event: JSONRecordedEvent,
    batch: FirebaseFirestore.WriteBatch
  ) => {
    if (
      event.eventType !== 'VehicleMoved' ||
      !event.streamId.startsWith('Vehicle')
    ) {
      return
    }

    batch.set(firestore.collection('position').doc(event.streamId), {
      lastKnownPosition: (event.data as any).position,
    })
  }

  const projector = new EsdbToFirestoreProjector(
    'position-projector',
    connection,
    firestore,
    handleEvent,
    {
      stopOnEncounteringEvent: {
        streamId: 'IntegrationTest',
        eventType: 'IntegrationTestEnded',
      },
      maxBatchSize: 100,
      maxQueueTimeMs: 2000,
    }
  )

  return projector
}
