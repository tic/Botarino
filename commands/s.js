// Soundboard functionality! :>

const Command = require("../superComponents/Command");
const 	assert = require('assert'),
		fs = require('fs');

class Sound extends Command {

	constructor(Client, m, argv, Mongo) {
		assert(m.channel.guild);
		assert(argv.length === 2);
		super(Client, m, argv);
		this.sound = argv[1];
		if(this.sound !== "list") assert(m.member.voice.channel);
		this.Client = Client;
		this.m = m;
		this.Mongo = Mongo;
	}

	async run() {
		if(this.sound === "list") {
			let files = fs.readdirSync('./soundboard/', {withFileTypes: true});
			let names = files.filter(o => !o.isDirectory())
					.map(o => o.name.substring(0, o.name.indexOf('.')));

			let maxi = names.length - 1, end_bits = [];
			while((maxi + 1) % 4 !== 0) {
				end_bits.unshift(names[maxi]);
				maxi--;
			}
			let pretty_list = end_bits.length > 0 ? [end_bits.join(' \t')] : [];
			for(; maxi > 2 ; maxi -= 4) {
				pretty_list.unshift(`${names[maxi - 3]} \t${names[maxi - 2]} \t${names[maxi - 1]} \t${names[maxi]}`);
			}

			this.m.channel.send(`Valid sounds:\n> ${pretty_list.join('\n> ')}`);
		} else {
			if(this.m.channel.type !== "dm") this.m.delete();
			let connection = await this.m.member.voice.channel.join();
			let cons = this.Client.voice.connections.array();
			let player = cons[0].play(`./soundboard/${this.sound}.mp3`);

			this.Mongo.logPlayedSound(this.m.channel.guild.id, this.m.author.id, this.sound, this.m.createdTimestamp);

			let delay = new Promise((resolve, reject) => {
				player.on("finish", async () => {
					await cons[0].channel.leave();
					resolve();
				});
			});

			await delay;
		}
	}

	static help() {
		return `> Allows you to play sounds from the bot as you might do on a soundboard.\n> *User must be in a voice channel.*\n> Usage \`!s <sound name>\`.\n> To see a list of valid sounds, use \`!s list\`.`;
	}
}

module.exports = Sound;
