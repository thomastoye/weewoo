import {
  EventStoreConnection,
  JSONRecordedEvent,
  subscribeToAll,
} from '@eventstore/db-client'
import { Firestore } from '@google-cloud/firestore'

export type CommitPositionCheckpointer = {
  getLastPosition: () => Promise<bigint | null>
  savePosition: (position: bigint) => Promise<void>
}

export class InMemoryCheckpointer implements CommitPositionCheckpointer {
  #position: null | bigint = null

  async getLastPosition(): Promise<bigint | null> {
    return this.#position
  }

  async savePosition(position: bigint): Promise<void> {
    this.#position = position
  }
}

export type ProjectorOptions = {
  /* Stop the projector when an event of this type is received on the specified stream */
  stopOnEncounteringEvent?: {
    streamId: string
    eventType: string
  }

  // /* Start at this commit offset */
  // startCommitOffset: null | number

  saveCommitPositionEveryNRelevantEvents?: number
}

export class Projector {
  #connection: EventStoreConnection
  #stopOnEncounteringEvent: {
    streamId: string
    eventType: string
  } | null
  #relevantEventsHandled = 0
  #saveCommitPositionEveryNRelevantEvents: number | null
  #checkpointer: CommitPositionCheckpointer
  #isRelevantEvent: (event: JSONRecordedEvent) => boolean
  #handleEvent: (event: JSONRecordedEvent) => Promise<void>
  #started = false

  constructor(
    connection: EventStoreConnection,
    isRelevantEvent: (event: JSONRecordedEvent) => boolean,
    handleEvent: (event: JSONRecordedEvent) => Promise<void>,
    checkpointer: CommitPositionCheckpointer,
    options: ProjectorOptions
  ) {
    this.#connection = connection
    this.#stopOnEncounteringEvent = options.stopOnEncounteringEvent || null
    this.#saveCommitPositionEveryNRelevantEvents =
      options.saveCommitPositionEveryNRelevantEvents || null
    this.#checkpointer = checkpointer
    this.#isRelevantEvent = isRelevantEvent
    this.#handleEvent = handleEvent
  }

  async start(): Promise<void> {
    if (this.#started) {
      throw new Error('Projection was already started')
    }

    this.#started = true
    this.#relevantEventsHandled = 0

    const subscription = await subscribeToAll()
      .fromStart()
      .doNotResolveLink()
      .execute(this.#connection)

    for await (const resolvedEvent of subscription) {
      if (
        this.#stopOnEncounteringEvent != null &&
        resolvedEvent.event?.streamId ===
          this.#stopOnEncounteringEvent.streamId &&
        resolvedEvent.event.eventType ===
          this.#stopOnEncounteringEvent.eventType
      ) {
        subscription.unsubscribe()
        break
      }

      if (
        resolvedEvent.event == null ||
        !resolvedEvent.event.isJson ||
        !this.#isRelevantEvent(resolvedEvent.event)
      ) {
        continue
      }

      // TODO error handling
      await this.#handleEvent(resolvedEvent.event)
      this.#relevantEventsHandled++
    }
  }
}

export const projectPosition = async (
  connection: EventStoreConnection,
  firestore: Firestore
): Promise<void> => {
  const isRelevantEvent = (event: JSONRecordedEvent): boolean =>
    event.eventType === 'VehicleMoved'

  const handleEvent = async (event: JSONRecordedEvent) => {
    await firestore.collection('position').doc(event.streamId).set({
      lastKnownPosition: event.data.position,
    })
  }

  const projector = new Projector(
    connection,
    isRelevantEvent,
    handleEvent,
    new InMemoryCheckpointer(),
    {
      stopOnEncounteringEvent: {
        streamId: 'IntegrationTest',
        eventType: 'EndIntegrationTest',
      },
    }
  )

  return projector.start()
}
