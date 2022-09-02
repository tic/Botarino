/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

import { Message } from 'discord.js';

export enum InteractionSourceEnum {
  WAIT_FOR_MESSAGE_FROM_USER = 0,
  WAIT_FOR_MESSAGE_FROM_CHANNEL = 1,
  WAIT_FOR_MESSAGE_CUSTOM_CRITERIA = 2,
  WAIT_FOR_MESSAGE_REACTION = 3,
}

export type PendingInteractionType = {
  interactionSource: InteractionSourceEnum.WAIT_FOR_MESSAGE_FROM_USER;
  requirePrefix: boolean;
  userId: string;
} | {
  interactionSource: InteractionSourceEnum.WAIT_FOR_MESSAGE_FROM_CHANNEL;
  requirePrefix: boolean;
  channelId: string;
} | {
  interactionSource: InteractionSourceEnum.WAIT_FOR_MESSAGE_CUSTOM_CRITERIA;
  validator: (arg0: Message) => boolean;
} | {
  interactionSource: InteractionSourceEnum.WAIT_FOR_MESSAGE_REACTION;
  messageId: string;
}
