//

const Command = require("../superComponents/Command");
const assert = require('assert');

// regex for daily reminder format: /daily/i
const DAILY_FORMAT = /daily/i;
// regex for weekly reminder format: /(^sunday|^monday|^tuesday|^wednesday|^thursday|^friday|^saturday)s?$/i
const WEEKLY_FORMAT = /(^sunday|^monday|^tuesday|^wednesday|^thursday|^friday|^saturday)s?$/i;
// regex for monthly reminder format: /(^-2[1-8]$|^-1?\d$)|(^[12]?\d$|^3[01]$)/
const MONTHLY_FORMAT = /(^-2[1-8]$|^-1?\d$)|(^[12]?\d$|^3[01]$)/;
// regex for yearly reminder format: /^(0?[1-9]|1[0-2])\/(0?\d|[12]\d|3[01])$/
const YEARLY_FORMAT = /^(0?[1-9]|1[0-2])-(0?\d|[12]\d|3[01])$/;
// regex for one-off reminder format: /^(0?[1-9]|1[0-2])\/(0?\d|[12]\d|3[01])\/\d\d$/
const ONE_OFF_FORMAT = /^(0?[1-9]|1[0-2])-(0?\d|[12]\d|3[01])-\d\d$/;
// regex for triggers
const TRIGGER_FORMAT = /(^[01]?\d$|^2[0123]$)|(^(0?\d|1[012])(am|pm)$)/;
// regex for channel id
const CHANNEL_FORMAT = /^\d{18}$/;

function padNumberString(numString) {
    if(numString.length === 1) return `0${numString}`;
    else return numString;
}

class Reminder extends Command {
    constructor(Client, m, argv, Mongo) {
        super();
        assert(argv.length > 1);
        this.m = m;
        argv[1] = argv[1].split('\n')[0];
        this.argv = argv;
        this.Mongo = Mongo;
    }

    async run() {
        switch(this.argv[1]) {
            case "add":
                const lines = this.m.content.split('\n');
                lines.shift();
                let { frequency, trigger, title, description, channel } = lines.reduce((acc, line) => {
                    const [key, value] = line.split(': ');
                    acc[key] = value;
                    return acc;
                }, {});

                // Verify all fields exist
                if(!frequency || !trigger || !title || !description || !channel) {
                    this.m.channel.send("Each of the following fields must be specified: `frequency`, `trigger`, `title`, `description`, `channel`.");
                    return;
                }
                // Verify frequency input
                if(DAILY_FORMAT.test(frequency)) {
                    frequency = "DAILY";
                    var freqDisp = "daily"
                } else if(WEEKLY_FORMAT.test(frequency)) {
                    frequency = frequency.toUpperCase();
                    frequency = frequency[frequency.length - 1] === "S" ? frequency.substring(0, frequency.length - 1) : frequency;
                    var freqDisp = `${frequency}S`;
                } else if(MONTHLY_FORMAT.test(frequency)) {
                    frequency = parseInt(frequency);
                    if(frequency > 0) {
                        if(frequency > 10 && frequency < 14) var freqDisp = `monthly on the ${frequency}th`;
                        else var freqDisp = `monthly on the ${frequency}${frequency % 10 === 1 ? "st" : frequency % 10 === 2 ? "nd" : frequency % 10 === 3 ? "rd" : "th"}`;
                    }
                    else if(frequency === 0) var freqDisp = `the last day of each month`;
                    else var freqDisp = `${frequency * -1} days before the last day of each month`;

                } else if(YEARLY_FORMAT.test(frequency)) {
                    const [month, day] = frequency.split("-");
                    frequency = `${padNumberString(month)}-${padNumberString(day)}`;
                    var freqDisp = `yearly on ${frequency}`;
                } else if(ONE_OFF_FORMAT.test(frequency)) {
                    const [month, day, year] = frequency.split("-");
                    frequency = `${padNumberString(month)}-${padNumberString(day)}-${year}`;
                    var freqDisp = `one time reminder on ${frequency}`;
                } else { // the frequency didn't match any expected format
                    this.m.channel.send(`I didn't understand that frequency format. It should match one of these:\n> daily reminders: \`daily\`\n> weekly reminders: the name of any day of the week\n> monthly reminders: \`\`\n> yearly reminders: \`MM-DD\`\n> one-time reminders: \`MM-DD-YY\``);
                    return;
                }
                // Verify channel input
                if(!CHANNEL_FORMAT.test(channel)) {
                    this.m.channel.send(`I didn't understand that channel format. It should look like this (18 digit number):\n> \`012345678901234567\``);
                    return;
                }
                // Verify trigger
                if(!TRIGGER_FORMAT.test(trigger)) {
                    this.m.channel.send(`I didn't understand that trigger format. It should match one of these:\n> an hour corresponding to 24hr time: \`[0-23]\`\n> an hour labeled according to 12hr time: \`[1-12][am|pm]\``);
                    return;
                } else {
                    if(trigger.indexOf('pm') > -1 && parseInt(trigger) !== 12) trigger = parseInt(trigger) + 12;
                    else trigger = parseInt(trigger);
                    var trigDisp = trigger > 11 ? `${trigger - 12} pm` : `${trigger} am`;
                }

                const success = await this.Mongo.createEvent(this.m.author.id, title, description, channel, frequency, trigger);
                if(success) {
                    this.m.channel.send(`Successfully scheduled event reminder! Event details:\n> Frequency: \`${freqDisp} around ${trigDisp}\`\n> Channel: \`${channel}\`\n> Title Preview: ${title.replace('\*', '*').replace('\`', '`').replace('\_', '_')}\n> Description Preview: ${description.replace('\*', '*').replace('\`', '`').replace('\_', '_')}`);
                }
                else this.m.channel.send("Event reminder could not be scheduled :anguished:");
                return;

            case "delete":
                assert(/[\dabcdef]{24}/.test(`${argv[2]}`));
                console.log("valid delete command");
                break;

            case "list":
                const scope = argv[2];
                assert(scope === undefined || scope === "personal" || scope === "channel");
                console.log("valid list command");
                break;

            case "preview":
                assert(/[\dabcdef]{24}/.test(`${argv[2]}`));
                console.log("valid preview command");
                break;

            default:
                console.log("default switch");
                assert(false);
        }
    }

    static help() {
        return `> Create and manage reminders`;
    }
}

module.exports = Reminder;
