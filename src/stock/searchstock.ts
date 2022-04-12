import { market } from "./getstock";
import { getstocknamelist, stocknametypes } from "./getstockname";

export default async function searchstock(name: string): Promise<[ market, stocknametypes ] | undefined> {
  let getlist = await getstocknamelist(name, "stock", "KRX");
  if (getlist && getlist[0]?.description?.replace(/ +/g,"").toLowerCase() === name.replace(/ +/g,"").toLowerCase()) {
    return [ "KRX", getlist[0] ];
  }

  getlist = await getstocknamelist(name, "stock", "NASDAQ");
  if (getlist && getlist[0]?.description?.replace(/ +/g,"").toLowerCase() === name.replace(/ +/g,"").toLowerCase()) {
    return [ "NASDAQ", getlist[0] ];
  }

  getlist = await getstocknamelist(name, "stock", "NYSE");
  if (getlist && getlist[0]?.description?.replace(/ +/g,"").toLowerCase() === name.replace(/ +/g,"").toLowerCase()) {
    return [ "NYSE", getlist[0] ];
  }
  
  return undefined;
}