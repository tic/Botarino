import {
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  VoiceBasedChannel,
} from 'discord.js';
import { join } from 'node:path';
import { Sound } from '../types/commandSpecificTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { logError, logMessage } from './logger.service';

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Pause,
  },
});

const getResource = (sound: Sound) => createAudioResource(
  join('soundboard', `${sound.filename}.mp3`),
  { inputType: StreamType.Arbitrary },
);

const disconnectTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const beginDisconnectTimer = (channelId: string, connection: VoiceConnection) => {
  const timer = disconnectTimers[channelId];
  if (timer) {
    clearTimeout(timer);
  }

  disconnectTimers[channelId] = setTimeout(() => {
    connection.destroy();
    delete disconnectTimers[channelId];
  }, 900000);
};

// eslint-disable-next-line import/prefer-default-export
export const playSoundToChannel = async (sound: Sound, channel: VoiceBasedChannel) => {
  if (!channel) {
    return false;
  }

  let connection = getVoiceConnection(channel.guildId);

  if (connection?.joinConfig?.channelId !== channel.id) {
    logMessage('service_audioPlayer', 'establishing connection');
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
      logError(LogCategoriesEnum.CONNECTION_FAILURE, 'service_audioPlayer', 'voice channel connection timeout');
      return false;
    }
  } else {
    logMessage('service_audioPlayer', 'already connected -- using existing connection');
  }

  if (!connection) {
    logMessage('service_audioPlayer', 'invalid connection object');
    return false;
  }

  logMessage('service_audioPlayer', 'connected -- playing');
  connection.subscribe(player);
  player.play(getResource(sound));
  beginDisconnectTimer(channel.id, connection);
  return true;
};
