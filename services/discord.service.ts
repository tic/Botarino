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
  MessageEmbed,
  MessagePayload,
  TextChannel,
} from 'discord.js';
import { config } from '../config';
import { DiscordActionType } from '../types/serviceDiscordTypes';
import { Semaphore } from './util.service';

const options: ClientOptions = {
  intents: new Intents()
    .add(Intents.FLAGS.DIRECT_MESSAGES)
    .add(Intents.FLAGS.GUILDS)
    .add(Intents.FLAGS.GUILD_MESSAGES)
    .add(Intents.FLAGS.GUILD_MESSAGE_REACTIONS),
};
const client = new Client(options);

const actionSemaphore = new Semaphore(1);
const pendingActions: DiscordActionType[] = [];

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

export const dispatchAction = async (action: DiscordActionType) => {
  const release = await actionSemaphore.acquire();
  try {
    pendingActions.push(action);
  } finally {
    release();
  }
};

export const initialize = () => {
  client.login(config.discord.secret);
  // client.on('ready', () => {
  //   logMessage('service.discord.initialize', `${config.discord.username} has logged in.`);
  //   throttleMessages();
  // });
};
