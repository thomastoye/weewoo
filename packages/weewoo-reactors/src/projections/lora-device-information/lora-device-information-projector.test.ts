import {
  createEventStore,
  EventStoreForTesting,
  createFirestore,
  FirestoreForTesting,
} from '@toye.io/weewoo-integration-test-utils'
import { createLoraDeviceInformationProjector } from './lora-device-information-projector'
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
  await eventStore?.stop()
  await firestore?.stop()
})

const exampleDeviceData = {
  LrrSNR: '-2.0',
  Lrrid: 'FF010889',
  SpFact: '12',
  SubBand: 'G0',
  FPort: '2',
  Channel: 'LC1',
  FCntUp: '3',
  Time: '1606577589748',
  DevEUI: 'A840416621826E07',
  LrrRSSI: '-109.0',
  DeviceAddress: '06100DEF',
  FCntDn: '4',
  DevLrrCnt: '5',
  Tags: '["gps"]',
  DeviceName: 'lgt72',
  Asset: 'lora4makers',
  Payload: 'AwrVsAA5BRUPvmM=',
  FullTags: 'DATA, lgt72, A840416621826E07, gps, ',
}

test('Position projector', async () => {
  const cloudEnginePreSharedKey = 'example-key'

  const connection = eventStore.connection
  const server = createServer(connection, {
    cloudEnginePreSharedKey,
  })

  await server({
    name: 'ReceiveLoraWANDataFromCloudEngine',
    preSharedKey: cloudEnginePreSharedKey,
    data: exampleDeviceData,
  })

  await server({
    name: 'ReceiveLoraWANDataFromCloudEngine',
    preSharedKey: cloudEnginePreSharedKey,
    data: exampleDeviceData,
  })

  await server({
    name: 'ReceiveLoraWANDataFromCloudEngine',
    preSharedKey: cloudEnginePreSharedKey,
    data: {
      ...exampleDeviceData,
      Payload: 'AAAAAAAAAABPwmM=',
      Time: '1606577589749',
    },
  })

  await server({
    name: 'ReceiveLoraWANDataFromCloudEngine',
    preSharedKey: cloudEnginePreSharedKey,
    data: {
      ...exampleDeviceData,
      Payload: 'AoY9aPrCm69LRWAE0vsu',
      DevEUI: 'A840419821726B39',
      Time: '1606577589750',
    },
  })

  await server({
    name: 'EndIntegrationTest',
  })

  const projector = createLoraDeviceInformationProjector(
    connection,
    firestore.connection
  )
  await projector.start()

  expect(await firestore.dumpCollection('lora-device-information'))
    .toMatchInlineSnapshot(`
    Object {
      "LGT92-A840416621826E07": Object {
        "batteryVoltage": 4.034,
        "deviceEUI": "A840416621826E07",
        "isInAlarmState": true,
        "lastRSSI": -109,
        "lastReceivedAt": 1606577589749,
        "locationWGS84": Object {
          "lat": 51.041712,
          "lng": 3.736853,
          "receivedAt": 1606577589748,
        },
      },
      "LGT92-A840419821726B39": Object {
        "batteryVoltage": 2.885,
        "deviceEUI": "A840419821726B39",
        "isInAlarmState": true,
        "lastRSSI": -109,
        "lastReceivedAt": 1606577589750,
        "locationWGS84": Object {
          "lat": 42.351976,
          "lng": -87.909457,
          "receivedAt": 1606577589750,
        },
      },
    }
  `)
})
