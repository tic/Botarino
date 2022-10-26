import { Message } from 'discord.js';
import { config } from '../config';
import { ServerEngagement } from '../types/databaseModels';
import { AnalyticsTypesEnum } from '../types/serviceAnalyticsTypes';
import {
  InteractionResolution,
  InteractionType,
  PendingInteractionType,
  ResolvingFunction,
} from '../types/serviceInteractionTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { collections } from './database.service';
import { parseMessage } from './discord.service';
import { getErrorLogger, getLogger } from './logger.service';
import { Semaphore } from './util.service';
import { runCommand } from './command.service';

const logger = getLogger(config.hypervisor.identifier);
const errorLogger = getErrorLogger(config.hypervisor.identifier);

const interactionLock = new Semaphore(1);
const pendingInteractions: PendingInteractionType[] = [];

export const interaction = async (
  requestedInteraction: InteractionType,
  blocking: boolean,
  blockable: boolean,
) : Promise<InteractionResolution> => {
  const callTime = new Date().getTime();
  const interactionId = Buffer.from(`${callTime}N${Math.round(Math.random() * 10000)}`, 'ascii').toString('hex');
  const interactionPromise = new Promise((resolve: ResolvingFunction) => {
    interactionLock.acquire().then((release) => {
      try {
        pendingInteractions.push({
          id: interactionId,
          interaction: requestedInteraction,
          resolver: resolve,
          started: callTime,
          blocking,
          blockable,
        });
      } finally {
        release();
      }
    }).catch(() => resolve({ timeout: false, success: false }));
  });

  const timeoutPromise = new Promise((resolve: ResolvingFunction) => {
    setTimeout(() => {
      interactionLock.acquire().then((release) => {
        try {
          const interactionIndex = pendingInteractions.findIndex((item) => item.id === interactionId);
          if (interactionIndex > -1) {
            pendingInteractions.splice(interactionIndex, 1);
          }
          resolve({ timeout: true, success: true });
        } finally {
          release();
        }
      }).catch(() => resolve({ timeout: false, success: false }));
    }, 600000);
  });

  return Promise.race([timeoutPromise, interactionPromise]);
};

// Takes in messages and coordinates command behavior:
// 1. Log statistics (serverId, channelId, authorId, timestamp)
// 2. Is this a message we were waiting for?
//      - If so, pipe data into the appropriate handler and clear the pending interaction.
// 3. If not, is this a command?
//      - If so, spin up a new command handler.
export const hypervisor = async (message: Message) => {
  const classification = parseMessage(message);
  try {
    collections.serverEngagements.insertOne({
      engagementType: AnalyticsTypesEnum.NEW_MESSAGE,
      serverId: message.inGuild ? message.guildId : null,
      channelId: message.channelId,
      userId: message.author.id,
      timestamp: message.createdTimestamp,
      username: message.author.username,
    } as ServerEngagement);
  } catch (error) {
    errorLogger.log(LogCategoriesEnum.STATISTICS_FAILURE, String(error));
  }

  let interactionsToFulfill: PendingInteractionType[] = [];
  let matchingBlocked = false;

  const release = await interactionLock.acquire();
  try {
    const matchedInteractions = new Set<number>();
    for (let i = 0; i < pendingInteractions.length; i++) {
      const pendingInteraction = pendingInteractions[i];
      if (matchingBlocked && pendingInteraction.blockable) {
        continue;
      }

      const isPrefixSatisfied = pendingInteraction.interaction.requirePrefix
        ? message.content.indexOf(pendingInteraction.interaction.requirePrefix) === 0
        : true;

      const isUserIdSatisfied = pendingInteraction.interaction.userId
        ? message.author.id === pendingInteraction.interaction.userId
        : true;

      const isChannelIdSatisfied = pendingInteraction.interaction.channelId
        ? message.channelId === pendingInteraction.interaction.channelId
        : true;

      const isMessageIdSatisfied = pendingInteraction.interaction.messageId
        ? message.id === pendingInteraction.interaction.messageId
        : true;

      const matched = isPrefixSatisfied && isUserIdSatisfied && isChannelIdSatisfied && isMessageIdSatisfied;
      if (matched) {
        matchedInteractions.add(i);
        matchingBlocked = matchingBlocked || pendingInteraction.blocking;
      }
    }

    interactionsToFulfill = pendingInteractions.filter((_, i) => matchedInteractions.has(i));
    Array.from(matchedInteractions.values()).sort((a, b) => b - a).forEach((index) => {
      pendingInteractions.splice(index, 1);
    });
  } finally {
    release();
  }

  if (interactionsToFulfill.length > 0) {
    const pluralizedEnding = interactionsToFulfill.length === 1 ? '' : 's';

    logger.log(`fulfilling ${interactionsToFulfill.length} pending interaction${pluralizedEnding}`);
    interactionsToFulfill.forEach((interactionItem) => interactionItem.resolver({
      timeout: false,
      success: true,
      content: message,
    }));
  }

  // Only try to run a command if there were no matched, blocking interactions
  if (!matchingBlocked && classification.isCommand) {
    logger.log(`no pending blocking interactions for command ${classification.arguments.basicParse[0]}`);
    await runCommand(classification.arguments.basicParse[0], classification.arguments, message);
  }
};
