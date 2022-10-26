import { MessageEmbed, TextChannel } from 'discord.js';
import { collections } from '../services/database.service';
import { buildBasicMessage, dispatchAction } from '../services/discord.service';
import { formatNumAsPct } from '../services/util.service';
import { CommandControllerType, CommandExecutor, createRegexValidator } from '../types/commandTypes';
import { StatisticItem } from '../types/databaseModels';
import { AnalyticsTypesEnum } from '../types/serviceAnalyticsTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const countFilters = (userId: string) => [
  {
    $facet: {
      totalCount: [
        { $count: 'count' },
      ],
      userCount: [
        { $match: { userId } },
        { $count: 'count' },
      ],
    },
  },
  { $set: { totalCount: { $ifNull: [{ $first: '$totalCount' }, { count: 0 }] } } },
  { $set: { totalCount: '$totalCount.count' } },
  { $set: { userCount: { $ifNull: [{ $first: '$userCount' }, { count: 0 }] } } },
  { $set: { userCount: '$userCount.count' } },
];

const command: CommandExecutor = async (args, message) => {
  const userIdFromMessage = args.rawWithoutCommand.match(/(\d{18})/)?.[1];
  const userId = userIdFromMessage || message.author.id;
  const hasServerTag = args.basicParseWithoutCommand[0] === 'server' && message.inGuild();
  const hasChannelTag = args.basicParseWithoutCommand[0] === 'channel';
  const doServerStats = hasServerTag || (!hasServerTag && !hasChannelTag);
  const doChannelStats = hasChannelTag || (!hasServerTag && !hasChannelTag);
  const doGenericUserStats = doServerStats && doChannelStats && userIdFromMessage;
  const stats: { name: string; value: string }[] = [];

  if (doServerStats) {
    const [[messageCountObject], [commandCountObject], [gifCountObject], [firstStatsItem]] = await Promise.all([
      collections.serverEngagements.aggregate([
        {
          $match: {
            engagementType: AnalyticsTypesEnum.NEW_MESSAGE,
            serverId: message.guildId,
          },
        },
        ...countFilters(userId),
      ]).toArray(),
      collections.serverEngagements.aggregate([
        {
          $match: {
            engagementType: AnalyticsTypesEnum.COMMAND_USED,
            serverId: message.guildId,
          },
        },
        ...countFilters(userId),
      ]).toArray(),
      collections.serverEngagements.aggregate([
        {
          $match: {
            engagementType: AnalyticsTypesEnum.GIF_AWARDED,
            serverId: message.guildId,
          },
        },
        ...countFilters(userId),
      ]).toArray(),
      collections.serverEngagements.aggregate([
        { $match: { serverId: message.guildId } },
        { $sort: { _id: 1 } },
        { $limit: 1 },
      ]).toArray(),
    ]);

    const serverCreationTime = Math.floor(message.guild.createdTimestamp / 1000);
    const { totalCount: totalMessageCount, userCount: userMessageCount } = messageCountObject;
    const { totalCount: totalCommandCount, userCount: userCommandCount } = commandCountObject;
    const { totalCount: totalGifCount, userCount: userGifCount } = gifCountObject;
    const firstStatsItemTimestamp = Math.floor((firstStatsItem as StatisticItem)._id.getTimestamp().getTime() / 1000);

    stats.push(
      { name: 'Server Age', value: `Created on <t:${serverCreationTime}:F>\nAbout <t:${serverCreationTime}:R>!` },
      {
        name:
        'Oldest Server Record',
        value: `I have been tracking analytics in this server since <t:${firstStatsItemTimestamp}:F>`,
      },
      {
        name: 'Server Message Count',
        value: `${totalMessageCount} message${totalMessageCount !== 1 ? 's' : ''}\n`
          + `${userMessageCount} from <@${userId}> `
          + `(${formatNumAsPct(userMessageCount / (totalMessageCount || 1), 2)}%)`,
      },
      {
        name: 'Server Command Count',
        value: `${totalCommandCount} message${totalCommandCount !== 1 ? 's' : ''}\n`
        + `${userCommandCount} from <@${userId}> (${formatNumAsPct(userCommandCount / (totalCommandCount || 1), 2)}%)`,
      },
      {
        name: 'Server Gif Count',
        value: `${totalGifCount} message${totalGifCount !== 1 ? 's' : ''}\n`
        + `${userGifCount} awarded to <@${userId}> (${formatNumAsPct(userGifCount / (totalGifCount || 1), 2)}%)`,
      },
    );
  }

  if (doChannelStats) {
    const [[messageCountObject], [commandCountObject], [gifCountObject], [firstStatsItem]] = await Promise.all([
      collections.serverEngagements.aggregate([
        {
          $match: {
            engagementType: AnalyticsTypesEnum.NEW_MESSAGE,
            channelId: message.channelId,
          },
        },
        ...countFilters(userId),
      ]).toArray(),
      collections.serverEngagements.aggregate([
        {
          $match: {
            engagementType: AnalyticsTypesEnum.COMMAND_USED,
            channelId: message.channelId,
          },
        },
        ...countFilters(userId),
      ]).toArray(),
      collections.serverEngagements.aggregate([
        {
          $match: {
            engagementType: AnalyticsTypesEnum.GIF_AWARDED,
            channelId: message.channelId,
          },
        },
        ...countFilters(userId),
      ]).toArray(),
      collections.serverEngagements.aggregate([
        { $match: { channelId: message.channelId } },
        { $sort: { _id: 1 } },
        { $limit: 1 },
      ]).toArray(),
    ]);

    const channelCreationTime = Math.floor(message.channel.createdTimestamp / 1000);
    const { totalCount: totalMessageCount, userCount: userMessageCount } = messageCountObject;
    const { totalCount: totalCommandCount, userCount: userCommandCount } = commandCountObject;
    const { totalCount: totalGifCount, userCount: userGifCount } = gifCountObject;
    const firstStatsItemTimestamp = Math.floor((firstStatsItem as StatisticItem)._id.getTimestamp().getTime() / 1000);

    stats.push(
      { name: 'Channel Age', value: `Created on <t:${channelCreationTime}:F>\nAbout <t:${channelCreationTime}:R>!` },
      {
        name:
        'Oldest Channel Record',
        value: `I have been tracking analytics in this channel since <t:${firstStatsItemTimestamp}:F>`,
      },
      {
        name: 'Channel Message Count',
        value: `${totalMessageCount} message${totalMessageCount !== 1 ? 's' : ''}\n`
          + `${userMessageCount} from <@${userId}> `
          + `(${formatNumAsPct(userMessageCount / (totalMessageCount || 1), 2)}%)`,
      },
      {
        name: 'Channel Command Count',
        value: `${totalCommandCount} message${totalCommandCount !== 1 ? 's' : ''}\n`
        + `${userCommandCount} from <@${userId}> (${formatNumAsPct(userCommandCount / (totalCommandCount || 1), 2)}%)`,
      },
      {
        name: 'Channel Gif Count',
        value: `${totalGifCount} message${totalGifCount !== 1 ? 's' : ''}\n`
        + `${userGifCount} awarded to <@${userId}> (${formatNumAsPct(userGifCount / (totalGifCount || 1), 2)}%)`,
      },
    );
  }

  if (doGenericUserStats) {
    const member = message.mentions.members.find((guildMember) => guildMember.id === userId) || null;

    if (member) {
      const createdAt = Math.floor(member.user.createdTimestamp / 1000);
      const memberSince = Math.floor(member.joinedTimestamp / 1000);

      stats.push(
        {
          name: 'User Account Age',
          value: `<@${userId}> has been online since <t:${createdAt}:F>\nAbout <t:${createdAt}:R>!`,
        },
        {
          name: 'User Membership',
          value: `<@${userId}> joined on <t:${memberSince}:F>\nAbout <t:${memberSince}:R>!`,
        },
      );
    }
  }

  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channel as TextChannel, ' ', [
      new MessageEmbed()
        .setAuthor({ name: 'Statistics' })
        .setDescription('Here are some (hopefully) interesting statistics!')
        .addFields(stats.map((stat) => ({ ...stat, inline: true }))),
    ]),
  });
};

const validator = createRegexValidator(/^(((server)|(channel))( ((<@\d{18}>)|(\d{18})))?)|((<@\d{18}>)|(\d{18}))$/);

export default {
  executor: command,
  description: "Retrieve use statistics about yourself or the channel and server you're in.",
  help: '`$!$ <?"server"|"channel":both[retrieve statistics for either the channel or the server]> <?string:you[user to'
    + ' get stats for]>',
  validator: (args) => args.rawWithoutCommand.length === 0 || validator(args),
} as CommandControllerType;
