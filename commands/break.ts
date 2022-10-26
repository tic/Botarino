import axios from 'axios';
import { TextChannel } from 'discord.js';
import { buildBasicMessage, buildIEmbed, dispatchActions } from '../services/discord.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const command: CommandExecutor = async (args, message) => {
  const pasteId = args.basicParseWithoutCommand[0].match(/^https:\/\/(www\.)?pastebin\.com\/(raw\/)?(\w+)$/)[3];
  const url = `https://pastebin.com/raw/${pasteId}`;
  const resp = await axios.get(url);
  if (resp.status !== 200) {
    return;
  }

  const text = resp.data.replace(/\r/g, '') as string;
  const stringSegments = [];
  let startIndex = 0;
  let stringIndex = 0;
  let lastLineBreak = -1;
  let lastNonBreakingWhitespace = -1;
  while (startIndex < text.length) {
    let characterCount = 0;
    stringIndex = startIndex;
    while (characterCount < 2000 && stringIndex < text.length) {
      if (text[stringIndex] === '\n') {
        lastLineBreak = stringIndex;
      }

      if (text[stringIndex] === ' ' || text[stringIndex] === '\t') {
        lastNonBreakingWhitespace = stringIndex;
      }

      characterCount++;
      stringIndex++;
    }

    let endIndex: number;
    let nextStartIndex: number;
    if (stringIndex === text.length) {
      endIndex = text.length;
      nextStartIndex = endIndex + 1;
    } else if (lastLineBreak > -1) {
      endIndex = lastLineBreak;
      nextStartIndex = endIndex + 1;
    } else if (lastNonBreakingWhitespace > -1) {
      endIndex = lastNonBreakingWhitespace;
      nextStartIndex = endIndex + 1;
    } else {
      endIndex = stringIndex;
      nextStartIndex = endIndex;
    }

    stringSegments.push(text.substring(startIndex, endIndex));
    startIndex = nextStartIndex;
    lastLineBreak = -1;
    lastNonBreakingWhitespace = -1;
  }

  await dispatchActions(
    stringSegments
      .filter((segment) => segment.length > 0)
      .map((segment, index, segments) => ({
        actionType: DiscordActionTypeEnum.SEND_MESSAGE,
        payload: buildBasicMessage(
          message.channel as TextChannel,
          segment.substring(0, 2000),
          [buildIEmbed({ description: `Message ${index + 1} of ${segments.length}` })],
        ),
      })),
  );
};

export default {
  executor: command,
  description: 'Splits a long message into 2000 character segments and posts them sequentially. Content must be supplie'
    + 'd through a Pastebin link, and **I will only split up to 20,000 characters.**',
  help: '$!$ <string[Pastebin link]>',
  validator: (args) => !!args.basicParseWithoutCommand[0]?.match(/^https:\/\/(www\.)?pastebin\.com\/(raw\/)?(\w+)$/),
} as CommandControllerType;
