// Interfaces with a locally running python process that uses an AI
// to generate DND actions. It uses the AIDungeon play_dm.py mode, with
// some nice modifications to use sockets for inter-process communications.
// Honestly, this is my Frankenstein.

const Command = require("../superComponents/Command");
const assert = require('assert');
const net = require('net');
const fs = require('fs');
var Semaphore = require('async-mutex').Semaphore;

class Robozot extends Command {

    static usageLock = new Semaphore(1);
    static inUse = false;

    static FunctionalStats = {
        STR: [9, -1],
        DEX: [15, 2],
        CON: [16, 3],
        INT: [14, 2],
        WIS: [13, 1],
        CHA: [16, 3],
    }
    static CharacterStats = {
        HP: 43,
        AC: 15,
        INIT: 5
    }

    constructor(Client, m, argv, Mongo) {
        super(Client, m, argv);
        this.Client = Client;
        this.m = m;
        this.argv = argv;
    }

    async run() {
        const giveUpExclusivity = async () => {
            let [_, release] = await Robozot.usageLock.acquire();
            Robozot.inUse = false;
            release();
        }

        const requireExclusivity = async () => {
            let exclusive = false;
            let [_, release] = await Robozot.usageLock.acquire();
            if(Robozot.inUse) exclusive = false;
            else {
                exclusive = true;
                Robozot.inUse = true;
            }
            release();
            return exclusive;
        }

        // "The AI is currently processing a query. Please wait until it is finished before requesting another."

        switch(this.argv[1]) {
            case "stats":
                this.m.channel.send(`${Object.keys(Robozot.FunctionalStats).map(stat => `> ${stat}: ${Robozot.FunctionalStats[stat][0]} (${Robozot.FunctionalStats[stat][1] > -1 ? `+${Robozot.FunctionalStats[stat][1]}` : Robozot.FunctionalStats[stat][1]})`).join("\n")}\n\n${Object.keys(Robozot.CharacterStats).map(stat => `> ${stat}: ${Robozot.CharacterStats[stat]}`).join("\n")}`);
                break;

            case "thank":
                if(this.m.member.voice.channel) {
                    let connection = await this.m.member.voice.channel.join();
                    let cons = this.Client.voice.connections.array();
                    let player = cons[0].play(`./audio/tyvm-robozot.mp3`);

                    let delay = new Promise((resolve, reject) => {
                        player.on("finish", async () => {
                            await cons[0].channel.leave();
                            resolve();
                        });
                    });
                    await delay;
                } else this.m.channel.send("> You have to be in a voice channel to thank Robozot.")
                break;

            case "theme":
                if(this.m.member.voice.channel) {
                    let connection = await this.m.member.voice.channel.join();
                    let cons = this.Client.voice.connections.array();
                    let player = cons[0].play(`./audio/theme-robozot.mp3`);

                    let delay = new Promise((resolve, reject) => {
                        player.on("finish", async () => {
                            await cons[0].channel.leave();
                            resolve();
                        });
                    });
                    await delay;
                } else this.m.channel.send("> You have to be in a voice channel to hear Robozot's theme.")
                break;

            default:
                assert(await requireExclusivity());
                assert(this.argv.length > 1);

                let client = null;
                let thinking = new Promise((resolve, reject) => {
                    let timeout = setTimeout(resolve, 60000);
                    let resolved = false;

                    // Send the rest of argv as a string to the connection socket.
                    let scenario = this.argv.filter((_, i) => i > 1).join(" ");
                    client = new net.Socket();

                    const doResolve = msg => {
                        if(!resolved) {
                            resolved = true;
                            clearTimeout(timeout);
                            resolve(msg);
                            try {
                                client.destroy();
                            } catch(e) {
                                console.log("robozot socket client destruction error", e)
                            }
                        }
                    }

                    client.connect(12345, '127.0.0.1', () => {
                        client.write(`${scenario}\x04`);
                    });

                    client.on('error', e => {
                        doResolve("Robozot's AI is currently unavailable.");
                    });

                    client.on('data', resp => {
                        let action = resp.toString();
                        let punctuations = [".", "!", "?"];
                        if(punctuations.includes(action[action.length - 1])) doResolve(action);
                        else {
                            let party_members = ["Bozo", "Happy", "Reg", "Erv", "Adoy", "Clem", "the nearest NPC"];
                            doResolve(`${action} ...\nWell, ${party_members[parseInt(Math.random() * party_members.length)]} can tell you the rest.`);
                        }
                    });

                    client.on('close', () => {
                        doResolve(undefined);
                    });
                });

                this.m.channel.startTyping();
                let response = await thinking;
                if(response) await this.m.channel.send(response);
                else await this.m.channel.send("TImed out waiting for a response from Robozot. Here's the in-cannon explanation:\n> Robozot freezes wherever he currently is and does not move for the rest of the turn. Robozot is completely and utterly unresponsive.")
                await this.m.channel.stopTyping();
                await giveUpExclusivity();
                if(client) {
                    client.destroy();
                    client = null;
                }
                break;
        }

    }

    static help() {
        return `> Uses an AI text generator trained with lots of DND text to try and response with something relevant to the scenario you specified. It takes around 35 seconds to get a response on average.\n> Usage: \`!robozot <explain the scenario>\` to get an action, or \`!robozot stats\` to learn Robozot's DND character stats.`;
    }
}

module.exports = Robozot;
