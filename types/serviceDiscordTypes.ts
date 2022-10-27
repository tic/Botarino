/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */

import {
  ColorResolvable,
  MessageEmbed,
  MessagePayload,
  PresenceData,
} from 'discord.js';

export enum DiscordActionTypeEnum {
  SEND_MESSAGE = 0,
  DELETE_MESSAGE = 1,
  ADD_REACTION = 2,
  REMOVE_REACTION = 3,
  SET_PRESENCE = 6,
}

export type DiscordActionType = {
  actionType: DiscordActionTypeEnum.SEND_MESSAGE;
  payload: MessagePayload;
} | {
  actionType: DiscordActionTypeEnum.DELETE_MESSAGE;
  channelId: string;
  messageId: string;
} | {
  actionType: DiscordActionTypeEnum.SET_PRESENCE;
  presence: PresenceData;
}

export type IEmbedProperties = {
  color?: ColorResolvable;
  title?: string;
  url?: string;
  thumbnail?: string;
  author?: {
    name: string;
    url?: string;
    iconURL?: string;
  },
  description?: string;
  removeInlineDefault?: boolean;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[],
  footer?: {
    text: string;
    url?: string;
    iconUrl?: string;
  },
  timestamp?: number | true;
  image?: string;
}

export type IEmbed = MessageEmbed
