import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {validateExport} from '../scripts/unity-build.mjs';

// This test requires a real local export; no routes or Unity messages are mocked.
await validateExport(fileURLToPath(new URL('../unity-build/',import.meta.url)));
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:1000},serviceWorkers:'block'});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(/(?:NullReferenceException|InvalidOperationException|TypeLoadException|EntryPointNotFoundException)/.test(m.text()))errors.push(m.text());});
try {
 for(const id of ['ark-park','pharaoh-chase','galilee','plague-party','lost-sheep']) {
  await page.goto('http://localhost:4173/#unity/'+id);
  if(await page.locator('#intro-skip').count())await page.locator('#intro-skip').click();
  await page.locator('#unity-status').filter({hasText:'Unity game ready'}).waitFor({timeout:120000});
  // Engine initialization precedes the built-in splash finishing.
  await page.waitForTimeout(6000);
  const frame=await (await page.locator('iframe').elementHandle()).contentFrame();
  const canvas=frame.locator('canvas');
  await canvas.click();
  const bounds=await canvas.boundingBox();const scale=Math.min(bounds.width/900,bounds.height/700);
  const click=async(x,y)=>page.mouse.click(bounds.x+(bounds.width-900*scale)/2+x*scale,bounds.y+(bounds.height-700*scale)/2+y*scale,{delay:120});
  // Startup can lose focus while the iframe loads, which deliberately pauses Unity.
  const initial=await canvas.screenshot();await page.waitForTimeout(1200);
  if(initial.equals(await canvas.screenshot()))await click(800,35);
  await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');
  await page.keyboard.press('Space',{delay:100});
  await click(800,35);await page.waitForTimeout(300);
  const paused=await canvas.screenshot({path:'tests/unity-export-paused-before.png'});await page.waitForTimeout(1100);
  const later=await canvas.screenshot({path:'tests/unity-export-paused-after.png'});
  assert.ok(paused.equals(later),id+' stays visually frozen while paused; '+errors.join('; '));
  await click(800,35);await page.waitForTimeout(300);
  await canvas.screenshot({path:'tests/unity-export-'+id+'.png'});
  if(id==='ark-park') {
   await page.locator('#unity-status').filter({hasText:/points/}).waitFor({timeout:90000});
   await canvas.screenshot({path:'tests/unity-export-results.png'});
   await click(450,425);await page.waitForTimeout(500);
   await canvas.screenshot({path:'tests/unity-export-restart.png'});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS real Unity export: '+id+' startup, keyboard action and pause/resume');
  await page.getByRole('link',{name:'Back to library',exact:true}).click();
  await page.locator('iframe').waitFor({state:'detached'});
 }
 console.log('PASS real Ark round completion bridge and restart exercised; no Unity runtime exceptions');
} finally {await browser.close();}
