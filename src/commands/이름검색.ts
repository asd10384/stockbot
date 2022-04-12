import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getstockname } from "../stock/getstockname";
import { market } from "../stock/getstock";

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
    options: [
      {
        type: "SUB_COMMAND",
        name: "한국",
        description: "코스피, 코스닥에서 검색",
        options: [{
          type: "STRING",
          name: "주식이름",
          description: "주식이름을 입력해주세요.",
          required: true
        }]
      },
      {
        type: "SUB_COMMAND",
        name: "나스닥",
        description: "나스닥에서 검색",
        options: [{
          type: "STRING",
          name: "주식이름",
          description: "주식이름을 입력해주세요.",
          required: true
        }]
      },
      {
        type: "SUB_COMMAND",
        name: "nyse",
        description: "나스닥에서 검색",
        options: [{
          type: "STRING",
          name: "주식이름",
          description: "주식이름을 입력해주세요.",
          required: true
        }]
      }
    ]
  };
  msgmetadata?: { name: string; des: string; }[] = [
    {
      name: "이름검색 한국 [주식이름]",
      des: "입력한 값이 들어간 [코스피, 코스닥] 주식들을 알려줍니다."
    },
    {
      name: "이름검색 나스닥 [주식이름]",
      des: "입력한 값이 들어간 [나스닥] 주식들을 알려줍니다."
    },
    {
      name: "이름검색 NYSE [주식이름]",
      des: "입력한 값이 들어간 [나스닥] 주식들을 알려줍니다."
    }
  ];

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    const getmarket = interaction.options.getSubcommand(true).toUpperCase() as "한국" | "나스닥" | "NYSE";
    const market: market = getmarket === "한국" ? "KRX" : getmarket === "나스닥" ? "NASDAQ" : "NYSE";
    return await interaction.editReply({ embeds: [ await this.searchname(market, interaction.options.getString("주식이름", true)) ] });
  }
  async msgrun(message: M, args: string[]) {
    const getmarket = args[0];
    const market: market | undefined = getmarket ? getmarket === "한국" ? "KRX" : getmarket === "나스닥" ? "NASDAQ" : getmarket.toUpperCase() === "NYSE" ? "NYSE" : undefined : undefined;
    if (market) return message.channel.send({ embeds: [ await this.searchname(market, args.slice(1).join(" ")) ] });
    return message.channel.send({ embeds: [ this.help() ] });
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async searchname(market: market, name: string | undefined): Promise<MessageEmbed> {
    if (!name || name.length === 0) return client.mkembed({
      title: `**주식이름을 입력해주세요.**`,
      footer: { text: "도움말: !주식 help" },
      color: "DARK_RED"
    });
    return await getstockname(name, "stock", market);
  }
}