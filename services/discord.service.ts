// Need an action queue
// Supported actions:
//  - Send message
//  - Delete message
//  - Add reaction
//  - Remove reaction
//  - Join voice channel
//  - Leave voice channel

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
import { config } from '../config';
import { DiscordActionType, DiscordActionTypeEnum } from '../types/serviceDiscordTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { parseArguments } from './argumentParser.service';
import { logError, logMessage } from './logger.service';
import { Semaphore, sleep } from './util.service';

const options: ClientOptions = {
  intents: new Intents()
    .add(Intents.FLAGS.DIRECT_MESSAGES)
    .add(Intents.FLAGS.GUILDS)
    .add(Intents.FLAGS.GUILD_MESSAGES)
    .add(Intents.FLAGS.GUILD_MESSAGE_REACTIONS),
};
const client = new Client(options);

const executeSemaphore = new Semaphore(1);
const actionSemaphore = new Semaphore(1);
const pendingActions: DiscordActionType[] = [];

const executeAction = async (action: DiscordActionType) => {
  if (action.actionType === DiscordActionTypeEnum.SEND_MESSAGE) {
    const targetChannel = action.payload.target as TextChannel;
    const { send } = targetChannel;

    if (!send) {
      logError(
        LogCategoriesEnum.DISCORD_ERROR,
        config.discord.identifier,
        'invalid send function for submitted discord action',
      );
      return;
    }

    if (!targetChannel.permissionsFor(client.user).has(Permissions.FLAGS.SEND_MESSAGES)) {
      logError(
        LogCategoriesEnum.DISCORD_PERMISSION_ERROR,
        config.discord.identifier,
        `expected permission to send messages in channel ${targetChannel.id}`,
      );
      return;
    }

    await send(action.payload);
  } else if (action.actionType === DiscordActionTypeEnum.DELETE_MESSAGE) {
    const targetChannel: AnyChannel = client.channels.cache[action.channelId];
    if (!targetChannel.isText()) {
      logError(
        LogCategoriesEnum.DISCORD_ERROR,
        config.discord.identifier,
        `expected channel ${action.channelId} to be a text channel`,
      );
      return;
    }

    const targetTextChannel = targetChannel as TextChannel;
    const { permissionsFor } = targetTextChannel;

    if (!permissionsFor || !permissionsFor(client.user).has(Permissions.FLAGS.MANAGE_MESSAGES)) {
      logError(
        LogCategoriesEnum.DISCORD_ERROR,
        config.discord.identifier,
        `expected permission to delete messages in channel ${targetTextChannel.id}`,
      );
      return;
    }

    const targetMessage = await targetTextChannel.messages.fetch(action.messageId);

    if (!targetMessage) {
      logError(
        LogCategoriesEnum.DISCORD_ERROR,
        config.discord.identifier,
        `failed to locate message ${action.messageId} in channel ${action.channelId}`,
      );
      return;
    }

    if (!targetMessage.deletable) {
      logError(
        LogCategoriesEnum.DISCORD_ERROR,
        config.discord.identifier,
        `target message ${action.messageId} in channel ${action.channelId} is marked undeletable`,
      );
      return;
    }

    await targetMessage.delete();
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
          logError(
            LogCategoriesEnum.DISCORD_ERROR,
            config.discord.identifier,
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

export const initialize = () => {
  client.login(config.discord.secret);
  client.on('ready', () => {
    logMessage('service.discord.initialize', `${client.user.tag} has logged in.`);
    executeActions();
  });
};

export const buildBasicMessage = (
  content: string,
  embeds: MessageEmbed[],
  destination: TextChannel,
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
    arguments: isCommand ? parseArguments(message) : null,
  };
};
