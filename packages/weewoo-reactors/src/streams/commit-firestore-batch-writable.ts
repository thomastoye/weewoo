import { Writable } from 'stream'
import { Logger } from 'tslog'

export const commitFirestoreBatchWritable = (logger: Logger): Writable =>
  new Writable({
    objectMode: true,
    highWaterMark: 5,
    write(
      {
        writeBatch,
        commitPosition,
      }: {
        writeBatch: FirebaseFirestore.WriteBatch
        commitPosition: bigint
      },
      enc,
      callback
    ) {
      writeBatch
        .commit()
        .then(() => {
          logger.info(
            `WriteBatch committed to Firestore! Commit offset: ${commitPosition}.`
          )
          callback()
        })
        .catch((err) => callback(err))
    },
  })
