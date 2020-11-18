// Import some packages and login credentials.
const   Discord = require('discord.js'),
        decache = require('decache'),
        refresh = require('import-fresh'),
        assert = require("assert"),
        Credentials = require("./credentials");

// Configure the locations of the main components.
const   TickerLocation = "./superComponents/UptimeTicker",
        HandlerLocation = "./superComponents/MessageHandler",
        MongoLocation = "./superComponents/Mongo";

// These are all vars because they can be changed via decache and import-fresh.
var UptimeTicker = require(TickerLocation),
    MessageHandler = require(HandlerLocation),
    Mongo = require(MongoLocation);

// Main Bot class
class Botarino {

    constructor() {

        // Create discord client.
        this.Client = new Discord.Client();

        // Log into Discord.
        this.Client.login(Credentials.ClientSecret);

        // When login is complete, log progress and start the ticker.
        this.Client.on("ready", () => {
            console.log(`${Credentials.SelfUser} logged in.\n`);
            // Create uptime ticker
            this.ticker = new UptimeTicker(this.updateStatus.bind(this));
        });

        // Log into Mongodb.
        this.Mongo = new Mongo();
        this.Mongo.connect();

        // Assign event handlers.
        this.Client.on("message", this.onMessage.bind(this));
        this.messageHandler = new MessageHandler(this.Client, this.Mongo);

        // If the client errors out, attempt login again.
        this.Client.on("error", err => {
            console.log(err);
            this.Client.login(Credentials.ClientSecret);
        });
    }

    // Method lives here to avoid passing around full Client access unless necessary
    updateStatus = async (status, options) => this.Client.user.setActivity(status, options);

    // Wrapper for the ticker's getUptime method to provide access to the MessageHandler
    getUptime = type => this.ticker.getUptime(type);

    // Main onMessage for the Bot
    onMessage(m) {
        // Ignore messages from myself.
        if(m.author.id === Credentials.SelfID) return;

        // Check for reload and reset commands, which are handled manually.
        if(m.author.id === Credentials.CreatorID) {
            switch(m.content) {

                // !reload: reinstantiate message handler
                case "!reload":
                    this.messageHandler.cease();
                    this.messageHandler = null;
                    decache(HandlerLocation);
                    MessageHandler = refresh(HandlerLocation);
                    this.messageHandler = new MessageHandler(this.Client, this.Mongo, this.getUptime.bind(this));
                    if(m.channel.type !== "dm") m.delete();
                    return;

                // !reset: reinstantiate ticker
                case "!reset":
                    this.ticker.cease();
                    this.ticker = null;
                    decache(TickerLocation);
                    UptimeTicker = refresh(TickerLocation);
                    this.ticker = new UptimeTicker(this.updateStatus.bind(this));
                    this.messageHandler.updateTicker(this.getUptime.bind(this));
                    if(m.channel.type !== "dm") m.delete();
                    return;

                // !reconnect: terminate and rebuild connection to Mongo
                case "!reconnect":
                    this.Mongo = null;
                    decache(MongoLocation);
                    Mongo = refresh(MongoLocation);
                    this.Mongo = new Mongo();
                    this.Mongo.connect();
                    this.messageHandler.updateMongo(this.Mongo);
                    if(m.channel.type !== "dm") m.delete();
                    return;
            }
        }

        // Command wasn't a special one. Forward the message to the MessageHandler for further processing.
        this.messageHandler.handle(m);
    }
}


// Do the things!
const Bot = new Botarino();
