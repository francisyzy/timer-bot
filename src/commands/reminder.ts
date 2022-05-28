import bot from "../lib/bot";
import { Message, InlineKeyboardButton } from "typegram";
import { Markup } from "telegraf";
import parse from "parse-duration";
import {
  addMilliseconds,
  differenceInMilliseconds,
  formatDuration as formatDurationFns,
  formatISO,
  formatISO9075,
  intervalToDuration,
  isSameSecond,
  parseISO,
} from "date-fns";
import config from "../config";
import formatDuration from "format-duration";

const users: {
  userId: number;
  timers: {
    createdAt: Date;
    timer: NodeJS.Timeout;
    messageId: number;
  }[];
}[] = [];

const bootDate = new Date();

//https://stackoverflow.com/a/62002839
const max = 2147483647; //max 32 bit signed int

const reminder = () => {
  try {
    bot.action(/ .+/, async (ctx) => {
      if (ctx.from === undefined) {
        return ctx.replyWithHTML(
          `Bug! You're not a user? If so, please /start at @" +
            ${
              (await bot.telegram.getMe()).username
            } else, report a bug @ <a href="http://go.francisyzy.com/timer-bot-issues">Github</a>`,
        );
      }

      ctx.answerCbQuery("Setting up timer/reminder");
      const callback = ctx.match[0];
      const createdAt = parseISO(
        callback.slice(callback.indexOf(" ") + 1),
      );
      ctx.editMessageText("Looking for timers/reminder to remove");

      const index = users.findIndex(
        (user) => user.userId === ctx.from!.id,
      );
      if (index === -1) {
        ctx.reply("No Timers Found");
      } else {
        const timer = users[index].timers.find((timer) =>
          isSameSecond(timer.createdAt, createdAt),
        );
        if (timer) {
          clearTimeout(timer.timer);
          ctx.reply("Removed the timer/reminder", {
            reply_to_message_id: timer.messageId,
          });
        } else {
          ctx.reply("Cannot find timer/reminder to remove");
        }
      }
    });

    bot.action(/ .+/, async (ctx) => {
      if (ctx.from === undefined) {
        return ctx.replyWithHTML(
          `Bug! You're not a user? If so, please /start at @" +
            ${
              (await bot.telegram.getMe()).username
            } else, report a bug @ <a href="http://go.francisyzy.com/timer-bot-issues">Github</a>`,
        );
      }

      ctx.answerCbQuery("Setting up timer/reminder");
      const callback = ctx.match[0];
      const effectName = callback.slice(0, callback.indexOf("⏰"));
      const currentDate = new Date();
      const effectEndDate = parseISO(
        callback.slice(callback.indexOf("⏰") + 1),
      );
      const formattedDuration = formatDurationFns(
        intervalToDuration({
          start: currentDate,
          end: effectEndDate,
        }),
      );
      const ms = effectEndDate.valueOf() - currentDate.valueOf();
      if (Math.sign(ms) === 1) {
        const replyTo = await ctx.reply(
          `Will remind you about:${effectName}in ${formattedDuration}`,
        );
        const timeout = setTimeout(() => {
          ctx.reply("Reminding you about this!", {
            reply_to_message_id: replyTo.message_id,
          });
        }, ms);
        const index = users.findIndex(
          (user) => user.userId === ctx.from!.id,
        );
        if (index === -1) {
          users.push({
            userId: ctx.from.id,
            timers: [
              {
                createdAt: currentDate,
                timer: timeout,
                messageId: replyTo.message_id,
              },
            ],
          });
        } else {
          users[index].timers.push({
            createdAt: currentDate,
            timer: timeout,
            messageId: replyTo.message_id,
          });
        }
      } else {
        ctx.reply(
          `${effectName}is in the past. Send a new ／effect from @chtwrsbot`,
        );
      }
    });

    bot.command("activetimers", (ctx) => {
      const index = users.findIndex(
        (user) => user.userId === ctx.from.id,
      );
      const currentDate = new Date();
      if (index === -1) {
        ctx.reply("No Timers Found");
      } else {
        let cancelBtn: (InlineKeyboardButton & {
          hide?: boolean | undefined;
        })[] = [];

        users[index].timers.forEach((timer) => {
          //TODO stop using private variables
          // @ts-ignore because timer has _destroyed
          if (!timer.timer["_destroyed"]) {
            const futureDate = addMilliseconds(
              timer.createdAt,
              // @ts-ignore because timer has _idleTimeout
              timer.timer["_idleTimeout"],
            );
            const formattedDuration = formatDuration(
              Math.abs(
                differenceInMilliseconds(currentDate, futureDate),
              ),
            );

            cancelBtn.push(
              Markup.button.callback(
                formattedDuration,
                " " + formatISO(timer.createdAt, { format: "basic" }),
              ),
            );
          }
        });
        let returnMessage = "You have no active timers";
        if (cancelBtn.length === 1) {
          returnMessage =
            "Your active timer/reminder (time remaining), press the button to cancel timer";
        } else if (cancelBtn.length > 1) {
          returnMessage =
            "Your active timers/reminders (time remaining), press the button to cancel timer";
        }
        ctx.reply(returnMessage, {
          reply_to_message_id: ctx.message.message_id,
          ...Markup.removeKeyboard(),
          ...Markup.inlineKeyboard(cancelBtn, {
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
      }
    });

    bot.command("stats", (ctx) => {
      const index = users.findIndex(
        (user) => user.userId === ctx.from.id,
      );
      let createdTimers = 0;
      if (index !== -1) {
        createdTimers = users[index].timers.length;
      }
      let returnMessage = `You have created a total of ${createdTimers} timers since the server was last rebooted at ${formatISO9075(
        bootDate,
      )} GMT+8`;
      if (ctx.from.id === config.ADMIN_TELE_ID) {
        returnMessage += `\n\nCurrent no. of users: ${users.length}`;
        let activeTimers = 0;
        let destroyedTimers = 0;
        users.forEach((user) => {
          user.timers.forEach((timer) => {
            // @ts-ignore because timer has _destroyed
            if (timer.timer["_destroyed"] == false) {
              activeTimers++;
            } else {
              destroyedTimers++;
            }
          });
        });
        returnMessage += `\n\nActive timers: ${activeTimers}`;
        returnMessage += `\n\nDestroyed timers: ${destroyedTimers}`;
      }
      ctx.reply(returnMessage, {
        reply_to_message_id: ctx.message.message_id,
        ...Markup.removeKeyboard(),
      });
    });

    bot.on("message", async (ctx) => {
      const originalSender = (ctx.message as Message.TextMessage)
        .forward_from?.username;
      const text = (ctx.message as Message.TextMessage).text;
      const parsedDurationMs = parse(text);
      const currentDate = new Date();
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
            if (effectDurationMs > max) {
              return; //https://stackoverflow.com/a/18453035
            }

            const effectEndDate = addMilliseconds(
              currentDate,
              effectDurationMs,
            );
            effectBtn.push(
              Markup.button.callback(
                effectName,
                ` ${effectName}⏰${formatISO(effectEndDate, {
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
        if (parsedDurationMs > max) {
          const maxDate = addMilliseconds(currentDate, max);
          return ctx.reply(
            `You have exceeded the maximum amount timeout. Max Timeout: 32-bit signed integer (${max}ms = ${formatDurationFns(
              intervalToDuration({
                start: currentDate,
                end: maxDate,
              }),
            )})`,
          );
        }
        const futureDate = addMilliseconds(
          currentDate,
          parsedDurationMs,
        );
        const formattedDuration =
          formatDurationFns(
            intervalToDuration({
              start: currentDate,
              end: futureDate,
            }),
          ) || parsedDurationMs + "ms";
        const replyTo = await ctx.reply(
          `Will remind you about ^ in ${formattedDuration}`,
          {
            reply_to_message_id: ctx.message.message_id,
          },
        );
        const timeout = setTimeout(() => {
          ctx.reply("Reminding you about this!", {
            reply_to_message_id: ctx.message.message_id,
          });
        }, parsedDurationMs);
        const index = users.findIndex(
          (user) => user.userId === ctx.from.id,
        );
        if (index === -1) {
          users.push({
            userId: ctx.from.id,
            timers: [
              {
                createdAt: currentDate,
                timer: timeout,
                messageId: replyTo.message_id,
              },
            ],
          });
        } else {
          users[index].timers.push({
            createdAt: currentDate,
            timer: timeout,
            messageId: replyTo.message_id,
          });
        }
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
