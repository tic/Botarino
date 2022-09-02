// A very simple command which just repeats whatever you told it.


// !stats
// server || channel
// sound || gif || command || message
// count || percent
// \d{18} || <!@\d{18}> || --blank--








// Remove the need for excessive relative paths in requires
module.paths.push("/media/michael/Workhorse/File-Drop/code/botarino v3");
const Command = require("superComponents/Command");
const assert = require('assert');
class Stats extends Command {
    constructor(Client, m, argv, Mongo) {
        super(Client, m, argv);
        this.m = m;
        this.argv = argv;
        this.Mongo = Mongo;
    }

    async run() {
        console.log("getting stats");
        console.log(this.Mongo);
        if(this.argv.length === 1) {
            this.m.channel.send(Stats.help());
            return;
        }

        // 0        1       2       3
        // !stats   chan    msgcnt  @Botarino
        let filter = {};
        switch(this.argv[2]) {
            ////////////////////////////////////////////////////////////////////////////////////////////////////
            // How many messages have you, or someone else, sent to this server or text channel?
            case "msgcount":
            // Get the id of the user to lookup. It may be provided or implied by the message author.
            if(/<@!\d{18}>/.test(this.argv[3])) filter["sender"] = /<@!(\d{18})>/.exec(this.argv[3])[1];
            else if(/\d{18}/.test(this.argv[3])) filter["sender"] = /(\d{18})/.exec(this.argv[3])[1];
            else filter["sender"] = this.m.author.id;
            if(this.argv[1] === "channel") filter["channel"] = this.m.channel.id;

            let msgcount = await this.Mongo.getNumMessages(this.m.channel.guild ? this.m.channel.guild.id : "dm", filter);
            this.m.channel.send(`<@!${filter["sender"]}> has sent \` ${msgcount} \` messages to this ${filter["channel"] ? "channel" : "server"}. Well, at least since I started counting. ${parseInt(Math.random() * 20) ? "" : ":snake:"}`);
            break;

            ////////////////////////////////////////////////////////////////////////////////////////////////////
            // Of the messages sent to this server or text channel, what percentage were yours or someone elses?
            case "msgpct":
            // Get the id of the user to lookup. It may be provided or implied by the message author.
            if(/<@!\d{18}>/.test(this.argv[3])) filter["sender"] = /<@!(\d{18})>/.exec(this.argv[3])[1];
            else if(/\d{18}/.test(this.argv[3])) filter["sender"] = /(\d{18})/.exec(this.argv[3])[1];
            else filter["sender"] = this.m.author.id;
            if(this.argv[1] === "channel") {
                var loose_filter = {channel: this.m.channel.id};
                filter["channel"] = this.m.channel.id;
            }

            console.log("waiting for total");
            let total = await this.Mongo.getNumMessages(this.m.channel.guild ? this.m.channel.guild.id : "dm", loose_filter);
            console.log("waiting for yours");
            let yours = await this.Mongo.getNumMessages(this.m.channel.guild ? this.m.channel.guild.id : "dm", filter);

            console.log(yours, total);
            this.m.channel.send(`<@!${filter["sender"]}> has sent \` ${parseInt(yours / total * 10000) / 100}% \` of all messages to this ${filter["channel"] ? "channel" : "server"}. Well, at least since I started counting. ${parseInt(Math.random() * 20) ? "" : ":snake:"}`);
            break;

            default:
            this.m.channel.send(Stats.help());
        }

        // this.m.channel.send("Hey, this command is a work in progress. Check back later :-)");
    }

    static help() {
        return `> Use this to retrieve use statistics about yourself or the channel you're in. Currently this command is a work in progress.`;
    }
}

module.exports = Stats;
