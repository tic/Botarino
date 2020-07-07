// A very simple command which just repeats whatever you told it.

const Command = require('../superComponents/Command');
const assert = require('assert');

class Echo extends Command {
    constructor(Client, m, argv) {
        super(Client, m, argv);
        this.content = m.content.substring(6);
        assert(this.content.length > 0);
        this.m = m;
    }

    async run() {
        this.m.channel.send(this.content);
        if(this.m.channel.type !== "dm") this.m.delete();
    }

    static help() {
        return `> Use this command to have me repeat whatever you'd like me to say.\n> Usage: \`!echo <word or phrase to repeat>\`.`;
    }
}

module.exports = Echo;
