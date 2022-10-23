import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: 'Retrieves information about which Seinfeld episode I am currently watching.',
  help: '`$!$ <?"options"|"assumptions":[optional subcommands]>',
} as CommandControllerType;
