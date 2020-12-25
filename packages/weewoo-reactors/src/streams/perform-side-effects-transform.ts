import {
  AllStreamJSONRecordedEvent,
  AllStreamResolvedEvent,
  JSONRecordedEvent,
} from '@eventstore/db-client'
import { Transform } from 'stream'

const maxBigint = (arr: readonly bigint[]): bigint =>
  arr.reduce((highest, curr) => (highest > curr ? highest : curr), arr[0])

export const performSideEffectsTransform = (
  handleEvent: (
    event: JSONRecordedEvent,
    batch: FirebaseFirestore.WriteBatch
  ) => Promise<void>,
  projectorPositionDoc: FirebaseFirestore.DocumentReference,
  createWriteBatch: () => FirebaseFirestore.WriteBatch
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
            commitPosition: highestCommitPosition,
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
  })
