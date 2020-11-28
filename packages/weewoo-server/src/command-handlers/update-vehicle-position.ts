import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/update-vehicle-position'
import { EventData } from '@eventstore/db-client'

export const updateVehiclePosition: CommandHandler = async (command) => {
  if (command.name !== commandName) {
    return Promise.resolve({
      result: 'rejected',
      reason: 'Command cannot be handled by this command handler',
    })
  }

  const event = EventData.json('VehicleMoved', {
    position: {
      lat: command.position.lat,
      lon: command.position.lon,
    },
    positionAtTime: command.positionAtTime,
  }).build()

  return {
    result: 'accepted',
    events: [
      {
        expectedRevision: 'stream_exists',
        event,
        stream: `Vehicle-${command.vehicleId}`,
      },
    ],
  }
}
