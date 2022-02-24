import bot from "../lib/bot";
import { Message, InlineKeyboardButton } from "typegram";
import { Markup } from "telegraf";
import parse from "parse-duration";
import {
  addMilliseconds,
  formatDuration,
  formatISO,
  intervalToDuration,
  parseISO,
} from "date-fns";
import config from "../config";

const reminder = () => {
  try {
    bot.action(/.+/, async (ctx) => {
      ctx.answerCbQuery("Setting up timer/reminder");
      const callback = ctx.match[0];
      const effectName = callback.slice(0, callback.indexOf("⏰"));
      const currentDate = new Date();
      const effectEndDate = parseISO(
        callback.slice(callback.indexOf("⏰") + 1),
      );
      const formattedDuration = formatDuration(
        intervalToDuration({
          start: currentDate,
          end: effectEndDate,
        }),
      );
      const ms = effectEndDate.valueOf() - currentDate.valueOf();
      if (Math.sign(ms) === 1) {
        const replyTo = await ctx.reply(
          `Will remind you about ${effectName}in ${formattedDuration}`,
        );
        setTimeout(() => {
          ctx.reply("Reminding you about this!", {
            reply_to_message_id: replyTo.message_id,
          });
        }, ms);
      } else {
        ctx.reply(
          `${effectName}is in the past. Send a new ／effect from @chtwrsbot`,
        );
      }
    });
    bot.on("message", (ctx) => {
      const originalSender = (ctx.message as Message.TextMessage)
        .forward_from?.username;
      const text = (ctx.message as Message.TextMessage).text;
      const parsedDurationMs = parse(text);
      const currentDate = new Date();
      const futureDate = addMilliseconds(
        currentDate,
        parsedDurationMs,
      );
      if (originalSender == "chtwrsbot") {
        const forwardText = (
          ctx.message as Message.TextMessage
        ).text.split("\n");
        const messageDelay =
          currentDate.valueOf() -
          (ctx.message as Message.TextMessage).forward_date! * 1000;

        let effectBtn: (InlineKeyboardButton & {
          hide?: boolean | undefined;
        })[] = [];

        forwardText.forEach((line) => {
          if (line.includes("⏰")) {
            const effectName = line.slice(0, line.indexOf("⏰"));
            const effectDurationMs =
              parse(line.slice(line.indexOf("⏰"))) - messageDelay;
            const effectEndDate = addMilliseconds(
              currentDate,
              effectDurationMs,
            );
            effectBtn.push(
              Markup.button.callback(
                effectName,
                `${effectName}⏰${formatISO(effectEndDate, {
                  format: "basic",
                })}`,
              ),
            );
          }
        });
        if (effectBtn.length !== 0) {
          ctx.reply("Select the effect you want to be reminded of", {
            reply_to_message_id: ctx.message.message_id,
            ...Markup.removeKeyboard(),
            ...Markup.inlineKeyboard(effectBtn, {
              //set up custom keyboard wraps for two columns
              wrap: (btn, index, currentRow) => {
                if (currentRow.length === 2) {
                  return true;
                } else {
                  return false;
                }
              },
            }),
          });
        } else {
          ctx.replyWithHTML(
            `No effects found. Send a new ／effect from @chtwrsbot\n
<i>For bug reports/suggestions, please create an issue at <a href="http://go.francisyzy.com/timer-bot-issues">Github</a></i>`,
          );
        }
      } else if (parsedDurationMs) {
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
