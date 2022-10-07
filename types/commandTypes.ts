/* eslint-disable no-unused-vars */
import { AnyChannel, Message } from 'discord.js';
import { Arguments } from './serviceArgumentParserTypes';

export type CommandExecutor = (arg0: Arguments, arg1: Message) => Promise<void>;

export type ValidatorFunction = (arg0: Arguments) => boolean;

export type VisibilityFunction = (arg0: Message, arg1: Arguments) => boolean;

export type CommandControllerType = {
  /* Function which implements the command. */
  executor: CommandExecutor;

  /* Describe the purpose of the command. */
  description: string;

  /* Provide expected command syntax. '$!$' will be replaced by arg[0], e.g. '!echo'. */
  help: string;

  /* Optionally provide examples of commands */
  examples?: { example: string, description: string }[];

  /* Optionally provide a validator function to run before executing */
  validator?: ValidatorFunction;

  /* Optionally provide a function to determine whether the command is available in the given context */
  isVisible?: VisibilityFunction;
}

export const createRegexValidator = (regex: RegExp) => (args: Arguments) => !!args.rawWithoutCommand.match(regex);

export const createVisibilityFilter = (whitelist: string[], blacklist: string[]) => (message: Message) => {
  if (!message.channel.isText) {
    return false;
  }

  const { id } = message.channel;
  const passedWhitelist = whitelist.length > 0 ? whitelist.includes(id) : true;
  const passedBlacklist = !blacklist.includes(id);
  return passedWhitelist && passedBlacklist;
};
