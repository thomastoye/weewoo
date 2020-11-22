import {
  EventStoreConnection,
  JSONRecordedEvent,
  ResolvedEvent,
  subscribeToAll,
} from '@eventstore/db-client'
import { Firestore } from '@google-cloud/firestore'
import { BehaviorSubject } from 'rxjs'
import { filter, first } from 'rxjs/operators'
import { Logger } from 'tslog'
import pRetry from 'p-retry'
import pSeries from 'p-series'

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

/**
 * This class provides batching for pushing to Firestore
 * It flushes a batch to Firestore when one of the following happens:
 *  * The deadline for a batch is reached
 *  * The max size for a batch is reached
 *
 * It also provides backpressure: await the promise when you add something
 */
class Batcher {
  #maxBatchSize: number
  #maxQueueTimeMs: number
  #firestore: Firestore
  #isFlushing = new BehaviorSubject<boolean>(false)
  #isClosing = false
  #intervalHandle: NodeJS.Timeout
  #projectorName: string
  #logger: Logger
  #lastSuccessfulCommitPosition: bigint | null = null
  #error: Error | null = null

  #queue: {
    performSideEffect: (batch: FirebaseFirestore.WriteBatch) => Promise<void>
    deadline: bigint
    commitPosition: bigint
  }[] = []

  private static CHECK_IF_NEED_TO_FLUSH_EVERY_MS = 50

  constructor(
    maxBatchSize: number,
    maxQueueTimeMs: number,
    firestore: Firestore,
    projectorName: string
  ) {
    this.#projectorName = projectorName
    this.#maxBatchSize = maxBatchSize
    this.#maxQueueTimeMs = maxQueueTimeMs
    this.#firestore = firestore
    this.#logger = new Logger({
      name: `${this.#projectorName}-batcher`,
    })

    if (this.#maxQueueTimeMs < Batcher.CHECK_IF_NEED_TO_FLUSH_EVERY_MS) {
      throw new Error(
        `Batcher only checks if it needs to flush every ${Batcher.CHECK_IF_NEED_TO_FLUSH_EVERY_MS}ms, choose a higher max queue time than that`
      )
    }

    this.#intervalHandle = setInterval(
      () => this.flush(),
      Batcher.CHECK_IF_NEED_TO_FLUSH_EVERY_MS
    )
  }

  get error(): Error | null {
    return this.#error
  }

  get hasError(): boolean {
    return this.#error != null
  }

  async add(
    performSideEffect: (batch: FirebaseFirestore.WriteBatch) => Promise<void>,
    commitPosition: bigint
  ): Promise<void> {
    try {
      // If we're still flushing, wait until we're done with that
      await this.waitUntilDoneFlushing()
      this.#queue.push({
        performSideEffect,
        deadline:
          process.hrtime.bigint() + BigInt(this.#maxQueueTimeMs * 1000000),
        commitPosition,
      })
    } catch (err) {
      this.#error = err
    }
  }

  get lastSuccessfulCommitPosition(): bigint | null {
    return this.#lastSuccessfulCommitPosition
  }

  private async waitUntilDoneFlushing(): Promise<void> {
    await this.#isFlushing
      .pipe(
        filter((isFlushing) => !isFlushing),
        first()
      )
      .toPromise()
  }

  private get needsToFlush(): boolean {
    if (this.#isClosing) {
      return true
    }

    if (this.getQueueLength >= this.#maxBatchSize) {
      return true
    }

    const currentTime = process.hrtime.bigint()
    if (this.#queue[0] != null && this.#queue[0].deadline >= currentTime) {
      return true
    }

    return false
  }

  private async flush(): Promise<void> {
    try {
      if (this.#isFlushing.getValue()) {
        // Silently ignore
        return
      }

      while (this.needsToFlush) {
        if (this.hasError) {
          break
        }

        try {
          const toFlush = this.#queue.slice(0, this.#maxBatchSize)
          this.#queue = this.#queue.slice(this.#maxBatchSize)

          if (toFlush.length === 0) {
            break
          }

          this.#logger.silly(
            `Running a batch of ${
              toFlush.length
            } events and committing them to Firestore. Last successful commit position is ${
              this.#lastSuccessfulCommitPosition
            }`
          )
          this.#isFlushing.next(true)
          const batch = this.#firestore.batch()

          await pRetry(
            async () => {
              await pSeries(
                toFlush.map(({ performSideEffect, commitPosition }) => () =>
                  pRetry(() => performSideEffect(batch), {
                    retries: 3,
                    maxTimeout: 1000,
                    onFailedAttempt: (err) => {
                      this.#logger.warn(
                        `Could not perform side effect for event at commit offset ${commitPosition}. Retrying...`,
                        err
                      )
                    },
                  })
                )
              )

              const commitPosition = toFlush.slice(-1)[0].commitPosition
              batch.set(
                this.#firestore
                  .collection('projector')
                  .doc(this.#projectorName),
                {
                  commitPosition,
                }
              )

              await batch.commit()
              this.#lastSuccessfulCommitPosition = commitPosition
              this.#logger.silly(
                `Batch committed! Commit position: ${commitPosition}`
              )
            },
            {
              retries: 3,
              maxTimeout: 1000,
              onFailedAttempt: (err) => {
                this.#logger.warn(
                  `Could not perform side effects or commit to Firestore. Retrying...`,
                  err
                )
              },
            }
          )
        } catch (err) {
          this.#logger.warn('Error while committing or constructing batch', err)
          throw err
        }
      }
      this.#isFlushing.next(false)
    } catch (err) {
      this.#error = err
    }
  }

  async closeWithoutFlushing(): Promise<void> {
    this.#isClosing = true
    clearInterval(this.#intervalHandle)
  }

  async close(): Promise<void> {
    clearInterval(this.#intervalHandle)
    await this.waitUntilDoneFlushing()
    this.#isClosing = true
    await this.flush()
    await this.waitUntilDoneFlushing()
  }

  private get getQueueLength(): number {
    return this.#queue.length
  }
}

type HandleEvent = (
  event: JSONRecordedEvent,
  batch: FirebaseFirestore.WriteBatch
) => Promise<void>

export class EsdbToFirestoreProjector {
  #connection: EventStoreConnection
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
    connection: EventStoreConnection,
    firestore: Firestore,
    handleEvent: (
      event: JSONRecordedEvent,
      batch: FirebaseFirestore.WriteBatch
    ) => Promise<void>,
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
        this.#logger.info(`Projector done successfully`)
        return
      } else {
        this.#logger.debug(
          `Projector hit a snag, restarting. Error was`,
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
    const batcher = this.createBatcher()

    const subscription =
      position == null
        ? await subscribeToAll()
            .fromStart()
            .execute(this.#connection)
        : await subscribeToAll()
            .fromPosition({
              commit: position,
              prepare: position,
            })
            .execute(this.#connection)

    for await (const resolvedEvent of subscription) {
      if (
        resolvedEvent.event != null &&
        resolvedEvent.event.isJson &&
        resolvedEvent.commitPosition != null
      ) {
        const ev = resolvedEvent.event
        await batcher.add(
          (batch) => this.#handleEvent(ev, batch),
          resolvedEvent.commitPosition
        )
      }

      if (batcher.error != null) {
        this.#logger.warn(`Batcher has error, throwing up`)
        await batcher.closeWithoutFlushing()
        subscription.unsubscribe()

        return {
          lastSuccessfulCommitPosition: batcher.lastSuccessfulCommitPosition,
          error: batcher.error,
          status: 'error',
        }
      }

      if (this.isTerminalEvent(resolvedEvent)) {
        await batcher.close()
        subscription.unsubscribe()
        if (batcher.error != null) {
          return {
            status: 'error',
            error: batcher.error,
            lastSuccessfulCommitPosition: batcher.lastSuccessfulCommitPosition,
          }
        } else {
          return { status: 'success', reason: 'terminal event received' }
        }
      }
    }

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

  private createBatcher(): Batcher {
    return new Batcher(
      this.#maxBatchSize,
      this.#maxQueueTimeMs,
      this.#firestore,
      this.#projectorName
    )
  }

  private isTerminalEvent(resolvedEvent: ResolvedEvent): boolean {
    return (
      this.#stopOnEncounteringEvent != null &&
      resolvedEvent.event?.streamId ===
        this.#stopOnEncounteringEvent.streamId &&
      resolvedEvent.event.eventType === this.#stopOnEncounteringEvent.eventType
    )
  }
}
