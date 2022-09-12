import { TextChannel } from 'discord.js';
import { dispatchAction, buildBasicMessage } from '../services/discord.service';
import { selectRandomElement } from '../services/util.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const responses = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes - definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'Don\'t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.',
];

const executor: CommandExecutor = async (_, { channel }) => {
  const response = selectRandomElement(responses);
  dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(channel as TextChannel, response, []),
  });
};

export default {
  executor,
  description: 'It\'s a magic 8 ball. Just ask a question!',
  help: '`$!$ <question>',
} as CommandControllerType;
