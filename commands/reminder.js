//

const Command = require("../superComponents/Command");
const assert = require('assert');

// regex for daily reminder format: /daily/i
const DAILY_FORMAT = /daily/i
// regex for weekly reminder format: /(^sunday|^monday|^tuesday|^wednesday|^thursday|^friday|^saturday)s?$/i
const WEEKLY_FORMAT = /(^sunday|^monday|^tuesday|^wednesday|^thursday|^friday|^saturday)s?$/i
// regex for monthly reminder format: /(^-2[1-8]$|^-1?\d$)|(^[12]?\d$|^3[01]$)/
const MONTHLY_FORMAT = /(^-2[1-8]$|^-1?\d$)|(^[12]?\d$|^3[01]$)/
// regex for yearly reminder format: /^(0?[1-9]|1[0-2])\/(0?\d|[12]\d|3[01])$/
const YEARLY_FORMAT = /^(0?[1-9]|1[0-2])-(0?\d|[12]\d|3[01])$/
// regex for one-off reminder format: /^(0?[1-9]|1[0-2])\/(0?\d|[12]\d|3[01])\/\d\d$/
const ONE_OFF_FORMAT = /^(0?[1-9]|1[0-2])-(0?\d|[12]\d|3[01])-\d\d$/

class Reminder extends Command {
    constructor(Client, m, argv) {
        super();
        assert(argv.length > 1);
        console.log("running constructor", this.argv[1]);
        switch(this.argv[1]) {
            case "add":
                const freq = this.argv[2];
                if(DAILY_FORMAT.test(freq)) {
                    console.log("valid daily command");
                } else if(WEEKLY_FORMAT.test(freq)) {
                    console.log("valid weekly command");
                } else if(MONTHLY_FORMAT.test(freq)) {
                    console.log("valid monthly command");
                } else if(YEARLY_FORMAT.test(freq)) {
                    console.log("valid yearly command");
                } else if(ONE_OFF_FORMAT.test(freq)) {
                    console.log("valid one-off command");
                } else {
                    // the frequency didn't match any expected format
                    console.log("unknown frequency format");
                    assert(false);
                }

                break;

            case "delete":
                assert(/[\dabcdef]{24}/.test(`${this.argv[2]}`));
                console.log("valid delete command");
                break;

            case "list":
                const scope = this.argv[2];
                assert(scope === undefined || scope === "personal" || scope === "channel");
                console.log("valid list command");
                break;

            default:
                console.log("default switch");
                assert(false);
        }
        this.m = m;
        this.argv = argv;
    }

    async run() {

    }

    static help() {
        return `> Create and manage reminders`;
    }
}

module.exports = Reminder;
