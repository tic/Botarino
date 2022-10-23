import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: "Retrieve use statistics about yourself or the channel and server you're in.",
  help: '`$!$ ... todo ...',
} as CommandControllerType;
