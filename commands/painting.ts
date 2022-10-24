import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: 'Posts a random abstract painting pre-generated by a neural network. Check out https://1secondpainting.c'
    + 'om.',
  help: '`$!$ <?number:random from 0-9999[optionally specify a specific painting]',
} as CommandControllerType;