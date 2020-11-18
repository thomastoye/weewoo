import { EventStoreConnection } from '@eventstore/db-client'
import { CommandHandler } from './command-handler'
import { endIntegrationTest } from './command-handlers/end-integration-test'
import { renameVehicle } from './command-handlers/rename-vehicle'
import { updateVehiclePosition } from './command-handlers/update-vehicle-position'

export const createServer: (
  connection: EventStoreConnection
) => CommandHandler = (connection) => (command) => {
  switch (command.name) {
    case 'UpdateVehiclePosition':
      return updateVehiclePosition(connection)(command)

    case 'RenameVehicle':
      return renameVehicle(connection)(command)

    case 'EndIntegrationTest':
      return endIntegrationTest(connection)(command)

    default:
      return Promise.resolve({
        result: 'rejected',
        reason: 'Unknown command',
      })
  }
}
