//

const Command = require("../superComponents/Command");

const Responses = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes - definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful.",
];

class EightBall extends Command {
    constructor(Client, m, argv, Mongo) {
        super();
        this.m = m;
    }

    async run() {
        this.m.channel.send(`> *${Responses[parseInt(Math.random() * Responses.length)]}*`);
    }

    static help() {
        return `> It's a magic 8 ball. Just ask a question.\n> Usage: \`!8ball <question>\``;
    }
}

module.exports = EightBall;
