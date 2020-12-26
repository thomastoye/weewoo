import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client'
import { CommandHandler } from './command-handler'
import { endIntegrationTest } from './command-handlers/end-integration-test'
import { renameVehicle } from './command-handlers/rename-vehicle'
import { updateVehiclePosition } from './command-handlers/update-vehicle-position'
import { receiveLoraWANDataFromCloudEngine } from './command-handlers/receive-lorawan-data-from-cloudengine'
import { Command } from './commands'
import {
  CommandAcceptedResult,
  CommandRejectedResult,
  CommandResult,
} from './command-result'

export type ServerConfig = {
  cloudEnginePreSharedKey: string
}

const registerRejectedCommand = async (
  connection: EventStoreDBClient,
  command: Command,
  rejection: CommandRejectedResult,
  initialResult?: CommandAcceptedResult
): Promise<void> => {
  try {
    await connection.appendToStream(
      'RejectedCommand',
      jsonEvent({
        eventType: 'CommandRejected',
        payload: {
          command,
          rejection: {
            reason: rejection.reason,
            result: rejection.result,
            error: rejection.error
              ? {
                  message: rejection.error.message,
                  name: rejection.error.name,
                  stack: rejection.error.stack,
                  stingified: rejection.error.toString(),
                }
              : undefined,
          },
          initialResult,
        },
        metadata: {
          timestamp: new Date().getTime(),
        },
      })
    )
  } catch (err) {
    // Persisting rejected commands on a best effort basis
    console.log('Could not register rejected command.', command)
  }
}

const getEvents = async (
  command: Command,
  config: ServerConfig
): Promise<CommandResult> => {
  switch (command.name) {
    case 'UpdateVehiclePosition':
      return updateVehiclePosition(command)

    case 'RenameVehicle':
      return renameVehicle(command)

    case 'ReceiveLoraWANDataFromCloudEngine':
      return receiveLoraWANDataFromCloudEngine({
        preSharedKey: config.cloudEnginePreSharedKey,
      })(command)

    case 'EndIntegrationTest':
      return endIntegrationTest(command)

    default:
      return {
        result: 'rejected',
        reason: 'Unknown command',
      }
  }
}

export const createServer: (
  connection: EventStoreDBClient,
  config: ServerConfig
) => CommandHandler = (connection, config) => async (command) => {
  const commandResult = await getEvents(command, config)

  if (commandResult.result === 'rejected') {
    await registerRejectedCommand(connection, command, commandResult)
    return commandResult
  }

  try {
    await Promise.all(
      commandResult.events.map((event) => {
        return connection.appendToStream(event.stream, event.event, {
          expectedRevision: event.expectedRevision,
        })
      })
    )

    return commandResult
  } catch (err) {
    const rejection = {
      result: 'rejected' as const,
      reason:
        'Events could not be written to the event store - probably optimistic concurrency violation',
      err,
    }

    await registerRejectedCommand(connection, command, rejection, commandResult)

    return rejection
  }
}
