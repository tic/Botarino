import { MessageEmbed, TextChannel } from 'discord.js';
import { buildBasicMessage, dispatchAction } from '../services/discord.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const command: CommandExecutor = async (args, message) => {
  // Calculate basic constants
  const nameCostPairs = [...Array((args.basicParse.length - 1) / 2)]
    .map((_, i) => ({
      name: args.basicParse[2 * i + 1],
      paid: Number(args.basicParse[2 * (i + 1)]),
    }));

  const total = nameCostPairs.reduce((tot, cur) => tot + cur.paid, 0);
  const costPerPerson = total / nameCostPairs.length;
  const matrix = [...Array(nameCostPairs.length)].map(() => [...Array(nameCostPairs.length)].map(() => 0));

  // A specific sorting order is required to more reliably deliver an increased number of optimal results.
  nameCostPairs.sort((a, b) => {
    if (a.paid < costPerPerson && b.paid < costPerPerson) return a.paid - b.paid;
    if (a.paid < costPerPerson && b.paid > costPerPerson) return 1;
    if (a.paid > costPerPerson && b.paid < costPerPerson) return -1;
    return b.paid - a.paid;
  });

  for (let i = 0; i < nameCostPairs.length; i++) {
    // If we're already paying above the average, move on to the next person.
    if (nameCostPairs[i].paid > costPerPerson) continue;

    // We're paying below the average. Calculate how much we need to contribute.
    let ourContribution = costPerPerson - nameCostPairs[i].paid;

    // After we're done, we will be paid up. Set that now.
    nameCostPairs[i].paid = costPerPerson;

    // Look for people to contribute to until we have paid the average. In order to receive our contribution, the other
    // must have paid above the average.
    while (ourContribution > 0.01) { // Account for small floating point rounding issues
      let donateTo = 0;
      while (donateTo < nameCostPairs.length) {
        if (nameCostPairs[donateTo].paid !== costPerPerson) break;
        donateTo++;
      }

      // If no donor was found, something has gone wrong.
      if (nameCostPairs[donateTo].paid < costPerPerson || donateTo === nameCostPairs.length) {
        throw new Error('ERR: No elligible receiver.');
      }

      // Elligible donor was found at costs[donateTo].
      if (nameCostPairs[donateTo].paid - costPerPerson >= ourContribution) {
        // We can place our entire contribution at this index.
        matrix[i][donateTo] = ourContribution;
        nameCostPairs[donateTo].paid -= ourContribution;
        ourContribution = 0;
      } else {
        // Only a portion of our contribution is needed here.
        matrix[i][donateTo] = nameCostPairs[donateTo].paid - costPerPerson;
        ourContribution -= nameCostPairs[donateTo].paid - costPerPerson;
        nameCostPairs[donateTo].paid = costPerPerson;
      }
    }
  }

  // Write the result.
  const paymentItems: {
    from: string;
    to: string;
    amount: number;
  }[] = [];

  for (let i = 0; i < matrix.length; i++) {
    if (matrix[i].reduce((t, c) => t + c)) {
      // There are payments in this row to display.
      const payments: {
        from: string;
        to: string;
        amount: number;
      }[] = [];

      for (let x = 0; x < matrix.length; x++) {
        if (matrix[i][x]) {
          // This cell contains a payment.
          payments.push({
            from: nameCostPairs[i].name,
            to: nameCostPairs[x].name,
            amount: Math.round(matrix[i][x] * 100) / 100,
          });
        }
      }

      paymentItems.push(...payments);
    }
  }

  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channel as TextChannel, ' ', [
      new MessageEmbed()
        .setAuthor({ name: 'Bill split results' })
        .setDescription(
          `The total amount paid was \`$${total}\`. Splitting that among ${nameCostPairs.length} people, the cost/perso'
          + 'n is \`$${Math.round(costPerPerson * 100) / 100}\`.`,
        )
        .addFields(
          paymentItems.length === 0
            ? [{ name: 'No payments necessary', value: 'The total has already been optimally divided!' }]
            : paymentItems.map((item) => ({ name: item.from, value: `Pays ${item.amount} to ${item.to}` })),
        ),
    ]),
  });
};

export default {
  executor: command,
  description: 'Determines the minimum number of payments necessary to ensure all members of a group have paid the same'
    + ' amount towards a communal pot where each member prepaid a different amount. For instance, if three roommates ea'
    + 'ch pay a different bill.',
  help: '`$!$ <string[person A]> <number[amount paid by A]> <string[person B]> <number[amount paid by B]> ...',
  validator: (args) => !!` ${args.rawWithoutCommand}`.match(/( \w+( \d+(\.\d*)?)+)+/),
} as CommandControllerType;
