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
  User,
} from 'discord.js';
import { readdirSync } from 'fs';
import { config } from '../config';
import { DiscordActionType, DiscordActionTypeEnum, IEmbedProperties } from '../types/serviceDiscordTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { ModuleControllerType } from '../types/serviceModulesTypes';
import { parseArguments } from './argumentParser.service';
import { getErrorLogger, getLogger } from './logger.service';
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
      const moduleLogger = getLogger(`module_${module.name.replace(/\s/g, '-')}`);
      if (config.meta.inDevelopment && !module.runInDevMode) {
        moduleLogger.log('module does not run in dev mode');
        return;
      }

      moduleLogger.log('initializing module');
      await module.setup();

      moduleLogger.log('starting module');
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
  destination: string,
  content: string,
  embeds: MessageEmbed[],
) => new MessagePayload(
  client.channels.cache.get(destination) as TextChannel,
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

export const buildIEmbed = (props?: IEmbedProperties) => {
  const defaultFooter = {
    text: `Maintained by ${config.discord.maintainer}`,
    iconURL: 'https://i.gyazo.com/0842de92fce0bef73327f31a628245ec.jpg',
  };

  const baseEmbed = new MessageEmbed()
    .setColor('#2ecc71')
    .setTimestamp()
    .setFooter(defaultFooter);

  if (!props) {
    return baseEmbed;
  }

  if (props.color) {
    baseEmbed.setColor(props.color);
  }

  if (props.title) {
    baseEmbed.setTitle(props.title);
  }

  if (props.url) {
    baseEmbed.setURL(props.url);
  }

  if (props.thumbnail) {
    baseEmbed.setThumbnail(props.thumbnail);
  }

  if (props.author) {
    baseEmbed.setAuthor(props.author);
  }

  if (props.description) {
    if (props.description.length === 0) {
      throw new Error("description can't be an empty string");
    }

    baseEmbed.setDescription(props.description);
  }

  if (props.fields) {
    const invalidFields = props.fields.reduce(
      (sum, field) => (field.name.length && field.value.length ? sum : sum + 1),
      0,
    );

    if (invalidFields > 0) {
      throw new Error('field names and values cannot contain empty strings');
    }

    const inlineDefault = !props.removeInlineDefault;
    baseEmbed.setFields(props.fields.map((field) => ({
      name: field.name,
      value: field.value,
      inline: field.inline ?? inlineDefault,
    })));
  }

  if (props.footer) {
    baseEmbed.setFooter({ ...defaultFooter, ...props.footer });
  }

  if (props.timestamp) {
    if (props.timestamp === true) {
      baseEmbed.setTimestamp();
    } else {
      baseEmbed.setTimestamp(props.timestamp);
    }
  }

  if (props.image) {
    baseEmbed.setImage(props.image);
  }

  return baseEmbed;
};

export const getUser = async (
  userId: string,
) : Promise<User | undefined> => Promise.resolve(client.users.cache.get(userId) || await client.users.fetch(userId));
