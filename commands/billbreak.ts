import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: 'Designed to help split food costs or other bills where the amount paid per person is itemized and likel'
    + 'y non-equal.',
  help: '`$!$ <string[person A]> <number[item 1 cost]> <number[item 2 cost]> ... <string[person B]> <number[item 1 cost'
    + ']> <number[item 2 cost]> ... <?string:tax[tax]> <?number:0[amount of tax]> <?string:fees[fees]> <?number:0[fee 1'
    + ']> <?number:0[fee 2]>',
} as CommandControllerType;
