import { Transform } from 'stream'
import { Logger } from 'tslog'

export const createFilterTransform = <T>(
  filterFun: (chunk: T) => boolean,
  logger?: Logger
): Transform =>
  new Transform({
    objectMode: true,
    transform(chunk: T, enc, callback) {
      if (filterFun(chunk)) {
        callback(null, chunk)
      } else {
        callback()
      }
    },
    destroy(err, cb) {
      logger?.debug('Destroying createFilterTransform...')
      cb(err)
    },
  })
