import gifModule from '../modules/gif.module';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { ModuleControllerType } from '../types/serviceModulesTypes';
import { logError, logMessage } from './logger.service';
import { sleep } from './util.service';

const moduleControllers: ModuleControllerType[] = [gifModule];

const runModules = () => moduleControllers.forEach(async (controller) => {
  const identifier = `service_module_${controller.name}`;
  let configuration = null;
  try {
    logMessage('service_modules', `setting up module ${controller.name}`);
    configuration = await controller.setup();
  } catch (error) {
    logError(LogCategoriesEnum.MODULE_INITIALIZATION_FAILURE, identifier, String(error));
  }

  let consecutiveErrors = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await controller.run(configuration);
      consecutiveErrors = 0;
    } catch (error) {
      consecutiveErrors++;
      logError(LogCategoriesEnum.MODULE_RUN_FAILURE, identifier, String(error));

      if (consecutiveErrors === 10) {
        logError(
          LogCategoriesEnum.MODULE_RUN_FAILURE,
          identifier,
          '10 consecutive failures; aborting module',
        );
        return;
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(600000);
    }
  }
});

export default {
  runModules,
};
