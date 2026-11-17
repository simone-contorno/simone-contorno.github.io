import puppeteer from '../.local/qa/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const browser = await puppeteer.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true});
try {
  const page=await browser.newPage();
  await page.setViewport({width:1200,height:630,deviceScaleFactor:1});
  const response=await page.goto('http://127.0.0.1:4173/_tools/social-card.html');
  if (!response.ok()) throw new Error('Social card source did not load');
  await page.screenshot({path:'assets/img/social-card.png'});
  console.log('Rendered assets/img/social-card.png (1200 × 630).');
} finally {await browser.close();}
