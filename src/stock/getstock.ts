import "dotenv/config";
import { client } from "../index";
import WebSocket from "ws";
import getexrate from "./getexrate";
import randomString from "./randomString";

export interface stocks {
  market: market;
  code: string;
  name: string;
  data: {
    price: number;
    count: number;
  }[];
};

export type market = "KRX" | "NASDAQ";

export async function getstock(market: market, symbols: string): Promise<{
  market: market;
  symbols: string;
  price: number | undefined;
  krwprice: number | undefined;
  ch: number | undefined;
  chp: number | undefined;
  volume: number | undefined;
}> {
  const ws: WebSocket | undefined = await get_ws(market, symbols).catch((err) => {
    if (client.debug) console.log(err);
    return undefined;
  });
  if (!ws) return {
    market: market,
    symbols: symbols,
    price: undefined,
    krwprice: undefined,
    ch: undefined,
    chp: undefined,
    volume: undefined
  };
  const data: {
    price: number | undefined;
    ch: number | undefined;
    chp: number | undefined;
    volume: number | undefined;
  } | undefined = await get(ws).catch((err) => {
    if (client.debug) console.log(err);
    return undefined;
  });
  if (!data) return {
    market: market,
    symbols: symbols,
    price: undefined,
    krwprice: undefined,
    ch: undefined,
    chp: undefined,
    volume: undefined
  };
  return {
    market: market,
    symbols: symbols,
    price: data.price,
    krwprice: (await getexrate(market, data.price))[0],
    ch: data.ch,
    chp: data.chp,
    volume: data.volume
  };
}

export async function getstocks(list: { market: market; symbols: string; }[]): Promise<{
  market: market;
  symbols: string;
  price: number | undefined;
  krwprice: number | undefined;
  ch: number | undefined;
  chp: number | undefined;
}[]> {
  let output: {
    market: market;
    symbols: string;
    price: number | undefined;
    krwprice: number | undefined;
    ch: number | undefined;
    chp: number | undefined;
  }[] = [];
  for (let i in list) {
    const ws: WebSocket | undefined = await get_ws(list[i].market, list[i].symbols).catch((err) => {
      if (client.debug) console.log(err);
      return undefined;
    });
    if (!ws) {
      output.push({
        market: list[i].market,
        symbols: list[i].symbols,
        price: undefined,
        krwprice: undefined,
        ch: undefined,
        chp: undefined
      });
      continue;
    }
    const data: {
      price: number | undefined;
      ch: number | undefined;
      chp: number | undefined;
    } | undefined = await get(ws).catch((err) => {
      if (client.debug) console.log(err);
      return undefined;
    });
    if (!data) {
      output.push({
        market: list[i].market,
        symbols: list[i].symbols,
        price: undefined,
        krwprice: undefined,
        ch: undefined,
        chp: undefined
      });
      continue;
    }
    output.push({
      market: list[i].market,
      symbols: list[i].symbols,
      price: data.price,
      krwprice: (await getexrate(list[i].market, data.price))[0],
      ch: data.ch,
      chp: data.chp
    });
  }
  return output;
}

function get_ws(market: market, symbols: string): Promise<WebSocket> {
  return new Promise(function (res, rej) {
    const ws = new WebSocket(`wss://data.tradingview.com/socket.io/websocket?from=symbols%2F${market}-${symbols}`, {
      headers: {
        "Accept-Language": "ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,zh;q=0.6,zh-CN;q=0.5,zh-TW;q=0.4,zh-HK;q=0.3",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36",
        "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        "Sec-WebSocket-Version": "13"
      },
      host: "data.tradingview.com",
      origin: "https://kr.tradingview.com"
    });
    ws.onopen = function () {
      let code = market === "KRX" ? 62 : 63;
      let random = randomString();
      ws.send(`~m~36~m~{"m":"set_data_quality","p":["low"]}`);
      ws.send(`~m~52~m~{"m":"quote_create_session","p":["qs_${random}"]}`);
      ws.send(`~m~${code}~m~{"m":"quote_add_symbols","p":["qs_${random}","${market}:${symbols}"]}`);
      res(ws);
    }
    ws.onerror = function (err) {
      if (client.debug) console.log(err);
      rej(err);
    }
  });
}
function get(ws: WebSocket): Promise<{
  price: number | undefined;
  ch: number | undefined;
  chp: number | undefined;
  volume: number | undefined;
} | undefined> {
  return new Promise(function (res, rej) {
    ws.onmessage = function (e) {
      if (!e.data.toString().includes("{")) ws.send(e.data);
      let list = e.data.toString().replace(/\~m\~.{1,6}\~m\~/g, "@A@A@").replace(/\~/g,"").split("@A@A@");
      for (let i in list) {
        let text = list[i];
        // if (market === "NASDAQ") continue;
        if (text.length > 0) {
          const json = JSON.parse(text);
          if (json.p && json.p[1] && json.p[1].v && !json.p[1].v.ask) {
            const stock = json.p[1].v;
            res({
              price: stock?.lp,
              ch: stock?.ch,
              chp: stock?.chp,
              volume: stock?.volume
            });
            ws.close();
            break;
          }
        }
      }
    }
    ws.onerror = function (err) {
      rej(err);
    }
  });
}