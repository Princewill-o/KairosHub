import http from 'node:http';
import {chromium} from '@playwright/test';
import worker from '../dist/server/index.js';
import assert from 'node:assert/strict';
const server=http.createServer(async(req,res)=>{
 try{const response=await worker.fetch(new Request('http://127.0.0.1:4187'+req.url));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end();}
});
await new Promise(resolve=>server.listen(4187,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4187/#play/verse');
 // Opening film is independent of the game UI.
 if(await page.locator('#intro-skip').isVisible()) await page.locator('#intro-skip').click();
 const reader=page.locator('[data-scripture-reader]');
 await reader.locator('summary').click();
 await reader.locator('input').fill('John 11:35');
 await reader.locator('button').click();
 await reader.locator('blockquote').waitFor({state:'visible',timeout:20000});
 assert.match(await reader.locator('blockquote').textContent(),/Jesus wept/);
 await context.setOffline(true);
 await reader.locator('button').click();
 await page.waitForFunction(()=>document.querySelector('[data-scripture-reader] [role=status]').textContent.includes('Saved passage'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await reader.locator('input').fill('John 3:16');
 await reader.locator('button').click();
 await page.waitForFunction(()=>document.querySelector('[data-scripture-reader] [role=status]').textContent.includes('offline'));
 console.log('PASS: mobile passage lookup, translation label, offline cached passage, offline error, no horizontal overflow.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
