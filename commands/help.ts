import { TextChannel } from 'discord.js';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { controllerLookupMap } from '../services/command.service';
import { buildBasicMessage, dispatchAction } from '../services/discord.service';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

export const formatCommandHelpString = (helpString: string) : string => {
  console.log(helpString);
  return helpString;
};

const executor: CommandExecutor = async (args, message) => {
  // Help called by itself: !help
  if (args.basicParse.length === 1) {
    // Provide general information about the bot and a list of valid commands.
    return;
  }

  const commandController = controllerLookupMap[args.basicParse[0]];

  // Help called on a non-existent command: !help diddlyDoodly
  if (!commandController) {
    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel as TextChannel, `Unknown command "${args.basicParse[0]}"`, []),
    });
    return;
  }

  // Help called on an actual command: !help echo
  const helpString = formatCommandHelpString(commandController.help);
  console.log(helpString);
};

export default {
  executor,
  description: '',
  help: '$!$ <string[the command to get help for]>',
} as CommandControllerType;
