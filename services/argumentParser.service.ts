import { Message } from 'discord.js';
import { Arguments } from '../types/serviceArgumentParserTypes';

// eslint-disable-next-line import/prefer-default-export
export const parseArguments = (message: Message) : Arguments => {
  const args = {
    raw: message.content,
    basicParse: message.content.substring(1).split(' '),
  };
  return args;
};
