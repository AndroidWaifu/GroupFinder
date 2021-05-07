// Imports
import * as Discord from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as SQL from "better-sqlite3";

const fileLogger = require('log-to-file');

dotenv.config();
import { log, logAll, LOG_LVL, TOKEN } from "./vars";
import * as MessageHandler from "./handlers/message";

// DEV PLANS
/*
  GET GROUP FUNCTIONALITY !!!
*/

interface PartialCommand {
  desc: string;
  args: string;
  can_run: (message: Discord.Message, client: Bot) => boolean;
  run: (message: Discord.Message, args: string[], client: Bot) => void;
}
interface CommandGroup {
  name: string,
  commands: Discord.Collection<string, PartialCommand>
}

const defaultHelp: PartialCommand = {
  desc: "A help command that isn't functional",
  args: "",
  can_run: (_message, _client) => {return true},
  run: (message, _args, _client) => {
    try {
      message.channel.send("There is no configured help command.");
    } catch (err) {
      log(`Encountered error while sending message: ${err}`, "ERROR");
    }
  }
};

export class Bot extends Discord.Client {
  groups: CommandGroup[];
  help: PartialCommand = defaultHelp;
  db: SQL.Database;

  constructor() {
    super();
    this.groups = [];
    this.db = new SQL('bot.db', { verbose: (info) => {
      fileLogger(info, 'database.log');
    }})

    logAll([
      'Beginning bot initialization',
      `Bot log level set to "${LOG_LVL}"`
    ]);

    this.loadCommands();

    this.on("ready", (): void => {
      log(`Bot started at ${new Date()}`);
      this.randomPresence();
      setInterval(() => this.randomPresence(), 120);
    });
    this.on("message", async (message) => MessageHandler.default(this, message));
  }

  genBotEmbed(
    title: string = (this.user ? this.user.username : "Bot Message"), url: string = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'): Discord.MessageEmbed {
    const embed = new Discord.MessageEmbed;
    embed
      .setTitle(title)
      .setURL(url)
      .setColor("RANDOM")
      .setTimestamp(new Date());
    return embed;
  }

  randomPresence(): void {
    const user = this.user;
    if (!user) return log("Client user non-existant for presence update", "ERROR");

    const presenceArr = [
      `@${user.username} help`, 
      `Studying really hard!`,
      `Read Coding for Dummies`
    ]

    user.setPresence(
      {
        activity: {
          name: presenceArr[Math.floor(Math.random()*presenceArr.length)],
          type: "PLAYING"
        }, 
        status: "online"
      }
    ).catch((e: any) => log(`Failed to set new presence: ${e}`));
  }

  loadCommands(): void {
    const files: string[] = [];
    fs.readdirSync("src/commands/").forEach(file => {
      files.push(file.slice(0, -3));
    });

    let ind = 0;
    let total = 0;
    for (const file of files) {
      log(`Loading file ${file} (${((ind+1)/files.length)*100}%)`, 'INFO');
      try {
        const imported = require(`./commands/${file}`);
        if (imported.commands) {
          if (imported.init)
            imported.init(this);
          imported.commands.forEach((command: Command) => {
            if (!command.group)
              if (imported.group)
                command.group = imported.group;
              else
                command.group = "Default";

            if (command.desc === "") command.desc = "No description"
            
            if (command.group === "Default" && command.name === "help")
              this.help = command;
            else {
              let groupInd = this.groups.findIndex(group => group.name === command.group);
              if (groupInd > -1)
                this.groups[groupInd].commands.set(command.name, command);
              else
                this.groups.push({
                  name: command.group || "Default",
                  commands: new Discord.Collection<string, PartialCommand>([[command.name, command]])
                });
            }
            total++;
          });
        }
        else
          throw new Error('Command file didn\'t have required "commands" export');
      } catch(error) {
        log(`${file} is an invalid bot addition: \n\t${error}`, "WARN");
      }
      ind++;
    }
    if (this.help === defaultHelp)
      log('Help command was not overwritten', 'WARN');
    log(`Finished loading ${total} commands from ${files.length} files.`);

    return;
  }

  async start() {
    await this.login(TOKEN);
  }
}

// Exports
export interface Command {
  name: string;
  group?: string;
  desc: string;
  args: string;
  can_run: (message: Discord.Message, client: Bot) => boolean;
  run: (message: Discord.Message, args: string[], client: Bot) => void;
}
export default Bot;