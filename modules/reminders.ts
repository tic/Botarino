/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import { buildIEmbed, getUser } from '../services/discord.service';
import { sleep } from '../services/util.service';
import { Reminder } from '../types/databaseModels';
import { IEmbed } from '../types/serviceDiscordTypes';
import { ModuleControllerType } from '../types/serviceModulesTypes';

export const buildReminderEmbed = (reminder: Reminder) : IEmbed => {
  const user = getUser(reminder.authorId);
  return buildIEmbed({
    author: {
      name: user.username,
      iconURL: user.avatar,
    },
    title: reminder.title,
    description: reminder.description,
  });
};

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
