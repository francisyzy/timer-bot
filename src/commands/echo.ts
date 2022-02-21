import bot from "../lib/bot";
import { Message } from "typegram";
import parse from "parse-duration";
import {
  addMilliseconds,
  formatDuration,
  intervalToDuration,
} from "date-fns";

const echo = () => {
  try {
    bot.on("message", (ctx) => {
      const text = (ctx.message as Message.TextMessage).text;
      const parsedDurationMs = parse(text);
      const currentDate = new Date();
      const futureDate = addMilliseconds(
        currentDate,
        parsedDurationMs,
      );
      if (
        futureDate instanceof Date &&
        !isNaN(futureDate.valueOf())
      ) {
        const formattedDuration = formatDuration(
          intervalToDuration({ start: currentDate, end: futureDate }),
        );
        ctx.reply(`Will remind you about ^ in ${formattedDuration}`, {
          reply_to_message_id: ctx.message.message_id,
        });
        setTimeout(() => {
          ctx.reply("Reminding you about this!", {
            reply_to_message_id: ctx.message.message_id,
          });
        }, parsedDurationMs);
      } else {
        ctx.reply("Invalid entry", {
          reply_to_message_id: ctx.message.message_id,
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

export default echo;
