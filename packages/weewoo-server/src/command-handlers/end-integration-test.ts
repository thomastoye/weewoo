import { CommandHandler } from '../command-handler'
import { commandName } from '../commands/end-integration-test'
import { jsonEvent } from '@eventstore/db-client'

export const endIntegrationTest: CommandHandler = async (command) => {
  if (command.name !== commandName) {
    return Promise.resolve({
      result: 'rejected',
      reason: 'Command cannot be handled by this command handler',
    })
  }

  const event = jsonEvent({ type: 'IntegrationTestEnded', data: {} })

  return {
    result: 'accepted',
    events: [
      {
        stream: 'IntegrationTest',
        event,
        expectedRevision: 'no_stream',
      },
    ],
  }
}
