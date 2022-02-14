import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { GuildMember, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
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
  name = "보유";
  visible = true;
  description = "현재보유금액과 매수한 주식 확인";
  information = "현재보유금액과 매수한 주식 확인";
  aliases = [  ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [ await this.queue(interaction) ] });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: [ await this.queue(message) ] });
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async queue(message: M | I): Promise<MessageEmbed> {
    const udb = await MDB.get.user(message.member as GuildMember);
    if (!udb) return client.mkembed({
      title: `유저정보를 찾을수 없습니다.`,
      description: "다시 시도해주세요.",
      color: "DARK_RED"
    });
    const nickname = (message.member as GuildMember)?.nickname ? (message.member as GuildMember)?.nickname : (message.member as GuildMember)?.user.username;
    var text = "";
    if (udb.stocks.length > 0) {
      for (let i=0; i<udb.stocks.length; i++) {
        let stockmarket: "코스피" | "코스닥" = "코스피";
        let stock = udb.stocks[i];
        let checkname = kospi.name.filter((stname) => stname.replace(/ +/g,"").includes(stock.name.replace(/ +/g,"")));
        if (checkname.length === 0) {
          stockmarket = "코스닥";
          // checkname = kosdaq.name.filter((stname) => stname.replace(/ +/g,"").includes(name.replace(/ +/g,"")));
        }
        const stockdata = await getstock(stock.code, false);
        if (!stockdata) continue;
        text += `\n【${stockmarket}】[${stock.name}] (${stockdata.price}) <${stock.count}주>〔${
          (parseInt(stockdata.price.replace(/\,/g,""))-stock.price)*stock.count
        }원〕｛${stock.price*stock.count}원｝「${
          (((parseInt(stockdata.price.replace(/\,/g,""))-stock.price)*stock.count) / stock.price * 100).toFixed(2)
        }%」`;
        // embed.addField(`이름: **${stock.name}**`, `수량: **${stock.count}**\n구매가: **${stock.price.toLocaleString("ko-KR")}원**\n현재가: **${stockdata.price}원**`);
      }
    }
    return client.mkembed({
      title: `**${nickname}**님 보유자산`,
      description: `보유금액 : ${udb.money.toLocaleString("ko-KR")}원\n\n【시장】[종목] (현재가) <보유수량>〔손익〕｛투자금액｝「예상수익률」\n${text.length === 0 ? "\n없음" : text}`
    });
  }
}