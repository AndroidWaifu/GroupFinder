# Skelebot
A very basic bot (a "skeleton" bot) that has only minimal commands. This bot takes inspiration from Dylan Warren's (https://github.com/Uhuh) various Discord bots. 

The "prefix" to the bot is it's mention. Ex:
@Skelebot status

## Built In Commands

**Command** - *Description* (Extra Information)



###### Default Commands

**Help** - *Sends a list of all available commands.* (This can also be used by just mentioning the bot)

**Groups** - *Sends a list of all available command groups.* 

**Botstatus** - *Gives information regarding the bot.*

**Status** - *Gives information about the server where the command is run.*

###### Default Developer Command

**Eval** - *Evaluates a piece of code and returns the output.*

## Adding Command Packages

###### Commands

  To add a command, you create a file with an export that is named `commands`. In this export should be an array of Command (interface found in `src/bot.ts`) objects. If this export is not created, the bot will not recognize the file as valid.
  
  *Side note, any commands with the group set to "Dev" will not show up in the help menu for any members that aren't the Bot Developer. Similarly, other members will be unable to run the `eval` command given above.*
  
###### Init

  In case a command package wants to add listeners or affect the client in other ways, there is the option to add a function export which accepts a single parameter - the client. This function will be run before the bot loads all the commands.
  
  *The init function will not be run unless the commands export is present.*
  
###### Group Overriding

  Any commands without a `group` attribute can have their attribute set to a shared group. This is done by adding a `string` export with the name `group`. 
  
## Configuration/Environmental Variables

  Any configurable options for the bot should be put into a file called `.env`. More about configuring this file can be found at https://www.npmjs.com/package/dotenv. In order for the bot to function, you **must** add the bot's login token into the ENV file (formatted as `TOKEN="{Your Token}"`) or it will be unable to login to Discord. The only other current configuration option found in the .env file is "LOG_LVL". More information on this is given below.
  
#### Log Level (LOG_LVL)

**Log level is the lowest type of message that should be logged to both the console and to `bot.log`. So if the log level is "INFO", then all other levels are logged. Levels are ranked below, starting at the lowest.**

"INFO" - *This will be used to provide extra information that may not be needed for daily operation. For example, the bot currently logs the beginning of each file load under this level.*

"DEV" - *This is a debugging tool often used while developing the bot.*

"BOT" - *These are the most basic bot status updates.*

"WARN" - *Anything that goes wrong with the bot that isn't so dangerous it could break the bot. For example, a command file not being loaded because of the module name being mismatched is logged as a warning.*

"ERROR" - *Issues that are considered severe enough they could break the bot or cause problems.*
