import { Message } from 'discord.js';
import { commandEngagement, serverEngagement } from '../types/databaseModels';
import { AnalyticsTypesEnum } from '../types/serviceAnalyticsTypes';
import { Arguments } from '../types/serviceArgumentParserTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { collections } from './database.service';
import { getErrorLogger } from './logger.service';

const errorLogger = getErrorLogger('service_analytics');

export const messagePosted = async (message: Message) => {
  const engagement: serverEngagement = {
    engagementType: AnalyticsTypesEnum.NEW_MESSAGE,
    channelId: message.channelId,
    senderId: message.author.id,
    serverId: message.inGuild() ? message.guildId : null,
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
  const result = await collections.commandStats.insertOne({
    serverId: message.inGuild ? message.guildId : null,
    channelId: message.channelId,
    invokerId: message.author.id,
    command,
    args: args.raw,
    succeeded,
    elapsedTimeMs: new Date().getTime() - startTime,
    executionComment: comment && comment.length > 0 ? comment : null,
  } as commandEngagement);

  if (!result.insertedId) {
    errorLogger.log(LogCategoriesEnum.STATISTICS_FAILURE, 'failed to log command engagement');
  }
};
