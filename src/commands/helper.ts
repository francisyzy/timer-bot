import bot from "../lib/bot";
import { getBotCommands } from "../utils/botCommands";

//General helper commands
const helper = () => {
  //All bots start with /start
  bot.start((ctx) => {
    ctx.setMyCommands(getBotCommands());
  });
  bot.help((ctx) => ctx.reply("Help message"));
};

export default helper;
