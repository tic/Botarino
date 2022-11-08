import { ObjectId } from 'mongodb';
import { buildReminderEmbed } from '../modules/reminders';
import { collections, isObjectId } from '../services/database.service';
import { buildBasicMessage, buildIEmbed, dispatchAction } from '../services/discord.service';
import { padToNDigits, pluralizedItem } from '../services/util.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { Reminder, ReminderAtType } from '../types/databaseModels';
import { Arguments } from '../types/serviceArgumentParserTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

/*
Supported syntax:
!reminders list
  - list reminders by the user in the channel
  - if none, empty embed that says "You haven't created any reminders in this channel."

!reminders list all
- if used in a dm
  - displays all reminders across all servers for the user
  - if none, "You haven't created any reminders."
- else
  - list all reminders by the user in the server
  - if none, "You haven't created any reminders in this server."

!reminder delete <reminder id>
  - deleted successfully
  - "You don't have a reminder with that ID."

!reminder preview <reminder id>
  - if that user owns the reminder
    - generate and post embed of what that reminder will look like when posted
  - else
    - "You don't have a reminder with that ID."

!reminder add frequency on at "title" "description"
  - valid frequency and on options:
    1. once
      a. MM/DD/YYYY
    2. yearly
      a. MM/DD
    3. monthly
      a. XX - the xx^th day of the month
      b. -XX - the xx^th to last day of the month
        -0 = the last day
        -1 = the day before last
    4. weekly
      a. monday/tuesday/.../sunday
      b. mon/tue/wed/thu/fri/sat/sun
      d. mo/tu/we/th/fr/sa/su
      d. m/t/w/r/f/s/u
    5. daily

  - valid at options
    - HH [0,23]
    - HH:MM [0,23]:[0,59]

Regexs for add:
frequency/on regexs:
  /once on \d\d?\/\d\d?/\d{4}/
  /yearly on \d\d?/\d\d/
  /yearly on day [+-]?\d\d?\d?
  /monthly on day [+-]?\d\d?/
  /weekly on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
  /weekly on (mon|tue|wed|thu|fri|sat|sun)/i
  /weekly on (mo|tu|we|th|fr|sa|su)/i
  /weekly on (m|t|w|r|f|s|u)/i
  /daily/

at regex:
  /at /d/d?:?\d\d/i

*/

const frequencyRegexps = [
  /(once) on (\d\d?\/\d\d?\/\d{4})/i,
  /(yearly) on \d\d?\/\d\d/i,
  /(yearly) on day [+-]?\d\d?\d?/i,
  /(monthly) on day [+-]?\d\d?/i,
  /(weekly) on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /(weekly) on (mon|tue|wed|thu|fri|sat|sun)/i,
  /(weekly) on (mo|tu|we|th|fr|sa|su)/i,
  /(weekly) on (m|t|w|r|f|s|u)/i,
  /(daily)/i,
];

const atRegexps = [
  /at (\d\d?:?\d\d)/i,
  /at (\d\d?)/i,
];

const titleDescRegexps = [/"(.*)" "(.*)"/];

const validator = (args: Arguments) => {
  if (args.basicParseWithoutCommand[0] === 'list') {
    return args.basicParseWithoutCommand.length === 1;
  }

  if (
    ['preview', 'delete'].includes(args.basicParseWithoutCommand[0])
    && isObjectId(args.basicParseWithoutCommand[1])
  ) {
    return true;
  }

  if (args.basicParseWithoutCommand[0] === 'add') {
    return frequencyRegexps.reduce(
      (fValid, fRegex) => fValid || (!!args.rawWithoutCommand.match(fRegex) && atRegexps.reduce(
        (aValid, aRegex) => aValid || (!!args.rawWithoutCommand.match(aRegex) && titleDescRegexps.reduce(
          (tdValid, tdRegex) => tdValid || !!args.rawWithoutCommand.match(tdRegex),
          false,
        )),
        false,
      )),
      false,
    );
  }

  return false;
};

const findRegexAndGetMatches = (
  regexpList: RegExp[],
  inputStr: string,
  numProps: number,
) : RegExpMatchArray | null[] => {
  const blank = [...new Array(numProps)].map(() => null);
  return regexpList.reduce(
    (grouping, regex) => (
      !grouping[0]
        ? (inputStr.match(regex) || blank)
        : grouping
    ),
    blank,
  );
};

const command: CommandExecutor = async (args, message) => {
  if (args.basicParseWithoutCommand[0] === 'list') {
    const reminders = (await collections.reminders
      .find({ authorId: message.author.id })
      .toArray()) as unknown as Reminder[];

    const inServer = message.inGuild();
    const remindersInServer = reminders.filter((reminder) => reminder.targetServerId === message.guildId);
    const remindersInChannel = reminders.filter((reminder) => reminder.targetChannelId === message.channelId);
    const remindersToPost = inServer ? remindersInChannel : reminders;
    const serversWithUsersReminders = Array.from(new Set(reminders.map((reminder) => reminder.targetServerId))).length;
    const channelsWithUsersReminders = Array.from(new Set(reminders.map(
      (reminder) => reminder.targetChannelId,
    ))).length;

    const embed = remindersToPost.length === 0
      ? buildIEmbed({
        title: 'Your reminders',
        description: `You have not created any reminders${inServer ? ' in this channel' : ''}!`,
      })
      : buildIEmbed({
        removeInlineDefault: true,
        title: 'Your reminders',
        description: inServer
          ? `You have created ${pluralizedItem(remindersInServer.length, 'reminder')} in this server. `
            + `Listing ${pluralizedItem(remindersInChannel.length, 'reminder')} from this channel.`
          : `You have created ${pluralizedItem(reminders.length, 'reminder')} in `
            + `${pluralizedItem(channelsWithUsersReminders, 'channel')} across `
            + `${pluralizedItem(serversWithUsersReminders, 'server')}.`,
        fields: inServer
          ? remindersToPost.map((reminder) => ({
            name: reminder.title,
            value: `Description: ${reminder.description}\n`
              + `Occurs: ${reminder.frequency.toLowerCase()} on ${reminder.on} at ${reminder.at}`,
          }))
          : remindersToPost.map((reminder) => ({
            name: reminder.title,
            value: `Description: ${reminder.description}\n`
              + `Occurs: ${reminder.frequency.toLowerCase()} on ${reminder.on} at ${reminder.at}`
              + `Posts in ${reminder.targetServerId ? `<#${reminder.targetChannelId}` : 'DM'}>`,
          })),
      });

    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel, ' ', [embed]),
    });
  } else if (args.basicParseWithoutCommand[0] === 'preview') {
    const reminder = await collections.reminders.findOne({
      _id: new ObjectId(args.basicParseWithoutCommand[1]),
      authorId: message.author.id,
    }) as (Reminder | null);

    const embed = reminder ? buildReminderEmbed(reminder) : buildIEmbed({
      title: 'Unknown reminder',
      description: 'You do not have a reminder with that id. Does it exist and belong to you?',
    });

    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel, reminder ? 'PREVIEW' : ' ', [embed]),
    });
  } else if (args.basicParseWithoutCommand[0] === 'delete') {
    // TODO
  } else if (args.basicParseWithoutCommand[0] === 'add') {
    const [, rawFrequency, on]: string[] = findRegexAndGetMatches(frequencyRegexps, args.rawWithoutCommand, 3);
    const [, rawAt]: string[] = findRegexAndGetMatches(atRegexps, args.rawWithoutCommand, 2);
    const [, title, description]: string[] = findRegexAndGetMatches(titleDescRegexps, args.rawWithoutCommand, 3);
    const cleanedAt = padToNDigits(Number(rawAt.replace(':', '')), 4);

    const reminder = {
      authorId: message.author.id,
      targetServerId: message.inGuild ? message.guildId : null,
      targetChannelId: message.channelId,
      frequency: rawFrequency.toUpperCase(),
      on,
      at: `${cleanedAt.substring(0, 2)}:${cleanedAt.substring(2)}` as ReminderAtType,
      title,
      description,
    } as Reminder;

    const result = await collections.reminders.insertOne(reminder);
    const embed = result.insertedId
      ? buildIEmbed({
        title: 'Reminder created!',
        description: `Created a new reminder with id \`${result.insertedId}\`!`,
      })
      : buildIEmbed({
        title: 'Could not create reminder :(',
        description: 'The reminder was parsed correctly, but it could not be added.',
      });

    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel, ' ', [embed]),
    });
  }
};

export default {
  executor: command,
  description: 'Create and manage reminders.',
  help: '`$!$ ... todo ...',
  validator,
} as CommandControllerType;
