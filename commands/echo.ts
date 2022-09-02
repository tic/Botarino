import { MessagePayload } from 'discord.js';
import { dispatchAction } from '../services/discord.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const echo: CommandExecutor = async (args, message) => {
  // Add a message to the Discord action queue
  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: new MessagePayload(
      message.channel,
      {
        content: args.raw,
      },
    ),
  });
};

export default {
  executor: echo,
  description: 'Sends a message containing whatever the user supplies as arguments.',
  help: '`$!$ <string>',
} as CommandControllerType;
