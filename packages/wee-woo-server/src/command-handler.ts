import { CommandResult } from './command-result'
import { Command } from './commands'

export type CommandHandler = (command: Command) => Promise<CommandResult>
