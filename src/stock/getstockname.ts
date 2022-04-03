import "dotenv/config";
import { client } from "../index";
import axios from "axios";
import { MessageEmbed } from "discord.js";
import { market } from "./getstock";

export interface stocknametypes {
  country: string; // KR
  currency_code: string; // KRW
  description: string; // 삼성전자보통주
  exchange: market; // KRX
  logoid: string; // samsung
  provider_id: string; // ice
  symbol: string; // 005930
  type: string; // stock
};

export async function getstocknamelist(text: string, type: "stock", exchange: market): Promise<stocknametypes[] | undefined> {
  const get: {
    [key: string]: any;
    data: stocknametypes[] | undefined;
  } = await axios.get(`https://symbol-search.tradingview.com/symbol_search?text=${encodeURI(text)}&hl=1&exchange=${exchange}&lang=ko&type=${type}&domain=production`, {
    responseType: "json",
    timeout: 3500
  }).catch((err) => {
    return { data: undefined };
  });
  return get.data?.map((data) => {
    return {
      country: data.country,
      currency_code: data.currency_code,
      description: data.description.replace(/\<\/?em\>/g,""),
      exchange: data.exchange,
      logoid: data.logoid,
      provider_id: data.provider_id,
      symbol: data.symbol,
      type: data.type
    };
  });
}

export async function getstockname(text: string, type: "stock", exchange: market): Promise<MessageEmbed> {
  const getlist = await getstocknamelist(text, type, exchange);
  if (!getlist || getlist.length === 0) return client.mkembed({
    title: `\` 이름검색: ${text} \``,
    description: `검색결과없음`
  });
  var overcount = 0;
  var text2 = "";
  const list = getlist.map((data) => {
    data.description = data.description.trim().endsWith("보통주") ? data.description.replace("보통주", "") : data.description;
    return data;
  });
  for (let i in list) {
    let input = `${list[i].description}\n`;
    if ((text2.length+input.length) >= 1900) {
      overcount++;
    } else {
      text2+=input;
    }
  }
  return client.mkembed({
    title: `\` 이름검색: ${text} \``,
    description: `${text2.length === 0 ? "검색결과없음" : text2}\n${overcount === 0 ? "" : `+ ${overcount}개`}`
  });
}