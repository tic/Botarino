import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: 'Determines the minimum number of payments necessary to ensure all members of a group have paid the same'
    + ' amount towards a communal pot where each member prepaid a different amount. For instance, if three roommates ea'
    + 'ch pay a different bill.',
  help: '`$!$ <string[person A]> <number[amount paid by A]> <string[person B]> <number[amount paid by B]> ...',
} as CommandControllerType;
