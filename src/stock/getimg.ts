import "dotenv/config";
import { client } from "../index";
import puppeteer from "puppeteer";
import { emptyDirSync } from "fs-extra";
import { MessageAttachment } from "discord.js";
import { randomString_notsame } from "./randomString";
import { market } from "./getstock";

export const img_path = process.env.IMAGE_URL ? process.env.IMAGE_URL.trim().endsWith("/") ? process.env.IMAGE_URL.trim().slice(0,-1) : process.env.IMAGE_URL.trim() : ""
export const random: Set<string> = new Set();

emptyDirSync(img_path);

export default async function getimg(market: market, symbols: string): Promise<[ string, MessageAttachment[], string | undefined ]> {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({
      width: 960,
      height: 540
    });
    await page.goto(`https://www.tradingview.com/chart?symbol=${market}%3A${symbols}`);
    await page.waitForTimeout(5000);
    await page.click(`div[data-name="header-toolbar-fullscreen"]`);
    await page.waitForTimeout(1250);
    await page.click(`div[data-role="toast-container"] button`).catch((err) => {});
    await page.waitForTimeout(1250);
    const rs = randomString_notsame();
    await page.screenshot({ path: `${img_path}/${rs}.jpg`, type: "jpeg" });
    await browser.close();
    const file = new MessageAttachment(`${img_path}/${rs}.jpg`);
    return [ `attachment://${rs}.jpg`, [ file ], `${rs}.jpg` ];
  } catch (err) {
    if (client.debug) console.log(err);
    return [ "", [], undefined ];
  }
}