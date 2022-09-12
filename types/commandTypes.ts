import { Message } from 'discord.js';
import { Arguments } from './serviceArgumentParserTypes';

// eslint-disable-next-line no-unused-vars
export type CommandExecutor = (arg0: Arguments, arg1: Message) => Promise<void>;

export type CommandControllerType = {
  /* Function which implements the command. */
  executor: CommandExecutor;

  /* Describe the purpose of the command. */
  description: string;

  /* Provide expected command syntax. '$!$' will be replaced by arg[0], e.g. '!echo'. */
  help: string;

  /* Optionally provide examples of commands */
  examples?: { example: string, description: string }[];
}
