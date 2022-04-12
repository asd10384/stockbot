import "dotenv/config";
import { client } from "../index";
import { market, money } from "./getstock";
import axios from "axios";

// https://api.exchangeratesapi.io/v1/symbols?access_key=KEY

const exchangeratesapikey = process.env.EXCHAGE_RATE_API_KEY ? process.env.EXCHAGE_RATE_API_KEY : "";

const resion = {
  "US": "USD",
  "KR": "KRW"
};

export default async function getexrate(currency_code: money | undefined, money: number | undefined): Promise<[ number, undefined ] | [ undefined, string ]> {
  if (!money) return [ undefined, "돈을 입력하지 않음" ];
  if (currency_code === "KRW") return [ money, undefined ];
  if (!exchangeratesapikey || exchangeratesapikey.length === 0) return [ undefined, "API키를 찾을수 없음" ];
  const val: { [key: string]: any, data?: any } = await axios.get(`http://api.exchangeratesapi.io/v1/latest?access_key=${exchangeratesapikey}`, {
    responseType: "json",
    timeout: 3000
  }).catch((err) => {
    if (client.debug) console.log(err);
    return { data: undefined };
  });
  let data = val?.data?.rates;
  if (!data) return [ undefined, "오류발생" ];
  if (currency_code === "USD") return [ Math.floor((data[resion.KR]/data[resion.US])*money), undefined ];
  return [ money, undefined ];
}
