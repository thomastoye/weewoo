import { Transform } from 'stream'

export const createFilterTransform = <T>(
  filterFun: (chunk: T) => boolean
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
  })
