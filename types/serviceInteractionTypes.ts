/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

import { Message, VoiceState } from 'discord.js';

export enum InteractionSourceEnum {
  WAIT_FOR_MESSAGE_FROM_USER = 0,
  WAIT_FOR_MESSAGE_IN_SERVER = 5,
  WAIT_FOR_MESSAGE_FROM_CHANNEL = 10,
  WAIT_FOR_MESSAGE_CUSTOM_CRITERIA = 15,
  WAIT_FOR_MESSAGE_REACTION_CUSTOM_CRITERIA = 20,
  WAIT_FOR_VOICE_EVENT_USER_JOIN_IN_SERVER = 25,
  WAIT_FOR_VOICE_EVENT_USER_LEAVE_IN_SERVER = 30,
  WAIT_FOR_VOICE_EVENT_USER_JOIN_CHANNEL = 35,
  WAIT_FOR_VOICE_EVENT_USER_LEAVE_CHANNEL = 40,
  WAIT_FOR_VOICE_EVENT_CUSTOM_CRITERIA = 45,
}

export const interactionSources = {
  messageCreate: [
    InteractionSourceEnum.WAIT_FOR_MESSAGE_FROM_USER,
    InteractionSourceEnum.WAIT_FOR_MESSAGE_FROM_CHANNEL,
    InteractionSourceEnum.WAIT_FOR_MESSAGE_CUSTOM_CRITERIA,
  ],
  voiceStateUpdate: [
    InteractionSourceEnum.WAIT_FOR_VOICE_EVENT_USER_JOIN_IN_SERVER,
    InteractionSourceEnum.WAIT_FOR_VOICE_EVENT_USER_LEAVE_IN_SERVER,
    InteractionSourceEnum.WAIT_FOR_VOICE_EVENT_USER_JOIN_CHANNEL,
    InteractionSourceEnum.WAIT_FOR_VOICE_EVENT_USER_LEAVE_CHANNEL,
    InteractionSourceEnum.WAIT_FOR_VOICE_EVENT_CUSTOM_CRITERIA,
  ],
};

export type InteractionType = {
  interactionSource: InteractionSourceEnum;
  requirePrefix?: string;
  userId?: string;
  serverId?: string;
  channelId?: string;
  messageId?: string;
  validator?: (arg: Message) => boolean;
  vsValidator?: (oldState: VoiceState, newState: VoiceState) => boolean;
}

export type InteractionResolution = {
  /* True only if the promise was resolved by timeout */
  timeout: boolean;

  /* True unless a promise was unexpectedly rejected */
  success: boolean;

  /* Content properties exist only if success === true */
  content?: Message;
  vsContent?: [VoiceState, VoiceState];
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
