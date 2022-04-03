import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { GuildMember, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import searchstock from "../stock/searchstock";
import { getstock } from "../stock/getstock";
import { stocks } from "../stock/getstock";

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
  name = "매도";
  visible = true;
  description = "주식 매도";
  information = "주식 매도";
  aliases = [ "판매" ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = [{
    name: "매도 [주식이름] [수량]",
    des: "입력한 주식을 [수량] 만큼 매도"
  }];

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [
      client.mkembed({
        title: `\` \/ 명령어 사용불가 \``,
        description: `매도 명령어는 **${client.prefix}매도**로 사용가능합니다.`,
        footer: { text: `도움말: ${client.prefix}주식` },
        color: client.embedcolor
      })
    ] });
  }
  async msgrun(message: M, args: string[]) {
    if (args.length >= 2) return message.channel.send({ embeds: [ await this.sell(message.member as GuildMember, args.slice(0,-1).join(" ").trim(), parseInt(args[args.length-1])) ] });
    return message.channel.send({ embeds: [ this.help() ] });
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async sell(member: GuildMember, name: string, count: number): Promise<MessageEmbed> {
    if (name.replace(/ +/g,"").length === 0) return this.help();
    if (count === NaN) return client.mkembed({
      title: `\` 숫자를 입력해주세요. \``,
      description: `도움말: ${client.prefix}매도 도움말`,
      color: "DARK_RED"
    });
    const searchstockdata = await searchstock(name);
    if (!searchstockdata) return client.mkembed({
      title: `\` 주식을 찾을수 없음 \``,
      description: `**${name}** 이름의 주식을 찾을수 없습니다.`,
      color: "DARK_RED"
    });
    const getstockdata = await getstock(searchstockdata[0], searchstockdata[1].symbol);
    if (!getstockdata.price) return client.mkembed({
      title: `\` 주식정보 불러오는중 오류발생 \``,
      description: `다시시도해주세요.`,
      color: "DARK_RED"
    });
    const udb = await MDB.get.user(member);
    if (!udb) return client.mkembed({
      title: `\` 데이터베이스 오류 \``,
      description: `다시시도해주세요.`,
      color: "DARK_RED"
    });
    let dbstocks: stocks[] = JSON.parse(udb.stocks);
    if (udb.money < getstockdata.price*count) return client.mkembed({
      title: `\` 자금부족 \``,
      description: `필요자금 : ${getstockdata.price*count}\n보유자금 : ${udb.money}`,
      color: "DARK_RED"
    });
    if (dbstocks.find((stock) => stock.code === getstockdata.symbols)) {
      let allcount = 0;
      dbstocks.find((stock) => stock.code === getstockdata.symbols)!.data.map((data) => {
        allcount += data.count;
      });
      if (allcount < count) return client.mkembed({
        title: `\` 수량부족 \``,
        description: `${name}주식을 ${count}만큼 보유하고있지 않습니다.\n${name}주식 보유개수 : ${allcount}`,
        color: "DARK_RED"
      });
      let getdbstocks: stocks[] = [];
      let setcount = count;
      for (let i in dbstocks) {
        let stock = dbstocks[i];
        if (stock.code === getstockdata.symbols) {
          let getdata: { price: number, count: number }[] = [];
          for (let j in stock.data) {
            let data = stock.data[j];
            let dcount = data.count;
            data = {
              price: data.price,
              count: data.count - setcount
            };
            setcount = setcount - dcount;
            if (data.count > 0) {
              getdata.push(data);
            }
            if (setcount <= 0) break;
          }
          if (getdata.length > 0) {
            stock.data = getdata;
            getdbstocks.push(stock);
          }
          break;
        }
      }
      dbstocks = getdbstocks;
    } else {
      return client.mkembed({
        title: `\` 주식없음 \``,
        description: `${name}주식을 보유하고있지 않습니다.`,
        color: "DARK_RED"
      });
    }
    udb.stocks = JSON.stringify(dbstocks);
    udb.money = udb.money + (getstockdata.price*count);
    return await udb.save().catch((err) => {
      return client.mkembed({
        title: `\` 데이터베이스 저장 오류 \``,
        description: `다시시도해주세요.`,
        color: "DARK_RED"
      });
    }).then(() => {
      return client.mkembed({
        title: `\` ${searchstockdata[1].description} 주식 매도성공 \``,
        description: `
          개당가격 : ${getstockdata.price!}
          수량 : ${count}
          종금액 : ${getstockdata.price!*count}
          보유금액 : ${udb.money}
        `,
        footer: { text: `${client.prefix} 보유` }
      });
    });
  }
}