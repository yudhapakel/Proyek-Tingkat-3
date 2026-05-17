const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://html.duckduckgo.com/html/?q=Polemik+Belum+Tuntas%2C+Dinas+Perikanan+Tanjab+Timur+Tancap+Gas+Anggarkan+Lagi+Kapal+10+GT+Rp+1%2C7+Miliar!');
  let url1 = await page.$eval('.result__url', el => el.href).catch(() => 'Not found');
  console.log('1:', url1);

  await page.goto('https://html.duckduckgo.com/html/?q=Korporasi+Perikanan+Pelaku+Illegal+Fishing+Nyaris+tak+Tersentuh+Proses+Hukum%2C+Mengapa%3F');
  let url2 = await page.$eval('.result__url', el => el.href).catch(() => 'Not found');
  console.log('2:', url2);

  await browser.close();
})();
