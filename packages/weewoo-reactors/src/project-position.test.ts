import {
  createEventStore,
  EventStoreForTesting,
  createFirestore,
  FirestoreForTesting,
} from '@toye.io/weewoo-integration-test-utils'
import { projectPosition } from './project-position'
import { createServer } from '@toye.io/weewoo-server'
import { expect, jest } from '@jest/globals'

jest.setTimeout(25000)

let eventStore: EventStoreForTesting
let firestore: FirestoreForTesting

beforeEach(async () => {
  eventStore = await createEventStore()
  firestore = await createFirestore()
})

afterEach(async () => {
  if (eventStore != null) {
    await eventStore.stop()
  }

  if (firestore != null) {
    await firestore.stop()
  }
})

test('Position projector', async () => {
  const connection = eventStore.connection
  const server = createServer(connection)

  await server({
    name: 'RenameVehicle',
    newVehicleName: 'Oscar 37',
    vehicleId: 'O37',
  })
  await server({
    name: 'RenameVehicle',
    newVehicleName: 'Oscar 38',
    vehicleId: 'O38',
  })

  await server({
    name: 'UpdateVehiclePosition',
    position: {
      lat: 6.051,
      lon: 3.123456,
    },
    positionAtTime: 1602858380,
    vehicleId: 'O37',
  })

  await server({
    name: 'UpdateVehiclePosition',
    position: {
      lat: 5.0,
      lon: 3.123456,
    },
    positionAtTime: 1602858381,
    vehicleId: 'O38',
  })

  await server({
    name: 'UpdateVehiclePosition',
    position: {
      lat: 6.052,
      lon: 3.123456,
    },
    positionAtTime: 1602858382,
    vehicleId: 'O37',
  })

  await server({
    name: 'UpdateVehiclePosition',
    position: {
      lat: 5.1,
      lon: 3.133456,
    },
    positionAtTime: 1602858383,
    vehicleId: 'O38',
  })

  await server({
    name: 'UpdateVehiclePosition',
    position: {
      lat: 5.0,
      lon: 3.123456,
    },
    positionAtTime: 1602858384,
    vehicleId: 'O38',
  })

  await server({
    name: 'UpdateVehiclePosition',
    position: {
      lat: 5.011,
      lon: 3.16,
    },
    positionAtTime: 1602858385,
    vehicleId: 'O38',
  })

  await server({
    name: 'EndIntegrationTest',
  })

  await projectPosition(connection, firestore.connection)

  expect(await firestore.dumpComplete()).toMatchInlineSnapshot(`
    Object {
      "position": Object {
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
      },
    }
  `)
})
