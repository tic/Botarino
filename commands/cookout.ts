import { CommandControllerType, CommandExecutor } from '../types/commandTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
};

export default {
  executor: command,
  description: 'With so many options available at Cookout, sometimes a little help building your order is needed. This '
    + "command can provide you with a variety of cookout information. Don't forget to play some Christian rock while or"
    + 'dering.',
  help: '$!$ <"jrtray"|"tray"|"burger"|"bbq"|"chicken"|"assorted"|"shake"|"vs"[cookout entity type]> <?number:2[number '
    + 'of trays to generate for a VS battle. Required only when using the vs entity type.] <?"combo":[turns any entity '
    + 'into a combo meal]>',
} as CommandControllerType;
