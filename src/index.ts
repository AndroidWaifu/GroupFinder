import Bot from "./bot";
import { log } from "./vars";

const bot = new Bot();

bot.start().catch((e: any) => {
  log(`${e}`, "ERROR");
})