/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
import { collections } from '../services/database.service';
import {
  buildBasicMessage,
  buildIEmbed,
  dispatchAction,
  getUser,
} from '../services/discord.service';
import { getLogger } from '../services/logger.service';
import { padToNDigits, sleep } from '../services/util.service';
import { Reminder } from '../types/databaseModels';
import { DiscordActionTypeEnum, IEmbed } from '../types/serviceDiscordTypes';
import { ModuleControllerType } from '../types/serviceModulesTypes';

const logger = getLogger('module_reminders');
const reminderTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export const buildReminderEmbed = async (reminder: Reminder) : Promise<IEmbed> => {
  const user = await getUser(reminder.authorId);
  return buildIEmbed({
    author: {
      name: user.username,
      iconURL: user.avatarURL(),
    },
    title: reminder.title,
    description: reminder.description,
  });
};

const announceReminder = async (reminder: Reminder) => {
  const idStr = reminder._id.toString();
  delete reminderTimeouts[idStr];
  logger.log(`dispatched reminder with id ${idStr}`);
  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(reminder.targetChannelId, ' ', [await buildReminderEmbed(reminder)]),
  });
};

export const loadNextReminders = async (forceToday?: boolean) => {
  const tomorrow = new Date(new Date().setHours(forceToday ? 0 : 24, 0, 0, 0));
  const year = tomorrow.getFullYear();
  const month = tomorrow.getMonth() + 1;
  const monthStr = padToNDigits(month, 2);
  const day = tomorrow.getDate();
  const dayStr = padToNDigits(day, 2);
  const inverseDay = day - new Date(year, month - 1, 0).getDate() + 1;

  const reminderCandidates = (await collections.reminders.find({
    $or: [
      { frequency: 'ONCE', on: `${monthStr}/${dayStr}/${year}` },
      { frequency: 'YEARLY', on: `${monthStr}/${dayStr}` },
      { frequency: 'MONTHLY', on: dayStr.toString() },
      { frequency: 'MONTHLY', on: inverseDay.toString() },
      { frequency: 'WEEKLY', on: tomorrow.getDay().toString() },
      { frequency: 'DAILY' },
    ],
  }).toArray()) as unknown as Reminder[];

  reminderCandidates.forEach((reminder) => {
    const [targetHr, targetMin] = reminder.at.split(':').map((s) => Number(s));
    const triggerTime = tomorrow.setHours(targetHr, targetMin, 0, 0);
    const msUntilTrigger = triggerTime - Date.now();

    if (msUntilTrigger > 0) {
      const idStr = reminder._id.toString();
      clearTimeout(reminderTimeouts[idStr]);
      reminderTimeouts[idStr] = setTimeout(() => announceReminder(reminder), msUntilTrigger);
    }
  });
};

const runModule = async () => {
  await loadNextReminders(true);
  while (true) {
    await loadNextReminders();
    await sleep(new Date(Date.now() + 93600000).setHours(0, 0, 0, 0) - 30000 - Date.now());
  }
};

export default {
  name: 'reminders',
  run: runModule,
  runInDevMode: true,
  setup: () => Promise.resolve(null),
} as ModuleControllerType;
