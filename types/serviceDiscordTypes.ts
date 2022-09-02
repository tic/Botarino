/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */

import { Message, MessagePayload } from 'discord.js';

export enum ChannelClassEnum {
  GENERAL_UPDATES = 'GENERAL_UPDATES',
  HOLIDAY = 'HOLIDAY',
};

export type DiscordRoleType = {
  id: string,
  name: string,
};

export type DiscordChannelType = {
  id: string,
};

export type DiscordServerType = {
  name: string,
  id: string,
  roles: DiscordRoleType[],
  channels: Record<ChannelClassEnum, DiscordChannelType[]>,
};

export enum DiscordActionTypeEnum {
  SEND_MESSAGE = 0,
  DELETE_MESSAGE = 1,
  ADD_REACTION = 2,
  REMOVE_REACTION = 3,
  JOIN_VOICE_CHANNEL = 4,
  LEAVE_VOICE_CHANNEL = 5,
}

export type DiscordActionType = {
  actionType: DiscordActionTypeEnum.SEND_MESSAGE;
  payload: MessagePayload;
} | {
  actionType: DiscordActionTypeEnum.DELETE_MESSAGE;
  messageId: string;
}
