/* eslint-disable no-console */
import {
  config as dotenvConfig,
  DotenvConfigOutput,
} from 'dotenv';

export const getConfig = () => {
  console.log('[CNFIG] Loading project configuration...');
  const { parsed: parsedEnv }: DotenvConfigOutput = dotenvConfig();
  if (parsedEnv === undefined) {
    throw new Error('failed to load environment file. does it exist?');
  }
  const missingKeys: string[] = [];
  function env(key: string) {
    if (key === '') {
      return '';
    }
    const value = parsedEnv?.[key];
    if (value === undefined) {
      missingKeys.push(key);
      return '';
    }
    return value;
  }

  const inDevelopment = parsedEnv?.NODE_ENV !== 'PRODUCTION';

  const createdConfig = {
    meta: {
      inDevelopment,
      inPracticeMode: env('PRACTICE_MODE') === 'true',
    },
    discord: {
      maintainer: env('DISCORD_MAINTAINER'),
      secret: env('DISCORD_SECRET'),
      username: env('DISCORD_USERNAME'),
      identifier: 'service_discord',
      prefix: '!',
    },
    mongo: {
      url: env('MONGO_URL'),
      primaryDatabase: env('MONGO_PRIMARY_DATABASE'),
      username: env('MONGO_USERNAME'),
      password: env('MONGO_PASSWORD'),
      identifier: 'service_mongo',
    },
    hypervisor: {
      identifier: 'service_hypervisor',
    },
  };

  if (missingKeys.length > 0) {
    console.warn(
      '[CNFIG] Global configuration referenced missing environment variables:\n\t- %s',
      missingKeys.join('\n\t- '),
    );
    console.error('[CNFIG] The project cannot continue with an incomplete configuration. Exiting...');
    process.exit(1);
  }

  console.log('[CNFIG] Configuration loaded.');
  return createdConfig;
};

export const config = getConfig();
