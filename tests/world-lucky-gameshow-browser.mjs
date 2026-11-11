// Mine a lucky block open; play the Bible game show.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
p.setDefaultTimeout(25000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(3000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
await f.goto(`${base}/world/index.html?map=city&mode=online&lucky=obsidian`);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 4000 }); } catch {}
await f.waitForSelector('.lb-cube').catch(() => errs.push('no lucky block'));
await f.click('.lb-cube'); await f.click('.lb-cube');
await p.screenshot({ path: `${out}/lucky-mining.png` });
for (let i = 0; i < 8; i++) await f.click('.lb-cube').catch(() => {});
await f.waitForSelector('.lb-card').catch(() => errs.push('block did not open'));
await p.screenshot({ path: `${out}/lucky-open.png` });
await f.click('.lb-card button');
await f.goto(`${base}/world/index.html?map=city&mode=online&gameshow=1`);
try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 4000 }); } catch {}
await f.waitForSelector('.gs-q').catch(() => errs.push('no game show'));
await f.click('.gs-bar button:has-text("Ask the audience")');
await f.click('.gs-answers button >> nth=1');
await p.screenshot({ path: `${out}/gameshow.png` });
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('Lucky blocks and game show work.');
