import puppeteer, { type VanillaPuppeteer } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { JSDOM } from 'jsdom';

let browser: Awaited<ReturnType<VanillaPuppeteer["launch"]>>;

(async () => {
  puppeteer.use(StealthPlugin());
  browser = await puppeteer.launch({
    args: [`--proxy-server=${process.env.GLOBAL_AGENT_HTTP_PROXY}`],
  });
})();

export const getDocument = async (url: string) => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', onReq);
  await page.goto(url, {
    waitUntil: 'domcontentloaded'
  });

  const resultElement = (await page.content()).toString();
  page.off("request", onReq);
  page.close();
  return new JSDOM(resultElement)?.window?.document;
};

const onReq = (request: any) => {
  const resourceType = request.resourceType();
  if (resourceType === "document") {
    request.continue();
  } else {
    request.abort();
  }
};