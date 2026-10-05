import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function open(hash=''){await page.goto('http://localhost:4173/'+hash);if(await page.locator('#intro-skip').count())await page.locator('#intro-skip').click();await page.locator('#site-intro').waitFor({state:'detached'});}
try{
 await open();assert.equal(await page.locator('.arcade-card').count(),5);await page.screenshot({path:'tests/arcade-home.png',fullPage:true});
 await page.goto('http://localhost:4173/#profile');await page.locator('[data-character="2"]').click();await page.locator('[name="name"]').fill('Test Explorer');await page.locator('[name="age"]').selectOption('little');await page.locator('#profile-form button').click();assert.match(await page.locator('#profile-saved').textContent(),/saved/);
 await open('#profile');assert.equal(await page.locator('[data-character="2"]').getAttribute('aria-pressed'),'true');await page.screenshot({path:'tests/arcade-profile.png',fullPage:true});
 for(const id of ['ark-park','pharaoh-chase','galilee','plague-party','lost-sheep']){
  await page.goto('http://localhost:4173/#arcade/'+id);await page.locator('[data-mode="solo"]').click();await page.locator('#countdown').waitFor({state:'hidden',timeout:10000});await page.locator('#arcade-pause').click();let clock=await page.locator('#arcade-clock').textContent();await page.waitForTimeout(1100);assert.equal(await page.locator('#arcade-clock').textContent(),clock);await page.locator('#arcade-resume').click();
  if(id==='ark-park'||id==='galilee'){await page.locator('[data-action="catch"]').click();}else{await page.keyboard.down('d');await page.waitForTimeout(200);await page.keyboard.up('d');await page.keyboard.press('Space');}
  await page.screenshot({path:'tests/arcade-'+id+'.png'});console.log('PASS solo controls/pause',id);
  await page.goto('http://localhost:4173/#');await page.goto('http://localhost:4173/#arcade/'+id);await page.locator('[data-mode="duo"]').click();assert.equal(await page.locator('.controller').count(),2);await page.goto('http://localhost:4173/#');console.log('PASS 2P mount',id);
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:4173/#');await page.screenshot({path:'tests/arcade-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.goto('http://localhost:4173/#profile');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto('http://localhost:4173/#arcade/plague-party');await page.locator('[data-mode="duo"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'tests/arcade-mobile-game.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS mobile/no runtime errors');
}finally{await browser.close();}
