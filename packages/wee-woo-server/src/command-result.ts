export type CommandResult =
  | {
      result: 'rejected'
      reason: string
      error?: Error
    }
  | {
      result: 'accepted'
    }
