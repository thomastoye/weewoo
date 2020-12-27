import { BatchWithTimeoutTransform } from './batch-with-timeout-stream-transform'
import { Readable, pipeline } from 'stream'
import { promisify } from 'util'
import { expect, test } from '@jest/globals'
import { accumulateStream } from './test-util'
import * as streamtest from 'streamtest'

const pipelineAsync = promisify(pipeline)

test('batch with chunks of size 1', async () => {
  const transform = new BatchWithTimeoutTransform(1, 2000)
  const accumulator = [] as unknown[]

  await pipelineAsync(
    Readable.from(
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
    ),
    transform,
    accumulateStream(accumulator)
  )

  expect(accumulator).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "a": 0,
        },
      ],
      Array [
        Object {
          "a": 1,
        },
      ],
      Array [
        Object {
          "a": 2,
        },
      ],
      Array [
        Object {
          "a": 3,
        },
      ],
      Array [
        Object {
          "a": 4,
        },
      ],
      Array [
        Object {
          "a": 5,
        },
      ],
      Array [
        Object {
          "a": 6,
        },
      ],
      Array [
        Object {
          "a": 7,
        },
      ],
      Array [
        Object {
          "a": 8,
        },
      ],
      Array [
        Object {
          "a": 9,
        },
      ],
    ]
  `)
})

test('batch with chunks of size 3 but arriving slower than the timeout', async () => {
  const transform = new BatchWithTimeoutTransform(3, 100)
  const accumulator = [] as unknown[]

  await pipelineAsync(
    streamtest.v2.fromObjects(
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
      200
    ),
    transform,
    accumulateStream(accumulator)
  )

  expect(accumulator).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "a": 0,
        },
      ],
      Array [
        Object {
          "a": 1,
        },
      ],
      Array [
        Object {
          "a": 2,
        },
      ],
      Array [
        Object {
          "a": 3,
        },
      ],
      Array [
        Object {
          "a": 4,
        },
      ],
      Array [
        Object {
          "a": 5,
        },
      ],
      Array [
        Object {
          "a": 6,
        },
      ],
      Array [
        Object {
          "a": 7,
        },
      ],
      Array [
        Object {
          "a": 8,
        },
      ],
      Array [
        Object {
          "a": 9,
        },
      ],
    ]
  `)
})

test('batch with chunks of size 3', async () => {
  const transform = new BatchWithTimeoutTransform(3, 2000)
  const accumulator = [] as unknown[]

  await pipelineAsync(
    Readable.from(
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
    ),
    transform,
    accumulateStream(accumulator)
  )

  expect(accumulator).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "a": 0,
        },
        Object {
          "a": 1,
        },
        Object {
          "a": 2,
        },
      ],
      Array [
        Object {
          "a": 3,
        },
        Object {
          "a": 4,
        },
        Object {
          "a": 5,
        },
      ],
      Array [
        Object {
          "a": 6,
        },
        Object {
          "a": 7,
        },
        Object {
          "a": 8,
        },
      ],
      Array [
        Object {
          "a": 9,
        },
      ],
    ]
  `)
})

test('batch with chunks of size 10 with an input of length 1', async () => {
  const transform = new BatchWithTimeoutTransform(10, 2000)
  const accumulator = [] as unknown[]

  await pipelineAsync(
    Readable.from([{ a: 0 }], { objectMode: true }),
    transform,
    accumulateStream(accumulator)
  )

  expect(accumulator).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "a": 0,
        },
      ],
    ]
  `)
})
