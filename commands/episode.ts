import { MessageEmbed, TextChannel } from 'discord.js';
import { getCurrentEpisode } from '../modules/presence.module';
import { buildBasicMessage, dispatchAction } from '../services/discord.service';
import { padToNDigits } from '../services/util.service';
import { CommandControllerType, CommandExecutor, createRegexValidator } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const formatRuntime = (runtime: number) => {
  const minutes = Math.floor(runtime / 60);
  const seconds = runtime % 60;
  return `${minutes}m${padToNDigits(seconds, 2)}s`;
};

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
  let embed: MessageEmbed;

  if (args.rawWithoutCommand.includes('options')) {
    embed = new MessageEmbed()
      .setTitle('Episode Info')
      .setDescription('The episode command has a couple sub-commands to pick from.')
      .addFields(
        { name: 'options', value: 'Display this message.', inline: true },
        { name: 'assumptions', value: 'Get information about how episodes are counted.', inline: true },
      );
  } else if (args.rawWithoutCommand.includes('assumptions')) {
    embed = new MessageEmbed()
      .setTitle('Episode Info')
      .setDescription(
        '1. There is no generally accepted standard for episode runtimes. They vary slightly everywhere. The ones used '
        + 'here are from an upscaled copy of the Netflix version.\n2. Special episodes that are double the normal episo'
        + 'de length are split into parts (1) and (2). The runtimes are divided according to the fade-to-black where th'
        + 'e episodes would be split apart should they air separately.\n3. The episode that is currently being watched '
        + 'is selected as if the episodes had been streaming continuously since midnight UTC on January 1st, 1970.',
      );
  } else {
    const currentEpisode = getCurrentEpisode();
    embed = new MessageEmbed()
      .setTitle(`${currentEpisode.name} - ${currentEpisode.spot}`)
      .setURL(currentEpisode.link)
      .setDescription("Here's what I'm currently watching!")
      .addFields(
        { name: 'Name', value: currentEpisode.name, inline: true },
        { name: 'Spot', value: currentEpisode.spot, inline: true },
        { name: 'Runtime', value: formatRuntime(currentEpisode.runtime), inline: true },
      );
  }

  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channel as TextChannel, ' ', [embed]),
  });
};

export default {
  executor: command,
  description: 'Retrieves information about which Seinfeld episode I am currently watching.',
  help: '`$!$ <?"options"|"assumptions":[optional subcommands]>',
  validator: createRegexValidator(/^((options)|(assumptions))?$/),
} as CommandControllerType;
