import { Command } from "../bot";
import { DEV_ID, log } from "../vars"

export const commands: Command[] = [
  {
    name: "help",
    desc: "Sends a list of all avaiable commands",
    args: "<group>",
    can_run: function (_message, _client): boolean {
      return true;
    },
    run: async function (message, args, client) {
      const embed = client.genBotEmbed(client.user ? `${client.user.username} Help` : "Help List");
      const author = message.member;
      const group = client.groups.find(group => group.name === (args[0] ? args[0] : "Default"));

      if (!author)
        return;

      if (!group) {
        embed.addField(
          "Error occured",
          "That group does not exist!"
        );
        try {
          message.author.send(embed);
        } catch (error) {
          log(`There was a problem while sending a user the help command: \n\t${error}`, "WARN");
        }
        return;
      }

      embed.setDescription(`List of Commands - ${group!.name}`);

      let totalCommands = 0;
      group.commands.forEach((command, name) => {
        totalCommands++;

        if (!command.can_run(message, client) && (author.id !== DEV_ID)) return;

        embed.addField(
          `**${name} ${command.args}**`,
          `- ${command.desc}`
        );

        if (totalCommands === 25) {
          try {
            message.author.send(embed);
          } catch (error) {
            log(`There was a problem while sending a user the help command: \n\t${error}`, "WARN");
          }
          embed.spliceFields(0, 25);
          totalCommands = 0;
        }
      });

      message.author.send(embed);
    }
  },
  {
    name: "groups",
    desc: "List all command groups available",
    args: "",
    can_run: function (_message, _client) {
      return true;
    },
    run: async function (message, _args, client) {
      const embed = client.genBotEmbed(client.user ? `${client.user.username} Help Groups` : "Help Groups List")
      const author = message.member;

      if (!author)
      return;

      embed.setDescription(`All the help group options`);

      client.groups.forEach((group, ind) => {

        embed.addField(
          `**${group.name}**`,
          `Use ${client.user ? `@${client.user.username}` : ""} help ${group.name}`
        );

        if ((ind+1) % 25 === 0) {
          try {
            message.author.send(embed);
          } catch (error) {
            log(`There was a problem while sending a user the help command: \n\t${error}`, "WARN");
          }
          embed.spliceFields(0, 25);
        }
      });

      try {
        message.author.send(embed);
      } catch (error) {
        log(`There was a problem while sending a user the help command: \n\t${error}`, "WARN");
      }
    }
  }
]