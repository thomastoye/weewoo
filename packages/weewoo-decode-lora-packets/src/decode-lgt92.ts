import { Location } from '@toye.io/weewoo-location'

type MotionDetectionMode =
  | 'Disabled'
  | 'Movement'
  | 'Collision detection'
  | 'Manually set'

export class DecodedLGT92Packet {
  #location: Location | null = null
  #batteryVoltage: number
  #isInAlarmState: boolean
  #isLedOnForTransmissionIndications: boolean
  #motionDetectionMode: MotionDetectionMode

  constructor(
    lat: number | null,
    lon: number | null,
    batteryVoltage: number,
    isInAlarmState: boolean,
    motionDetectionMode: MotionDetectionMode,
    isLedOnForTransmissionIndications: boolean
  ) {
    if (lat != null && lon != null) {
      this.#location = Location.fromWGS84(lat, lon)
    }
    this.#batteryVoltage = batteryVoltage
    this.#isInAlarmState = isInAlarmState
    this.#isLedOnForTransmissionIndications = isLedOnForTransmissionIndications
    this.#motionDetectionMode = motionDetectionMode
  }

  get location(): Location | null {
    return this.#location
  }

  get batteryVoltage(): number {
    return this.#batteryVoltage
  }

  get batteryStatus(): '80-100%' | '60-80%' | '40-60%' | '20-40%' | '0-20%' {
    if (this.batteryVoltage > 4) {
      return '80-100%'
    }

    if (this.batteryVoltage > 3.85) {
      return '60-80%'
    }

    if (this.batteryVoltage > 3.7) {
      return '40-60%'
    }

    if (this.batteryVoltage > 3.4) {
      return '20-40%'
    }

    return '0-20%'
  }

  get isLedOnForTransmissionIndications(): boolean {
    return this.#isLedOnForTransmissionIndications
  }

  get isInAlarmState(): boolean {
    return this.#isInAlarmState
  }

  get motionDetectionMode(): MotionDetectionMode {
    return this.#motionDetectionMode
  }
}

const getLatitude = (buf: Buffer): number | null => {
  let latitude = buf.readInt32BE()

  if (latitude === 0 || latitude === 0x0fffffff) {
    return null
  }

  if ((buf[0] & 0x80) === 0) {
    latitude |= 0xfffff00000000
  }

  return latitude / 1000000
}

const getLongitude = (buf: Buffer): number | null => {
  let longitude = buf.readInt32BE()

  if (longitude === 0 || longitude === 0x0fffffff) {
    return null
  }

  if (longitude === 0) {
    return null
  }

  if (buf[4] & 0x80) {
    longitude |= 0xfffff00000000
  }

  return longitude / 1000000
}

export const decodeLGT92Packet = (bytes: Buffer): DecodedLGT92Packet => {
  // Size (bytes)
  // v    Purpose
  // v    v
  // 4    Latitude
  // 4    Longitude
  // 2    Alarm and battery
  //       -> 1  bit  reserved
  //       -> 1  bit  alarm state
  //       -> 14 bits battery voltage
  // 1    Flag
  //       -> 2 bits "MD"
  //       -> 1 bit  "LON"
  //       -> 5 bits firmware version
  // 2    Roll (disabled)  - ignored
  // 2    Pitch (disabled) - ignored

  const latitude = getLatitude(bytes.slice(0, 4))
  const longitude = getLongitude(bytes.slice(4, 8))

  const isInAlarmState = bytes[8] & 0x40 ? true : false
  const battery = (((bytes[8] & 0x3f) << 8) | bytes[9]) / 1000

  let motionDetectionMode: MotionDetectionMode

  switch ((bytes[10] & 0xc0) >> 6) {
    case 0x01:
      motionDetectionMode = 'Movement'
      break
    case 0x10:
      motionDetectionMode = 'Collision detection'
      break
    case 0x11:
      motionDetectionMode = 'Manually set'
      break
    default:
      motionDetectionMode = 'Disabled'
      break
  }

  const ledIndicatorEnabled = bytes[10] & 0x20 ? true : false

  return new DecodedLGT92Packet(
    latitude,
    longitude,
    battery,
    isInAlarmState,
    motionDetectionMode,
    ledIndicatorEnabled
  )
}
