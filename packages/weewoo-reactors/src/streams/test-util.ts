import { Writable } from 'stream'

/** Writable stream that adds received data to an accumulator */
export const accumulateStream = <T = unknown>(acc: T[]): Writable =>
  new Writable({
    objectMode: true,
    write(chunk, enc, cb) {
      acc.push(chunk)
      cb(null)
    },
  })
