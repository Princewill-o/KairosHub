// The Kairos World menu: tabs, tiles, liquid-glass hover. SHOTS=dir saves screenshots.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
await f.goto(`${base}/world/index.html?map=city`);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
try { await f.waitForSelector('.km-menu', { timeout: 30000 }); } catch { errs.push('menu did not open'); }
await p.waitForTimeout(1500);
const tiles = await f.$$('.km-tile');
if (tiles.length !== 5) errs.push(`expected 5 tiles, saw ${tiles.length}`);
await p.screenshot({ path: `${out}/menu-online.png` });
const box = await (await f.$('.km-big')).boundingBox();
await p.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.45); await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/menu-hover.png` });
await f.click('.km-tabs button:nth-of-type(2)'); await p.waitForTimeout(900);
if (!(await f.$('[data-tile="preacher"]'))) errs.push('Kairos Life tab has no preacher tile');
const big = await (await f.$('.km-big')).boundingBox();
await p.mouse.move(big.x + big.width * 0.62, big.y + big.height * 0.4); await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/menu-life.png` });
await f.click('.km-tabs button:nth-of-type(1)'); await p.waitForTimeout(500);
await f.click('.km-select'); await p.waitForTimeout(9000);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
if (await f.$('.km-menu')) errs.push('menu stayed open after Play online');
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('Menu works.');
