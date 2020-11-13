import {
  createEventStore,
  EventStoreForTesting,
} from '@toye.io/weewoo-integration-test-utils'
import { projectPosition } from './project-position'
import { createServer } from '@toye.io/weewoo-server'

jest.setTimeout(10000)

let eventStore: EventStoreForTesting

beforeEach(async () => {
  eventStore = await createEventStore()
})

afterEach(async () => {
  if (eventStore != null) {
    await eventStore.stop()
  }
})

test('Position projector', async () => {
  const mock = jest.fn(() => Promise.resolve())

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

  await projectPosition(connection, 5, mock)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(mock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "message": "At 1602858380, position of vehicle Vehicle-O37 was {\\"lat\\":6.051,\\"lon\\":3.123456}",
        },
      ],
      Array [
        Object {
          "message": "At 1602858381, position of vehicle Vehicle-O38 was {\\"lat\\":5,\\"lon\\":3.123456}",
        },
      ],
      Array [
        Object {
          "message": "At 1602858382, position of vehicle Vehicle-O37 was {\\"lat\\":6.052,\\"lon\\":3.123456}",
        },
      ],
      Array [
        Object {
          "message": "At 1602858383, position of vehicle Vehicle-O38 was {\\"lat\\":5.1,\\"lon\\":3.133456}",
        },
      ],
      Array [
        Object {
          "message": "At 1602858384, position of vehicle Vehicle-O38 was {\\"lat\\":5,\\"lon\\":3.123456}",
        },
      ],
    ]
  `)
})
