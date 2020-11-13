import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/rename-vehicle'
import {
  EventData,
  EventStoreConnection,
  writeEventsToStream,
} from '@eventstore/db-client'

export const renameVehicle: (
  connection: EventStoreConnection
) => CommandHandler = (connection) => {
  return async (command) => {
    if (command.name !== commandName) {
      return Promise.resolve({
        result: 'rejected',
        reason: 'Command cannot be handled by this command handler',
      })
    }

    const stream = `Vehicle-${command.vehicleId}`
    const event = EventData.json('VehicleRenamed', {
      name: command.newVehicleName,
    }).build()

    try {
      await writeEventsToStream(stream)
        .expectedRevision('any')
        .send(event)
        .execute(connection)

      return {
        result: 'accepted',
      }
    } catch (error) {
      return {
        result: 'rejected',
        reason: 'Could not rename vehicle',
        error,
      }
    }
  }
}
