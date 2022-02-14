import { client, handler } from "..";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js";
import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import MDB from "../database/Mongodb";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 */

/** help 명령어 */
export default class HelpCommand implements Command {
  /** 해당 명령어 설명 */
  name = "help";
  visible = true;
  description = "명령어 확인";
  information = "명령어 확인";
  aliases = [ "도움말" ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply(this.gethelp());
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send(this.gethelp()).then(m => client.msgdelete(m, 8));
  }
  async menurun(interaction: S, args: string[]) {
    const command = handler.commands.get(args[0]);
    var embed = client.mkembed({ color: client.embedcolor });
    var embed2: MessageEmbed | undefined = undefined;
    if (command) {
      embed.setTitle(`\` /${args[0]} 도움말 \``)
        .setDescription(`이름: ${args[0]}\n설명: ${command.information ? command.information : command.description}`);
      embed2 = client.help(command.metadata.name, command.metadata, command.msgmetadata);
    } else {
      embed.setTitle(`\` ${args[0]} 도움말 \``)
        .setDescription(`명령어를 찾을수 없습니다.`)
        .setFooter({ text: `도움말: /help` })
        .setColor('DARK_RED');
    }
    if (embed2) return await interaction.editReply({ embeds: [ embed, embed2 ] });
    return await interaction.editReply({ embeds: [ embed ] });
  }

  gethelp(): { embeds: MessageEmbed[], components: MessageActionRow[] } {
    // const slashcmdembed = client.mkembed({
    //   title: `\` slash (/) 도움말 \``,
    //   description: `명령어\n명령어 설명`,
    //   color: client.embedcolor
    // });
    const msgcmdembed = client.mkembed({
      title: `\` 기본 (${client.prefix}) 도움말 \``,
      description: `명령어\n명령어 설명`,
      footer: { text: `PREFIX: ${client.prefix}` },
      color: client.embedcolor
    });
    let cmdlist: { label: string, description: string, value: string }[] = [];
    handler.commands.forEach((cmd) => {
      if (cmd.slashrun && cmd.visible) {
        cmdlist.push({ label: `/${cmd.name}`, description: `${cmd.information ? cmd.information : cmd.description}`, value: `${cmd.name}` });
        // slashcmdembed.addField(`**/${cmd.name}**`, `${cmd.information ? cmd.information : cmd.description ? cmd.description : "-"}`, true);
      }
    });
    handler.commands.forEach((cmd) => {
      if (cmd.msgrun && cmd.visible) {
        // cmdlist.push({ label: `${client.prefix}${cmd.metadata.name} [${(cmd.metadata.aliases) ? cmd.metadata.aliases : ''}]`, description: `${cmd.metadata.description}`, value: `${cmd.metadata.name}` });
        msgcmdembed.addField(`**${client.prefix} ${cmd.msgmetadata && cmd.msgmetadata.length === 1 ? cmd.msgmetadata[0].name : cmd.name}**`, `${cmd.information ? cmd.information : cmd.description ? cmd.description : "-"}`, true);
      }
    });
    const rowhelp = client.mkembed({
      title: '\` 명령어 상세보기 \`',
      description: `명령어의 자세한 내용은\n아래의 선택박스에서 선택해\n확인할수있습니다.`,
      footer: { text: '여러번 가능' },
      color: client.embedcolor
    });
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('help')
        .setPlaceholder('명령어를 선택해주세요.')
        .addOptions(cmdlist)
    );
    return { embeds: [ msgcmdembed, rowhelp ], components: [ row ] };
  }
}