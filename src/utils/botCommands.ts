import { BotCommand } from "typegram";
/**
 * All admin commands here
 * @return {BotCommand[]} List of admin commands
 */
export function getBotCommands(): BotCommand[] {
  // Update this list of commands
  const rawBotCommands = [
    {
      command: "activetimers",
      description: "Get list of active running timers",
    },
    {
      command: "stats",
      description: "Find your timer stats",
    },
    {
      command: "hypixel",
      description: "Open hypixel timer keyboard",
    },
    {
      command: "help",
      description: "Find out more on the bot",
    },
  ];

  let botCommands: BotCommand[] = [];
  rawBotCommands.forEach((botCommand) => {
    botCommands.push({
      command: botCommand.command.toLowerCase(),
      description: botCommand.description.substring(0, 256),
    });
  });
  return botCommands;
}
