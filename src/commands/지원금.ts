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
  name = "지원금";
  visible = true;
  description = "주식 지원금 (한번만가능)";
  information = "주식 지원금 (한번만가능)";
  aliases = [  ];
  metadata = <D>{
    name: this.name,
    description: this.description
  };
  msgmetadata?: { name: string; des: string; }[] = undefined;

  /** 실행되는 부분 */
  async slashrun(interaction: I) {
    return await interaction.editReply({ embeds: [ await this.givemoney(interaction) ] });
  }
  async msgrun(message: M, args: string[]) {
    return message.channel.send({ embeds: [ await this.givemoney(message) ] });
  }

  help(): MessageEmbed {
    return client.help(this.metadata.name, this.metadata, this.msgmetadata)!;
  }

  async givemoney(message: M | I): Promise<MessageEmbed> {
    const udb = await MDB.get.user(message.member as GuildMember);
    if (!udb) return client.mkembed({
      title: `유저정보를 찾을수 없습니다.`,
      description: "다시 시도해주세요.",
      color: "DARK_RED"
    });
    const nickname = (message.member as GuildMember).nickname ? (message.member as GuildMember).nickname : (message.member as GuildMember).user.username;
    if (udb.getmoney.check) return client.mkembed({
      title: `\` ${nickname}님은 이미 지원금을 받으셨습니다. \``,
      description: `지급일: ${udb.getmoney.time}`,
      color: "DARK_RED"
    });
    udb.getmoney.check = true;
    const date = new Date();
    udb.getmoney.time = `${
      date.getFullYear()
    }년 ${
      this.addzero(date.getMonth()+1)
    }월 ${
      this.addzero(date.getDate())
    }일  ${
      this.addzero(date.getHours())
    }시 ${
      this.addzero(date.getMinutes())
    }분 ${
      this.addzero(date.getSeconds())
    }초`;
    const smoney = 10000000;
    udb.money += smoney;
    return await udb.save().catch((err) => {
      return client.mkembed({
        title: `유저정보를 찾을수 없습니다.`,
        description: "다시 시도해주세요.",
        color: "DARK_RED"
      });
    }).then((val) => {
      return client.mkembed({
        title: `\` ${nickname}님 지원금 지급완료 \``,
        description: `금액: ${smoney.toLocaleString("ko-KR")}원\n지급일: ${udb.getmoney.time}`
      });
    })
  }

  addzero(num: number): string {
    return num < 10 ? "0"+num : ""+num;
  }
}