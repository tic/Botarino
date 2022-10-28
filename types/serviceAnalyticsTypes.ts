/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

export enum AnalyticsTypesEnum {
  NEW_MESSAGE = 0,
  COMMAND_USED = 1,
  SOUND_PLAYED = 2,
  GIF_AWARDED = 3,
}

export const AnalyticsTypesEnumToString: Record<AnalyticsTypesEnum, string> = {
  [AnalyticsTypesEnum.NEW_MESSAGE]: 'new message',
  [AnalyticsTypesEnum.COMMAND_USED]: 'command used',
  [AnalyticsTypesEnum.SOUND_PLAYED]: 'sound played',
  [AnalyticsTypesEnum.GIF_AWARDED]: 'gif awarded',
};
