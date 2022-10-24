import {
  Client,
  ClientOptions,
  Intents,
  Message,
  MessageEmbed,
  MessagePayload,
  TextChannel,
  Permissions,
  AnyChannel,
} from 'discord.js';
import { readdirSync } from 'fs';
import { config } from '../config';
import { DiscordActionType, DiscordActionTypeEnum } from '../types/serviceDiscordTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { ModuleControllerType } from '../types/serviceModulesTypes';
import { parseArguments } from './argumentParser.service';
import { getErrorLogger, getLogger, logMessage } from './logger.service';
import { Semaphore, sleep } from './util.service';

const logger = getLogger(config.discord.identifier);
const errorLogger = getErrorLogger(config.discord.identifier);

const options: ClientOptions = {
  intents: new Intents()
    .add(Intents.FLAGS.DIRECT_MESSAGES)
    .add(Intents.FLAGS.GUILDS)
    .add(Intents.FLAGS.GUILD_MESSAGES)
    .add(Intents.FLAGS.GUILD_MESSAGE_REACTIONS)
    .add(Intents.FLAGS.GUILD_VOICE_STATES),
};
const client = new Client(options);

const executeSemaphore = new Semaphore(1);
const actionSemaphore = new Semaphore(1);
const pendingActions: DiscordActionType[] = [];

const launchModules = async () => {
  const modules = readdirSync('./modules')
  // eslint-disable-next-line import/no-dynamic-require, global-require
    .map((file) => (file.endsWith('.ts') ? require(`../modules/${file}`).default : null))
    .filter((controller) => controller !== null) as ModuleControllerType[];

  await Promise.all(
    modules.map(async (module) => {
      const sourceName = `module_${module.name.replace(/\s/g, '-')}`;
      if (!module.runInDevMode) {
        logMessage(sourceName, 'module does not run in dev mode');
        return;
      }

      logMessage(sourceName, 'initializing module');
      await module.setup();

      logMessage(sourceName, 'starting module');
      module.run();
    }),
  );
};

const executeAction = async (action: DiscordActionType) => {
  if (action.actionType === DiscordActionTypeEnum.SEND_MESSAGE) {
    const targetChannel = action.payload.target as TextChannel;
    const send = (client.channels.cache.get(targetChannel.id) as TextChannel)?.send;

    if (!send) {
      errorLogger.log(
        LogCategoriesEnum.DISCORD_ERROR,
        'invalid send function for submitted discord action',
      );
      return;
    }

    if (!targetChannel.permissionsFor(client.user).has(Permissions.FLAGS.SEND_MESSAGES)) {
      errorLogger.log(
        LogCategoriesEnum.DISCORD_PERMISSION_ERROR,
        `expected permission to send messages in channel ${targetChannel.id}`,
      );
      return;
    }

    await targetChannel.send(action.payload);
  } else if (action.actionType === DiscordActionTypeEnum.DELETE_MESSAGE) {
    const targetChannel: AnyChannel = client.channels.cache[action.channelId];
    if (!targetChannel.isText()) {
      errorLogger.log(
        LogCategoriesEnum.DISCORD_ERROR,
        `expected channel ${action.channelId} to be a text channel`,
      );
      return;
    }

    const targetTextChannel = targetChannel as TextChannel;
    const { permissionsFor } = targetTextChannel;

    if (!permissionsFor || !permissionsFor(client.user).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      errorLogger.log(
        LogCategoriesEnum.DISCORD_ERROR,
        `expected permission to delete messages in channel ${targetTextChannel.id}`,
      );
      return;
    }

    const targetMessage = await targetTextChannel.messages.fetch(action.messageId);

    if (!targetMessage) {
      errorLogger.log(
        LogCategoriesEnum.DISCORD_ERROR,
        `failed to locate message ${action.messageId} in channel ${action.channelId}`,
      );
      return;
    }

    if (!targetMessage.deletable) {
      errorLogger.log(
        LogCategoriesEnum.DISCORD_ERROR,
        `target message ${action.messageId} in channel ${action.channelId} is marked undeletable`,
      );
      return;
    }

    await targetMessage.delete();
  } else if (action.actionType === DiscordActionTypeEnum.SET_PRESENCE) {
    client.user.setPresence(action.presence);
  }
};

const executeActions = async () => {
  const releaseExecute = await executeSemaphore.acquire();
  try {
    let actionsToExecute: DiscordActionType[] = [];
    const releaseAction = await actionSemaphore.acquire();
    try {
      actionsToExecute = pendingActions.splice(0);
    } finally {
      releaseAction();
    }
    await Promise.all(
      actionsToExecute.map(async (action, index) => {
        await sleep(index * 3000);
        try {
          executeAction(action);
        } catch (error) {
          errorLogger.log(
            LogCategoriesEnum.DISCORD_ERROR,
            `failed action of type ${String(action.actionType)}`,
          );
        }
      }),
    );
  } finally {
    releaseExecute();
  }
};

export const dispatchAction = async (action: DiscordActionType) => {
  const release = await actionSemaphore.acquire();
  try {
    pendingActions.push(action);
  } finally {
    release();
  }

  executeActions();
};

export const dispatchActions = async (actions: DiscordActionType[]) => {
  const release = await actionSemaphore.acquire();
  try {
    pendingActions.push(...actions);
  } finally {
    release();
  }

  executeActions();
};

export const initialize = () => {
  client.login(config.discord.secret);
  client.on('ready', async () => {
    logger.log(`${client.user.tag} has logged in.`);
    await launchModules();
    executeActions();
  });
};

export const buildBasicMessage = (
  destination: TextChannel,
  content: string,
  embeds: MessageEmbed[],
) => new MessagePayload(
  destination,
  {
    content,
    embeds,
  },
);

export const parseMessage = (message: Message) => {
  const isCommand = message.content.length > 1 && message.content[0] === config.discord.prefix;
  return {
    isCommand,
    arguments: isCommand ? parseArguments(message.content) : null,
  };
};

export const getClientId = () => client.user.id;

export const setHandler = (event, listener) => client.on(event, listener);

export const getCurrentPresence = () => client.user.presence;
