import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/rename-vehicle'
import { jsonEvent } from '@eventstore/db-client'

export const renameVehicle: CommandHandler = async (command) => {
  if (command.name !== commandName) {
    return Promise.resolve({
      result: 'rejected',
      reason: 'Command cannot be handled by this command handler',
    })
  }

  const event = jsonEvent({
    type: 'VehicleRenamed',
    data: {
      name: command.newVehicleName,
    },
  })

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
