/* eslint-disable no-console */
import { appendFile } from 'fs';
import { ErrorLoggerType, LogCategoriesEnum, LoggerType } from '../types/serviceLoggerTypes';

const twoDigitPad = (value: number) : string => (value < 10 ? `0${value}` : value.toString());

const getLogFileName = () : string => {
  const now = new Date();
  return `./logs/${now.getFullYear()}.${twoDigitPad(now.getMonth() + 1)}.botarino.log`;
};

const getTimeString = () : string => {
  const now = new Date();
  return `${
    twoDigitPad(now.getFullYear())
  }.${
    twoDigitPad(now.getMonth() + 1)
  }.${
    twoDigitPad(now.getDate())
  }T${
    twoDigitPad(now.getHours())
  }:${
    twoDigitPad(now.getMinutes())
  }:${
    twoDigitPad(now.getSeconds())
  }`;
};

// [time]|[log version]|[category]|[source]|[message]
const logFormat = '%s|%s|%s|%s|%s';
const logVersion = 'v1.0.0';

export const interpretLogLine = (logLine: string) : void => {
  const logPieces = logLine.split('|');
  if (logPieces[1] === 'v1.0.0') {
    if (logPieces.length !== 4) {
      console.log('Incorrectly formatted log message with version v1.0.0');
    } else {
      console.log(
        'Timestamp: %s\nLog version: %s\nCategory: %s\nSource: %s\nMessage: %s',
        logPieces[0],
        logPieces[1],
        logPieces[2],
        logPieces[3],
        logPieces[4],
      );
    }
  } else {
    console.log('Unsupported log format/version.');
  }
};

const writeLine = async (line: string) : Promise<boolean> => {
  console.log(line);
  return new Promise((resolve) => {
    appendFile(
      getLogFileName(),
      `${line}\n`,
      (error) => {
        resolve(error === null);
      },
    );
  });
};

const logError: ErrorLoggerType = (
  category: LogCategoriesEnum,
  source: string,
  message?: string,
) : Promise<boolean> => {
  const timeStr = getTimeString();
  const assembledMessage = [
    timeStr,
    logVersion,
    category,
    source,
    message || '',
  ].reduce((msg, content) => msg.replace('%s', content), logFormat);
  return writeLine(assembledMessage);
};

const logMessage: LoggerType = (source: string, message: string) : Promise<boolean> => {
  const timeStr = getTimeString();
  const assembledMessage = [
    timeStr,
    logVersion,
    LogCategoriesEnum.STATUS_LOG,
    source,
    message || '',
  ].reduce((msg, content) => msg.replace('%s', content), logFormat);
  return writeLine(assembledMessage);
};

export const getErrorLogger = (src: string) => ({
  log: (ctg: LogCategoriesEnum, msg?: string) => logError(ctg, src, msg),
});

export const getLogger = (src: string) => ({
  log: (msg: string) => logMessage(src, msg),
});
