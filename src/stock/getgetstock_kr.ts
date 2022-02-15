import axios from "axios";

export default async function getgetstock2(code: string): Promise<any> {
  const getstock = await axios.get(`http://finance.daum.net/api/quotes/A${code}`, {
    // params: {
    //   summary: false,
    //   changeStatistics: true
    // },
    headers: {
      "referer": `http://finance.daum.net/quotes/A${code}`,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.82 Safari/537.36"
    }
  }).catch((err) => {
    return { data: undefined };
  });
  return getstock;
}