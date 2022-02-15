import { config } from "dotenv";
import axios from "axios";
import { MessageAttachment } from "discord.js";
import { readdir, unlink } from "fs";
import nhti from "node-html-to-image";
import getgetstock2 from "./getgetstock2";
config();

readdir(process.env.IMAGE_URL!, (err, files) => {
  if (err) console.error(err);
  files.forEach((file) => {
    unlink(process.env.IMAGE_URL!+"/"+file, (err) => {
      if (err) return;
    });
  });
});

export interface stockstype {
  stockEndType: string, //"stock"
  itemCode: string, //"005930"
  reutersCode: string, //"005930"
  stockName: string, //"삼성전자"
  sosok: string, //"0"
  closePrice: string, //"75,400"
  compareToPreviousClosePrice: string, //"700"
  compareToPreviousPrice: {
    code: string, //"2"
    text: string, //"상승"
    name: string //"RISING"
  },
  fluctuationsRatio: string, //"0.94"
  accumulatedTradingVolume: string, //"17,363,579"
  accumulatedTradingValue: string, //"1,308,679"
  accumulatedTradingValueKrwHangeul: string, //"1조 3,087억원"
  localTradedAt: string, //"2022-02-10T16:11:33+09:00"
  marketValue: string, //"4,501,216"
  marketValueHangeul: string, //"450조 1,216억원"
  nav: string, //"N/A"
  threeMonthEarningRate: string, //"N/A"
  marketStatus: string, //"CLOSE"
  tradeStopType: {
    code: string, //"1"
    text: string, //"운영.Trading"
    name: string //"TRADING"
  },
  stockExchangeType: {
    code: string, //"KS"
    zoneId: string, //"Asia/Seoul"
    nationType: string, //"KOR"
    delayTime: number, //0
    startTime: string, //"0900"
    endTime: string, //"1530"
    closePriceSendTime: string, //"1630"
    nameKor: string, //"코스피"
    nameEng: string, //"KOSPI"
    name: string //"KOSPI"
  }
};
interface stockdata {
  stockListSortType: string,
  stockListCategoryType: string,
  stocks: stockstype[],
  totalCount: number,
  page: number,
  pageSize: number
};

export var kospi: { name: string[], stocks: stockstype[] } = { name: [], stocks: [] };
export var kosdaq: { name: string[], stocks: stockstype[] } = { name: [], stocks: [] };

async function getstocks(name: "KOSPI" | "KOSDAQ"): Promise<{ err: undefined, stocks: stockstype[] } | { err: string, stocks: undefined }> {
  const totalcheck: { [key: string]: any, data?: stockdata } = await axios.get(`https://m.stock.naver.com/api/stocks/marketValue/${name}`, {
    params: {
      page: 1,
      pageSize: 1
    }
  }).catch((err) => {
    return { data: undefined };
  });
  if (!totalcheck.data) return { err: "오류발생", stocks: undefined };
  const totalcount = totalcheck.data.totalCount;
  const maxpage = Math.ceil(totalcount/40);
  var stocklist: stockstype[] = [];
  for (let i=0; i<maxpage; i++) {
    const getstocks: { [key: string]: any, data?: stockdata } = await axios.get(`https://m.stock.naver.com/api/stocks/marketValue/${name}`, {
      params: {
        page: i+1,
        pageSize: 40
      }
    }).catch((err) => {
      return { data: undefined };
    });
    if (!getstocks.data) continue;
    stocklist = stocklist.concat(getstocks.data.stocks);
  }
  return { err: undefined, stocks: stocklist };
}

export async function getstock(Code: string, checkimg: boolean): Promise<{
  code: string, //코드
  name: string, //이름
  price: string, //시가
  compareToPreviousClosePrice: string, //전일비
  marketValue: string, //시가총액
  fluctuationsRatio: string, //등락률
  accumulatedTradingVolume: number, //거래량
  image: string, //이미지
  files: MessageAttachment[]
} | undefined> {
  const getstock: { [key: string]: any, data?: any } = await axios.get(`https://m.stock.naver.com/api/stock/${Code}/integration`).catch((err) => {
    return { data: undefined };
  });
  if (!getstock || !getstock.data) return undefined;
  // https://m.stock.naver.com/domestic/stock/005930/total
  // https://m.stock.naver.com/api/stock/005930/integration
  const getstock2 = await getgetstock2(Code);
  if (!getstock2 || !getstock2.data || getstock2.data[0] === "<") return undefined;
  const getstock3: {
    [key: string]: any,
    data?: any
  } = await axios.get(`https://m.stock.naver.com/api/stock/${Code}/basic`).catch((err) => {
    return { data: undefined };
  });
  if (!getstock3 || !getstock3.data) return undefined;
  var img: any = undefined;
  if (checkimg) {
    img = await nhti({
      output: `${process.env.IMAGE_URL!}/A${Code}.png`,
      html: `<html><body>
    <div class="main">
      <img class="ff" src="{{url1}}" />
      <img class="ss" src="{{url2}}" />
    </div>
    <style>
      body {
        width: 700px;
        height: 594px;
      }
      .ff {
        margin-top: 5px;
      }
      .ss {
        margin-top: 5px;
      }
    </style>
  </body></html>`,
      content: {
        url1: getstock2.data.chartImageUrl.day,
        url2: `https://ssl.pstatic.net/imgfinance/chart/item/candle/day/${Code}.png`
      }
    }).catch((err) => {
      return undefined;
    });
  }
  if (img) {
    const file = new MessageAttachment(`${process.env.IMAGE_URL!}/A${Code}.png`);
    return {
      code: Code, //코드
      name: getstock.data.stockName, //이름
      price: (getstock2.data.tradePrice as number).toLocaleString("ko-KR"), //시가
      compareToPreviousClosePrice: frr(getstock2.data.change, (getstock2.data.changePrice as number).toLocaleString("ko-KR")), //전일비
      marketValue: numberToKorean(getstock2.data.marketCap), //시가총액
      fluctuationsRatio: fr(getstock2.data.change, getstock2.data.changeRate)+"%", //등락률
      accumulatedTradingVolume: getstock2.data.accTradeVolume, //거래량
      image: `https://ssl.pstatic.net/imgfinance/chart/item/candle/day/${Code}.png`, //이미지
      files: [ file ]
    };
  } else {
    return {
      code: Code, //코드
      name: getstock.data.stockName, //이름
      price: (getstock2.data.tradePrice as number).toLocaleString("ko-KR"), //시가
      compareToPreviousClosePrice: frr(getstock2.data.change, (getstock2.data.changePrice as number).toLocaleString("ko-KR")), //전일비
      marketValue: numberToKorean(getstock2.data.marketCap), //시가총액
      fluctuationsRatio: fr(getstock2.data.change, getstock2.data.changeRate)+"%", //등락률
      accumulatedTradingVolume: getstock2.data.accTradeVolume, //거래량
      image: `https://ssl.pstatic.net/imgfinance/chart/item/candle/day/${Code}.png`, //이미지
      files: []
    };
  }
}

export async function getnames(name: string): Promise<any[]> {
  const getname = await axios.get(`https://finance.daum.net/api/search/quotes`, {
    params: {
      q: name
    },
    headers: {
      "referer": `https://finance.daum.net/domestic/search?q=${encodeURI(name)}`,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36"
    }
  }).catch((err) => {
    return undefined;
  });
  if (!getname || !getname.data || getname.data[0] === "<") return [];
  return getname.data.quotes;
}

function numberToKorean(number: number): string {
  const unitWords = ['', '만', '억', '조', '경'];
  const splitUnit = 10000;
  var resultArray = [];
  var resultString = '';
  for (let i=0; i < unitWords.length; i++) {
    var unitResult = (number % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
    unitResult = Math.floor(unitResult);
    if (unitResult > 0) resultArray[i] = unitResult;
  }
  for (let i=0; i < resultArray.length; i++) {
    if(!resultArray[i]) continue;
    resultString = "" + resultArray[i] + unitWords[i] + resultString;
  }
  const check = resultString.split("만");
  if (check.length > 1) return check[0]+"만";
  return check[0];
}
function fr(updown: string, num: number): string {
  const number = (num * 100).toFixed(2);
  if (updown === "FALL") return "-"+number;
  return "+"+number;
}
function frr(updown: string, num: string): string {
  if (updown === "FALL") return "-"+num;
  return "+"+num;
}
export async function setkospi(): Promise<boolean> {
  const get = await getstocks("KOSPI");
  if (!get.stocks) return false;
  kospi.name = get.stocks.map((stock) => stock.stockName);
  kospi.stocks = get.stocks;
  return true;
}
export async function setkosdaq(): Promise<boolean> {
  const get = await getstocks("KOSDAQ");
  if (!get.stocks) return false;
  kosdaq.name = get.stocks.map((stock) => stock.stockName);
  kosdaq.stocks = get.stocks;
  return true;
}


console.log("주식: 주식정보 불러오기");
setkospi().catch((err) => {
  return console.log("주식: 코스피 정보 불러오던중 오류발생");
}).then((val) => {
  if (val) return console.log("주식: 코스피 정보 불러오기 성공");
  return console.log("주식: 코스피 정보 불러오기 실패");
});
setkosdaq().catch((err) => {
  return console.log("주식: 코스닥 정보 불러오던중 오류발생");
}).then((val) => {
  if (val) return console.log("주식: 코스닥 정보 불러오기 성공");
  return console.log("주식: 코스닥 정보 불러오기 실패");
});
setInterval(() => {
  setkospi().catch((err) => {
    return console.log("주식: 코스피 정보 불러오던중 오류발생");
  }).then((val) => {
    if (val) return console.log("주식: 코스피 정보 불러오기 성공");
    return console.log("주식: 코스피 정보 불러오기 실패");
  });
  setkosdaq().catch((err) => {
    return console.log("주식: 코스닥 정보 불러오던중 오류발생");
  }).then((val) => {
    if (val) return console.log("주식: 코스닥 정보 불러오기 성공");
    return console.log("주식: 코스닥 정보 불러오기 실패");
  });
}, 1000*60*60*2);
