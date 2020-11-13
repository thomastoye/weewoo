import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/update-vehicle-position'
import {
  EventData,
  EventStoreConnection,
  writeEventsToStream,
} from '@eventstore/db-client'

export const updateVehiclePosition: (
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
    const event = EventData.json('VehicleMoved', {
      position: {
        lat: command.position.lat,
        lon: command.position.lon,
      },
      positionAtTime: command.positionAtTime,
    }).build()

    try {
      await writeEventsToStream(stream)
        .expectedRevision('stream_exists')
        .send(event)
        .execute(connection)

      return {
        result: 'accepted',
      }
    } catch (error) {
      return {
        result: 'rejected',
        reason: 'Could not update vehicle position',
        error,
      }
    }
  }
}
