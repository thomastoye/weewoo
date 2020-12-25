import { Readable, pipeline } from 'stream'
import { promisify } from 'util'
import { expect, test } from '@jest/globals'
import { accumulateStream } from './test-util'
import { createFilterTransform } from './filter-transform'

const pipelineAsync = promisify(pipeline)

test('filters out chunks for which provided filter function returns false', async () => {
  const accumulator = [] as unknown[]

  const readable = Readable.from(
    [
      { a: 0 },
      { a: 1 },
      { a: 2 },
      { a: 3 },
      { a: 4 },
      { a: 5 },
      { a: 6 },
      { a: 7 },
      { a: 8 },
      { a: 9 },
    ],
    { objectMode: true }
  )

  await pipelineAsync(
    readable,
    createFilterTransform<{ a: number }>((ev) => ev.a % 2 === 0),
    accumulateStream(accumulator)
  )

  expect(accumulator).toMatchInlineSnapshot(`
    Array [
      Object {
        "a": 0,
      },
      Object {
        "a": 2,
      },
      Object {
        "a": 4,
      },
      Object {
        "a": 6,
      },
      Object {
        "a": 8,
      },
    ]
  `)
})
