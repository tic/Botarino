import { Message } from 'discord.js';
import { serverEngagement } from '../types/databaseModels';
import { AnalyticsTypesEnum } from '../types/serviceAnalyticsTypes';
import { collections } from './database.service';

export const analyticsMessagePosted = async (message: Message) => {
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

export const analyticsCommandUsed = async () => {

};
