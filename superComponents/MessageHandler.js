// The main message handler for Botarino. It can be hot-reloaded using the special
// core commands indentified in start.js. The handler is responsible for loading
// gifs from the gif database (special responses that rarely appear after a message
// has been sent), carrying out analytics, providing command help, and the instantiation,
// execution, and cleanup of requested commands.

const   refresh = require('import-fresh'),
        decache = require('decache'),
        fs = require('fs'),
        moment = require('moment');
const Discord = require('discord.js');

class MessageHandler {
    constructor(Client, Mongo, getUptime, loud) {
        Client.sendMessage = async (channel, content) => await Client.channels.fetch(channel) ? (await Client.channels.fetch(channel)).send(content).catch(err => console.log(err)) : null;
        this.Client = Client;
        this.born = new Date();
        this.used = {};
        this.Mongo = Mongo;
        this.getUptime = getUptime;

        this.gifs = [];
        this.loadGIFs(Mongo);

        // Execute reminders immediately if this was a "loud" reload.
        // Set a timeout to execute reminders again at the top of the hour,
        // and from there run reminders every hour.
        if(loud) this.executeReminders();
        setTimeout(() => {
            this.executeReminders();
            this.reminderInterval = setInterval(this.executeReminders.bind(this), 3600000);
        }, 3600000 - new Date().getTime() % 3600000);

        console.log("MessageHandler reloaded.\n");
    }

    cease() {
        Object.keys(this.used).forEach(loc => {
            decache(loc);
        });
        clearInterval(this.reminderInterval);
        this.Client = null;
        this.used = null;
    }

    async executeReminders() {
        const m = moment();
        const Days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const or_arguments = [
            { frequency: "DAILY" }, // Daily reminders
            { frequency: Days[m.day()] }, // Weekly reminders
            { frequency: m.date() }, // Monthly reminders (from the front)
            { frequency: m.date() - moment(m).month(m.month() + 1).date(0).date() }, // Monthly reminders (from the back)
            { frequency: m.format("MM-DD") }, // Yearly reminders
            { frequency: m.format("MM-DD-YY") }, // One-off reminders
        ];

        const events = await this.Mongo.getEvents({
            trigger: m.hour(),
            $or: or_arguments,
        });
        for(var i = 0; i < events.length; i++) {
            const event = events[i];
            var author = await this.Client.users.fetch(event.author);
            var msg = new Discord.MessageEmbed()
                .setColor('#' + [...new Array(6)].map(_ => ((Math.random() * 16) | 0).toString(16)).join('')) // Random color! :)
                .setTitle(event.title)
                .setAuthor(`${author.username}#${author.discriminator}`, author.displayAvatarURL(), '')
                .setDescription(event.description)
                .setTimestamp()
                .setFooter('Create custom reminders with !reminder')
            await this.Client.sendMessage(event.channel, { embed: msg})
            await new Promise((resolve, _) => setTimeout(resolve, 2000));
        }
    }

    updateMongo(Mongo) {
        this.Mongo = Mongo;
    }

    updateTicker(AccessTicker) {
        this.AccessTicker = AccessTicker;
    }

    async loadGIFs(Mongo) {
        this.gifs = await Mongo.loadGifList();
        if(!this.gifs) {
            this.gifs = [];
            console.log("Gif loading failed, but state is safe.");
        } else console.log("Gif list loaded.\n");
    }

    async handle(m) {
        if(m.content[0] === "!" && m.content.length > 0) {
            let elapsedTime = 0;
            let error = "";
            try { // Run a command
                var argv = m.content.split(" ");
                argv[0] = argv[0].substring(1);
                if(argv[0] === "help") {
                    if(argv.length > 1) {
                        // Get help for a specific command by consulting the class' help method.
                        let loc = `../commands/${argv[1]}`;
                        let CommandClass = this.used[loc] ? this.used[loc] : refresh(loc);
                        this.used[loc] = CommandClass;

                        m.channel.send(CommandClass.help());
                    } else {
                        // General help requested. Get a list of commands in the directory!
                        let files = fs.readdirSync('./commands/', {withFileTypes: true});
            			let names = files.filter(o => !o.isDirectory())
            					.map(o => o.name.substring(0, o.name.indexOf('.')));

                        m.channel.send(`> Valid commands:\n\`\`\` ${names.reduce((accum, name) => `${accum}\n ${name}`)} \`\`\`\n> Use \`!help <command>\` to get help with a specific command.`);
                    }
                } else {
                    let loc = `../commands/${argv[0]}`;
                    let CommandClass = this.used[loc] ? this.used[loc] : refresh(loc);
                    this.used[loc] = CommandClass;

                    try {
                        // Instantiate the command handler
                        let handler = new CommandClass(this.Client, m, argv, this.Mongo, this.getUptime);

                        // Store the start time
                        elapsedTime = new Date();

                        // Run could take a while... When it's over, tell the instance to clean itself up.
                        await handler.run().catch(err => error = err.toString());
                        console.log(error);
                        handler.cease();

                        // Command successfully exited. Save elapsed time and update status.
                        elapsedTime = new Date() - elapsedTime;
                        succeeded = true;
                    } catch(e) {}
                }
            } catch(e) {
                elapsedTime = 0;
                if(e.code === "MODULE_NOT_FOUND") error = "no such command"; //console.log("Command didn't exist\n");
                else {
                    error = e.toString();
                    console.log("Crash in MessageHandler segment", e);
                }
            } finally {
                this.Mongo.commandAnalytics(m, argv, error, elapsedTime)
            }
        } else { // Not a command
            // Message analytics!
            this.Mongo.messageAnalytics(m);

            // Award a gif... maybe.
            if(!parseInt(Math.random() * 350)) {
                // Award a gif! Which one?
                let probability_field = [0], i = 0;
                for( ; i < this.gifs.length; i++) {
                    probability_field[i + 1] = this.gifs[i].relative_probability + probability_field[i];
                }

                // Remove first zero
                probability_field.shift();

                // Generate random number
                let random = parseInt(Math.random() * probability_field[--i]);

                // Find which gif we were granted
                for(i = 0; i < probability_field.length; i++) {
                    if(random < probability_field[i]) {
                        this.Mongo.logGif(this.gifs[i]._id, m);
                        m.channel.send(`${this.gifs[i].message.replace("$USER", `<@!${m.author.id}>`)} ${this.gifs[i].gif}`);
                        break;
                    }
                }
            }
        }
    }
}

module.exports = MessageHandler;
