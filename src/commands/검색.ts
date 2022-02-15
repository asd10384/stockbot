import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { MessageAttachment, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getstock, kosdaq, kospi, stockstype } from "../stock/getstock";

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
  name = "검색";
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
    name: "검색 [주식이름]",
    des: "주식의 정보를 알려줍니다."
  }];

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply(await this.search(interaction, interaction.options.getString("주식이름", true)));
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send(await this.search(message, args.join(" ")));
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async search(message: M | I, name: string | undefined): Promise<{ embeds: MessageEmbed[], files: MessageAttachment[] }> {
    if (!name || name.length === 0) return { embeds: [ client.mkembed({
      title: `**주식이름을 입력해주세요.**`,
      footer: { text: "도움말: !주식 help" },
      color: "DARK_RED"
    }) ], files: [] };
    var stockmarket: "코스피" | "코스닥" = "코스피";
    var stocknames = kospi.name.filter((stname) => stname.replace(/ +/g,"") === name.replace(/ +/g,""));
    if (stocknames?.length === 0) {
      stockmarket = "코스닥";
      stocknames = kosdaq.name.filter((stname) => stname.replace(/ +/g,"") === name.replace(/ +/g,""));
    }
    if (stocknames?.length > 0) {
      var stocks: stockstype[] = [];
      if (stockmarket === "코스피") stocks = kospi.stocks.filter((st) => st.stockName === stocknames[0]);
      if (stockmarket === "코스닥") stocks = kosdaq.stocks.filter((st) => st.stockName === stocknames[0]);
      if (stocks?.length > 0) {
        const stock = await getstock(stocks[0].reutersCode, true, message);
        if (stock) {
          const embed = client.mkembed({
            title: `\` ${stock.name} \``,
            url: `https://finance.daum.net/quotes/A${stock.code}`,
            footer: { text: stockmarket }
          });
          if (stock.files.length > 0) embed.setImage(`attachment://A${stock.code}.png`);
          else embed.setImage(stock.image);
          embed.addFields([
            {
              name: `**현재가**`,
              value: stock.price,
              inline: true
            },
            {
              name: `**전일비**`,
              value: stock.compareToPreviousClosePrice,
              inline: true
            },
            {
              name: `**등락률**`,
              value: stock.fluctuationsRatio,
              inline: true
            },
            {
              name: `**시가총액**`,
              value: stock.marketValue,
              inline: true
            },
            {
              name: `**거래량**`,
              value: stock.accumulatedTradingVolume.toLocaleString("ko-KR"),
              inline: true
            }
          ]);
          return { embeds: [ embed ], files: stock.files };
        }
      }
    }
    return { embeds: [ client.mkembed({
      title: `\` 주식을 찾을수 없음 \``,
      description: `**${name}** 이름의 주식을 찾을수 없습니다.`
    })], files: [] };
  }
}