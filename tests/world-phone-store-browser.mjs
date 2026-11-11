// The phone App Store: install a risky app, open it, delete apps, see where you are spiritually.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
p.setDefaultTimeout(25000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
await f.goto(`${base}/world/index.html?map=city&mode=online&phone=1`);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 5000 }); } catch {}
await f.waitForSelector('.kp-phone', { timeout: 8000 }).catch(() => errs.push('phone did not open'));
await p.waitForTimeout(800);
await f.click("button[aria-label='App Store']").catch(() => errs.push('no App Store icon'));
await f.waitForSelector('.kp-reading').catch(() => errs.push('no spiritual reading'));
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/phone-store.png` });
await f.click(".kp-store-tabs button:has-text('Risky')");
await f.click(".kp-store-list li:has-text('BetBlitz') .kp-get").catch(() => errs.push('could not get BetBlitz'));
await f.click(".kp-store-tabs button:has-text('Time sinks')");
await f.click(".kp-store-list li:has-text('Scrollr') .kp-get").catch(() => errs.push('could not get Scrollr'));
await f.click('.kp-back'); await p.waitForTimeout(300);
if (!(await f.$("[data-app='bet']"))) errs.push('installed app not on home screen');
await f.click("[data-app='bet']"); await p.waitForTimeout(300);
await f.click('.kp-storeapp-offer').catch(() => errs.push('no offer'));
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/phone-app.png` });
await f.click('.kp-storeapp-delete');
await p.waitForTimeout(300);
await f.click('.kp-edit');
await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/phone-edit.png` });
await f.click("button[aria-label='Delete Scrollr']").catch(() => errs.push('could not delete in edit mode'));
await f.click('.kp-edit');
await f.click("button[aria-label='App Store']");
const reading = await f.getAttribute('.kp-reading', 'data-reading');
if (reading !== 'pruning') errs.push(`expected pruning, got ${reading}`);
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/phone-store-after.png` });
// the HUD portrait is your blocky skin
await f.click('.kp-homebar').catch(() => {}); await f.click('.kp-homebar').catch(() => {});
await p.waitForTimeout(600);
if (!(await f.$("[data-portrait='skin-bust']"))) errs.push('HUD portrait is not the skin bust');
await p.screenshot({ path: `${out}/hud-portrait.png`, clip: { x: 0, y: 560, width: 420, height: 240 } });
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('App Store works.');
