import bot from "../lib/bot";
import { Message } from "typegram";
import parse from "parse-duration";
import {
  addMilliseconds,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import config from "../config";

const reminder = () => {
  try {
    bot.on("message", (ctx) => {
      const text = (ctx.message as Message.TextMessage).text;
      const parsedDurationMs = parse(text);
      const currentDate = new Date();
      const futureDate = addMilliseconds(
        currentDate,
        parsedDurationMs,
      );
      if (parsedDurationMs) {
        const formattedDuration =
          formatDuration(
            intervalToDuration({
              start: currentDate,
              end: futureDate,
            }),
          ) || parsedDurationMs + "ms";
        ctx.reply(`Will remind you about ^ in ${formattedDuration}`, {
          reply_to_message_id: ctx.message.message_id,
        });
        setTimeout(() => {
          ctx.reply("Reminding you about this!", {
            reply_to_message_id: ctx.message.message_id,
          });
        }, parsedDurationMs);
      } else {
        if (
          config.LOG_GROUP_ID &&
          process.env.NODE_ENV === "production"
        ) {
          ctx.telegram.sendMessage(
            config.LOG_GROUP_ID,
            "Invalid entry ^",
          );
        }
        if (parsedDurationMs === 0) {
          ctx.reply("0 is not an accepted value, please try again", {
            reply_to_message_id: ctx.message.message_id,
          });
        } else {
          ctx.reply(
            "You have entered an invalid duration, /help to learn more.",
            {
              reply_to_message_id: ctx.message.message_id,
            },
          );
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
};

export default reminder;
