import { Message } from 'discord.js';
import { config } from '../config';
import { serverEngagement } from '../types/databaseModels';
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
import { logError } from './logger.service';
import { Semaphore } from './util.service';
import Command from './command.service';

const interactionLock = new Semaphore(1);
const pendingInteractions: PendingInteractionType[] = [];

export const interaction = async (
  requestedInteraction: InteractionType,
  blocking: boolean,
  blockable: boolean,
) : Promise<InteractionResolution> => {
  const callTime = new Date().getTime();
  const interactionId = Buffer.from(String(callTime + Math.round(Math.random() * 10000)), 'ascii').toString('hex');
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
      channelId: message.channelId,
      senderId: message.author.id,
      serverId: message.inGuild ? message.guildId : null,
      timestamp: message.createdTimestamp,
      username: message.author.username,
    } as serverEngagement);
  } catch (error) {
    logError(LogCategoriesEnum.STATISTICS_FAILURE, config.hypervisor.identifier, String(error));
  }

  let interactionsToFulfill: PendingInteractionType[] = [];
  const release = await interactionLock.acquire();
  try {
    let matchingBlocked = false;
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
  } finally {
    release();
  }

  if (interactionsToFulfill.length > 0) {
    interactionsToFulfill.forEach((interactionItem) => interactionItem.resolver({
      timeout: false,
      success: true,
      content: message,
    }));
  } else if (classification.isCommand) {
    await Command.runCommand(classification.arguments.basicParse[0], classification.arguments, message);
  }
};
