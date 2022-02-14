import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getnames } from "../stock/getstock";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class StockCommand implements Command {
  /** 해당 명령어 설명 */
  name = "이름검색";
  visible = true;
  description = "입력한 값이 들어간 주식들을 알려줍니다.";
  information = "입력한 값이 들어간 주식들을 알려줍니다.";
  aliases = [  ];
  metadata = <D>{
    name: this.name,
    description: this.description,
    options: [{
      type: "STRING",
      name: "주식이름",
      description: "주식이름을 입력해주세요.",
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = [{
    name: "이름검색 [주식이름]",
    des: "입력한 값이 들어간 주식들을 알려줍니다."
  }];

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [ await this.searchname(interaction.options.getString("주식이름", true)) ] });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: [ await this.searchname(args.join(" ")) ] });
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async searchname(name: string | undefined): Promise<MessageEmbed> {
    if (!name || name.length === 0) return client.mkembed({
      title: `**주식이름을 입력해주세요.**`,
      footer: { text: "도움말: !주식 help" },
      color: "DARK_RED"
    });
    var namelist: any[] = await getnames(name);
    if (!namelist) namelist = [];
    var output: string = "";
    var outnum = 0;
    for (let i=0; i<namelist.length; i++) {
      if (output.length > 1965) {
        outnum+=1;
        continue;
      }
      output += `${namelist[i].name} (${(namelist[i].tradePrice as number).toLocaleString("ko-KR")})\n`;
    }
    if (namelist.length === 0) return client.mkembed({
      title: `\` 검색: ${name} \``,
      description: `없음`
    });
    return client.mkembed({
      title: `\` 검색: ${name} \``,
      description: `주식이름 (현재가)\n${output}\n${outnum === 0 ? "" : `+ ${outnum}개`}`,
      footer: { text: `예시: !주식 검색 ${namelist[0].name}` }
    });
  }
}