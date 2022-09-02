// Billme accepts in a list of people and amounts of money they have paid towards
// some communal pot. An example could be the amount spent by each roommate on various
// utilities in an apartment. The algorithm below finds an optimized, but not always
// optimal, method to ensure everyone has paid the same amount with as few inter-personal
// transactions as possible.

// Side note: the algorithm which is guaranteed to find the shortest possible transaction
// set is a decent bit more complex than this one, and takes around O(2^n) time.
// Most importantly, though, it was created after I wrote this up, so...

const Command = require("../superComponents/Command");
const assert = require('assert');

class BillMe extends Command {
    constructor(Client, m, argv, Mongo) {
        assert(argv.length > 1 && argv.length % 2);
        for(let i = 2; i < argv.length; i += 2) {
            assert(parseFloat(argv[i]) >= 0);
        }
        super();
        this.m = m;
        this.argv = argv;
    }

    async run() {
        // Calculate basic constants
        let NameCostPairs = [...Array((this.argv.length - 1) / 2)].map((_, i) => ({name: this.argv[2*i + 1], paid: parseFloat(this.argv[2*(i + 1)])}));
        let total = NameCostPairs.reduce((tot, cur) => tot + cur.paid, 0);
        let cpp = total / NameCostPairs.length;
        let matrix = [...Array(NameCostPairs.length)].map(() => [...Array(NameCostPairs.length)].map(() => 0));

        // A specific sorting order is required to more reliably deliver an increased number of optimal results.
        NameCostPairs.sort((a, b) => {
            if(a.paid < cpp && b.paid < cpp) return a.paid - b.paid;
            else if(a.paid < cpp && b.paid > cpp) return 1;
            else if(a.paid > cpp && b.paid < cpp) return -1;
            else return b.paid - a.paid;
        });

        await this.m.channel.send(`> Reordered arguments to partially optimize outcome:\n> ${NameCostPairs.map(pair => `\`${pair.name} ${pair.paid}\``).join("\t")}`);

        for(let i = 0; i < NameCostPairs.length; i++) {
            // If we're already paying above the average, move on to the next person.
            if(NameCostPairs[i].paid > cpp) continue;

            // We're paying below the average. Calculate how much we need to contribute.
            let our_contribution = cpp - NameCostPairs[i].paid;

            // After we're done, we will be paid up. Set that now.
            NameCostPairs[i].paid = cpp;

            // Look for people to contribute to until we have paid the average. In order to receive our contribution, the other must have paid above the average.
            while(our_contribution > 0.01) { // Account for small floating point rounding issues
                let donate_to = 0;
                while(donate_to < NameCostPairs.length) {
                    if(NameCostPairs[donate_to].paid !== cpp) break;
                    donate_to++;
                }

                // If no donor was found, something has gone wrong.
                if(NameCostPairs[donate_to].paid < cpp || donate_to === NameCostPairs.length) throw "ERR: No elligible receiver.";

                // Elligible donor was found at costs[donate_to].
                if(NameCostPairs[donate_to].paid - cpp >= our_contribution) {
                    // We can place our entire contribution at this index.
                    matrix[i][donate_to] = our_contribution;
                    NameCostPairs[donate_to].paid -= our_contribution;
                    our_contribution = 0;
                } else {
                    // Only a portion of our contribution is needed here.
                    matrix[i][donate_to] = NameCostPairs[donate_to].paid - cpp;
                    our_contribution -= NameCostPairs[donate_to].paid - cpp;
                    NameCostPairs[donate_to].paid = cpp;
                }
            }
        }

        // Write the result.
        let payments = [];
        for(let i = 0; i < matrix.length; i++) {
            if(matrix[i].reduce((t, c) => t + c)) {
                // There are payments in this row to display.
                let msg = [];
                for(let x = 0; x < matrix.length; x++) {
                    if(matrix[i][x]) {
                        // This cell contains a payment.
                        msg.push(`> **${NameCostPairs[i].name}** pays \`$${parseInt(matrix[i][x] * 100) / 100}\` to **${NameCostPairs[x].name}**.`);
                    }
                }
                payments.push(msg.join("\n"));
            }
        }

        await this.m.channel.send(`> The total amount paid was \`$${total}\`.\n> Splitting that among ${NameCostPairs.length} people, the cost/person is \`$${parseInt(cpp * 100) / 100}\`.`);
        if(payments.length === 0) await this.m.channel.send(`\n> **No payments necessary!**`);
        else await this.m.channel.send(`\n${payments.join("\n")}`);
    }

    static help() {
        return `> In a scenario where different people have paid different amounts towards a communal pot, there typically follows a slew of Peter paying Paul, Paul paying John, and so on. This command produces the fewest (or in some cases, near-fewest) number of transactions needed to ensure everyone has paid the same amount.\n> Usage: \`!billme <PersonA> <$PaidByPersonA> <PersonB> <$PaidByPersonB>\`. Additional pairs of names and amounts are optional.\n> Example: \`!billme Bob 12.50 Alice 18 Mallory 24\`\n> *Payments may vary slightly based on input order*.`;
    }
}

module.exports = BillMe;
