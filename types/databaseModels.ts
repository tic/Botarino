import { ObjectId } from 'mongodb';
import { AnalyticsTypesEnum } from './serviceAnalyticsTypes';

export interface databaseItem {
  _id?: ObjectId;
}

export interface serverEngagement extends databaseItem {
  engagementType: AnalyticsTypesEnum;
  channelId: string;
  senderId: string;
  serverId: string | null;
  timestamp: number;
  username: string;
}

export interface reminder extends databaseItem {
  authorId: string;
  targetChannelId: string;
  frequency: string;
  trigger: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
  title: string;
  description: string;
}

export interface commandEngagement extends databaseItem {
  serverId: string;
  channelId: string;
  invokerId: string;
  command: string;
  args: string;
  succeeded: boolean;
  elapsedTimeMs: number;
  executionComment: string;
}

export interface gifEngagement extends databaseItem {
  serverId: string;
  channelId: string;
  userId: string;
  gifId: string | ObjectId;
  timestamp: number;
}

export interface gifItem extends databaseItem {
  gifSourceUrl: string;
  messageTemplate: string;
  awardCount: number;
  relativeProbability: number;
}
