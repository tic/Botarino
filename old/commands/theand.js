// Meme command for the group I play DnD with. If enough meme commands are created,
// I'll probably make a folder for them separate from the other commands and put
// it in the gitignore. But for now, enjoy the leakage of memes.

const Command = require("../superComponents/Command");
const assert = require('assert');

class TheAnd extends Command {

    constructor(Client, m, argv) {
        assert(m.member.voice.channel);
        super(Client, m, argv);
        this.Client = Client;
        this.m = m;
    }

    async run() {
        try {
            let connection = await this.m.member.voice.channel.join();

            if(this.m.channel.type !== "dm") this.m.delete();

			let cons = this.Client.voice.connections.array();
			let player = cons[0].play(`./audio/theand.mp3`);

            let channel = this.m.channel;
            setTimeout(() => {
    			channel.send("https://i.gyazo.com/ba7a06ba9178d97bf70990e573028d21.gif").then(message => {
    				if(this.m.channel.type !== "dm") setTimeout(() => {
    					message.delete();
    				}, 10700);
    			});
    		}, 60);

			let delay = new Promise((resolve, reject) => {
				player.on("finish", async () => {
					await cons[0].channel.leave();
					resolve();
				});
			});

            await delay;
        } catch {}
    }

    static help() {
        return `> States the name of *The And* and provides an animated graphic to assist in the pronunciation of the organization's name.\n> *User must be in a voice channel.*\n> Usage \`!theand\`.`;
    }
}

module.exports = TheAnd;
