import gifModule from '../modules/gif.module';
import { LogCategoriesEnum } from '../types/serviceLoggerTypes';
import { ModuleControllerType } from '../types/serviceModulesTypes';
import { getErrorLogger, getLogger } from './logger.service';
import { sleep } from './util.service';

const logger = getLogger('service_modules');
const moduleControllers: ModuleControllerType[] = [gifModule];

const runModules = () => moduleControllers.forEach(async (controller) => {
  const identifier = `service_module_${controller.name}`;
  const moduleErrorLogger = getErrorLogger(identifier);
  let configuration = null;
  try {
    logger.log(`setting up module ${controller.name}`);
    configuration = await controller.setup();
  } catch (error) {
    moduleErrorLogger.log(LogCategoriesEnum.MODULE_INITIALIZATION_FAILURE, String(error));
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
      moduleErrorLogger.log(LogCategoriesEnum.MODULE_RUN_FAILURE, String(error));

      if (consecutiveErrors === 10) {
        moduleErrorLogger.log(LogCategoriesEnum.MODULE_RUN_FAILURE, '10 consecutive failures; aborting module');
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
