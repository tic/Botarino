import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: 'Splits a long message into 2000 character segments and posts them sequentially. Content must be supplie'
    + 'd through a Pastebin link.',
  help: '`$!$ <string[Pastebin link]>',
} as CommandControllerType;
