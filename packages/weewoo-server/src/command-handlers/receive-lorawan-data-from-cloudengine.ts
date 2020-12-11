import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/receive-lorawan-data-from-cloudengine'
import { jsonEvent } from '@eventstore/db-client'
import { CloudEnginePacket } from '@toye.io/weewoo-parse-cloudengine'

type ReceiveLoraWANDataFromCloudEngineConfig = {
  preSharedKey: string
}

export const receiveLoraWANDataFromCloudEngine = (
  config: ReceiveLoraWANDataFromCloudEngineConfig
): CommandHandler => async (command) => {
  if (command.name !== commandName) {
    return {
      result: 'rejected',
      reason: 'Command cannot be handled by this command handler',
    }
  }

  if (command.preSharedKey !== config.preSharedKey) {
    return {
      result: 'rejected',
      reason: 'Invalid pre-shared key',
    }
  }

  const packet = CloudEnginePacket.createLGT92FromPostedObject(command.data)

  if (packet == null) {
    return {
      result: 'rejected',
      reason: 'Could not parse CloudEngine packet',
    }
  }

  if (packet.payload.location != null) {
    const event = jsonEvent({
      eventType: 'LGT92MessageReceivedWithLocation',
      payload: {
        locationWGS84: {
          lat: packet.payload.location.WGS84.lat,
          lng: packet.payload.location.WGS84.lon,
        },
        batteryVoltage: packet.payload.batteryVoltage,
        isInAlarmState: packet.payload.isInAlarmState,
        motionDetectionMode: packet.payload.motionDetectionMode,
        isLedOnForTransmissionIndications:
          packet.payload.isLedOnForTransmissionIndications,
        lora: {
          applicationPort: packet.applicationPort,
          baseStationId: packet.baseStationId,
          baseStationRSSI: packet.baseStationRSSI,
          baseStationSRN: packet.baseStationSNR,
          channel: packet.channel,
          devEUI: packet.devEUI,
          deviceAddress: packet.deviceAddress,
          fCntUp: packet.fCntUp,
          fCntDn: packet.fCntDn,
          numberOfBaseStations: packet.numberOfBaseStations,
          receivedAtMs: packet.receivedAtMs,
          spreadingFactor: packet.spreadingFactor,
          subBand: packet.subBand,
        },
        cloudEngine: {
          allTags: packet.allTags,
          asset: packet.cloudEngineAsset,
          deviceName: packet.deviceName,
          deviceTags: packet.deviceTags,
        },
      },
    })

    return {
      result: 'accepted',
      events: [
        {
          stream: `LGT92-${packet.devEUI}`,
          event,
          expectedRevision: 'any',
        },
      ],
    }
  } else {
    const event = jsonEvent({
      eventType: 'LGT92MessageReceivedWithoutLocation',
      payload: {
        batteryVoltage: packet.payload.batteryVoltage,
        isInAlarmState: packet.payload.isInAlarmState,
        motionDetectionMode: packet.payload.motionDetectionMode,
        isLedOnForTransmissionIndications:
          packet.payload.isLedOnForTransmissionIndications,
        lora: {
          applicationPort: packet.applicationPort,
          baseStationId: packet.baseStationId,
          baseStationRSSI: packet.baseStationRSSI,
          baseStationSRN: packet.baseStationSNR,
          channel: packet.channel,
          devEUI: packet.devEUI,
          deviceAddress: packet.deviceAddress,
          fCntUp: packet.fCntUp,
          fCntDn: packet.fCntDn,
          numberOfBaseStations: packet.numberOfBaseStations,
          receivedAtMs: packet.receivedAtMs,
          spreadingFactor: packet.spreadingFactor,
          subBand: packet.subBand,
        },
        cloudEngine: {
          allTags: packet.allTags,
          asset: packet.cloudEngineAsset,
          deviceName: packet.deviceName,
          deviceTags: packet.deviceTags,
        },
      },
    })

    return {
      result: 'accepted',
      events: [
        {
          stream: `LGT92-${packet.devEUI}`,
          event,
          expectedRevision: 'any',
        },
      ],
    }
  }
}
