import { Message } from "discord.js";
import Bot from "../bot";
import { DEV_ID } from "../vars";

export default async (client: Bot, message: Message): Promise<void> => {
  const { guild } = message;

  // Ignore bots and DMs
  if (message.author.bot || !guild) return;

  const mention = message.mentions.users.first();
  if (mention && client.user && mention.id === client.user.id) {

    const len: number = message.content.split(' ')[0].length;
    const [command, ...args] = message.content.substring(len+1).split(' ');

    // Help Command
    if (!command || command === "help") {
      await client.help.run(message, args, client);
      return;
    }

    client.groups.forEach(async (group) => {
      const toRun = group.commands.get(command);
      if (toRun && (toRun.can_run(message, client) || (message.author && message.author.id === DEV_ID))) {
        await toRun.run(message, args, client);
        return;
      }
    })
  }
}