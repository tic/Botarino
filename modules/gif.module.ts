import { ModuleControllerType } from '../types/serviceModulesTypes';

const runModule = async () => {
  // Await interaction: new message in any channel, blocking = false, blockable = false
  // const event = await interaction();
};

export default {
  name: 'gif distributor',
  run: runModule,
  setup: () => Promise.resolve(null),
} as ModuleControllerType;
