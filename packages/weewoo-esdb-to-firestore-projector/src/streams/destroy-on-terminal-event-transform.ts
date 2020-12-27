import { Transform, Readable } from 'stream'
import { Logger } from 'tslog'

import { CustomError } from 'ts-custom-error'

export class TerminalEventReceivedError extends CustomError {
  public constructor(message?: string) {
    super(message)
  }
}

/** Destroy the readable when receiving a specific event. Useful for integration tests. */
export const destroyReadableOnTerminalEventTransform = <T>(
  isTerminalEvent: (ev: T) => boolean,
  readable: Readable,
  logger?: Logger
): Transform =>
  new Transform({
    objectMode: true,
    // highWaterMark: 200, // TODO
    transform(ev: T, enc, callback) {
      if (isTerminalEvent(ev)) {
        logger?.info(
          'Terminal event received in projector, destroying stream...'
        )
        callback(null, ev)
        readable.destroy(
          new TerminalEventReceivedError('Terminal event received in projector')
        )
      } else {
        callback(null, ev)
      }
    },
    destroy(err, cb) {
      logger?.debug('Destroying destroyReadableOnTerminalEventTransform...')
      cb(err)
    },
  })
