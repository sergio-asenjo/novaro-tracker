import { Bot } from './bot';
import { extractMapPosition, sanitizePrice } from './utils';
import { BDService } from './bd';
import * as puppeteer from 'puppeteer';
import cron = require('node-cron');
import 'dotenv/config';

const discord = new Bot();
const bdService = new BDService();

async function main() {
  const browser = await puppeteer.launch({
    executablePath: process.env.EXEC_PATH,
    userDataDir: process.env.USER_DIR,
  });
  const page = await browser.newPage();

  const data = await bdService.obtainTrackedItems();
  console.debug(data);

  if (data.length === 0) return;

  for await (const item of data) {
    const url = `https://www.novaragnarok.com/?module=vending&action=item&id=${item.id}`;
    await page.goto(url);

    const result = await page.evaluate(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const elements = document.getElementById("itemtable") as HTMLTableElement;
      const data = [];
      if (elements) {
        for (var i = 0, row; (row = elements.rows[i]); i++) {
          const values = row.innerText.split("\t");
          data.push(values);
        }
      }
      return data;
    });

    const itemName = (await page.mainFrame().title()).split(" - ")[0].trimEnd();
    if (item.itemName === undefined) {
      await bdService.updateTrackedItemName(item.id, item.uuid, itemName);
    }

    if (result.length === 0) continue;

    const pricePosition = result[0].indexOf("Price");
    const mapPosition = result[0].indexOf("Location");
    const currentLowerPrice = sanitizePrice(result[1][pricePosition]);
    const mapPos = extractMapPosition(result[1][mapPosition]);


    if (currentLowerPrice < item.wantedPrice) {
      discord.sendAlert(item.uuid, itemName, currentLowerPrice, item.id, mapPos);
    }
  }

  await browser.close();
}

cron.schedule('*/5 * * * *', main);