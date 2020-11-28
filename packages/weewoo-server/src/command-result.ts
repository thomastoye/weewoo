import { EventData, WriteEventsExpectedRevision } from '@eventstore/db-client'

export type CommandRejectedResult = {
  result: 'rejected'
  reason: string
  error?: Error
}

export type CommandAcceptedResult = {
  result: 'accepted'
  events: readonly {
    event: EventData
    stream: string
    expectedRevision: WriteEventsExpectedRevision
  }[]
}

export type CommandResult = CommandRejectedResult | CommandAcceptedResult
