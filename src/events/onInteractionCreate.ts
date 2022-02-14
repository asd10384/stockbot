import { handler } from '..';
import { ButtonInteraction, CommandInteraction, Interaction, SelectMenuInteraction } from 'discord.js';

export default async function onInteractionCreate (interaction: Interaction) {
  /**
   * 명령어 친사람만 보이게 설정
   * ephemeral: true
   */
  await (interaction as CommandInteraction | SelectMenuInteraction | ButtonInteraction).deferReply({ ephemeral: true }).catch(() => {});
  if (interaction.isSelectMenu()) {
    const commandName = interaction.customId;
    const args = interaction.values;
    const command = handler.commands.get(commandName);
    if (command && command.menurun) return command.menurun(interaction, args);
  }
  if (interaction.isButton()) {
    const args = interaction.customId.split("-");
    if (!args || args.length === 0) return;
    const command = handler.commands.get(args.shift()!);
    if (command && command.buttonrun) return command.buttonrun(interaction, args);
  }
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName;
  const command = handler.commands.get(commandName);

  if (!command) return;
  if (command.slashrun) command.slashrun(interaction);
}