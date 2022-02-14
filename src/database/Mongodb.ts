import { config } from "dotenv";
import { I, M } from "../aliases/discord.js";
import { connect } from "mongoose";
import { PartialMessage, SelectMenuInteraction, VoiceState, GuildMember } from "discord.js";
import { guild_type, guild_model } from "./obj/guild";
import { user_type, user_model } from "./obj/user";
config();

const mongodb_url = process.env.MONGODB_URL;
if (!mongodb_url) throw "mongodb url을 찾을수 없음";
connect(mongodb_url, (err) => {
  if (err) return console.error(err);
  console.log(`mongodb 연결 성공`);
});
const out = {
  module: {
    guild: guild_model,
    user: user_model
  },
  get: {
    guild: guild_get,
    user: user_get
  }
};

export default out;

async function guild_get(msg: M | I | VoiceState | PartialMessage | SelectMenuInteraction) {
  let guildDB: guild_type | null = await guild_model.findOne({ id: msg.guild?.id! });
  if (guildDB) {
    if (guildDB.name !== msg.guild!.name) {
      guildDB.name = msg.guild!.name;
      await guildDB.save().catch((err) => {});
    }
    return guildDB;
  } else {
    if (msg.guild?.id) {
      guildDB = await guild_model.findOne({ id: msg.guild.id });
      if (!guildDB) {
        await guild_model.findByIdAndDelete({ id: msg.guild.id });
        guildDB = new guild_model({});
      }
      guildDB.id = msg.guild.id;
      guildDB.name = msg.guild.name;
      await guildDB.save().catch((err) => {});
      return guildDB;
    } else {
      return console.error('guildID를 찾을수 없음');
    }
  }
}

async function user_get(member: GuildMember) {
  let userDB: user_type | null = await user_model.findOne({ id: member.user.id });
  if (userDB) {
    if (userDB.tag !== member.user.tag || userDB.nickname !== (member.nickname) ? member.nickname : member.user.username) {
      userDB.tag = member.user.tag;
      userDB.nickname = (member.nickname) ? member.nickname : member.user.username;
      await userDB.save().catch((err) => {});
    }
    return userDB;
  } else {
    if (member.user.id) {
      userDB = await user_model.findOne({ id: member.user.id });
      if (!userDB) {
        await user_model.findOneAndDelete({ id: member.user.id });
        userDB = new user_model({});
      }
      userDB.id = member.user.id;
      userDB.tag = member.user.tag;
      userDB.nickname = (member.nickname) ? member.nickname : member.user.username;
      await userDB.save().catch((err: any) => console.error(err));
      return userDB;
    } else {
      return console.error('userID를 찾을수 없음');
    }
  }
}