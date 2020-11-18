//

const Command = require("../superComponents/Command");
const assert = require('assert');

class BillBreak extends Command {
    constructor(Client, m, argv) {
        assert(argv.length > 2);
        super();
        this.m = m;
        this.argv = argv;
    }

    async run() {
        try {
            // Create name+amount pairs
            let [pairs, i] = [{}, 1];
            while(i < this.argv.length) {
                let [name, num] = [this.argv[i++], parseFloat(this.argv[i])];
                pairs[name] = pairs[name] || 0;
                while(num + 0.001) {
                    pairs[name] += num
                    i += 1;
                    num = parseFloat(this.argv[i]);
                }
            }
            let [people, display] = [Object.keys(pairs).filter(key => !(key == 'tax' || key == 'fees')), []];
            let [subtotal, splitcost] = [people.reduce((acc, key) => acc + pairs[key], 0), (pairs.tax || 0) + (pairs.fees || 0)];
            for(let i in people) {
                let pct = pairs[people[i]] / subtotal;
                display.push(`> **${people[i]}** owes $${parseInt((pairs[people[i]] + pct * splitcost) * 100) / 100} (cost + ${parseInt(pct * 1000) / 10}% of fees)`);
            }
            await this.m.channel.send(`Bill calculation:\n${display.join('\n')}`)
        } catch(err) {
            console.log(err);
            await this.m.channel.send(`Something went wrong. Check the command syntax. See \`!help billbreak\` for more.`);
        }
    }

    static help() {
        return `> Designed to help split food costs or other bills where the amound paid per person is itemized and likely non-equal.\n> Syntax: \`!billbreak <name> <item1 cost> <item2 cost> <tax> <tax amount> <fees> <fee 1> <fee 2>\`.\n> Example: \`!billbreak Larry 5.99 2.29 James 12.29 Lina 8.23 tax 4.36 fees 2.50 1.99\`\n> Tax and fees specifications are optional, but if given **must** be given with "tax" and "fees" keywords.`;
    }
}

module.exports = BillBreak;
