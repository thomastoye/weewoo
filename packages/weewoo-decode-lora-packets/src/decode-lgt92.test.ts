import { expect } from '@jest/globals'
import { decodeLGT92Packet } from './decode-lgt92'

test('can decode', () => {
  const packet = decodeLGT92Packet(Buffer.from('030AE22000394E6E4FC863', 'hex'))
  expect(packet.isInAlarmState).toBe(true)
  expect(packet.batteryVoltage).toBe(4.04)
  expect(packet.batteryStatus).toBe('80-100%')
  expect(packet.isLedOnForTransmissionIndications).toBe(true)
  expect(packet.motionDetectionMode).toBe('Movement')
  expect(packet.location?.WGS84.lat).toBe(51.044896)
  expect(packet.location?.WGS84.lon).toBe(3.75563)
})

test('decode example from Dragino manual', () => {
  const packet = decodeLGT92Packet(
    Buffer.from('02863D68FAC29BAF4B456004D2FB2E', 'hex')
  )

  expect(packet.isInAlarmState).toBe(true)
  expect(packet.batteryVoltage).toBe(2.885)
  expect(packet.batteryStatus).toBe('0-20%')
  expect(packet.isLedOnForTransmissionIndications).toBe(true)
  expect(packet.motionDetectionMode).toBe('Movement')
  expect(packet.location?.WGS84.lat).toBe(42.351976)
  expect(packet.location?.WGS84.lon).toBe(-87.909457)
})

test('decode example without location fix', () => {
  const packet = decodeLGT92Packet(Buffer.from('00000000000000004FC263', 'hex'))

  expect(packet.location).toBe(null)
  expect(packet.batteryVoltage).toBe(4.034)
})
