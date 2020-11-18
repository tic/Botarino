// Oversees all interaction with the database. Wraps the client with a semaphore
// to ensure access synchronicity and avoid duplicated connection requests.

// Mongo login information
const Credentials = require('../credentials');
const Mongo = require('mongodb');
const Semaphore = require('async-mutex').Semaphore;

class MongoWrapper {
    constructor() {
        this.connected = false;
        this.clientLock = new Semaphore(1);
        this.Client = new Mongo.MongoClient(`mongodb+srv://${Credentials.MongoUser}:${Credentials.MongoPass}@${Credentials.MongoSrv}.mongodb.net/<dbname>?retryWrites=true&w=majority`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            reconnectTries: Number.MAX
        });
    }

    async connect() {
        console.log("Connecting to Mongo...");
        const [_, release] = await this.clientLock.acquire();
        try {
            let conn = await this.Client.connect();
            this.connected = true;
            console.log("MongoDB connected!\n");
        } catch(e) {
            console.log("Mongo connection error:", e);
            console.log("Verify the current connection IP is on the MongoDB Atlas whitelist!");
        } finally {
            release();
        }
    }

    async messageAnalytics(msg) {
        if(!this.connected) {
            console.log("Mongo is unavailable. Analytics have not been run on this message");
            return;
        }
        try {
            // Ignore test channel messages.
            if(Credentials.isTestMessage(msg.channel.id, msg.guild ? msg.guild.id : "dm")) return;

            const [_, release] = await this.clientLock.acquire();
            try {
                let collection = this.Client.db("servers").collection(msg.guild ? msg.guild.id : "dm");
                await collection.insertOne(Object.assign({
                    id: msg.id,
                    sender: msg.author.id,
                    timestamp: msg.createdTimestamp,
                    name: msg.author.username,
                    channel: msg.guild ? msg.channel.id : "dm",
                }, !msg.guild ? {content: msg.content} : null));
            } finally { release(); }
        } catch(e) {
            console.log("Analytics failed.");
            console.log(e);
        }
    }

    async loadGifList() {
        const [_, release] = await this.clientLock.acquire();

        try {
            if(!this.connected) {
                console.log("Mongo is unavailable. GIF list is empty.");
                return;
            }
            let collection = this.Client.db("configuration").collection("gifs");
            return await collection.find().toArray();
        } finally { release(); }
    }

    async logGif(gif_id, message) {
        const [_, release] = await this.clientLock.acquire();
        try {
            let stats_col = this.Client.db("stats").collection("gifs");
            let config_col = this.Client.db("configuration").collection("gifs");

            // Increment the # of times this gif as been awarded
            await config_col.updateOne({_id: gif_id}, {$inc: {awarded: 1}}, {upsert: true});

            // Log the event
            await stats_col.insertOne({
                server: message.guild ? message.guild.id : "dm",
                channel: message.guild ? message.guild.id : "dm",
                user: message.author.id,
                gif: gif_id,
                timestamp: message.createdTimestamp,
            });
        } finally { release(); }
    }

    async getMessages(server_id, filter) {
        const [_, release] = await this.clientLock.acquire();
        try {
            let collection = this.Client.db("servers").collection(server_id);
            return await collection.find(filter).toArray();
        } finally { release(); }
    }

    async getNumMessages(server_id, filter) {
        const [_, release] = await this.clientLock.acquire();
        try {
            let collection = this.Client.db("servers").collection(server_id);
            return await collection.countDocuments(filter);
        } finally { release(); }
    }

    async logPlayedSound(server_id, user_id, sound, timestamp) {
        const [_, release] = await this.clientLock.acquire();
        try {
            let collection = this.Client.db("stats").collection("sounds");

            await collection.insertOne({
                server: server_id,
                user: user_id,
                sound: sound,
                timestamp: timestamp
            });
        } finally { release(); }
    }

    async commandAnalytics(msg, argv, error, elapsedTime) {
        // Ignore test channel messages.
        if(Credentials.isTestMessage(msg.channel.id, msg.guild ? msg.guild.id : "dm")) return;

        const [_, release] = await this.clientLock.acquire();
        try {
            let collection = this.Client.db("stats").collection("commands");

            await collection.insertOne(Object.assign({
                server: msg.guild ? msg.guild.id : "dm",
                channel: msg.guild ? msg.channel.id : "dm",
                user: msg.author.id,
                timestamp: msg.createdTimestamp,
                command: argv.shift(),
                succeeded: error === "",
                args: argv.join(" "),
                elapsedTime
            }, error !== "" ? { error } : null));
        } catch(e) { console.log(e);
        } finally { release(); }
    }
}

module.exports = MongoWrapper;
