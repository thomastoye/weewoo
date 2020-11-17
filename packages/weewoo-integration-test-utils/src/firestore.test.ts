import { createFirestore, FirestoreForTesting } from './firestore'
import { describe, expect, jest } from '@jest/globals'

jest.setTimeout(25000)

let firestore: FirestoreForTesting

beforeAll(async () => {
  firestore = await createFirestore()
})

afterAll(async () => {
  if (firestore != null) {
    await firestore.stop()
  }
})

describe('Firestore for integration testing', () => {
  const exampleDocumentData = {
    my: 'value',
    other: 1234,
    thatsIt: true,
  }

  test('Connection is not null', () => {
    expect(firestore.connection).not.toBeNull()
  })

  test('Create documents', async () => {
    await firestore.connection
      .collection('my-collection')
      .doc('my-doc')
      .create(exampleDocumentData)

    await firestore.connection
      .collection('other-collection')
      .doc('blah-doc')
      .create({ hi: 'hello' })

    await firestore.connection
      .collection('other-collection')
      .doc('my-doc')
      .create({ hi: 'hello' })
  })

  test('Read documents', async () => {
    const doc = await firestore.connection
      .collection('my-collection')
      .doc('my-doc')
      .get()

    const doesNotExist = await firestore.connection
      .collection('meh-collection')
      .doc('id')
      .get()

    expect(doc.data()).toEqual(exampleDocumentData)
    expect(doesNotExist.exists).toBe(false)
  })

  test('Dump entire Firestore', async () => {
    const dump = await firestore.dump()

    expect(dump).toMatchInlineSnapshot(`
      Object {
        "my-collection": Object {
          "my-doc": Object {
            "my": "value",
            "other": 1234,
            "thatsIt": true,
          },
        },
        "other-collection": Object {
          "blah-doc": Object {
            "hi": "hello",
          },
          "my-doc": Object {
            "hi": "hello",
          },
        },
      }
    `)
  })
})
