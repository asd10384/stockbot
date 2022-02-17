import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { GuildMember, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getstock, kosdaq, kospi, stockstype } from "../stock/getstock_kr";
import { setcooldown } from "../stock/cooldown";

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
  name = "매수";
  visible = true;
  description = "입력한 값이 들어간 주식을 수량만큼 매수합니다.";
  information = "입력한 값이 들어간 주식을 수량만큼 매수합니다.";
  aliases = [  ];
  metadata = <D>{
    name: this.name,
    description: this.description,
    options: [{
      type: "STRING",
      name: "주식",
      description: "[주식이름]/[수량]",
      required: true
    }]
  };
  msgmetadata?: { name: string; des: string; }[] = [{
    name: "매수 [주식이름] [수량]",
    des: "입력한 값이 들어간 주식을 수량만큼 매수합니다."
  }];

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    const args = interaction.options.getString("주식", true).split("/");
    return await interaction.editReply({ embeds: [ await this.purchase(interaction, args[0].trim(), args[1].trim()) ] });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: [ await this.purchase(message, args[0], args[1]) ] });
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async purchase(message: M | I, name: string | undefined, count: string | undefined): Promise<MessageEmbed> {
    if (!name || name.length === 0) return client.mkembed({
      title: `**주식이름을 입력해주세요.**`,
      footer: { text: "도움말: !주식 help" },
      color: "DARK_RED"
    });
    if (!count || count.length === 0) return client.mkembed({
      title: `**주식을 매수할 수량을 입력해주세요.**`,
      footer: { text: "도움말: !주식 help" },
      color: "DARK_RED"
    });
    if (!parseInt(count) || parseInt(count) <= 0) return client.mkembed({
      title: `**수량은 1이상 입력해주세요.**`,
      footer: { text: "도움말: !주식 help" },
      color: "DARK_RED"
    });
    var stockmarket: "코스피" | "코스닥" = "코스피";
    var getname: string[] = [];
    getname = kospi.name.filter((stname) => stname.replace(/ +/g,"") === name.replace(/ +/g,""));
    if (getname.length === 0) {
      stockmarket = "코스닥";
      getname = kosdaq.name.filter((stname) => stname.replace(/ +/g,"") === name.replace(/ +/g,""));
    }
    if (getname.length === 0) return client.mkembed({
      title: `\` ${name} 주식을 찾을수 없습니다. \``,
      color: "DARK_RED"
    });
    var stocks: stockstype[] = [];
    if (stockmarket === "코스피") stocks = kospi.stocks.filter((st) => st.stockName === getname[0]);
    if (stockmarket === "코스닥") stocks = kosdaq.stocks.filter((st) => st.stockName === getname[0])
    const stock = await getstock(stocks[0].reutersCode, false);
    if (!stock) return client.mkembed({
      title: `\` ${name} 주식을 찾을수 없습니다. \``,
      color: "DARK_RED"
    });
    const udb = await MDB.get.user(message.member as GuildMember);
    if (!udb) return client.mkembed({
      title: `\` 데이터베이스 오류발생 \``,
      description: "다시 시도해주세요.",
      color: "DARK_RED"
    });
    const stockprice = parseInt(stock.price.replace(/\,/g,"").trim());
    if (udb.money < parseInt(count)*stockprice) return client.mkembed({
      title: `\` 보유금액 부족 \``,
      description: `현재보유금액: ${udb.money}\n총매수액: ${(parseInt(count)*stockprice-udb.money).toLocaleString("ko-KR")}원 만큼 부족`,
      color: "DARK_RED"
    });
    udb.money = udb.money - (parseInt(count)*stockprice);
    const getcheck = udb.stocks.filter((val) => ((val.name === stock.name) && (val.price === stockprice)));
    if (getcheck.length > 0) {
      udb.stocks = udb.stocks.map((st) => (st.name === getcheck[0].name && st.price === stockprice) ? { code: st.code, name: st.name, price: st.price, count: st.count+parseInt(count) } : st);
    } else {
      udb.stocks.push({ code: stock.code, name: stock.name, price: stockprice, count: parseInt(count) });
    }
    return await udb.save().catch((err) => {
      return client.mkembed({
        title: `\` 데이터베이스 오류발생 \``,
        description: "다시 시도해주세요.",
        color: "DARK_RED"
      });
    }).then((val) => {
      setcooldown(`${message.member!.user.id}-${stock.code}`);
      return client.mkembed({
        title: `\` 매수완료 \``,
        description: `주식이름: ${stock.name}\n개당가격: ${stockprice.toLocaleString("ko-KR")}원\n매수수량: ${count}개\n총매수가격: ${(parseInt(count)*stockprice).toLocaleString("ko-KR")}원`,
        footer: { text: `!주식 보유` }
      });
    });
  }
}