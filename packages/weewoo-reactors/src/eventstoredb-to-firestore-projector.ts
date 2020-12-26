import {
  AllStreamResolvedEvent,
  EventStoreDBClient,
  JSONRecordedEvent,
  ResolvedEvent,
} from '@eventstore/db-client'
import { Firestore } from '@google-cloud/firestore'
import { Logger } from 'tslog'
import { Readable, pipeline } from 'stream'
import { promisify } from 'util'
import { BatchWithTimeoutTransform } from './streams/batch-with-timeout-stream-transform'
import {
  destroyReadableOnTerminalEventTransform,
  TerminalEventReceivedError,
} from './streams/destroy-on-terminal-event-transform'
import { createFilterTransform } from './streams/filter-transform'
import { commitFirestoreBatchWritable } from './streams/commit-firestore-batch-writable'
import { performSideEffectsTransform } from './streams/perform-side-effects-transform'
import delay from 'delay'
import { CustomError } from 'ts-custom-error'

const pipelineAsync = promisify(pipeline)

export class ProjectorStoppedError extends CustomError {
  public constructor() {
    super()
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

  maxBatchSize: number
  maxQueueTimeMs: number
}

type HandleEvent = (
  event: JSONRecordedEvent,
  batch: FirebaseFirestore.WriteBatch
) => Promise<void>

export class EsdbToFirestoreProjector {
  #connection: EventStoreDBClient
  #stopOnEncounteringEvent: {
    streamId: string
    eventType: string
  } | null
  #handleEvent: HandleEvent
  #started = false
  #logger: Logger
  #firestore: Firestore
  #maxBatchSize: number
  #maxQueueTimeMs: number
  #projectorName: string
  #stopFun: (() => void) | null = null

  constructor(
    name: string,
    connection: EventStoreDBClient,
    firestore: Firestore,
    handleEvent: HandleEvent,
    options: ProjectorOptions
  ) {
    this.#logger = new Logger({ name: `projector-esdb2firestore-${name}` })
    this.#connection = connection
    this.#stopOnEncounteringEvent = options.stopOnEncounteringEvent || null
    this.#handleEvent = handleEvent
    this.#projectorName = name
    this.#maxBatchSize = options.maxBatchSize
    this.#maxQueueTimeMs = options.maxQueueTimeMs
    this.#firestore = firestore
  }

  async start(): Promise<void> {
    if (this.#started) {
      throw new Error('Projection was already started')
    }

    this.#started = true

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const startAfterCommitPosition:
        | bigint
        | null = await this.getLastSuccessfulCommitPosition()
      const projectorResult = await this.startAfterCommitPosition(
        startAfterCommitPosition
      )

      if (projectorResult.status !== 'error') {
        this.#logger.info(`Projector done successfully!`)
        return
      } else {
        const randomDelay = Math.round(Math.random() * 1000 * 5)
        this.#logger.warn(
          `Projector hit a snag, restarting in ${randomDelay}ms. Error was`,
          projectorResult.error
        )

        await delay(randomDelay)
      }
    }
  }

  async startAfterCommitPosition(
    position: bigint | null
  ): Promise<
    | {
        status: 'error'
        error: Error
      }
    | { status: 'success'; reason: string }
  > {
    this.#logger.debug(`Starting after commit position ${position}`)

    const subscription = this.#connection.subscribeToAll({
      fromPosition:
        position == null
          ? 'start'
          : {
              commit: position,
              prepare: position,
            },
    })

    const readable = Readable.from(subscription, {
      highWaterMark: this.#maxBatchSize * 5,
    })

    this.#stopFun = () => readable.destroy(new ProjectorStoppedError())

    const isTerminalEvent = (resolvedEvent: ResolvedEvent): boolean => {
      return (
        this.#stopOnEncounteringEvent != null &&
        resolvedEvent.event?.streamId ===
          this.#stopOnEncounteringEvent.streamId &&
        resolvedEvent.event.eventType ===
          this.#stopOnEncounteringEvent.eventType
      )
    }

    try {
      await pipelineAsync([
        readable,
        createFilterTransform<AllStreamResolvedEvent>(
          (ev) =>
            ev.event != null && ev.event.isJson && ev.commitPosition != null,
          this.#logger
        ),
        destroyReadableOnTerminalEventTransform(
          isTerminalEvent,
          readable,
          this.#logger
        ),
        new BatchWithTimeoutTransform(
          this.#maxBatchSize,
          this.#maxQueueTimeMs,
          this.#logger
        ),
        performSideEffectsTransform(
          this.#handleEvent,
          this.projectorDocument,
          () => this.#firestore.batch(),
          this.#logger
        ),
        commitFirestoreBatchWritable(this.#logger),
      ])
    } catch (err) {
      subscription.unsubscribe()
      if (err instanceof TerminalEventReceivedError) {
        return {
          status: 'success',
          reason: 'terminal event received',
        }
      }

      if (err instanceof ProjectorStoppedError) {
        return {
          status: 'success',
          reason: 'projector stopped',
        }
      }

      return {
        status: 'error',
        error: err,
      }
    }

    subscription.unsubscribe()
    return { status: 'success', reason: 'end of stream' }
  }

  async stop(): Promise<void> {
    if (this.#stopFun == null) {
      this.#logger.warn('Tried to stop projector that was not running')
    } else {
      this.#stopFun()
      this.#stopFun = null
    }
  }

  get projectorName(): string {
    return this.#projectorName
  }

  async getLastSuccessfulCommitPosition(): Promise<bigint | null> {
    const doc = await this.projectorDocument.get()

    if (doc == null || !doc.exists) {
      return null
    }

    try {
      return BigInt(doc.data()?.commitPosition)
    } catch (err) {
      return null
    }
  }

  private get projectorDocument(): FirebaseFirestore.DocumentReference<{
    commitPosition: string
  }> {
    return this.#firestore
      .collection('projector')
      .doc(this.#projectorName) as FirebaseFirestore.DocumentReference<{
      commitPosition: string
    }>
  }
}
