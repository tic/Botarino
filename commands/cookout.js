// Having trouble deciding what to get from cookout? No longer.

const Command = require("../superComponents/Command");
const { MessageEmbed } = require("discord.js");
const assert = require('assert');

class Chooser {
    static Shakes = ["Fresh banana", "Banana berry", "Banana fudge", "Banana nut", "Banana pineapple", "Banana pudding", "Blueberry", "Butterfinger", "Cappuccino", "Caramel fudge", "Blueberry cheesecake", "Caramel cheesecake", "Cherry cheesecake", "Chocolate chip cheesecake", "Strawberry cheesecake", "Hershey's chocolate", "Double chocolate", "Chocolate cherry", "Chocolate chip cherry", "Chocolate chip mint", "Chocolate malt", "Chocolate nut", "Heath toffee", "M&M", "Mocha", "Orange push-up", "Oreo", "Oreo mint", "Peach", "Peach cobbler", "Peanut butter", "Peanut butter banana", "Peanut butter fudge", "Pineapple", "Red cherry", "Reese's cup", "Snickers", "Strawberry", "Vanilla", "Walnut", "Fresh watermelon", "Eggnog"];
    static Sides = ["Bacon wrap", "Cheese bites", "Chicken nuggets", "Chicken wrap", "Corn dog", "Fries", "Hushpuppies", "Onion rings", "Quesadilla", "Slaw", "Chili"];
    static BurgerToppings = ["Mayo", "Mustard", "Ketchup", "Pickles", "Onion", "Lettuce", "Grilled onions", "Cajun seasoning", "Tomato", "Bacon", "Cheese", "Chili", "Slaw"];
    static BurgerTypes = ["Small burger", "Regular burger", "Huge burger", "Big double burger"];
    static Drinks = ["Fountain soda", "Huge tea", "Bottled water", "Cheerwine float", "Coke float"];
    static ChickenEntrees = ["Original chicken breast", "Barbeque chicken breast", "Cajun chicken breast", "Club chicken breast", "Cheddar chicken breast", "Homemade chicken breast", "Regular spicy chicken breast", "Chicken strip snack (3)", "Chicken strip sandwich", "Chicken strip club", "Cajun chicken wrap", "Ranch chicken wrap", "Honey mustard chicken wrap", "Cajun ranch chicken wrap", "Chicken nuggets (5)"];
    static JrTrayEntrees = ["Small burger", "2 chicken strips", "2 corn dogs", "BLT sandwich", "Hot dog", "Quesadilla"];
    static TrayEntrees = ["Big double burger", "1/4 lb. burger", "Reg. barbeque", "2 hot dogs", "2 beef quesadillas", "2 chicken quesadillas", "Reg. chicken", "Cajun chicken", "Spicy chicken", "BBQ chicken", "Chicken strip sandwich", "Chicken strips (3)"];
    static BBQEntrees = ["BBQ sandwich", "BBQ plate"];
    static OddballEntrees = ["Hot dog", "Corn dog", "Hushpuppies", "Cheese quesadilla", "Chicken quesadilla", "Beef quesadilla", "BLT", "Bacon ranch wrap", "Chili dog", "Cajun fries", "Bacon cheddar dog", "Cook Out style hot dog", "Onion rings", "White cheddar cheese bites"];

    ///////// Actual methods /////////
    constructor() {}

    static pickFromArray = arr => arr[parseInt(Math.random() * arr.length)];
    static isBurger = entree => ["Small burger", "Regular burger", "Huge burger", "Big double burger", "1/4 lb. burger"].includes(entree);

    static pickAnyEntree() {
        let list = Chooser.BurgerTypes.concat(Chooser.ChickenEntrees.concat(Chooser.BBQEntrees.concat(Chooser.OddballEntrees)));
        return Chooser.pickFromArray(list);
    }

    // Things we can generate:
    //  shake, side, toppings, burger, drink, chickenEntree, jrEntree, trayEntree, bbqEntree, oddballEntree
    static generate(gen_list) {
        let generated_list = []
        for(let i = 0; i < gen_list.length; i++) {
            switch(gen_list[i]) {
                case "shake":
                let shake_block = {
                    shake: Chooser.pickFromArray(Chooser.Shakes)
                };
                if(shake_block.shake === "Fresh watermelon" || shake_block.shake === "Eggnog") {
                    shake_block.backup = Chooser.pickFromArray(Chooser.Shakes);
                    while(shake_block.backup === "Fresh watermelon" || shake_block.backup === "Eggnog") shake_block.backup = Chooser.pickFromArray(Chooser.Shakes)
                }
                generated_list.push(shake_block);
                break;

                case "side":
                generated_list.push(Chooser.pickFromArray(Chooser.Sides));
                break;

                case "burger":
                generated_list.push(Chooser.pickFromArray(Chooser.BurgerTypes));
                break;

                case "drink":
                generated_list.push(Chooser.pickFromArray(Chooser.Drinks));
                break;

                case "chickenEntree":
                generated_list.push(Chooser.pickFromArray(Chooser.ChickenEntrees));
                break;

                case "jrEntree":
                generated_list.push(Chooser.pickFromArray(Chooser.JrTrayEntrees));
                break;

                case "trayEntree":
                generated_list.push(Chooser.pickFromArray(Chooser.TrayEntrees));
                break;

                case "bbqEntree":
                generated_list.push(Chooser.pickFromArray(Chooser.BBQEntrees));
                break;

                case "oddballEntree":
                generated_list.push(Chooser.pickFromArray(Chooser.OddballEntrees));
                break;

                default:
                if(gen_list[i].indexOf("toppings_") === 0 && gen_list[i].length > 9) {
                    let topping_count = parseInt(gen_list[i].substring(gen_list[i].indexOf("_") + 1)) || 0;
                    if(topping_count > 12 || topping_count < 0) topping_count = 0;
                    let toppings = [], topping_box = Chooser.BurgerToppings.concat([]);
                    while(topping_count--) {
                        let topping_index = parseInt(Math.random() * topping_box.length);
                        toppings.push(topping_box[topping_index]);
                        topping_box.splice(topping_index, 1);
                    }
                    generated_list.push(toppings);
                } else generated_list.push(undefined);
            }
        }
        return generated_list;
    }
}

class Cookout extends Command {
    constructor(Client, m, argv, Mongo) {
        assert(argv.length > 1);
        super(Client, m, argv);
        this.m = m;
        this.argv = argv;
    }

    static randomElement(arr) {
        return arr[parseInt(Math.random() * arr.length)];
    }

    async run() {
        let message = ``, generation = [], embeds = [], executed = false;
        switch(this.argv[1]) {

            case "jrtray":
            executed= true;
            generation = Chooser.generate(["jrEntree", "side", "side", "drink", "shake", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`]);
            message = `> Jr. Entree: **${generation[0]}**\n${Chooser.isBurger(generation[0]) ? `> Burger toppings: **${generation[5].join(", ")}**\n` : ``}> Sides: **${generation[1] === generation[2] ? `double ${generation[1]}` : `${generation[1]} and ${generation[2]}`}**\n> Drink: **${generation[3]}**\n> Shake: **${generation[4].shake}** ${generation[4].backup ? `(seasonal backup: **${generation[4].backup}**)` : ``}\nFor this order, I recommend the ${parseInt(Math.random() * 2) ? "shake" : "drink"}.`;
            break;

            case "tray":
            executed= true;
            generation = Chooser.generate(["trayEntree", "side", "side", "drink", "shake", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`]);
            embeds.push(
                new MessageEmbed()
                    .setTitle("Cookout Tray")
                    .setColor("#ff0000")
                    .setAuthor("Cookout", "https://i.gyazo.com/7c7d82381d1799cbc60332f2dea8010a.jpg", "https://cookout.com/menu")
                    .setDescription(`For this tray, I recommend the ${parseInt(Math.random() * 4) ? "shake" : "drink"}.`)
                    .addFields(
                        {name: "Entree", value: Chooser.isBurger(generation[0]) ? `${generation[0]}\nToppings: ${generation[5].join(", ")}` : generation[0]},
                        {name: "Sides", value: generation[1] === generation[2] ? `Double ${generation[1]}` : `${generation[1]} and ${generation[2]}`},
                        {name: "Drink", value: generation[3]},
                        {name: "Shake", value: generation[4].backup ? `${generation[4].shake}\nSeasonal backup: *${generation[4].backup}*` : generation[4].shake}
                    )
            );
            break;

            case "burger":
            executed= true;
            switch(this.argv[2]) {
                case "combo":
                generation = Chooser.generate(["burger", "side", "drink", "shake", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`]);
                message = `> Burger size: **${generation[0]}**\n${Chooser.isBurger(generation[0]) ? `> Burger toppings: **${generation[4].join(", ")}**\n` : ``}> Side: **${generation[1]}**\n> Drink: **${generation[2]}**\n> Shake: **${generation[3].shake}** ${generation[3].backup ? `(seasonal backup: **${generation[3].backup}**)` : ``}\nFor this order, I recommend the ${parseInt(Math.random() * 2) ? "shake" : "drink"}.`;
                break;

                default:
                generation = Chooser.generate(["burger", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`]);
                message = `> Burger size: ${generation[0]}\n> Toppings: ${generation[1].join(", ")}`;
            }
            break;

            case "bbq":
            executed= true;
            switch(this.argv[2]) {
                case "combo":
                generation = Chooser.generate(["bbqEntree", "side", "drink", "shake", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`]);
                message = `> BBQ Entree: **${generation[0]}**\n${Chooser.isBurger(generation[0]) ? `> Burger toppings: **${generation[4].join(", ")}**\n` : ``}> Side: **${generation[1]}**\n> Drink: **${generation[2]}**\n> Shake: **${generation[3].shake}** ${generation[3].backup ? `(seasonal backup: **${generation[3].backup}**)` : ``}\nFor this order, I recommend the ${parseInt(Math.random() * 2) ? "shake" : "drink"}.`;
                break;

                default:
                generation = Chooser.generate(["bbqEntree"]);
                message = `> BBQ Dish: **${generation[0]}**`;
            }
            break;

            case "chicken":
            executed= true;
            switch(this.argv[2]) {
                case "combo":
                generation = Chooser.generate(["chickenEntree", "side", "drink", "shake", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`]);
                message = `> Chicken Entree: **${generation[0]}**\n${Chooser.isBurger(generation[0]) ? `> Burger toppings: **${generation[4].join(", ")}**\n` : ``}> Side: **${generation[1]}**\n> Drink: **${generation[2]}**\n> Shake: **${generation[3].shake}** ${generation[3].backup ? `(seasonal backup: **${generation[3].backup}**)` : ``}\nFor this order, I recommend the ${parseInt(Math.random() * 2) ? "shake" : "drink"}.`;
                break;

                default:
                generation = Chooser.generate(["chickenEntree"]);
                message = `> Chicken dish: **${generation[0]}**`;
            }
            break;

            case "assorted":
            executed= true;
            switch(this.argv[2]) {
                case "combo":
                generation = Chooser.generate(["oddballEntree", "side", "drink", "shake", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`]);
                embeds.push(
                    new MessageEmbed()
                        .setTitle("Assorted Combo Meal")
                        .setColor("#ff0000")
                        .setAuthor("Cookout", "https://i.gyazo.com/7c7d82381d1799cbc60332f2dea8010a.jpg", "https://cookout.com/menu")
                        .setDescription(`A randomly generated meal that follows no conventions.`)
                        .addFields(
                            {name: "Entree", value: Chooser.isBurger(generation[0]) ? `${generation[0]}\nToppings: ${generation[4].join(", ")}` : generation[0]},
                            {name: "Side", value: generation[1]},
                            {name: "Drink", value: generation[2]},
                            {name: "Shake", value: generation[3].backup ? `${generation[3].shake}\nSeasonal backup: *${generation[3].backup}*` : generation[3].shake}
                        )
                );
                break;

                default:
                generation = Chooser.generate(["oddballEntree"]);
                embeds.push(
                    new MessageEmbed()
                        .setTitle("Assorted Entree")
                        .setColor("#ff0000")
                        .setAuthor("Cookout", "https://i.gyazo.com/7c7d82381d1799cbc60332f2dea8010a.jpg", "https://cookout.com/menu")
                        .setDescription(generation[0])
                );
            }
            break;

            case "shake":
            executed= true;
            if(this.argv[2] && parseInt(this.argv[2])) {
                let i = parseInt(this.argv[2]);
                let genarr = []
                while(i--) genarr.push("shake");
                generation = Chooser.generate(genarr);
                let mass_shake_format = generation.map(shake => `${shake.shake} ${shake.backup ? `(seasonal backup: *${shake.backup}*)` : ``}`);

                embeds.push(
                    new MessageEmbed()
                        .setTitle("Shakes")
                        .setColor("#ff0000")
                        .setAuthor("Cookout", "https://i.gyazo.com/7c7d82381d1799cbc60332f2dea8010a.jpg", "https://cookout.com/menu")
                        .setDescription(`Here's your list of ${this.argv[2]} shake${parseInt(this.argv[2]) > 1 ? "s" : ""}`)
                        .addFields({name: "Shakes", value: mass_shake_format.join("\n")})
                );
            } else {
                generation = Chooser.generate(["shake"]);
                let embed = new MessageEmbed()
                    .setTitle("Shake")
                    .setColor("#ff0000")
                    .setAuthor("Cookout", "https://i.gyazo.com/7c7d82381d1799cbc60332f2dea8010a.jpg", "https://cookout.com/menu")
                    .setDescription(generation[0].shake)

                if(generation[0].backup) {
                    embed.addFields({name: "Seasonal Backup", value: generation[0].backup});
                }
                embeds.push(embed);
            }
            break;

            // !cookout vs A B C D ...
            // !cookout vs #contestants
            case "vs":
            var num_contestants = 2, contestants = [];
            let gen_settings = ["trayEntree", "side", "side", "drink", "shake", `toppings_${parseInt(Math.random() * Chooser.BurgerToppings.length)}`];
            if(parseInt(this.argv[2])) {
                // We were given a number of contestants to register
                num_contestants = parseInt(this.argv[2]);
                while(contestants.length < num_contestants) {
                    contestants.push(this.argv[contestants.length + 3] || `Contestant ${contestants.length + 1}`);
                }
            } else {
                // The names of the contestants were given directly.
                num_contestants = this.argv.length - 2;
                while(contestants.length < num_contestants) {
                    contestants.push(this.argv[contestants.length + 2]);
                }
            }

            embeds = contestants.map(name => {
                let gen = Chooser.generate(gen_settings);
                let embed = new MessageEmbed()
                    .setTitle(`${name}'s Tray`)
                    .setColor("#ff0000")
                    .setAuthor("Cookout", "https://i.gyazo.com/7c7d82381d1799cbc60332f2dea8010a.jpg", "https://cookout.com/menu")
                    .setDescription(`For this order, I recommend the ${parseInt(Math.random() * 4) ? "shake" : "drink"}.`)
                    .addFields(
                        {name: "Entree", value: Chooser.isBurger(gen[0]) ? `${gen[0]}\nToppings: ${gen[5].join(", ")}` : gen[0]},
                        {name: "Sides", value: gen[1] === gen[2] ? `Double ${gen[1]}` : `${gen[1]} and ${gen[2]}`},
                        {name: "Drink", value: gen[3]},
                        {name: "Shake", value: gen[4].backup ? `${gen[4].shake}\nSeasonal backup: ${gen[4].backup}` : gen[4].shake}
                    )

                return embed;
            });

            break;
        }

        if(this.argv[1] !== "vs") {
            if(executed === false) {
                this.m.channel.send("Sorry, I don't understand that Cookout command. Try `!help cookout`");
            } else {
                this.m.channel.send(`Picking randomly from *${this.argv[1]}*`);
                for(let i = 0; i < embeds.length; i++) {
                    await this.m.channel.send({embed: embeds[i]});
                }
            }
        } else {
            await this.m.channel.send("**COOKOUT VS BATTLE**");
            for(let i = 0; i < embeds.length; i++) {
                await this.m.channel.send({embed: embeds[i]});
            }
            this.m.channel.send("**Who won? Who's next? You decide :point_right:**").then(async msg => {
                let i = 0, nums = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
                while(num_contestants--) {
                    if(i < nums.length) await msg.react(nums[i++]);
                }
            });
        }
    }

    static help() {
        return `With so many options available at Cookout, sometimes a little help building your order is needed. This command can provide you with a variety of cookout information:\n> Build a random Jr. Tray: \`!cookout jrtray\`\n> Build a random Tray: \`!cookout tray\`\n> Random burger with toppings: \`!cookout burger\`\n> Random BBQ dish: \`!cookout bbq\`\n> Random chicken dish: \`!cookout chicken\`\n> Random assorted dish: \`!cookout assorted\`\n> Random shake flavor: \`!cookout shake\`\n> Battle of the best tray: \`!cookout vs <optional number of contestants>\`. Provide additional arguments to specify the names of the contestants who are playing.\n\n> Add \`combo\` as an additional argument to the \`burger\`, \`bbq\`, \`chicken\`, or \`assorted\` commands to get sides and a drink assigned as well.\nDon't forget to play some Christian rock while ordering.`;
    }
}

module.exports = Cookout;
