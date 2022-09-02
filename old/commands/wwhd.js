// What would the notorious Happy Sadman do, you wonder? Well,
// wonder no longer. Just ask, and I'll figure out what the
// madman himself would probably do right now.


const Command = require("../superComponents/Command");

const Checks = [
    "Animal Handling",
    "Arcana",
    "History",
    "Investigation",
    "Medicine",
    "Nature",
    "Religion",
    "Survival"
]

const RollnDx = (n, x) => {
    if(n && x) return [...Array(n)].map(() => parseInt(Math.random() * x + 1)).reduce((s, c) => s + c);
    return parseInt(Math.random() * 20 + 1);
}

class WWHD extends Command {
    constructor(Client, m, argv, Mongo) {
        super(Client, m, argv);
        this.m = m;
        let place = parseInt(Math.random() * 10) + 1;
        this.options = [
            `The ${place}${place === 1 ? "st" : place === 2 ? "nd" : place === 3 ? "rd" : "th"} closest person to me is losing their eyebrows. Here's 4 1d20 rolls. Use them in order (as needed) to make this happen. ${RollnDx()}, ${RollnDx()}, ${RollnDx()}, ${RollnDx()}. My sleight of hand modifier is +6.`,
            `I'll enter sneak, no matter what the current scenario is. Here's 2 d20 rolls (in case of adv/disadv): ${RollnDx()}, ${RollnDx()}. My sneak modifier is +8.`,
            `I'm firing an arrow with my crossbow. Whoever (or whatever) is next in the initiative gets to decide who or what I'm shooting at (hopefully not myself). Here's a couple rolls: ${RollnDx()}, ${RollnDx()}. The modifier for this attack is normally +6.`,
            `The mage hand is going to make an appearance. The party member whose current HP is closest to a prime number (aside from my own) gets to decide what the mage hand does! Oh, and it can't just be *put away*.`,
            `Happy Sadman begins speaking in Thieves' Cant, probably with no clear purpose in mind. From the perspective of a passerby without proficiency in the dialect, it probably appears as though a patient escaped from a nearby facility. To someone who actually understands Thieves' Cant, I'm trying to explain what happened when I jumped off the wall at the Circus and experienced the camera clipping issue.`,
            `Do a ${Checks[parseInt(Math.random() * Checks.length)]} check on the nearest applicable object. What I'm trying to do with that check can be decided by the party. If there are no applicable objects within the distance I can travel in my turn, attempt to take the nearest non-party member's shoes. If necessary, explain I am the local shoe authority and their wear is against regulation. Here's a couple rolls, use as necessary. ${RollnDx()}, ${RollnDx()}.`,
            `Give Reg a ball bearing from my bag.`,
            `Go locate the Assman and attempt to bring him back to aid in the current situation.`,
            `Visit the port and use a special cantrip to detect if any Trident agents are nearby. If possible to contact one, ask about possible civilizations located at the bottom of the water body. Here's a roll if necessary: ${RollnDx()}.`,
            `Attempt to find someone in town who can dye hair. If I can find someone capable of this, I'm going to try to explain the shade of yellow that we used at the tailor for the TCA uniforms. Here's a couple rolls as needed: ${RollnDx()}, ${RollnDx()}.`,
        ];
    }

    async run() {
        await this.m.channel.send(`What would Happy Sadman do? Probably something like this:\n> ${this.options[parseInt(Math.random() * this.options.length)]}`);
        this.m.delete();
    }

    static help() {
        return `> Ask for a suggestion as to what Happy Sadman might do in whatever the current scenario is.\n> *What would Happy do?*\n> Usage: \`!wwhd\``;
    }
}

module.exports = WWHD;
