import { client } from "../index";
import { check_permission as ckper, embed_permission as emper } from "../function/permission";
import { Command } from "../interfaces/Command";
import { I, D, M, B, S } from "../aliases/discord.js.js";
import { GuildMember, MessageAttachment, MessageEmbed } from "discord.js";
import MDB from "../database/Mongodb";
import { getstocknamelist, stocknametypes } from "../stock/getstockname";
import { getstock, market } from "../stock/getstock";
import { unlink } from "fs";
import getimg, { img_path, random } from "../stock/getimg";
import searchstock from "../stock/searchstock";

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
  description = "주식의 정보를 알려줍니다.";
  information = "주식의 정보를 알려줍니다.";
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
    const searchstockdata = await searchstock(name);
    if (!searchstockdata) return { embeds: [ client.mkembed({
      title: `\` 주식을 찾을수 없음 \``,
      description: `**${name}** 이름의 주식을 찾을수 없습니다.`,
      color: "DARK_RED"
    })], files: [] };
    return await this.get(message, searchstockdata[1], searchstockdata[0]);
  }

  async get(message: M | I, getlist: stocknametypes, market: market): Promise<{embeds: MessageEmbed[], files: MessageAttachment[]}> {
    const nickname = message.member ? (message.member as GuildMember).nickname ? (message.member as GuildMember).nickname : message.member.user.username : undefined;
    const msg = await message.channel?.send({ embeds: [ client.mkembed({
      title: `\` ${getlist.description} \` 주식 불러오는중...`,
      description: `약 10~20초 소요됨`,
      footer: { text: `${nickname} 님이 요청` }
    }) ], files: [] });
    const stock = await getstock(market, getlist.symbol);
    if (!stock.price || !stock.krwprice) {
      msg?.delete().catch((err) => {});
      return { embeds: [
        client.mkembed({
          title: `\` ${getlist.description} \``,
          description: `불러오기 오류\n다시시도해주세요.`,
          footer: { text: market },
          color: "DARK_RED"
        })
      ], files: [] };
    }
    const img = await getimg(getlist.exchange, getlist.symbol);
    const embed = client.mkembed({
      title: `\` ${getlist.description} \``,
      image: img[0],
      footer: { text: market }
    });
    embed.addFields([
      {
        name: `**현재가(KRW)**`,
        value: stock.krwprice.toLocaleString("ko-kr"),
        inline: true
      },
      {
        name: `**전일비**`,
        value: stock.ch!.toLocaleString("ko-kr"),
        inline: true
      },
      {
        name: `**등락률**`,
        value: stock.chp!.toLocaleString("ko-kr")+"%",
        inline: true
      },
      {
        name: `**거래량**`,
        value: stock.volume!.toLocaleString("ko-kr"),
        inline: true
      }
    ]);
    msg?.delete().catch((err) => {});
    setTimeout(() => {
      if (img[2]) {
        if (random.has(img[2])) {
          unlink(`${img_path}/${img[2]}`, (err) => {
            if (err) return;
            random.delete(img[2]!);
          });
        }
      }
    }, 1000*10);
    return { embeds: [ embed ], files: img[1] };
  }
}