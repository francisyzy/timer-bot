import bot from "../lib/bot";
import { getBotCommands } from "../utils/botCommands";

//General helper commands
const helper = () => {
  //All bots start with /start
  bot.start((ctx) => {
    ctx.telegram.setMyCommands(getBotCommands());
    return ctx.replyWithHTML(
      `Welcome to ${bot.botInfo?.first_name}, ${ctx.from.first_name}. To set a timer/reminder, simply type <pre>10s Test</pre> to be reminded about that message in 10s. For more examples, /help`,
    );
  });

  bot.help((ctx) => {
    let helpMsg = "Examples of time format that can be accepted\n\n";
    helpMsg +=
      "<i>Long(er) duration</i>\n<pre>1hour 20minutes 5seconds</pre>\n\n";
    helpMsg +=
      "<i>Long duration</i>\n<pre>1hr 20mins 5secs</pre>\n\n";
    helpMsg += "<i>Short duration</i>\n<pre>1h 20m 5s</pre>\n\n";
    helpMsg += "<i>Spaces allowed</i>\n<pre>1 hr 20 mins</pre>\n\n";
    helpMsg += "<i>Numbers only</i>\n<pre>10</pre> → 10ms\n\n";
    helpMsg +=
      "<i>Numbers only</i>\n<pre>1000</pre> → 1000ms → 1s\n\n";
    helpMsg +=
      "<i>Negatives</i>\n<pre>2hr -40mins</pre> → 1h 20m\n\n";
    helpMsg += "<i>Exponents:</i>\n<pre>2e3s</pre> → 2000s\n\n";
    helpMsg +=
      "<i>Most other types of noise:</i>\n<pre>running length: 1hour:20mins</pre> → 1h 20m\n\n";
    helpMsg += `<i>For bug reports, please create an issue at <a href="http://go.francisyzy.com/timer-bot-issues">Github</a></i>`;
    ctx.replyWithHTML(helpMsg, { disable_web_page_preview: true });
  });
};

export default helper;
