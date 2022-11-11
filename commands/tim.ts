import * as RandExp from 'randexp';
import { buildBasicMessage, buildIEmbed, dispatchAction } from '../services/discord.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
  let count = parseInt(args.basicParse[1], 10);
  if (!count || count < 0 || count > 100) {
    count = 1;
  }

  let regex = /T[aeiouy]{1,2}[a-z]{1,2}/;
  if (args.basicParse.length === 3) {
    try {
      regex = new RegExp(args.basicParse[2]);
    // eslint-disable-next-line no-empty
    } catch {}
  }

  const generatedNames = [];
  const generator = new RandExp(regex);
  let i = count;
  while (i--) {
    generatedNames.push(generator.gen());
  }

  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channelId, ' ', [
      buildIEmbed({
        title: `Generated ${count} name${count > 1 ? 's' : ''} using regex \`${regex}\`.`,
        description: generatedNames.join(', '),
      }),
    ]),
  });
};

export default {
  executor: command,
  description: 'Generates strings according to a provided regular expression.',
  help: '`$!$ <number[number of strings to generate]> <?string:regex to '
    + "make names that are similar to 'Tim'[regular expression to use]>",
} as CommandControllerType;
