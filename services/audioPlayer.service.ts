import { createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';
import { Sound } from '../types/commandSpecificTypes';

const player = createAudioPlayer();

const getResource = (sound: Sound) => createAudioResource(
  `../sounds/${sound.filename}`,
  { inputType: StreamType.Arbitrary },
);

// eslint-disable-next-line import/prefer-default-export
export const playSoundToChannel = async (sound: Sound, channel: VoiceBasedChannel) => {
  if (!channel) {
    return false;
  }

  const resource = getResource(sound);
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: null,
  });

  return true;
};
