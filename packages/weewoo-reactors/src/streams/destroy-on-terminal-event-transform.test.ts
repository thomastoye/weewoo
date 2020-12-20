import { Readable, pipeline } from 'stream'
import { promisify } from 'util'
import { expect, test } from '@jest/globals'
import { accumulateStream } from './test-util'
import {
  destroyReadableOnTerminalEventTransform,
  TerminalEventReceivedError,
} from './destroy-on-terminal-event-transform'

const pipelineAsync = promisify(pipeline)

test('stream should destroy when receiving a terminal event', async () => {
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

  await expect(
    pipelineAsync(
      readable,
      destroyReadableOnTerminalEventTransform<{ a: number }>(
        (ev) => ev.a === 6,
        readable
      ),
      accumulateStream(accumulator)
    )
  ).rejects.toThrowError(
    new TerminalEventReceivedError('Terminal event received in projector')
  )

  expect(accumulator).toMatchInlineSnapshot(`
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
      Object {
        "a": 3,
      },
      Object {
        "a": 4,
      },
      Object {
        "a": 5,
      },
      Object {
        "a": 6,
      },
    ]
  `)
})

test('stream should run until end when a terminal event is not received', async () => {
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
    destroyReadableOnTerminalEventTransform<{ a: number }>(
      (ev) => ev.a === 111,
      readable
    ),
    accumulateStream(accumulator)
  ).catch((err) => {
    if (!(err instanceof TerminalEventReceivedError)) {
      throw err
    }
  })

  expect(accumulator).toMatchInlineSnapshot(`
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
      Object {
        "a": 3,
      },
      Object {
        "a": 4,
      },
      Object {
        "a": 5,
      },
      Object {
        "a": 6,
      },
      Object {
        "a": 7,
      },
      Object {
        "a": 8,
      },
      Object {
        "a": 9,
      },
    ]
  `)
})
