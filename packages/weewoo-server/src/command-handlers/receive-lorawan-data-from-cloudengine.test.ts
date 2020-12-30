import { receiveLoraWANDataFromCloudEngine } from './receive-lorawan-data-from-cloudengine'
import { expect, test } from '@jest/globals'

const command = {
  data: {
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
  },
  name: 'ReceiveLoraWANDataFromCloudEngine' as const,
  preSharedKey: 'abc',
}

test('reject packet with incorrect PSK', async () => {
  const handler = receiveLoraWANDataFromCloudEngine({ preSharedKey: 'myKey' })
  const handled = await handler(command)

  expect(handled.result).toBe('rejected')
  if (handled.result === 'rejected') {
    expect(handled.reason).toBe('Invalid pre-shared key')
  }
})

test('accept packet with correct PSK', async () => {
  const handler = receiveLoraWANDataFromCloudEngine({ preSharedKey: 'abc' })
  const handled = await handler(command)

  expect(handled.result).toBe('accepted')
  if (handled.result === 'accepted') {
    expect(handled.events).toHaveLength(1)
    expect(handled.events[0].stream).toBe('LGT92-A840416621826E07')
    expect(handled.events[0].event.type).toBe(
      'LGT92MessageReceivedWithLocation'
    )
    expect(handled.events[0].event.data).toMatchInlineSnapshot(`
      Object {
        "batteryVoltage": 4.03,
        "cloudEngine": Object {
          "allTags": Array [
            "DATA",
            "lgt72",
            "A840416621826E07",
            "gps",
          ],
          "asset": "lora4makers",
          "deviceName": "lgt72",
          "deviceTags": Array [
            "gps",
          ],
        },
        "isInAlarmState": false,
        "isLedOnForTransmissionIndications": true,
        "locationWGS84": Object {
          "lat": 51.041712,
          "lng": 3.736853,
        },
        "lora": Object {
          "applicationPort": 2,
          "baseStationId": "FF010889",
          "baseStationRSSI": -109,
          "baseStationSRN": -2,
          "channel": "LC1",
          "devEUI": "A840416621826E07",
          "deviceAddress": "06100DEF",
          "fCntDn": 4,
          "fCntUp": 3,
          "numberOfBaseStations": 5,
          "receivedAtMs": 1606577589748,
          "spreadingFactor": 12,
          "subBand": "G0",
        },
        "motionDetectionMode": "Movement",
      }
    `)
  }
})
