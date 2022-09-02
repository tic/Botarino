// Takes a phrase and finds the french word which most closely matches it.

const Command = require("../superComponents/Command");
const   assert = require('assert'),
        Fuse = require('fuse.js'),
        french = require('../library/french_words').dict;

const fuse_ops = {
    shouldSort: true,
    threshold: 0.8,
    location: 0,
    distance: 500,
    maxPatternLength: 24,
    minMatchCharLength: 4,
    includeScore: true,
};
const fuse_instance = new Fuse(french, fuse_ops);

class French extends Command {

    constructor(Client, m, argv) {
        console.log("constructor");
        super(Client, m, argv);
        // this.m = m;
        // this.query = m.content.substring(8);
        this.stall = new Promise((resolve, reject) => {
            this.m = m;
            this.query = m.content.substring(8);
            m.channel.startTyping();
            resolve();
        });

    }

    async run() {
        await this.stall;
        console.log("lets go");
        let result = fuse_instance.search(this.query)[0];
        console.log("search over");
        await this.m.channel.stopTyping();
        let context = this.m.channel.guild ? this.m.channel.guild.id : "dm";
        if(result) {
            switch(context) {
                case "670785201835868173":
                this.m.channel.send(`**${french[result.item]}** | *${parseInt((1 - result.score) * 10000) / 100}% confidence*. <@!244683177292070913>, care to weigh in?`);
                break;

                default:
                this.m.channel.send(`**${french[result.item]}** | *${parseInt((1 - result.score) * 10000) / 100}% confidence*.`);
                break;
            }
        } else {
            switch(context) {
                case "670785201835868173":
                this.m.channel.send(`That's not even close to any of the ${french.length} French words I have on file! Strap in and see what <@!244683177292070913> comes up with, though.`);
                break;

                default:
                this.m.channel.send(`That's not even close to any of the ${french.length} French words I have on file!`);
                break;
            }
        }
        this.m.channel.stopTyping();
    }

    static help() {
        return `> Have you ever wondered which French word is closest to a given English word or phrase? Use this command to find out.\n> Usage: \`!french <word or phrase>\`.`
    }
}

module.exports = French;
