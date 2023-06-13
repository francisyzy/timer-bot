import bot from "../lib/bot";
import { Markup } from "telegraf";

//General hypixel commands
const hypixel = () => {
  bot.command("hypixel", (ctx) => {
    const hypixelBtn = Markup.keyboard(
      [
        Markup.button.text("10h 20mins Titanium"),
        Markup.button.text("1h composter"),
      ],
      {
        wrap: (btn, index, currentRow) =>
          currentRow.length >= index + 2,
      },
    );
    ctx.reply("Select your timer", hypixelBtn);
  });
};

export default hypixel;
