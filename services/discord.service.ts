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
} from 'discord.js';
import { config } from '../config';
import { DiscordActionType } from '../types/serviceDiscordTypes';
import { parseArguments } from './argumentParser.service';
import { logMessage } from './logger.service';
import { Semaphore } from './util.service';

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

};

const executeActions = async () => {
  const releaseExecute = await executeSemaphore.acquire();
  let releaseAction = await actionSemaphore.acquire();
  try {
    const actionsToExecute = pendingActions.splice(0);
    for (let i = 0; i < actionsToExecute.length; i++) {

    }
  } finally {
    releaseAction();
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
    throttleActions();
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
