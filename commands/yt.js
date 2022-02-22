//

const Command = require("../superComponents/Command");

class Yt extends Command {
    constructor(Client, m, argv, Mongo) {
        super();
        this.m = m;
        this.argv = argv;
        this.Client = Client;
    }

    async run() {
        // get rid of the music prefix
        this.argv.shift();
        const passthroughMessage = `!${this.argv.join(" ")}`;
        this.m.content = passthroughMessage;
        this.Client.MusicBot.onMessage(this.m);
    }

    static help(MessageEmbed) {
        // return `> Plays audio from YouTube videos. For a list of commands, visit https://www.npmjs.com/package/discord-music-system`;
        return {
            embed: new MessageEmbed()
                .setColor("#8a49cc")
                .setAuthor("Discord Music System", "https://i.gyazo.com/7115715a53ec854040311ad9c61f4194.png", "https://www.npmjs.com/package/discord-music-system")
                .setTitle("YouTube Player Commands")
                .setDescription("All player commands look like `!yt ____`. After `yt`, here are some of the things that you can do. For more info, click the \"Discord Music System\" link above.")
                .addFields(
                    {name: "Play Commands", value: "`play`\n`add`\n`join`\n`pause`\n`resume`"},
                    {name: "Stop Commands", value: "`stop`\n`kill`\n`destroy`\n`leave`"},
                    {name: "Now Playing", value: "`np`\n`nowplaying`\n`current`"},
                    {name: "Skips", value: "`skip`\n`next`"},
                    {name: "Queue Management", value: "`queue`\n`list`\n`show`\n`remove`\n`delete`"},
                    {name: "Volume Controls", value: "`volume`\n`setvolume`"},
                    {name: "Lyrics", value: "`lyrics`"}
                )
        }
    }
}

module.exports = Yt;
