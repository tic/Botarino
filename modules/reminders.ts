/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import { sleep } from '../services/util.service';
import { ModuleControllerType } from '../types/serviceModulesTypes';

const runModule = async () => {
  while (true) {
    await sleep(1000);
  }
};

export default {
  name: 'reminders',
  run: runModule,
  setup: () => Promise.resolve(null),
} as ModuleControllerType;
