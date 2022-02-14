import { client, handler } from '..';
import { Message } from 'discord.js';

export default async function onMessageCreate (message: Message) {
  if (message.author.bot || message.channel.type === 'DM') return;
  if (message.content.startsWith(client.prefix)) {
    const content = message.content.slice(client.prefix.length).trim();
    const args = content.split(/ +/g);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName || commandName.length === 0) {
      const gethelp = handler.commands.get("help");
      if (gethelp && gethelp.msgrun) gethelp.msgrun(message, []);
      return client.msgdelete(message, 0);
    }
    const command = handler.commands.get(commandName!) || handler.commands.find((cmd) => cmd.aliases.includes(commandName!));
    try {
      if (!command || !command.msgrun) return err(message, commandName);
      return command.msgrun(message, args);
    } catch(error) {
      if (client.debug) console.log(error); // 오류확인
      err(message, commandName);
    } finally {
      client.msgdelete(message, 0);
    }
  } else {
    // example
    // MDB.get.guild(message).then((guildID) => {
    //   if (guildID!.channelId === message.channelId) {
    // 
    //   }
    // });
  }
}

function err(message: Message, commandName: string | undefined | null): any {
  if (!commandName || commandName == '') return;
  return message.channel.send({ embeds: [
    client.mkembed({
      description: `\` ${commandName} \` 이라는 명령어를 찾을수 없습니다.`,
      footer: { text: ` ${client.prefix}help 를 입력해 명령어를 확인해주세요.` },
      color: "DARK_RED"
    })
  ] }).then(m => client.msgdelete(m, 1));
}