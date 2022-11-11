import { buildBasicMessage, buildIEmbed, dispatchAction } from '../services/discord.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const command: CommandExecutor = async (args, message) => {
  const pairs: { tax?: number; fees?: number; } = {};
  let i = 1;

  while (i < args.basicParse.length) {
    const name = args.basicParse[i++];
    let num = Number(args.basicParse[i]);
    pairs[name] = pairs[name] || 0;
    while (num + 0.001) {
      pairs[name] += num;
      i += 1;
      num = Number(args.basicParse[i]);
    }
  }

  const people = Object.keys(pairs).filter((key) => !(key === 'tax' || key === 'fees'));
  const subtotal = people.reduce((acc, key) => acc + pairs[key], 0);
  const splitCost = (pairs.tax || 0) + (pairs.fees || 0);
  const display: [string, number, number][] = people.map((person) => {
    const pct = pairs[people[i]] / subtotal;
    return [
      person,
      Math.round((pairs[person] + pct * splitCost) * 100) / 100,
      Math.round(pct * 1000) / 10,
    ];
  });

  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channelId, ' ', [
      buildIEmbed({
        title: 'Bill calculation',
        fields: display.map(
          ([person, amount, percentage]) => ({ name: person, value: `$${amount}\n(cost + ${percentage}) of fees` }),
        ),
      }),
    ]),
  });
};

export default {
  executor: command,
  description: 'Designed to help split food costs or other bills where the amount paid per person is itemized and likel'
    + 'y non-equal.',
  help: '`$!$ <string[person A]> <number[item 1 cost]> <number[item 2 cost]> ... <string[person B]> <number[item 1 cost'
    + ']> <number[item 2 cost]> ... <?string:tax[tax]> <?number:0[amount of tax]> <?string:fees[fees]> <?number:0[fee 1'
    + ']> <?number:0[fee 2]>',
  validator: (args) => !!` ${args.rawWithoutCommand}`
    .match(/( \w+( \d+(\.\d*)?)+)*(tax \d+(\.\d*)?)?(fees( \d+(\.\d*)?)+)?/),
} as CommandControllerType;
