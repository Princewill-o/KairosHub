// Welcome flow on a phone: an under-16 is sent to a grown-up, a parent sets up a child with
// matching emails, the child plays KairosGames Kids, and an 18+ player gets KairosGames.
// Run `npm run dev` first, then: node tests/welcome-browser.mjs
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.KAIROS_URL||'http://localhost:4173/';
const setAge=async n=>{await page.locator('#age-bar').focus();await page.keyboard.press('Home');for(let i=4;i<n;i++)await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#age-bar').getAttribute('aria-valuenow'),String(n));await page.locator('#age-next').click();};
try{
 await page.goto(base+'#bible');
 if(await page.locator('#intro-skip').count())await page.locator('#intro-skip').click();
 await page.locator('.wl-choices').waitFor();assert.equal(new URL(page.url()).hash,'#welcome','no player means the welcome page');
 await page.locator('[data-act=self]').click();await setAge(12);
 assert.match(await page.locator('h1').textContent(),/grown-up/);
 await page.locator('[data-act=here]').click();await setAge(40);
 await page.fill('#name','Kofi');await page.fill('#email','kofi@example.com');await page.fill('#emailConfirm','kofi@example.org');await page.locator('.wl-check input').check();await page.locator('form .wl-btn').click();
 assert.match(await page.locator('.wl-error').textContent(),/match/);
 await page.fill('#emailConfirm','kofi@example.com');await page.locator('form .wl-btn').click();
 assert.equal(await page.locator('#age-bar').getAttribute('aria-valuenow'),'12','the child’s age carries over');await page.locator('#age-next').click();
 await page.fill('#name','Ama');await page.locator('form .wl-btn').click();await page.locator('[data-char=ama]').click();await page.locator('[data-act=create]').click();
 await page.locator('[data-act=start]').click();await page.locator('.kg-tutorial').waitFor();for(let step=0;step<4;step++)await page.locator('#tutorial-next').click();await page.locator('.bible-library').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.audience),'kids');assert.match(await page.locator('.brand').textContent(),/KairosGames\s*Kids/);
 await page.goto(base+'#journey');await page.locator('#switch-player').click();
 const q=await page.locator('.wl-gate p').first().textContent();const [a,b]=q.match(/(\d+) × (\d+)/).slice(1).map(Number);
 await page.fill('#gate-answer','0');await page.locator('.wl-gate [value=check]').click();assert.equal(await page.locator('.wl-gate .wl-error').isVisible(),true,'wrong answers stay on the child profile');
 await page.fill('#gate-answer',String(a*b));await page.locator('.wl-gate [value=check]').click();await page.locator('.wl-profiles').waitFor();
 await page.locator('[data-act=self]').click();await setAge(25);
 await page.fill('#name','Sam');await page.fill('#email','sam@example.com');await page.fill('#emailConfirm','sam@example.com');await page.locator('.wl-check input').check();await page.locator('form .wl-btn').click();
 assert.ok(await page.locator('.wl-char .kai-adult').count()>0,'18+ players choose from older characters');
 await page.locator('[data-act=create]').click();await page.locator('.kg-tutorial').waitFor();for(let step=0;step<4;step++)await page.locator('#tutorial-next').click();await page.locator('.bible-library').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.audience),'adult');assert.doesNotMatch(await page.locator('.brand').textContent(),/Kids/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);
 console.log('Welcome flow: guardian gate, matching emails, Kids and 18+ platforms all work on a phone.');
}finally{await browser.close();}
