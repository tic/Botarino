import { ObjectId } from 'mongodb';
import { AnalyticsTypesEnum } from './serviceAnalyticsTypes';

export interface DatabaseItem {
  _id?: ObjectId;
}

export interface StatisticItem extends DatabaseItem {
  engagementType: AnalyticsTypesEnum;
  serverId: string | null;
  channelId: string;
  userId: string;
  timestamp: number;
}

export interface ServerEngagement extends StatisticItem {
  engagementType: AnalyticsTypesEnum.NEW_MESSAGE;
  username: string;
}

type HourType = `${'0' | '1'}${'0' | '1' | '2' | '3' | '5' | '6' | '7' | '8' | '9'}` | '20' | '21' | '22' | '23';
type MinuteType = `${'0' | '1' | '2' | '3' | '4' | '5'}${'0' | '1' | '2' | '3' | '5' | '6' | '7' | '8' | '9'}`;
export type ReminderAtType = `${HourType}:${MinuteType}`;

export interface Reminder extends DatabaseItem {
  authorId: string;
  targetChannelId: string;
  frequency: 'ONCE' | 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';
  on: string;
  at: ReminderAtType,
  title: string;
  description: string;
}

export interface CommandEngagement extends StatisticItem {
  engagementType: AnalyticsTypesEnum.COMMAND_USED;
  command: string;
  args: string;
  succeeded: boolean;
  elapsedTimeMs: number;
  executionComment: string | null;
}

export interface GifEngagement extends StatisticItem {
  engagementType: AnalyticsTypesEnum.GIF_AWARDED;
  gifId: string | ObjectId;
}

export interface SoundEngagement extends StatisticItem {
  engagementType: AnalyticsTypesEnum.SOUND_PLAYED;
  channelId: string | null;
  sound: string;
}

export interface GifItem extends DatabaseItem {
  gifSourceUrl: string;
  messageTemplate: string;
  awardCount: number;
  relativeProbability: number;
}
