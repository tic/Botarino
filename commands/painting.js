// Shows a random abstract painting generated by 1secondpainting.com
// Why does this exist? Idk, man.

const Command = require("../superComponents/Command");

class Painting extends Command {

    constructor(Client, m, argv, Mongo) {
        super(Client, m, argv);
        this.m = m;
        this.argv = argv;
    }

    async run() {
        if(this.argv.length > 1 && parseInt(this.argv[1]) > -1) {
            var num = parseInt(this.argv[1]);
            if(num > 9999) num = 0;
        } else var num = parseInt(Math.random() * 10000)
        this.m.channel.send(`https://1secondpaintingimages.s3.us-west-2.amazonaws.com/${num}.png`);
    }

    static help() {
        return `> Posts a random abstract painting generated by a neural network. Check out https://1secondpainting.com.\n> Usage: \`!painting\` for a random painting.\n> Specific painting: \`!painting <int>\` valid numbers are [0,9999].`;
    }
}

module.exports = Painting;
