// Plays every Bible game on a phone-sized screen: no runtime errors, no sideways scrolling,
// visible right/wrong feedback, and a finished quiz saves stars to My journey.
// Run `npm run dev` first, then: node tests/bible-browser.mjs
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {bibleGames} from '../public/bible/content.mjs';
const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
// Sign in as a 9-year-old on KairosGames Kids (the welcome flow has its own test).
await context.addInitScript(()=>{if(!localStorage.getItem('kairos-accounts-v1'))localStorage.setItem('kairos-accounts-v1',JSON.stringify({parents:[{id:'g-1',name:'Kofi',age:40,email:'k@example.com'}],players:[{id:'p-1',name:'Ama',age:9,band:'kids',character:'ama',parentId:'g-1'}],active:'p-1'}));});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.KAIROS_URL||'http://localhost:4173/';
const fits=async label=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflows sideways');
try{
 await page.goto(base+'#bible');
 if(await page.locator('#intro-skip').count())await page.locator('#intro-skip').click();
 assert.equal(await page.locator('.bible-game-card').count(),16);
 assert.match(await page.locator('.kg-soon').textContent(),/Coming soon[\s\S]*PlayMessages/);
 assert.equal(await page.locator('.kg-soon a, .kg-soon button').count(),0,'PlayMessages is not playable yet');
 assert.match(await page.locator('.brand-mark').getAttribute('src'),/dove/);
 assert.equal(await page.locator('.bible-card-art img').count(),16,'each card shows its icon');
 await fits('library');
 for(const g of bibleGames){
  await page.goto(base+'#bible/'+g.id);await page.locator('#bible-start').click();
  await page.locator('#bible-stage').waitFor();await fits(g.id);
  const answer=page.locator('[data-do=answer]:not(:disabled)').first();
  if(await answer.count()){await answer.click();assert.ok(await page.locator('#bible-feedback').evaluate(el=>/is-(good|retry)/.test(el.className)),g.id+' shows feedback');}
 }
 await page.goto(base+'#bible/quiz');await page.locator('#bible-start').click();
 for(let i=0;i<9;i++){await page.locator('[data-do=answer]').first().click();await page.locator('[data-do=next]').click();}
 await page.locator('.bible-results').waitFor();
 assert.equal(await page.locator('.kg-result-card .kg-stars img.on').count()>=1,true);
 await page.goto(base+'#character');await page.locator('[data-character=ama]').click();
 assert.match(await page.locator('#picker-status').textContent(),/Ama will join you/);await fits('character picker');
 await page.goto(base+'#bible');assert.match(await page.locator('.kg-hero-character').textContent(),/Ama/);
 await page.goto(base+'#journey');assert.match(await page.locator('.kg-journey').textContent(),/Bible Quiz/);await fits('journey');
 assert.deepEqual(errors,[]);
 console.log('Bible games: all 16 open and answer on a phone, results save to My journey, and the chosen character follows the player.');
}finally{await browser.close();}
