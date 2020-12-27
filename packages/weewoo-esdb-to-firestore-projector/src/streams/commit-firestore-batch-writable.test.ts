import { WriteBatch, WriteResult } from '@google-cloud/firestore'
import { Readable, pipeline } from 'stream'
import { promisify } from 'util'
import { expect, test, jest } from '@jest/globals'
import { commitFirestoreBatchWritable } from './commit-firestore-batch-writable'
import { Logger } from 'tslog'

const pipelineAsync = promisify(pipeline)

test('commits Firestore batch', async () => {
  const writeBatch = {
    commit: jest.fn<Promise<WriteResult[]>, [void]>(() => Promise.resolve([])),
  }

  const writable = commitFirestoreBatchWritable(new Logger())

  await pipelineAsync(
    Readable.from(
      [
        {
          writeBatch: (writeBatch as unknown) as WriteBatch,
          commitPosition: 12345n,
        },
      ],
      { objectMode: true }
    ),
    writable
  )

  expect(writeBatch.commit).toHaveBeenCalledTimes(1)
})

test('fails pipeline in case commit failed', async () => {
  const writeBatch = {
    commit: jest.fn<Promise<WriteResult[]>, [void]>(() =>
      Promise.reject(
        new Error(
          'Just an error that happened when you tried to commit a WriteBatch'
        )
      )
    ),
  }

  const writable = commitFirestoreBatchWritable(new Logger())

  await expect(() =>
    pipelineAsync(
      Readable.from(
        [
          {
            writeBatch: (writeBatch as unknown) as WriteBatch,
            commitPosition: 12345n,
          },
        ],
        { objectMode: true }
      ),
      writable
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Just an error that happened when you tried to commit a WriteBatch"`
  )

  expect(writeBatch.commit).toHaveBeenCalledTimes(1)
})
