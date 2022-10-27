/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import { dispatchAction } from '../services/discord.service';
import { getLogger } from '../services/logger.service';
import { sleep } from '../services/util.service';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';
import { ModuleControllerType } from '../types/serviceModulesTypes';
import { totalRuntime, episodes } from './episodes.data.json';

const logger = getLogger('module_presence-controller');
let episode = {
  name: '',
  spot: '',
  runtime: 0,
  link: '',
};

const runModule = async () => {
  while (true) {
    logger.log('updating presence');
    let seriesProgress = (Date.now() % totalRuntime.milliseconds) / 1000;
    let targetEpisode = 0;
    episode = { ...episodes[0] };
    for (; targetEpisode < episodes.length; targetEpisode++) {
      episode = { ...episodes[targetEpisode] };
      seriesProgress -= episode.runtime;
      if (seriesProgress < 0) {
        seriesProgress += episode.runtime;
        break;
      }
    }

    await dispatchAction({
      actionType: DiscordActionTypeEnum.SET_PRESENCE,
      presence: {
        status: 'online',
        activities: [{
          name: `${episode.name} - ${episode.spot}`,
          type: 'WATCHING',
        }],
      },
    });

    logger.log('dispatched presence update');
    await sleep((episode.runtime - seriesProgress) * 1000);
  }
};

export const getCurrentEpisode = () => episode;

export default {
  name: 'presence controller',
  run: runModule,
  setup: () => Promise.resolve(null),
} as ModuleControllerType;
