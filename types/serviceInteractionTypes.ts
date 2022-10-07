/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

import { Message } from 'discord.js';

export enum InteractionSourceEnum {
  WAIT_FOR_MESSAGE_FROM_USER = 0,
  WAIT_FOR_MESSAGE_FROM_CHANNEL = 1,
  WAIT_FOR_MESSAGE_CUSTOM_CRITERIA = 2,
  WAIT_FOR_MESSAGE_REACTION = 3,
  WAIT_FOR_VOICE_CHANNEL_CONNECT = 4,
}

export type InteractionType = {
  interactionSource: InteractionSourceEnum;
  requirePrefix?: string;
  userId?: string;
  channelId?: string;
  messageId?: string;
  validator?: (arg: Message) => boolean;
}

export type InteractionResolution = {
  /* True only if the promise was resolved by timeout */
  timeout: boolean;

  /* True unless a promise was unexpectedly rejected */
  success: boolean;

  /* Message content (exists only if success === true) */
  content?: Message;
}

export type ResolvingFunction = (arg0: InteractionResolution) => void;

export type PendingInteractionType = {
  id: string;
  interaction: InteractionType;
  resolver: ResolvingFunction;
  started: number;
  blocking: boolean;
  blockable: boolean;
}
