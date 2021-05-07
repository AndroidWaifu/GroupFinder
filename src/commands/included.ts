import { MessageEmbed, Role } from "discord.js";
import * as OS from "os";
import { Command } from "../../src/bot";
import { log } from "../vars";

export const commands: Command[] = [
  {
    desc: "Information about the bot",
    name: "botstatus",
    args: "",
    run: (message, _args, client) => {
      const embed = client.genBotEmbed("**Bot Status");
      let userCount = 0;
      let channelCount = 0;

      client.guilds.cache.forEach(g => {
        userCount += g.memberCount;
        channelCount += g.channels.cache.size;
      });

      embed
        .setThumbnail(client.user!.avatarURL() || "")
        .addField(`**Bot Developer:**`, `AndroidWaifu`, true)
        .addField(`**The bot is in:**`, `${client.guilds.cache.size} servers`, true)
        .addField(`**The bot is watching:**`, `${userCount} users`, true)
        .addField(`**The bot is watching:**`, `${channelCount} channels`, true)
        .addField(`**Bot OS:**`, `${OS.platform()}`, true);
      message.channel.send(embed);
    },
    can_run: function (_message, _client): boolean {
      return true;
    }
  },
  {
    desc: "A developer command that runs any code in the message",
    name: "eval",
    group: "Dev",
    args: "",
    run: async function (message, args, _client) {
      const clean = (text: string) => {
        if (typeof text === "string")
          return text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203));
        else return text;
      };
  
      try {
        const code = args.join(" ");
        let evaled = eval(code);
  
        if (typeof evaled !== "string") evaled = require("util").inspect(evaled);
  
        message.channel.send(clean(evaled), { code: "xl" });
      } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
      }
    },
    can_run: function(_message, _client): boolean {
      return false;
    }
  },
  {
    desc: "Shows status of current server",
    name: "status",
    args: "",
    run: async function (message, _args, _client) {
      const embed = new MessageEmbed()
      const guild = message.guild
  
      if(!guild) return
  
      let roles: Role[] = []
      let textC: number = 0
      let voiceC: number = 0
      if (message.channel.type === "dm") return
  
      guild.roles.cache.forEach((role: Role) => roles.push(role))
  
      guild.channels.cache.forEach((channel: {type: string}) => {
        if (channel.type === "text") textC++
        else if (channel.type === "voice") voiceC++
      })
  
      embed
        .setColor(16772864)
        .setThumbnail(guild.iconURL() || "")
        .setDescription(`**Server information for _${guild.name}_**`)
        .addField(`_**> Owner**_`, `\`${guild.owner!.user.tag}\``, true)
        .addField(`_**> OwnerID**_`, `\`${guild.ownerID}\``, true)
        .addField(`_**> Users**_`, `\`${guild.memberCount}\``, true)
        .addField(`_**> Text Channels**_`, `\`${textC}\``, true)
        .addField(`_**> Voice Channels**_`, `\`${voiceC}\``, true)
        .addField(`_**> Roles**_`, `${roles.join(" ")}`, true)
  
      message.channel.send(embed)
    },
    can_run: function (_message, _client): boolean {
      return true;
    }
  }
]