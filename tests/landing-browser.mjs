import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page = await browser.newPage({serviceWorkers:'block'});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://localhost:4173/');
 if(await page.locator('#intro-skip').count()) await page.locator('#intro-skip').click();
 await page.locator('#site-intro').waitFor({state:'detached'});
 await page.locator('.landing-page').waitFor({timeout:5000});
 assert.equal(await page.locator('.lp-game').count(),0);
 assert.equal(await page.locator('video').count(),0);
 assert.equal(await page.locator('.lp-preview img').count(),3);
 assert.equal(await page.locator('.lp-church').first().getAttribute('href'),'https://kharis.org');
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`/tmp/kairos-landing-${width}.png`,fullPage:true});
 }
 await page.locator('.lp-actions .lp-start').click();
 await page.locator('.wl-choices').waitFor();
 assert.deepEqual(errors,[]);
 console.log('Landing: screenshot gallery, no game cards or video, church link, desktop/mobile layout and player setup passed.');
} finally {await browser.close();}
