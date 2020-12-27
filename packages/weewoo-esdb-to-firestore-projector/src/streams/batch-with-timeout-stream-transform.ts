import { Transform, TransformOptions } from 'stream'
import { Logger } from 'tslog'

export class BatchWithTimeoutTransform extends Transform {
  #buffer: unknown[] = []
  #maxBatchSize: number
  #maxTimeWaitingMs: number
  #timeoutHandle: NodeJS.Timeout | null = null
  #logger: Logger | null

  constructor(
    maxBatchSize: number,
    maxTimeWaitingMs: number,
    logger?: Logger,
    transformOptions?: TransformOptions
  ) {
    super({
      objectMode: true,
      readableHighWaterMark: maxBatchSize * 3,
      highWaterMark: maxBatchSize * 3,
      writableHighWaterMark: maxBatchSize * 3,
      ...transformOptions,
    })
    this.#maxBatchSize = maxBatchSize
    this.#maxTimeWaitingMs = maxTimeWaitingMs
    this.#logger = logger || null
  }

  _transform(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: unknown) => void
  ): void {
    if (chunk == null) {
      this.#logger?.debug('Received an empty (null) chunk')
      callback()
      return
    }

    this.#buffer.push(chunk)

    if (this.#timeoutHandle == null) {
      this.#timeoutHandle = setTimeout(() => {
        this._flushBatchBuffer('max queue time exceeded')
      }, this.#maxTimeWaitingMs)
    }

    if (this.#buffer.length >= this.#maxBatchSize) {
      this._flushBatchBuffer('max batch buffer size reached')
    }

    callback()
  }

  _flushBatchBuffer(
    reason:
      | 'max queue time exceeded'
      | 'max batch buffer size reached'
      | 'transform stream _flush called'
      | 'transform stream _destroy called'
  ): void {
    this.#logger?.debug(
      `Was asked to flush batch buffer due to ${reason}. Timeout handle is ${
        this.#timeoutHandle
      }`
    )

    if (this.#timeoutHandle != null) {
      clearTimeout(this.#timeoutHandle)
    }
    this.#timeoutHandle = null

    if (this.#buffer.length === 0) {
      this.#logger?.debug(`Was asked to flush buffer, but it's empty`)
      return
    }

    this.#logger?.debug(`Passing on a batch of size ${this.#buffer.length}`)
    this.push(this.#buffer)
    this.#buffer = []
  }

  _flush(callback: (error?: Error | null, data?: unknown) => void): void {
    this._flushBatchBuffer('transform stream _flush called')
    callback()
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void): void {
    this.#logger?.debug('Destroying BatchWithTimeoutTransform...')
    this._flushBatchBuffer('transform stream _destroy called')
    callback(error)
  }
}
