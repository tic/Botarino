import { dispatchAction, buildBasicMessage } from '../services/discord.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const executor: CommandExecutor = async (args, message) => {
  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channel, args.raw, []),
  });
};

export default {
  executor,
  description: 'Sends a message containing whatever the user supplies as arguments.',
  help: '`$!$ <string[phrase to repeat]>',
} as CommandControllerType;
