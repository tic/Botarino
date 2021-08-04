//

const Command = require("../superComponents/Command");

class Add extends Command {
    constructor(Client, m, argv, Mongo) {
        super();
        this.m = m;
        this.argv = argv
    }

    async run() {
        let clientID = "610883726129233931"
        if(this.argv.length === 2) clientID = this.argv[1];
        this.m.channel.send(`https://discord.com/oauth2/authorize?client_id=${clientID}&scope=bot`);
    }

    static help() {
        return `> Generates the URL required to add a bot to a Discord server. Usage: \`!add <?clientID>\``;
    }
}

module.exports = Add;
