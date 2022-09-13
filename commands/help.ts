import { TextChannel } from 'discord.js';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { controllerLookupMap } from '../services/command.service';
import { buildBasicMessage, dispatchAction } from '../services/discord.service';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';
import { parseSyntaxDescriptionFromHelpString } from '../services/argumentParser.service';

const executor: CommandExecutor = async (args, message) => {
  // Help called by itself: !help
  if (args.basicParse.length === 1) {
    // Provide general information about the bot and a list of valid commands.
    return;
  }

  const commandName = args.basicParse[0];
  const commandController = controllerLookupMap[commandName];

  // Help called on a non-existent command: !help diddlyDoodly
  if (!commandController) {
    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel as TextChannel, `Unknown command "${args.basicParse[0]}"`, []),
    });
    return;
  }

  // Help called on an actual command: !help echo
  const syntax = parseSyntaxDescriptionFromHelpString(commandName, commandController.help);
  console.log(syntax);
};

export default {
  executor,
  description: '',
  help: '$!$ <string[the command to get help for]>',
} as CommandControllerType;
