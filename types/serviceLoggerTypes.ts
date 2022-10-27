/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable import/prefer-default-export */

export enum LogCategoriesEnum {
  COMMAND_EXECUTION_FAILURE = 'COMMAND_EXECUTION_FAILURE',
  DISCORD_ERROR = 'DISCORD_ERROR',
  DISCORD_PERMISSION_ERROR = 'DISCORD_PERMISSION_ERROR',
  STATUS_LOG = 'STATUS_LOG',
  CONNECTION_FAILURE = 'CONNECTION_FAILURE',
  HYPERVISOR_FAILURE = 'HYPERVISOR_FAILURE',
  STATISTICS_FAILURE = 'STATISTICS_FAILURE',
  MODULE_INITIALIZATION_FAILURE = 'MODULE_INITIALIZATION_FAILURE',
  MODULE_RUN_FAILURE = 'MODULE_RUN_FAILURE',
};

export type LoggerType = (arg0: string, arg1: string) => Promise<boolean>;

export type ErrorLoggerType = (arg0: LogCategoriesEnum, arg1: string, arg2?: string) => Promise<boolean>;
