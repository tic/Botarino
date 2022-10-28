# Botarino v4

Botarino is a fully modular and easily customizable general purpose chatbot written in TypeScript. Currently it is build with the intention of being used as a Discord bot, but a substantial amount of the architecture is designed in a way which will allow for easy porting to other platforms. Nearly all of the Discord-specific functionality exists within the Discord service file, make it easy to replace with logic for some other platform.

This is the fourth major iteration of Botarino, following:
- v1 -- simplistic, single-file.
- v2 -- multi-file with common functionality abstracted to custom libraries.
- v3 -- object oriented, multi-file, modular, with hot reloads.



# Architecture

## Root Files
The root level of the repository, `/`, contains configuration files and the startup file. These are designed to requrire little to no modifications during development.

## Command Files
The commands folder, `/commands`, contains one file for each command the bot can execute. Command files must provide a `CommandControllerType` as their default export. This type must contain properties for an *executor function*, a description, and a help string. Optionally, it can contain examples of how to use the command, a *validation function*, and a *visibility function*.


| Command Terminology |    Definition     |
|---------------------|-------------------|
| Executor function   | Given an arguments object and a message object, this function implements the desired command functionality. |
| Validation function | Accepts an arguments object and returns a boolean indicating whether the input is valid for the given command. If it returns false, the command's executor function will not run. |
| Visibility function | Accepts a message object and an arguments object and returns a boolean indicating whether the given command should be visible. Visibility is a mechanism which controls whether a certain command is available to certain users, within certain servers, or according to other criteria. |

Within the executor function, you may call the `dispatchAction` function to send messages or perform other actions. You may also call the `interaction` function as a way of implementing some form of state into a command. Consider a `!chess` command; since the game is stateful, you can conduct the entire game within a single instance of the chess command, and request additional user input by making calls to `interaction`. These functions will be described more thoroughly in the services section.

## Modules
The modules folder, `/modules`, contains isolated subprocesses which the bot should run while it is operating. An example could be a periodic task that posts a message every day at a certain time, sets a status, and so forth. Module files must provide a `ModuleControllerType` as their default export. This type includes a unique name to identify the module in logs, and two functions: `setup` and `run`. The setup function is executed exactly once before the run function runs. After the setup has completed, the `run` function is called **exactly once**. Most modules probably will need to do some infinite looping. If the module crashes, it will be restarted after a ten minute pause. If the module crashes 10 consecutive times without exiting gracefully, it will be aborted and will no longer run. In this case, a message will be placed in the log file stating the module was aborted due to continued failures.

## Scripts
Contains random files for testing stuff.

## Services
Most of the bot's functionality, outside of actual command implementations, resides here. It contains the database connector, common utilities, the Discord connector, and the interaction manager.

|Service|Purpose|
|-------|-------|
|Analytics|Records basic statistics for every channel the bot can see in each server it is in. Stats contain no content-specific data, only metadata like the action performed (message posted, command used, etc.), the user who performed the action, the server/channel it was performed in, and so forth. Analytics can be disabled by setting `DO_ANALYTICS=false` in the environemnt file.
|Argument Parser|Converts raw messages into parsed argument objects. Arguments are styled similarly to *argv* in C.|
|Audio Player|Exclusively oversees the bot's ability to connect to voice channels and speak (play sound). This functionality is complex and very tightly connected to the platform where the bot is running, so it has its own dedicated service.|
|Command|Provides a method for executing a command given a command name and arguments, as well as a lookup map to convert strings to command controller objects. These are loaded dynamically from the commands folder.|
|Database|Provides a connection to the Mongo database for the bot.|
|Discord|Provides portable methods for interacting with the Discord platform. Provides the `dispatchAction` function (and `dispatchActions` function) which can be used to issue a single I/O action (or multiple I/O actions). Actions are automatically throttled to prevent API rate limit issues, general action spam, and to encourage more thoughtful use of actions. When possible, the bot verifies whether it has permission to perform the requested action in order to minimize costly HTTP 401 responses from the Discord API.|
|Interactions|Interactions are the cornerstone feature of this bot version. They allow a single instance of a command to span across multiple messages or users. They work by a command awiting a call to the `interaction` function and specifying some criteria to wait for. When the bot processes incoming events, like a message being posted, it checks to see if that incoming message satisfies a pending interaction. If it does, that interaction is resolved with the incoming event and further processing *usually* does not occur (individual interactions can specify whether further processing is allowed). This service also contains the hypervisor, a function which handles all incoming messages and distributes actions as needed; this is similar to how a virtual machine's hypervisor manages events to and from the guest OS and make system calls as needed.|
|Logger|Provides basic logging utilities.|
|Modules|Launches all modules and manages any failures they may encounter.|
|Utilities|Exports a bunch of helper functions to make things easier elsewhere.|

## Templates
The templates folder, `/templates`, contains copy/paste-able skeletons for creating new commands or modules. It also contains a sample sound configuration file, which should be placed into a the `/sounds` folder (not part of the repository) if the soundboard command (`s`) is desired.

## Types
The types folder, `/types`, is where all custom types for the entire project are defined. They're mostly divided by services, since those are where most of the types are used.



# Creating your own instance

1. Clone the repository: `git clone git@github.com:tic/Botarino.git`
2. Install dependencies: `npm ci` or `npm i`
3. Create env file from the template: `cat .env.template > .env`
4. Add your Mongo and Discord information to the environment file.
5. In the environment file, set the `ADMINISTRATOR_IDS` property equal to your discord user id.



# Examples of command development

Since the interaction system is, from what I can tell, kind of unique, I thought it would be wise to share a bit of development philosophy. Let's imagine you want to build a command which implements the game "20 Questions". Thinking about the flow of the game, we have the player initiate the game with the selection of a category. This could be done in the initial call to the command. For instance, `!20q mineral` might start a game in the mineral category. The computer would need to respond with a guess, to which the player will reply yes or no. Eventually the computer will begin to propose guesses. If the user answers yes to one of the guesses, the game is over and the computer wins. If twenty questions pass without a correct guess from the computer, the game is over and the player wins.

Consider each prompt for input from the player as an interaction that the command will await. The command executor might look something like this:

```javascript
const command: CommandExecutor = async (args, message) => {
  const [category] = args.basicParseWithoutCommand; // "mineral" in our example

  let i = 0;
  for (; i < 20; i++) {
    // Figure out what we're going to ask the player. If
    // the computer is making a guess, isGuess === true.
    const [isGuess, prompt] = getNextQuestion();

    // Dispatch an action to post the prompt to the channel.
    await dispatchAction({
      actionType: DiscordActionTypeEnum.SEND_MESSAGE,
      payload: buildBasicMessage(message.channel, prompt, []),
    });

    // Wait for a response from the same player that started
    // the game. Ignore messages from any other user.
    const event = await interaction(
      {
        interactionSource: InteractionSourceEnum.WAIT_FOR_MESSAGE_FROM_USER,
        userId: message.author.id,
      },
      true, // whether this interaction can block others if this one is matched
      true, // whether this interaction can be blocked by a different interaction (has priority over the other property)
    );

    // You'd actually want to handle these errors,
    // but in this example we just throw an error.
    if (event.timeout || !event.success) {
      throw new Error('something went wrong');
    }

    // Get the response the player sent in.
    const responseFromPlayer = event.content.content;

    // If the computer guessed correctly, end the loop.
    if (isGuess && responseFromPlayer.match(/yes/)) {
      break;
    }
  }

  // Dispatch an action to state what the result of
  // the game was (i.e. state who won the game).
  await dispatchAction({
    actionType: DiscordActionTypeEnum.SEND_MESSAGE,
    payload: buildBasicMessage(message.channel, i === 20 ? `${message.author.username} wins!` : 'I win!', []),
  });
}
```
