import { MessageEmbed, TextChannel } from 'discord.js';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { controllerLookupMap } from '../services/command.service';
import { buildBasicMessage, dispatchAction } from '../services/discord.service';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';
import { parseSyntaxDescriptionFromHelpString } from '../services/argumentParser.service';
import { ArgumentDescription } from '../types/serviceArgumentParserTypes';

const parsedArgToString = (parsedArg: ArgumentDescription) => {
  const pieces = [];

  if (parsedArg.description.length > 0) {
    pieces.push(`*Description*: ${parsedArg.description}`);
  }
  if (parsedArg.defaultValue) {
    pieces.push(`*Defaults to*: ${parsedArg.defaultValue}`);
  }
  if (parsedArg.datatypes.length > 0) {
    pieces.push(`*Accepted datatypes*: ${parsedArg.datatypes.join(', ')}`);
  }
  if (parsedArg.required) {
    pieces.push('*__Required__!*');
  }

  return pieces.join('\n');
};

const executor: CommandExecutor = async (args, message) => {
  // Help called by itself: !help
  if (args.basicParse.length === 1) {
    // Provide general information about the bot and a list of valid commands.
    return;
  }

  const commandName = args.basicParse[1];
  const commandController = controllerLookupMap[commandName];

  if (!commandController) {
    // Help called on a non-existent command: !help diddlyDoodly
    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel as TextChannel, `Unknown command "${args.basicParse[0]}"`, []),
    });
  } else if (!commandController.isVisible || commandController.isVisible(message.channel)) {
    // Help called on an actual command: !help echo
    const syntax = parseSyntaxDescriptionFromHelpString(commandName, commandController.help);
    console.log(JSON.stringify(syntax, undefined, '  '));
    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel as TextChannel, ' ', [
        new MessageEmbed()
          .setAuthor({ name: 'Command help', iconURL: 'https://i.gyazo.com/ed410bced3281d8829580ebe5452feb6.png' })
          .addFields(
            { name: 'Call syntax', value: syntax.callSyntax },
            ...syntax.arguments.map(
              (parsedArg, index) => ({ name: `Argument ${index + 1}`, value: parsedArgToString(parsedArg) }),
            ),
          ),
      ]),
    });
  }
};

export default {
  executor,
  description: '',
  help: '$!$ <string[the command to get help for]>',
} as CommandControllerType;
