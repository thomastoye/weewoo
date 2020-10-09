import { EventStoreConnection } from '@eventstore/db-client'
import { CommandHandler } from './command-handler'
import { renameVehicle } from './command-handlers/rename-vehicle'
import { updateVehiclePosition } from './command-handlers/update-vehicle-position'

const connection = EventStoreConnection.builder()
  .insecure()
  .singleNodeConnection('localhost:2113')

export const server: CommandHandler = (command) => {
  switch (command.name) {
    case 'UpdateVehiclePosition':
      return updateVehiclePosition(connection)(command)

    case 'RenameVehicle':
      return renameVehicle(connection)(command)

    default:
      return Promise.resolve({
        result: 'rejected',
        reason: 'Unknown command',
      })
  }
}
