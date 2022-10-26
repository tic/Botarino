import { CommandControllerType, CommandExecutor, VisibilityFunction } from '../types/commandTypes';
import { buildBasicMessage, buildIEmbed, dispatchAction } from '../services/discord.service';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';
import { manifest } from '../sounds/sounds.config.json';
import { Sound } from '../types/commandSpecificTypes';
import { playSoundToChannel } from '../services/audioPlayer.service';
import { soundPlayed } from '../services/analytics.service';

const { sounds }: { sounds: Record<string, Sound> } = manifest;

const visibilityHelper = (soundName: string, userId: string, serverId: string) => {
  const sound = sounds[soundName];
  if (!sound) {
    return false;
  }

  if (
    (sound?.permissions?.whitelist?.user && !sound.permissions.whitelist.user.includes(userId))
    || (sound?.permissions?.whitelist?.server && !sound.permissions.whitelist.server.includes(serverId))
    || (sound?.permissions?.blacklist?.user && sound.permissions.blacklist.user.includes(userId))
    || (sound?.permissions?.blacklist?.server && sound.permissions.blacklist.server.includes(serverId))
  ) {
    return false;
  }

  return true;
};

const getPlayableSounds = (userId: string, serverId: string) => Object
  .keys(sounds)
  .filter((soundName) => visibilityHelper(soundName, userId, serverId));

const command: CommandExecutor = async (args, message) => {
  if (args.basicParse[1] === 'list') {
    const results = getPlayableSounds(message.author.id, message.channelId);
    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel, ' ', [
        buildIEmbed({
          title: 'Valid sounds',
          description: results.join('     '),
        }),
      ]),
    });
    return;
  }

  const soundToPlay = sounds[args.basicParse[1]];
  soundToPlay.filename = soundToPlay.filename || args.basicParse[1];

  await playSoundToChannel(soundToPlay, message.member.voice.channel);
  await Promise.all([
    soundPlayed(soundToPlay.filename, Date.now(), message),
    dispatchAction({
      actionType: DiscordActionTypeEnum.DELETE_MESSAGE,
      channelId: message.channelId,
      messageId: message.id,
    }),
  ]);
};

const isVisible: VisibilityFunction = (message, args) => args.basicParse[1] === 'list' || visibilityHelper(
  args.basicParse[1],
  message.author.id,
  message.channelId,
);

export default {
  executor: command,
  description: 'Play sounds off a list of soundboard items',
  validator: (args) => args.basicParse.length === 2,
  isVisible,
  help: '`$!$ <string[name of the sound to play]>',
} as CommandControllerType;
