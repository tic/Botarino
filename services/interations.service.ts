import { Message } from 'discord.js';
import { serverEngagement } from '../types/databaseModels';
import { PendingInteractionType } from '../types/serviceInteractionTypes';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { logError } from './logger.service';

const pendingInteractions: PendingInteractionType[] = [];

// Takes in messages and coordinates command behavior:
// 1. Log statistics (serverId, channelId, authorId, timestamp)
// 2. Is this a message we were waiting for?
//      - If so, pipe data into the appropriate handler and clear the pending interaction.
// 3. If not, is this a command?
//      - If so, spin up a new command handler.
export const hypervisor = (message: Message) => {
  try {
    
  } catch (error) {
    logError(LogCategoriesEnum.STATISTICS_FAILURE, 'service_hypervisor', String(error));
  }
  try {

  } catch (error) {
    logError(LogCategoriesEnum.HYPERVISOR_FAILURE, 'service_hypervisor', String(error));
  }
}
