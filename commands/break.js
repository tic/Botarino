// A neat little utility to break apart large things into messages sized appropriately
// for Discord messages (<2000 chars).

const Command = require("../superComponents/Command");
const   assert = require('assert'),
        fetch = require('node-fetch');

class Break extends Command {

    constructor(Client, m, argv) {
        super(Client, m, argv);
        this.argv = argv;
        this.channel = m.channel;
    }

    async run() {
        try {
            assert(/^https:\/\/pastebin.com\/raw\/\w+$/.test(this.argv[1]));
            let failed = false;
            let response = await fetch(this.argv[1]).catch(err => {failed = true});
            if(failed) return;

            let content = await response.text();
            let i = 0;
            while(i < text.length) {
                this.channel.send(content.substring(i, 2000));
                i += 2000;

                // Sleep for 1000ms to avoid Discord cooldown.
                await new Promise(res => setTimeout(res, 1000));
            }
        } catch(e) {

        }
    }

    static help() {
        return `> If you have a message that is too large to send in a single Discord message, this command can be used to post it in segments. Place the content you wish to send into Pastebin, and copy the link to the pastebin raw. Raw links look like **https://pastebin.com/raw/.../**.\n> Usage: \`!break <link to pastebin raw>\`.`;
    }
}

module.exports = Break;
