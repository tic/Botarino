/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import { Message, TextChannel } from 'discord.js';
import { interaction } from '../services/interactions.service';
import { ModuleControllerType } from '../types/serviceModulesTypes';
import { InteractionSourceEnum } from '../types/serviceInteractionTypes';
import { logError } from '../services/logger.service';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { collections } from '../services/database.service';
import { gifEngagement, gifItem } from '../types/databaseModels';
import { buildBasicMessage, dispatchAction, getClientId } from '../services/discord.service';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

let gifs: gifItem[];

const refreshGifs = async () => {
  try {
    const result = await collections.gifs.find({}).toArray();
    gifs = result as gifItem[];
  } catch (error) {
    logError(LogCategoriesEnum.MODULE_RUN_FAILURE, 'module_gif', String(error));
  }
};

const formatGifMessage = (gif: gifItem, message: Message) => gif.messageTemplate
  .replace('$USER', `<@!${message.author.id}>`)
  .replace('$URL', gif.gifSourceUrl);

const runModule = async () => {
  setInterval(refreshGifs, 3600000);
  await refreshGifs();
  while (true) {
    const event = await interaction(
      {
        interactionSource: InteractionSourceEnum.WAIT_FOR_MESSAGE_CUSTOM_CRITERIA,
        validator: (message) => message.author.id !== getClientId(),
      },
      false,
      false,
    );

    if (!event.timeout && event.success) {
      if (Math.floor(Math.random() * 350) === 0) {
        // Award a gif! Which one?
        const probabilityField = [0, ...new Array(gifs.length)];
        let i = 0;

        for (; i < gifs.length; i++) {
          probabilityField[i + 1] = gifs[i].relativeProbability + probabilityField[i];
        }

        // Remove first zero
        probabilityField.shift();

        // Generate random number
        const random = Math.floor(Math.random() * probabilityField[--i]);

        // Find which gif we were granted
        for (let k = 0; k < probabilityField.length; k++) {
          if (random < probabilityField[k]) {
            try {
              collections.gifStats.insertOne({
                serverId: (event.content.channel as TextChannel).guildId || null,
                channelId: event.content.channelId,
                userId: event.content.author.id,
                gifId: gifs[i]._id,
                timestamp: Date.now(),
              } as gifEngagement);

              await dispatchAction({
                actionType: DiscordActionTypeEnum.SEND_MESSAGE,
                payload: buildBasicMessage(
                  event.content.channel as TextChannel,
                  formatGifMessage(gifs[i], event.content),
                  [],
                ),
              });
            } catch (error) {
              logError(LogCategoriesEnum.MODULE_RUN_FAILURE, 'module_gif', String(error));
            }
            break;
          }
        }
      }
    }
  }
};

export default {
  name: 'gif distributor',
  run: runModule,
  setup: () => Promise.resolve(null),
} as ModuleControllerType;
