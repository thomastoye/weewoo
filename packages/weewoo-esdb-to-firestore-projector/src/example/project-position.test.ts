import {
  createEventStore,
  EventStoreForTesting,
  createFirestore,
  FirestoreForTesting,
} from '@toye.io/weewoo-integration-test-utils'
import { projectPosition } from './project-position'
import { expect, jest } from '@jest/globals'
import { jsonEvent } from '@eventstore/db-client'

jest.setTimeout(25000)

let eventStore: EventStoreForTesting
let firestore: FirestoreForTesting

beforeEach(async () => {
  eventStore = await createEventStore()
  firestore = await createFirestore()
})

afterEach(async () => {
  await eventStore?.stop()
  await firestore?.stop()
})

test('Position projector', async () => {
  const connection = eventStore.connection

  // await server({
  //   name: 'RenameVehicle',
  //   newVehicleName: 'Oscar 37',
  //   vehicleId: 'O37',
  // })
  // await server({
  //   name: 'RenameVehicle',
  //   newVehicleName: 'Oscar 38',
  //   vehicleId: 'O38',
  // })

  await connection.appendToStream(
    'Vehicle-O37',
    jsonEvent({
      eventType: 'VehicleMoved',
      payload: {
        position: {
          lat: 6.051,
          lon: 3.123456,
        },
        positionAtTime: 1602858380,
      },
    })
  )

  await connection.appendToStream(
    'Vehicle-O38',
    jsonEvent({
      eventType: 'VehicleMoved',
      payload: {
        position: {
          lat: 5.0,
          lon: 3.123456,
        },
        positionAtTime: 1602858381,
      },
    })
  )

  await connection.appendToStream(
    'Vehicle-O37',
    jsonEvent({
      eventType: 'VehicleMoved',
      payload: {
        position: {
          lat: 6.052,
          lon: 3.123456,
        },
        positionAtTime: 1602858382,
      },
    })
  )

  await connection.appendToStream(
    'Vehicle-O38',
    jsonEvent({
      eventType: 'VehicleMoved',
      payload: {
        position: {
          lat: 5.1,
          lon: 3.133456,
        },
        positionAtTime: 1602858383,
      },
    })
  )

  await connection.appendToStream(
    'Vehicle-O38',
    jsonEvent({
      eventType: 'VehicleMoved',
      payload: {
        position: {
          lat: 5.0,
          lon: 3.123456,
        },
        positionAtTime: 1602858384,
      },
    })
  )

  await connection.appendToStream(
    'Vehicle-O38',
    jsonEvent({
      eventType: 'VehicleMoved',
      payload: {
        position: {
          lat: 5.011,
          lon: 3.16,
        },
        positionAtTime: 1602858385,
      },
    })
  )

  await connection.appendToStream(
    'IntegrationTest',
    jsonEvent({
      eventType: 'IntegrationTestEnded',
      payload: {},
    })
  )

  const projector = await projectPosition(connection, firestore.connection)
  await projector.start()

  expect(await firestore.dumpCollection('position')).toMatchInlineSnapshot(`
    Object {
      "Vehicle-O37": Object {
        "lastKnownPosition": Object {
          "lat": 6.052,
          "lon": 3.123456,
        },
      },
      "Vehicle-O38": Object {
        "lastKnownPosition": Object {
          "lat": 5.011,
          "lon": 3.16,
        },
      },
    }
  `)
})
