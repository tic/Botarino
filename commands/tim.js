// Random string generator. Supply a regular expression (or not and use the default)
// which describes the string you want, and this command generates a given number
// (default is 1) of strings which match that regexp.

const Command = require("../superComponents/Command");
const   assert = require('assert'),
        Randexp = require('randexp');

class Echo extends Command {
    constructor(Client, m, argv, Mongo) {
        assert(argv.length < 4);
        super(Client, m, argv);
        this.m = m;
        this.argv = argv;
    }

    async run() {
        this.m.delete();
        let count = parseInt(this.argv[1]);
        if(!count || count < 0 || count > 100) count = 1;

        let regex = /T[aeiouy]{1,2}[a-z]{1,2}/;
        if(this.argv.length === 3) { try { regex = new RegExp(this.argv[2]); } catch {} }

        let names_out = [];
        let generator = new Randexp(regex);
        let i = count;
        while(i--) names_out.push(generator.gen());

        this.m.channel.send(`${names_out.join("\n")}\n> Generated ${count} name${count > 1 ? "s" : ""} using regex \`${regex}\`.`);
    }

    static help() {
        return `> Generate some interesting names according to a regex you want. Alternatively, you may use the default regex, which generates Tim-like names. To use the default, give no regex. If count is not provided, a single name is generated.\n> Usage: \`!tim <number of names> <regex>\`.`;
    }
}

module.exports = Echo;
