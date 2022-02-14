import { ButtonInteraction, ChatInputApplicationCommandData, CommandInteraction, Message, SelectMenuInteraction } from "discord.js";
import { M, B, I, S } from "../aliases/discord.js";

export interface Command {
  name: string;
  visible: boolean;
  description: string;
  information: string;
  aliases: string[];
  metadata: ChatInputApplicationCommandData;
  msgmetadata?: { name: string, des: string }[];
  slashrun?: (args: I) => Promise<any>;
  msgrun?: (message: M, args: string[]) => Promise<any>;
  menurun?: (interaction: S, args: string[]) => Promise<any>;
  buttonrun?: (interaction: B, args: string[]) => Promise<any>;
}