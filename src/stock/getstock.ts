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

export type market = "KRX" | "NASDAQ" | "NYSE";
export type money = "KRW" | "USD";

const stockwscode = {
  "NYSE": 61,
  "KRX": 62,
  "NASDAQ": 63
}

export async function getstock(market: market, symbols: string, selfcode?: number): Promise<{
  market: market;
  symbols: string;
  currency_code: money | undefined;
  price: number | undefined;
  krwprice: number | undefined;
  err: string | undefined;
  ch: number | undefined;
  chp: number | undefined;
  volume: number | undefined;
}> {
  if (selfcode && selfcode > stockwscode[market]+5) return {
    market: market,
    symbols: symbols,
    price: undefined,
    currency_code: undefined,
    krwprice: undefined,
    err: "불러오기 오류\n다시시도해주세요.\n(WS를 찾을수없음)",
    ch: undefined,
    chp: undefined,
    volume: undefined
  };
  const ws: WebSocket | undefined = await get_ws(market, symbols, selfcode).catch((err) => {
    if (client.debug) console.log(err);
    return undefined;
  });
  if (!ws) return {
    market: market,
    symbols: symbols,
    currency_code: undefined,
    price: undefined,
    krwprice: undefined,
    err: "불러오기 오류\n다시시도해주세요.\n(WS를 찾을수없음)",
    ch: undefined,
    chp: undefined,
    volume: undefined
  };
  const data: {
    err: "protocol_error" | undefined;
    currency_code: money | undefined;
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
    currency_code: undefined,
    price: undefined,
    krwprice: undefined,
    err: "불러오기 오류\n다시시도해주세요.\n(주식데이터 가져오기실패)",
    ch: undefined,
    chp: undefined,
    volume: undefined
  };
  if (data.err === "protocol_error") return await getstock(market, symbols, selfcode ? selfcode++ : stockwscode[market]+1);
  const krwprice = await getexrate(data.currency_code, data.price);
  return {
    market: market,
    symbols: symbols,
    currency_code: data.currency_code,
    price: data.price,
    krwprice: krwprice[0],
    err: krwprice[1],
    ch: data.ch,
    chp: data.chp,
    volume: data.volume
  };
}

export async function getstocks(list: { market: market; symbols: string; }[]): Promise<{
  market: market;
  symbols: string;
  currency_code: money | undefined;
  price: number | undefined;
  krwprice: number | undefined;
  ch: number | undefined;
  chp: number | undefined;
}[]> {
  let output: {
    market: market;
    symbols: string;
    currency_code: money | undefined;
    price: number | undefined;
    krwprice: number | undefined;
    err: string | undefined;
    ch: number | undefined;
    chp: number | undefined;
  }[] = [];
  let selfcode: number[] = [];
  for (let i=0; i<list.length; i++) {
    if (selfcode[0] === i && selfcode[1] && selfcode[1] > stockwscode[list[i].market]+5) {
      output.push({
        market: list[i].market,
        symbols: list[i].symbols,
        currency_code: undefined,
        price: undefined,
        krwprice: undefined,
        err: "불러오기 오류\n다시시도해주세요.\n(WS를 찾을수없음)",
        ch: undefined,
        chp: undefined
      });
      continue;
    }
    const ws: WebSocket | undefined = await get_ws(list[i].market, list[i].symbols, (selfcode[0] === i ? selfcode[1] : undefined)).catch((err) => {
      if (client.debug) console.log(err);
      return undefined;
    });
    if (!ws) {
      output.push({
        market: list[i].market,
        symbols: list[i].symbols,
        currency_code: undefined,
        price: undefined,
        krwprice: undefined,
        err: "불러오기 오류\n다시시도해주세요.\n(WS를 찾을수없음)",
        ch: undefined,
        chp: undefined
      });
      continue;
    }
    let data: {
      err: "protocol_error" | undefined;
      currency_code: money | undefined;
      price: number | undefined;
      ch: number | undefined;
      chp: number | undefined;
      volume: number | undefined;
    } | undefined = await get(ws).catch((err) => {
      if (client.debug) console.log(err);
      return undefined;
    });
    if (!data) {
      output.push({
        market: list[i].market,
        symbols: list[i].symbols,
        currency_code: undefined,
        price: undefined,
        krwprice: undefined,
        err: "불러오기 오류\n다시시도해주세요.\n(주식데이터 가져오기실패)",
        ch: undefined,
        chp: undefined
      });
      continue;
    }
    if (data.err === "protocol_error") {
      if (selfcode[0] === i) {
        selfcode[1] = selfcode[1]+1;
      } else {
        selfcode = [i, stockwscode[list[i].market]+1];
      }
      i--;
      continue;
    }
    const krwprice = await getexrate(data.currency_code, data.price);
    output.push({
      market: list[i].market,
      symbols: list[i].symbols,
      currency_code: data.currency_code,
      price: data.price,
      krwprice: krwprice[0],
      err: krwprice[1],
      ch: data.ch,
      chp: data.chp
    });
  }
  return output;
}

function get_ws(market: market, symbols: string, selfcode?: number): Promise<WebSocket> {
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
      let code = stockwscode[market];
      let random = randomString();
      ws.send(`~m~36~m~{"m":"set_data_quality","p":["low"]}`);
      ws.send(`~m~52~m~{"m":"quote_create_session","p":["qs_${random}"]}`);
      ws.send(`~m~${selfcode ? selfcode : code}~m~{"m":"quote_add_symbols","p":["qs_${random}","${market}:${symbols}"]}`);
      res(ws);
    }
    ws.onerror = function (err) {
      if (client.debug) console.log(err);
      rej(err);
    }
  });
}
function get(ws: WebSocket): Promise<{
  err: "protocol_error" | undefined;
  currency_code: money | undefined;
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
        if (text.length > 0) {
          const json = JSON.parse(text);
          if (json.m === "protocol_error") {
            res({
              err: "protocol_error",
              currency_code: undefined,
              price: undefined,
              ch: undefined,
              chp: undefined,
              volume: undefined
            });
            ws.close();
            break;
          }
          if (json.p && json.p[1] && json.p[1].v && !(json.p[1].v.ask || json.p[1].v.ask === 0)) {
            const stock = json.p[1].v;
            res({
              err: undefined,
              currency_code: stock?.currency_code,
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
      ws.close();
    }
  });
}