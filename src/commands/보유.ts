import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { GuildMember, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getstocks, stocks } from "../stock/getstock";

/**
 * DB
 * let guildDB = await MDB.get.guild(interaction);
 * 
 * check permission(role)
 * if (!(await ckper(interaction))) return await interaction.editReply({ embeds: [ emper ] });
 * if (!(await ckper(message))) return message.channel.send({ embeds: [ emper ] }).then(m => client.msgdelete(m, 1));
 */

/** 예시 명령어 */
export default class ExampleCommand implements Command {
  /** 해당 명령어 설명 */
  name = "보유";
  visible = true;
  description = "보유 주식 확인";
  information = "보유 주식 확인";
  aliases = [];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [ await this.have(interaction.member as GuildMember) ] });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: [ await this.have(message.member as GuildMember) ] });
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async have(member: GuildMember): Promise<MessageEmbed> {
    const udb = await MDB.get.user(member);
    if (!udb) return client.mkembed({
      title: `\` 데이터베이스 오류 \``,
      description: `다시시도해주세요.`,
      color: "DARK_RED"
    });
    let dbstocks: stocks[] = JSON.parse(udb.stocks);
    let text = `보유금액 : ${udb.money}\n\n【시장】[종목] (현재가) <보유수량>〔손익〕｛투자금액｝「예상수익률」\n\n`;
    if (dbstocks.length > 0) {
      const getstocksdata = await getstocks(dbstocks.map((stock) => {
        return { market: stock.market, symbols: stock.code }
      }));
      text += dbstocks.map((stock, i) => {
        let allcount = 0;
        let allprice = 0;
        for (let data of stock.data) {
          allprice += data.price*data.count;
          allcount += data.count;
        }
        return `【${
          stock.market
        }】[${
          stock.name
        }] (${
          getstocksdata[i].price ? getstocksdata[i].price : "오류"
        }) <${
          allcount
        }>〔${
          getstocksdata[i].price ? (getstocksdata[i].price!*allcount)-allprice : "오류"
        }〕｛${
          allprice
        }｝「${
          getstocksdata[i].price ? (((getstocksdata[i].price!*allcount)-allprice)/allprice*100).toFixed(2) : "오류"
        }」`;
      }).join("\n");
    } else {
      text += `없음`;
    }
    return client.mkembed({
      title: `\` ${member.nickname ? member.nickname : member.user.username}님 보유자산 \``,
      description: text
    });
  }
}