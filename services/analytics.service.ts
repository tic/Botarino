import { Message } from 'discord.js';
import { config } from '../config';
import { CommandEngagement, ServerEngagement, SoundEngagement } from '../types/databaseModels';
import { AnalyticsTypesEnum } from '../types/serviceAnalyticsTypes';
import { Arguments } from '../types/serviceArgumentParserTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { collections } from './database.service';
import { getErrorLogger } from './logger.service';

const errorLogger = getErrorLogger('service_analytics');

export const messagePosted = async (message: Message) => {
  if (!config.analytics.enabled) {
    return;
  }

  const engagement: ServerEngagement = {
    engagementType: AnalyticsTypesEnum.NEW_MESSAGE,
    serverId: message.inGuild() ? message.guildId : null,
    channelId: message.channelId,
    userId: message.author.id,
    timestamp: message.createdTimestamp,
    username: `${message.author.username}#${message.author.discriminator}`,
  };
  await collections.serverEngagements.insertOne(engagement);
};

export const commandUsed = async (
  command: string,
  args: Arguments,
  succeeded: boolean,
  startTime: number,
  comment: string,
  message: Message,
) => {
  if (!config.analytics.enabled) {
    return;
  }

  const result = await collections.serverEngagements.insertOne({
    engagementType: AnalyticsTypesEnum.COMMAND_USED,
    timestamp: startTime,
    serverId: message.inGuild ? message.guildId : null,
    channelId: message.channelId,
    userId: message.author.id,
    command,
    args: args.raw,
    succeeded,
    elapsedTimeMs: new Date().getTime() - startTime,
    executionComment: comment && comment.length > 0 ? comment : null,
  } as CommandEngagement);

  if (!result.insertedId) {
    errorLogger.log(LogCategoriesEnum.STATISTICS_FAILURE, 'failed to log command engagement');
  }
};

export const soundPlayed = async (
  sound: string,
  timestamp: number,
  message: Message,
) => {
  if (!config.analytics.enabled) {
    return;
  }

  const result = await collections.serverEngagements.insertOne({
    engagementType: AnalyticsTypesEnum.SOUND_PLAYED,
    timestamp,
    serverId: message.inGuild ? message.guildId : null,
    channelId: message.channelId,
    userId: message.author.id,
    sound,
  } as SoundEngagement);

  if (!result.insertedId) {
    errorLogger.log(LogCategoriesEnum.STATISTICS_FAILURE, 'failed to log command engagement');
  }
};
