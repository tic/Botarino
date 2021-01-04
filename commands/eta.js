

const Command = require('../superComponents/Command');
const assert = require('assert');

class Eta extends Command {
    constructor(Client, m, argv) {
        super(Client, m, argv);
        this.m = m;
        this.argv = argv;
    }

    async run() {
        try {
            if(/^\d{1,2}:\d{1,2}$/.test(this.argv[1]) && /^\d{1,2}%$/.test(this.argv[2])) {
                const [hr, min] = this.argv[1].split(':').map(i => parseInt(i));
                const pct = parseInt(this.argv[2]);

                let time_left = (min + hr * 60) / pct * 100;
                this.m.channel.send(`${parseInt(time_left / 60)} hr and ${Math.round((time_left % 60) * 100) / 100} min remaining`);
            } else {
                this.m.channel.send("> Couldn't find matching input format");
            }

        } catch(err) {
            console.log(err);
            this.m.channel.send("Unknown unput format");
        }
    }

    static help() {

    }
}

module.exports = Eta;
