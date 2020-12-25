import {
  AllStreamJSONRecordedEvent,
  AllStreamResolvedEvent,
  JSONRecordedEvent,
} from '@eventstore/db-client'
import { Transform } from 'stream'
import { Logger } from 'tslog'

const maxBigint = (arr: readonly bigint[]): bigint =>
  arr.reduce((highest, curr) => (highest > curr ? highest : curr), arr[0])

export const performSideEffectsTransform = (
  handleEvent: (
    event: JSONRecordedEvent,
    batch: FirebaseFirestore.WriteBatch
  ) => Promise<void>,
  projectorPositionDoc: FirebaseFirestore.DocumentReference<{
    commitPosition: string
  }>,
  createWriteBatch: () => FirebaseFirestore.WriteBatch,
  logger: Logger
): Transform =>
  new Transform({
    objectMode: true,
    transform(batch: readonly AllStreamResolvedEvent[], enc, callback) {
      const writeBatch = createWriteBatch()
      const highestCommitPosition = maxBigint(
        batch
          .map((ev) => ev.commitPosition)
          .filter((pos) => pos != null) as bigint[]
      )

      // TODO restrict promise concurrency?
      Promise.all(
        batch.map((ev) =>
          handleEvent(ev.event as AllStreamJSONRecordedEvent, writeBatch)
        )
      )
        .then(() => {
          writeBatch.set(projectorPositionDoc, {
            commitPosition: highestCommitPosition.toString(10),
          })
        })
        .then(() =>
          callback(null, {
            writeBatch,
            commitPosition: highestCommitPosition,
          })
        )
        .catch((err) => callback(err))
    },
    destroy(err, cb) {
      logger.debug('Destroying performSideEffectsTransform...')
      cb(err)
    },
  })
