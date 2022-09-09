import { Message } from 'discord.js';
import { Arguments } from '../types/serviceArgumentParserTypes';

// eslint-disable-next-line import/prefer-default-export
export const parseArguments = (message: Message) : Arguments => {
  const withoutPrefix = message.content.substring(1);
  const basicParse = withoutPrefix.split(' ');
  const args = {
    raw: withoutPrefix,
    rawWithoutCommand: withoutPrefix.substring(withoutPrefix.indexOf(' ')),
    basicParse,
    basicParseWithoutCommand: basicParse.slice(1),
  };
  return args;
};
