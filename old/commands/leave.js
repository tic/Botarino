// Forces the bot to leave all voice channels it's currently connected to.
// Useful if the bot erros out and gets stuck in a voice channel.

const Command = require("../superComponents/Command");
const   assert = require('assert');

class Leave extends Command {
    constructor(Client, m, argv) {
        super(Client, m, argv);
        this.Client = Client;
        this.m = m;
    }

    async run() {
        let cons = this.Client.voice.connections.array();
        cons.forEach(con => {
            con.channel.leave();
        });
        if(this.m.channel.type !== "dm") this.m.delete();
    }

    static help() {
        return `> If I am glitched out and refuse to leave a voice channel, use this command to force me to leave.\n> Usage: \`!leave\`.`;
    }
}

module.exports = Leave;
