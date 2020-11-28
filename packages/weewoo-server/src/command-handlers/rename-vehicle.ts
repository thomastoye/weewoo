import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/rename-vehicle'
import { EventData } from '@eventstore/db-client'

export const renameVehicle: CommandHandler = async (command) => {
  if (command.name !== commandName) {
    return Promise.resolve({
      result: 'rejected',
      reason: 'Command cannot be handled by this command handler',
    })
  }

  const event = EventData.json('VehicleRenamed', {
    name: command.newVehicleName,
  }).build()

  return {
    result: 'accepted',
    events: [
      {
        event,
        expectedRevision: 'any',
        stream: `Vehicle-${command.vehicleId}`,
      },
    ],
  }
}
