import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/end-integration-test'
import {
  EventData,
  EventStoreConnection,
  writeEventsToStream,
} from '@eventstore/db-client'

export const endIntegrationTest: (
  connection: EventStoreConnection
) => CommandHandler = (connection) => {
  return async (command) => {
    if (command.name !== commandName) {
      return Promise.resolve({
        result: 'rejected',
        reason: 'Command cannot be handled by this command handler',
      })
    }

    const stream = 'IntegrationTest'
    const event = EventData.json('EndIntegrationTest', {}).build()

    try {
      await writeEventsToStream(stream)
        .expectedRevision('no_stream')
        .send(event)
        .execute(connection)

      return {
        result: 'accepted',
      }
    } catch (error) {
      return {
        result: 'rejected',
        reason: 'Could not send integration test end event',
        error,
      }
    }
  }
}
