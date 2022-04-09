import "dotenv/config";
import { client } from "../index";
import { market } from "./getstock";
import axios from "axios";

const exchangeratesapikey = process.env.EXCHAGE_RATE_API_KEY ? process.env.EXCHAGE_RATE_API_KEY : "";

const resion = {
  "US": "USD",
  "KR": "KRW"
};

export default async function getexrate(market: market, money: number | undefined): Promise<[ number, undefined ] | [ undefined, string ]> {
  if (!money) return [ undefined, "돈을 입력하지 않음" ];
  if (market === "KRX") return [ money, undefined ];
  if (!exchangeratesapikey || exchangeratesapikey.length === 0) return [ undefined, "API키를 찾을수 없음" ];
  const val: { [key: string]: any, data?: any } = axios.get(`http://api.exchangeratesapi.io/v1/latest?access_key=${exchangeratesapikey}`, {
    responseType: "json",
    timeout: 3000
  }).catch((err) => {
    if (client.debug) console.log(err);
    return { data: undefined };
  });
  let data = val?.data?.rates;
  if (!data) return [ undefined, "오류발생" ];
  if (market === "NASDAQ") return [ Math.floor((data[resion.KR]/data[resion.US])*money), undefined ];
  return [ Math.floor((data[resion.KR]/data[resion.US])*money), undefined ];
}
