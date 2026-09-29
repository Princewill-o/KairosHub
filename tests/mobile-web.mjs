const {webkit,chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
const browser=process.env.MOBILE_BROWSER==='chrome'?await chromium.launch({channel:'chrome'}):await webkit.launch(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{});
const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:4173/');
 if(await page.locator('#intro-skip').count())await page.locator('#intro-skip').tap();
 await page.locator('.mobile-tabs').waitFor();
 assert.equal(await page.getByRole('link',{name:/Unity/}).count(),0);
 for(const id of ['ark-park','pharaoh-chase','galilee','plague-party','lost-sheep']){
  await page.goto('http://localhost:4173/#arcade/'+id);await page.locator('[data-mode="solo"]').tap();
  await page.locator('#countdown').waitFor({state:'hidden'});
  await page.locator('#arcade-pause').tap();const time=await page.locator('#arcade-clock').textContent();
  await page.locator('.theme-toggle').tap();assert.equal(await page.locator('#arcade-clock').textContent(),time);
  assert.equal(await page.locator('#arcade-paused').isVisible(),true);await page.locator('#arcade-resume').tap();
  await page.locator('[data-action]').first().tap();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' overflow');
  console.log('PASS iPhone '+(process.env.MOBILE_BROWSER||'WebKit')+' play/pause/theme/touch',id);
 }
 for(const size of [{width:375,height:667},{width:844,height:390},{width:820,height:1180}]){
  await page.setViewportSize(size);await page.goto('http://localhost:4173/#');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home overflow '+size.width);
  await page.goto('http://localhost:4173/#profile');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'profile overflow');
 }
 await page.goto('http://localhost:4173/#unity/ark-park');await page.locator('[data-mode="solo"]').waitFor();
 assert.deepEqual(errors,[]);
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:4173/#');await page.screenshot({path:'/tmp/kairos-iphone.png',fullPage:true});
 console.log('PASS mobile sizes, legacy links, no runtime errors');
}finally{await browser.close();}
