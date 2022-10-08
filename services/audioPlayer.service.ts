import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
  DiscordGatewayAdapterLibraryMethods,
  entersState,
  joinVoiceChannel,
  StreamType,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  Client,
  Snowflake,
  VoiceBasedChannel,
  Events,
  Status,
  Guild,
} from 'discord.js';
import {
  GatewayDispatchEvents,
  GatewayVoiceServerUpdateDispatchData,
  GatewayVoiceStateUpdateDispatchData,
} from 'discord-api-types/v9';
import { Sound } from '../types/commandSpecificTypes';
import { logError } from './logger.service';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';

const adapters = new Map<Snowflake, DiscordGatewayAdapterLibraryMethods>();
const trackedClients = new Set<Client>();
const trackedShards = new Map<number, Set<Snowflake>>();
const player = createAudioPlayer();

const getResource = (sound: Sound) => createAudioResource(
  `../sounds/${sound.filename}`,
  { inputType: StreamType.Arbitrary },
);

function trackClient(client: Client) {
  if (trackedClients.has(client)) return;
  trackedClients.add(client);
  client.ws.on(GatewayDispatchEvents.VoiceServerUpdate, (payload: GatewayVoiceServerUpdateDispatchData) => {
    adapters.get(payload.guild_id)?.onVoiceServerUpdate(payload);
  });
  client.ws.on(GatewayDispatchEvents.VoiceStateUpdate, (payload: GatewayVoiceStateUpdateDispatchData) => {
    if (payload.guild_id && payload.session_id && payload.user_id === client.user?.id) {
      adapters.get(payload.guild_id)?.onVoiceStateUpdate(payload);
    }
  });
  client.on(Events.ShardDisconnect, (_, shardId) => {
    const guilds = trackedShards.get(shardId);
    if (guilds) {
      // eslint-disable-next-line no-restricted-syntax
      for (const guildID of guilds.values()) {
        adapters.get(guildID)?.destroy();
      }
    }
    trackedShards.delete(shardId);
  });
}

function trackGuild(guild: Guild) {
  let guilds = trackedShards.get(guild.shardId);
  if (!guilds) {
    guilds = new Set();
    trackedShards.set(guild.shardId, guilds);
  }
  guilds.add(guild.id);
}

function createDiscordJSAdapter(channel: VoiceBasedChannel): DiscordGatewayAdapterCreator {
  return (methods) => {
    adapters.set(channel.guild.id, methods);
    trackClient(channel.client);
    trackGuild(channel.guild);
    return {
      sendPayload(data) {
        if (channel.guild.shard.status === Status.Ready) {
          channel.guild.shard.send(data);
          return true;
        }
        return false;
      },
      destroy() {
        return adapters.delete(channel.guild.id);
      },
    };
  };
}

// eslint-disable-next-line import/prefer-default-export
export const playSoundToChannel = async (sound: Sound, channel: VoiceBasedChannel) => {
  if (!channel) {
    return false;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: createDiscordJSAdapter(channel),
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30e3); // 30e3 = 30000
  } catch (error) {
    connection.destroy();
    logError(LogCategoriesEnum.DISCORD_ERROR, String(error));
    return false;
  }

  const resource = getResource(sound);
  try {
    player.play(resource);
    await entersState(player, AudioPlayerStatus.Playing, 5e3);
  } catch (error) {
    connection.destroy();
    logError(LogCategoriesEnum.DISCORD_ERROR, String(error));
    return false;
  }

  return true;
};
