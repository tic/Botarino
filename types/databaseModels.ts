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

export interface Reminder extends DatabaseItem {
  authorId: string;
  targetChannelId: string;
  frequency: string;
  trigger: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
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
