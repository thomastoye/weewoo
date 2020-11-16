import {
  EventStoreConnection,
  JSONRecordedEvent,
  subscribeToAll,
} from '@eventstore/db-client'

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
  /* Stop the projector after handling this many relevant events */
  stopAfter?: number

  // /* Start at this commit offset */
  // startCommitOffset: null | number

  saveCommitPositionEveryNRelevantEvents?: number
}

export class Projector {
  #connection: EventStoreConnection
  #stopAfter: number | null
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
    this.#stopAfter = options.stopAfter || null
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
        resolvedEvent.event == null ||
        !resolvedEvent.event.isJson ||
        !this.#isRelevantEvent(resolvedEvent.event)
      ) {
        continue
      }

      await this.#handleEvent(resolvedEvent.event)
      this.#relevantEventsHandled++

      if (this.shouldStop) {
        subscription.unsubscribe()
        break
      }
    }
  }

  get shouldStop(): boolean {
    if (this.#stopAfter == null) {
      return false
    }

    return this.#relevantEventsHandled >= this.#stopAfter
  }
}

export const projectPosition = async (
  connection: EventStoreConnection,
  stopAfter: number,
  callback: (res: { message: string }) => Promise<void>
): Promise<void> => {
  const isRelevantEvent = (event: JSONRecordedEvent): boolean =>
    event.eventType === 'VehicleMoved'

  const vehicleMovedToString = (
    streamId: string,
    data: Record<string, unknown> | Uint8Array
  ) => {
    if (data == null || data instanceof Uint8Array) {
      return ''
    }

    return `At ${
      data.positionAtTime
    }, position of vehicle ${streamId} was ${JSON.stringify(data.position)}`
  }

  const handleEvent = async (event: JSONRecordedEvent) => {
    callback({
      message: vehicleMovedToString(event.streamId, event.data),
    })
  }

  const projector = new Projector(
    connection,
    isRelevantEvent,
    handleEvent,
    new InMemoryCheckpointer(),
    {
      stopAfter,
    }
  )

  return projector.start()
}
