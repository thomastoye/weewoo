import { CloudEnginePacket } from './parse-cloudengine'
import { test, expect } from '@jest/globals'

test('parsing an EnCo CloudEngine packet with LGT-92 payload', () => {
  const input = {
    LrrSNR: '-11.0',
    Lrrid: 'FF010684',
    SpFact: '12',
    SubBand: 'G0',
    FPort: '2',
    Channel: 'LC8',
    FCntUp: '63',
    Time: '1606489920949',
    DevEUI: 'A840416621826E07',
    LrrRSSI: '-115.0',
    DeviceAddress: '06100DEF',
    FCntDn: '24',
    DevLrrCnt: '9',
    Tags: '["gps"]',
    DeviceName: 'lgt72',
    Asset: 'lora4makers',
    Payload: 'AwrV2AA5BZQPwmM=',
    FullTags: 'DATA, lgt72, A840416621826E07, gps, ',
  }

  const parsed = CloudEnginePacket.createLGT92FromPostedObject(input)

  expect(parsed).not.toEqual(null)
  expect(parsed?.baseStationSNR).toBe(-11.0)
  expect(parsed?.baseStationId).toBe('FF010684')
  expect(parsed?.spreadingFactor).toBe(12)
  expect(parsed?.subBand).toBe('G0')
  expect(parsed?.applicationPort).toBe(2)
  expect(parsed?.channel).toBe('LC8')
  expect(parsed?.fCntUp).toBe(63)
  expect(parsed?.receivedAtMs).toBe(1606489920949)
  expect(parsed?.devEUI).toBe('A840416621826E07')
  expect(parsed?.baseStationRSSI).toBe(-115.0)
  expect(parsed?.deviceAddress).toBe('06100DEF')
  expect(parsed?.fCntDn).toBe(24)
  expect(parsed?.numberOfBaseStations).toBe(9)
  expect(parsed?.deviceTags).toEqual(['gps'])
  expect(parsed?.deviceName).toBe('lgt72')
  expect(parsed?.cloudEngineAsset).toBe('lora4makers')
  expect(parsed?.allTags).toEqual(['DATA', 'lgt72', 'A840416621826E07', 'gps'])
  expect(parsed?.payload).not.toEqual(null)
  expect(parsed?.payload.location?.WGS84).toEqual({
    lat: 51.041752,
    lon: 3.73698,
  })
})
