import { MessageEmbed, TextChannel } from 'discord.js';
import { buildBasicMessage, dispatchAction } from '../services/discord.service';
import { selectRandomElement } from '../services/util.service';
import { CommandControllerType, CommandExecutor } from '../types/commandTypes';
import { DiscordActionTypeEnum } from '../types/serviceDiscordTypes';

const shakeFlavors = [
  'Fresh banana', 'Banana berry', 'Banana fudge', 'Banana nut', 'Banana pineapple', 'Banana pudding', 'Blueberry', 'But'
  + 'terfinger', 'Cappuccino', 'Caramel fudge', 'Blueberry cheesecake', 'Caramel cheesecake', 'Cherry cheesecake', 'Cho'
  + 'colate chip cheesecake', 'Strawberry cheesecake', "Hershey's chocolate", 'Double chocolate', 'Chocolate cherry',
  'Chocolate chip cherry', 'Chocolate chip mint', 'Chocolate malt', 'Chocolate nut', 'Heath toffee', 'M&M', 'Mocha', 'O'
  + 'range push-up', 'Oreo', 'Oreo mint', 'Peach', 'Peach cobbler', 'Peanut butter', 'Peanut butter banana', 'Peanut bu'
  + 'tter fudge', 'Pineapple', 'Red cherry', "Reese's cup", 'Snickers', 'Strawberry', 'Vanilla', 'Walnut', 'Fresh water'
  + 'melon', 'Eggnog',
];

const sideOrders = [
  'Bacon wrap', 'Cheese bites', 'Chicken nuggets', 'Chicken wrap', 'Corn dog', 'Fries', 'Hushpuppies', 'Onion rings',
  'Quesadilla', 'Slaw', 'Chili',
];

const burgerToppings = [
  'Mayo', 'Mustard', 'Ketchup', 'Pickles', 'Onion', 'Lettuce', 'Grilled onions', 'Cajun seasoning', 'Tomato', 'Bacon',
  'Cheese', 'Chili', 'Slaw',
];

const burgerTypes = ['Small burger', 'Regular burger', 'Huge burger', 'Big double burger'];
const drinkOptions = ['Fountain soda', 'Huge tea', 'Bottled water', 'Cheerwine float', 'Coke float'];
const chickenEntrees = [
  'Original chicken breast', 'Barbeque chicken breast', 'Cajun chicken breast', 'Club chicken breast', 'Cheddar chicken'
  + ' breast', 'Homemade chicken breast', 'Regular spicy chicken breast', 'Chicken strip snack (3)', 'Chicken strip san'
  + 'dwich', 'Chicken strip club', 'Cajun chicken wrap', 'Ranch chicken wrap', 'Honey mustard chicken wrap', 'Cajun ran'
  + 'ch chicken wrap', 'Chicken nuggets (5)',
];

const jrTrayEntrees = ['Small burger', '2 chicken strips', '2 corn dogs', 'BLT sandwich', 'Hot dog', 'Quesadilla'];
const trayEntrees = [
  'Big double burger', '1/4 lb. burger', 'Reg. barbeque', '2 hot dogs', '2 beef quesadillas', '2 chicken quesadillas',
  'Reg. chicken', 'Cajun chicken', 'Spicy chicken', 'BBQ chicken', 'Chicken strip sandwich', 'Chicken strips (3)',
];

const bbqEntrees = ['BBQ sandwich', 'BBQ plate'];

const getShake = () => {
  const month = new Date().getMonth();
  let shake = selectRandomElement(shakeFlavors);
  if (month === 7 || month === 8) {
    while (shake === 'Fresh watermelon') {
      shake = selectRandomElement(shakeFlavors);
    }
  } else if (month === 11) {
    while (shake === 'Eggnog') {
      shake = selectRandomElement(shakeFlavors);
    }
  }

  return shake;
};

const getToppings = () => {
  const numberOfToppings = Math.round(
    [...new Array(burgerToppings.length)]
      .map((_, __, arr) => Math.random() * arr.length)
      .reduce((sum, i) => sum + i),
  ) / burgerToppings.length;

  const availableToppings = [].concat(burgerToppings);
  const selectedToppings: string[] = [];
  while (selectedToppings.length < numberOfToppings) {
    const nextToppingIndex = Math.round(Math.random() * burgerToppings.length);
    const nextTopping = availableToppings[nextToppingIndex];
    availableToppings.splice(nextToppingIndex);
    selectedToppings.push(nextTopping);
  }

  return selectedToppings;
};

const generateMeal = (entrees: string[], numberOfSides: number) => {
  const sides = [...new Array(numberOfSides)].map(() => selectRandomElement(sideOrders));
  const entree = selectRandomElement(entrees);
  return {
    entree,
    entreeInfo: entree.includes('burger') ? `Toppings: ${getToppings().join(', ')}` : '',
    sides: numberOfSides > 1 && sides[0] === sides[1] ? [`Double ${sides[0]}`] : sides,
    drink: selectRandomElement(drinkOptions),
    shake: getShake(),
  };
};

// eslint-disable-next-line no-unused-vars
const command: CommandExecutor = async (args, message) => {
  const entity = args.basicParseWithoutCommand[0];
  const getDefaultEmbed = () => new MessageEmbed()
    .setAuthor({ name: 'Cookout Items' })
    .setDescription("Here are your cookout items, but they're probably not what you wanted!");
  const embeds: MessageEmbed[] = [];

  if (entity === 'jrtray') {
    const tray = generateMeal(jrTrayEntrees, 1);
    embeds.push(getDefaultEmbed().addFields(
      { name: 'Entree', value: tray.entreeInfo.length > 0 ? `${tray.entree}\n${tray.entreeInfo}` : tray.entree },
      { name: 'Side', value: tray.sides[0] },
      { name: 'Drink', value: tray.drink },
      { name: 'Shake', value: tray.shake },
    ));
  } else if (entity === 'tray') {
    const tray = generateMeal(trayEntrees, 2);
    embeds.push(getDefaultEmbed().addFields(
      { name: 'Entree', value: tray.entreeInfo.length > 0 ? `${tray.entree}\n${tray.entreeInfo}` : tray.entree },
      { name: 'Sides', value: tray.sides.join(' and ') },
      { name: 'Drink', value: tray.drink },
      { name: 'Shake', value: tray.shake },
    ));
  } else if (entity === 'burger') {
    embeds.push(getDefaultEmbed().addFields({ name: 'Entree', value: selectRandomElement(burgerTypes) }));
  } else if (entity === 'bbq') {
    embeds.push(getDefaultEmbed().addFields({ name: 'Entree', value: selectRandomElement(bbqEntrees) }));
  } else if (entity === 'chicken') {
    embeds.push(getDefaultEmbed().addFields({ name: 'Entree', value: selectRandomElement(chickenEntrees) }));
  } else if (entity === 'shake') {
    embeds.push(getDefaultEmbed().addFields({ name: 'Shake', value: getShake() }));
  } else if (entity === 'vs') {
    const traysToGenerate = Number(args.basicParseWithoutCommand[1]);
    const trays = [new Array(traysToGenerate)].map(() => generateMeal(trayEntrees, 2));
    trays.forEach((tray, i) => {
      embeds.push(
        getDefaultEmbed()
          .setTitle(`Tray ${i + 1}`)
          .addFields(
            { name: 'Entree', value: tray.entreeInfo.length > 0 ? `${tray.entree}\n${tray.entreeInfo}` : tray.entree },
            { name: 'Sides', value: tray.sides.join(' and ') },
            { name: 'Drink', value: tray.drink },
            { name: 'Shake', value: tray.shake },
          ),
      );
    });
  }

  if (embeds.length > 0 && entity !== 'vs' && args.basicParseWithoutCommand[1] === 'combo') {
    const drink = selectRandomElement(drinkOptions);
    const side = selectRandomElement(sideOrders);
    embeds.forEach((embed) => {
      embed.addFields(
        { name: 'Drink', value: drink, inline: true },
        { name: 'Side', value: side, inline: true },
      );
    });
  }

  if (embeds.length) {
    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel as TextChannel, ' ', embeds),
    });
  }

  // Todo: add reactions for voting for the best tray in a vs battle
  // "**Who won? Who's next? You decide :point_right:**"
  // reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
};

export default {
  executor: command,
  description: 'With so many options available at Cookout, sometimes a little help building your order is needed. This '
    + "command can provide you with a variety of cookout information. Don't forget to play some Christian rock while or"
    + 'dering.',
  help: '$!$ <"jrtray"|"tray"|"burger"|"bbq"|"chicken"|"assorted"|"shake"|"vs"[cookout entity type]> <?number:2[number '
    + 'of trays to generate for a VS battle. Required only when using the vs entity type.] <?"combo":[turns any entity '
    + 'into a combo meal]>',
  validator: (args) => !!args.rawWithoutCommand.match(
    /[(jrtray)(tray)(burger)(bbq)(chicken)(assorted)(shake)(vs \d+)( combo)?]/,
  ),
} as CommandControllerType;
