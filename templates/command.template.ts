import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: '',
  help: '`$!$ ...',
} as CommandControllerType;
