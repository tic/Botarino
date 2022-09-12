import { TextChannel } from 'discord.js';
import { dispatchAction, buildBasicMessage, getClientId } from '../services/discord.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const executor: CommandExecutor = async (args, message) => {
  const clientId = args.basicParse[1] || getClientId();
  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot`;
  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channel as TextChannel, url, []),
  });
};

export default {
  executor,
  description: 'Generates the URL required to add a bot to a Discord server.',
  help: '`$!$ <?botClientId:selfClientId>',
} as CommandControllerType;