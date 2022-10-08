import {
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  VoiceBasedChannel,
} from 'discord.js';
import { join } from 'node:path';
import { Sound } from '../types/commandSpecificTypes';
// import { logError } from './logger.service';
// import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Pause,
  },
});

const getResource = (sound: Sound) => createAudioResource(
  join('..', 'soundboard', `${sound.filename}.mp3`),
  { inputType: StreamType.Arbitrary },
);

// eslint-disable-next-line import/prefer-default-export
export const playSoundToChannel = async (sound: Sound, channel: VoiceBasedChannel) => {
  if (!channel) {
    return false;
  }

  console.log('joining vc');

  let connection = getVoiceConnection(channel.guildId);

  if (connection?.joinConfig?.channelId !== channel.id) {
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
    });

    const isConnected = await Promise.race([
      new Promise((resolve) => {
        connection.on(VoiceConnectionStatus.Ready, () => {
          resolve(true);
        });
      }),
      new Promise((resolve) => {
        setTimeout(() => resolve(false), 30000);
      }),
    ]);

    if (!isConnected) {
      console.log('no connect');
      return false;
    }
  } else {
    console.log('already connected');
  }

  if (connection) {
    connection.subscribe(player);
    player.play(getResource(sound));
    setTimeout(() => connection.destroy(), 10000);
    return true;
  }

  return false;

  // console.log(connection);

  // try {
  //   await entersState(connection, VoiceConnectionStatus.Ready, 30e3); // 30e3 = 30000
  // } catch (error) {
  //   connection.destroy();
  //   logError(LogCategoriesEnum.DISCORD_ERROR, String(error));
  //   return false;
  // }

  // console.log('getting retsource');
  // const resource = getResource(sound);
  // console.log(resource);
  // try {
  //   player.play(resource);
  //   await entersState(player, AudioPlayerStatus.Playing, 5e3);
  // } catch (error) {
  //   connection.destroy();
  //   logError(LogCategoriesEnum.DISCORD_ERROR, String(error));
  //   return false;
  // }

  // return true;
};
