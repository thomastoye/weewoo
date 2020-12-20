import {
  AllStreamJSONRecordedEvent,
  AllStreamResolvedEvent,
  EventStoreDBClient,
  JSONRecordedEvent,
  ResolvedEvent,
} from '@eventstore/db-client'
import { Firestore } from '@google-cloud/firestore'
import { Logger } from 'tslog'
import { Readable, pipeline, Transform, Writable } from 'stream'
import { promisify } from 'util'
import { BatchWithTimeoutTransform } from './streams/batch-with-timeout-stream-transform'
import {
  destroyReadableOnTerminalEventTransform,
  TerminalEventReceivedError,
} from './streams/destroy-on-terminal-event-transform'
// import pRetry from 'p-retry'
// import pSeries from 'p-series'

const pipelineAsync = promisify(pipeline)

const maxBigint = (arr: readonly bigint[]): bigint =>
  arr.reduce((highest, curr) => (highest > curr ? highest : curr), arr[0])

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
      const startAfter:
        | {
            status: 'error'
            lastSuccessfulCommitPosition: bigint | null
            error: Error
          }
        | {
            status: 'success'
          } = await this.startAfterCommitPosition(startAfterCommitPosition)

      if (startAfter.status !== 'error') {
        this.#logger.debug(`Projector done successfully`)
        return
      } else {
        this.#logger.warn(
          `Projector hit a snag, restarting. Last successful commit position was ${startAfter.lastSuccessfulCommitPosition}. Error was`,
          startAfter.error
        )
      }
    }
  }

  async startAfterCommitPosition(
    position: bigint | null
  ): Promise<
    | {
        status: 'error'
        lastSuccessfulCommitPosition: null | bigint
        error: Error
      }
    | { status: 'success'; reason: string }
  > {
    const subscription = await this.#connection.subscribeToAll({
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

    const isTerminalEvent = (resolvedEvent: ResolvedEvent): boolean => {
      return (
        this.#stopOnEncounteringEvent != null &&
        resolvedEvent.event?.streamId ===
          this.#stopOnEncounteringEvent.streamId &&
        resolvedEvent.event.eventType ===
          this.#stopOnEncounteringEvent.eventType
      )
    }
    const firestore = this.#firestore
    const logger = this.#logger
    const projectorPositionDoc = this.#firestore
      .collection('projector')
      .doc(this.#projectorName)
    const handleEvent = this.#handleEvent

    await pipelineAsync([
      readable,
      new Transform({
        objectMode: true,
        // highWaterMark: 200,
        transform(ev: AllStreamResolvedEvent, enc, callback) {
          if (
            ev.event != null &&
            ev.event.isJson &&
            ev.commitPosition != null
          ) {
            callback(null, ev)
          } else {
            callback()
          }
        },
      }),
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
      new Writable({
        objectMode: true,
        highWaterMark: 30,
        write(batch: readonly AllStreamResolvedEvent[], enc, callback) {
          const writeBatch = firestore.batch()
          const highestCommitOffset = maxBigint(
            batch
              .map((ev) => ev.commitPosition)
              .filter((pos) => pos != null) as bigint[]
          )

          // pSeries(
          //   batch.map((ev) => () =>
          //     pRetry(
          //       () =>
          //         handleEvent(
          //           ev.event as AllStreamJSONRecordedEvent,
          //           writeBatch
          //         ),
          //       {
          //         retries: 3,
          //         maxTimeout: 1000,
          //         randomize: true,
          //         onFailedAttempt: (err) => {
          //           logger.warn(
          //             `Could not perform side effect for event at commit offset ${ev.commitPosition}. Attempt ${err.attemptNumber}, ${err.retriesLeft} retries left. Error: ${err.message}`
          //           )
          //         },
          //       }
          //     )
          //   )
          // )

          Promise.all(
            batch.map((ev) =>
              handleEvent(ev.event as AllStreamJSONRecordedEvent, writeBatch)
            )
          )
            .then(() => {
              writeBatch.set(projectorPositionDoc, {
                commitPosition: highestCommitOffset,
              })
            })
            .then(() => writeBatch.commit())
            .then(() => {
              logger.info(
                `Writeable committed! Commit offset: ${highestCommitOffset}.`
              )
              callback()
            })
            .catch((err) => callback(err))
        },
      }),
    ]).catch((err) => {
      if (!(err instanceof TerminalEventReceivedError)) {
        throw err
      }
    })

    logger.debug('Done with pipeline')

    return { status: 'success', reason: 'end of stream' }
  }

  async getLastSuccessfulCommitPosition(): Promise<bigint | null> {
    const doc = await this.#firestore
      .collection('projector')
      .doc(this.#projectorName)
      .get()

    if (doc == null || !doc.exists) {
      return null
    }

    const data = doc.data()

    if (data == null) {
      return null
    }

    return data.commitPosition || null
  }
}
