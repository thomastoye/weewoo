import {
  EventStoreConnection,
  JSONRecordedEvent,
  ResolvedEvent,
  subscribeToAll,
} from '@eventstore/db-client'
import { Firestore } from '@google-cloud/firestore'

export type ProjectorOptions = {
  /* Stop the projector when an event of this type is received on the specified stream */
  stopOnEncounteringEvent?: {
    streamId: string
    eventType: string
  }

  // /* Start at this commit offset */
  // startCommitOffset: null | number

  maxBatchSize: number
  maxQueueTimeMs: number
}

export class EsdbToFirestoreProjector {
  #name: string
  #connection: EventStoreConnection
  #firestore: Firestore
  #stopOnEncounteringEvent: {
    streamId: string
    eventType: string
  } | null
  #handleEvent: (
    event: JSONRecordedEvent,
    batch: FirebaseFirestore.WriteBatch
  ) => Promise<void>
  #maxBatchSize: number
  #maxQueueTimeMs: number
  #started = false

  constructor(
    name: string,
    connection: EventStoreConnection,
    firestore: Firestore,
    handleEvent: (
      event: JSONRecordedEvent,
      batch: FirebaseFirestore.WriteBatch
    ) => Promise<void>,
    options: ProjectorOptions
  ) {
    this.#name = name
    this.#connection = connection
    this.#firestore = firestore
    this.#stopOnEncounteringEvent = options.stopOnEncounteringEvent || null
    this.#handleEvent = handleEvent
    this.#maxBatchSize = options.maxBatchSize
    this.#maxQueueTimeMs = options.maxQueueTimeMs
  }

  async start(): Promise<void> {
    if (this.#started) {
      throw new Error('Projection was already started')
    }

    this.#started = true

    const subscription = await subscribeToAll()
      .fromStart()
      .doNotResolveLink()
      .execute(this.#connection)

    let batch = this.#firestore.batch()
    let runningBatchStart = process.hrtime()
    let runningBatchSize = 0
    for await (const resolvedEvent of subscription) {
      if (resolvedEvent.event != null && resolvedEvent.event.isJson) {
        // TODO error handling
        await this.#handleEvent(resolvedEvent.event, batch)
      }

      runningBatchSize++

      const sinceBatchStart = process.hrtime(runningBatchStart)
      if (
        runningBatchSize >= this.#maxBatchSize ||
        sinceBatchStart[0] ||
        this.isTerminalEvent(resolvedEvent)
      ) {
        batch.set(this.#firestore.collection('projector').doc(this.#name), {
          commitOffset: resolvedEvent.commitPosition,
        })
        await batch.commit()
        batch = this.#firestore.batch()
        runningBatchSize = 0
        runningBatchStart = process.hrtime()
      }

      if (this.isTerminalEvent(resolvedEvent)) {
        subscription.unsubscribe()
        break
      }
    }
  }

  isTerminalEvent(resolvedEvent: ResolvedEvent): boolean {
    return (
      this.#stopOnEncounteringEvent != null &&
      resolvedEvent.event?.streamId ===
        this.#stopOnEncounteringEvent.streamId &&
      resolvedEvent.event.eventType === this.#stopOnEncounteringEvent.eventType
    )
  }
}

export const projectPosition = async (
  connection: EventStoreConnection,
  firestore: Firestore
): Promise<void> => {
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
        eventType: 'EndIntegrationTest',
      },
      maxBatchSize: 100,
      maxQueueTimeMs: 200,
    }
  )

  return projector.start()
}
