import { readdirSync } from 'fs';
import { Message } from 'discord.js';
import { config } from '../config';
import { commandEngagement } from '../types/databaseModels';
import { Arguments } from '../types/serviceArgumentParserTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { collections } from './database.service';
import { logError } from './logger.service';
import { CommandControllerType } from '../types/commandTypes';

type CommandControllerWithNameType = {
  name: string;
  controller: CommandControllerType;
}

const commandControllers: CommandControllerWithNameType[] = readdirSync('../commands')
  // eslint-disable-next-line import/no-dynamic-require, global-require
  .map((file) => ({ name: file.slice(0, -3), controller: require(`../commands/${file}`) }));

const controllerLookupMap: Record<string, CommandControllerType> = commandControllers.reduce(
  (acc, cur) => {
    acc[cur.name] = cur.controller;
    return acc;
  },
  {},
);

const runCommand = async (command: string, args: Arguments, sourceMessage: Message) => {
  let commandSuccess = true;
  const commandStarted = new Date().getTime();

  try {
    const controller = controllerLookupMap[command];
    if (!controller) {
      // TODO: handle command not found
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
    collections.commandStats.insertOne({
      serverId: sourceMessage.inGuild ? sourceMessage.guildId : null,
      channelId: sourceMessage.channelId,
      invokerId: sourceMessage.author.id,
      command: args.basicParse[0],
      args: args.raw,
      succeeded: commandSuccess,
      elapsedTimeMs: new Date().getTime() - commandStarted,
    } as commandEngagement);
  } catch (error) {
    logError(LogCategoriesEnum.STATISTICS_FAILURE, config.hypervisor.identifier, String(error));
  }
};

export default {
  runCommand,
  controllerLookupMap,
};
