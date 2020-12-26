export type WeewooEvent = {
  LGT92MessageReceivedWithLocation: {
    locationWGS84: {
      lat: number
      lng: number
    }
    batteryVoltage: number
    isInAlarmState: boolean
    motionDetectionMode:
      | 'Disabled'
      | 'Movement'
      | 'Collision detection'
      | 'Manually set'
    isLedOnForTransmissionIndications: boolean
    lora: {
      applicationPort: number | '*' | null
      baseStationId: string
      baseStationRSSI: number | null
      baseStationSRN: number | null
      channel: string
      devEUI: string
      deviceAddress: string
      fCntUp: number | null
      fCntDn: number | null
      numberOfBaseStations: number | null
      receivedAtMs: number | null
      spreadingFactor: number | null
      subBand: string
    }
    cloudEngine: {
      allTags: readonly string[]
      asset: string
      deviceName: string
      deviceTags: readonly string[]
    }
  }
  LGT92MessageReceivedWithoutLocation: {
    batteryVoltage: number
    isInAlarmState: boolean
    motionDetectionMode:
      | 'Disabled'
      | 'Movement'
      | 'Collision detection'
      | 'Manually set'
    isLedOnForTransmissionIndications: boolean
    lora: {
      applicationPort: number | '*' | null
      baseStationId: string
      baseStationRSSI: number | null
      baseStationSRN: number | null
      channel: string
      devEUI: string
      deviceAddress: string
      fCntUp: number | null
      fCntDn: number | null
      numberOfBaseStations: number | null
      receivedAtMs: number | null
      spreadingFactor: number | null
      subBand: string
    }
    cloudEngine: {
      allTags: readonly string[]
      asset: string
      deviceName: string
      deviceTags: readonly string[]
    }
  }
}

export type WeewooEventType = keyof WeewooEvent
