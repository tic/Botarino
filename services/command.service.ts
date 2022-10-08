import { readdirSync } from 'fs';
import { Message } from 'discord.js';
import { Arguments } from '../types/serviceArgumentParserTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { getLogger, getErrorLogger, logError } from './logger.service';
import { CommandControllerType } from '../types/commandTypes';
import * as analytics from './analytics.service';

const logger = getLogger('service_command');
const errorLogger = getErrorLogger('service_command');

type CommandControllerWithNameType = {
  name: string;
  controller: CommandControllerType;
}

const commandControllers: CommandControllerWithNameType[] = readdirSync('./commands')
  // eslint-disable-next-line import/no-dynamic-require, global-require
  .map((file) => ({ name: file.slice(0, -3), controller: require(`../commands/${file}`).default }));

export const controllerLookupMap: Record<string, CommandControllerType> = commandControllers.reduce(
  (acc, cur) => {
    acc[cur.name] = cur.controller;
    return acc;
  },
  {},
);

export const runCommand = async (command: string, args: Arguments, sourceMessage: Message) => {
  let commandSuccess = true;
  let executionComment = '';
  const commandStarted = new Date().getTime();

  try {
    const controller = controllerLookupMap[command];
    if (!controller) {
      logger.log(`unknown command "${command}"`);
    } else if (controller.validator && !controller.validator(args)) {
      logger.log(`validation failed for command "${command}"`);
      executionComment = 'validation failed';
    } else if (controller.isVisible && !controller.isVisible(sourceMessage, args)) {
      logger.log(`visibility failed for command "${command}"`);
      executionComment = 'visibility failed';
    } else {
      await controller.executor(args, sourceMessage);
    }
  } catch (error) {
    logError(
      LogCategoriesEnum.COMMAND_EXECUTION_FAILURE,
      `command_${command}`,
      `unhandled exception: ${String(error)}`,
    );
    commandSuccess = false;
  }

  try {
    await analytics.commandUsed(
      command,
      args,
      commandSuccess,
      commandStarted,
      executionComment,
      sourceMessage,
    );
  } catch (error) {
    errorLogger.log(LogCategoriesEnum.STATISTICS_FAILURE, String(error));
  }
};
