// Camera views: classic → close → first person with fists; riders visible through car glass.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
await f.goto(`${base}/world/index.html?map=city&mode=online&at=${process.env.AT ?? '30,20'}`); await p.waitForTimeout(3000);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 2000 }); } catch {}
await p.waitForTimeout(6000);
const label = async () => (await f.$eval('[data-hud="camera-view"]', (e) => e.textContent)).trim();
if (!(await label()).includes('Classic')) errs.push('starts in classic view');
await f.click('[data-hud="camera-view"]'); await p.waitForTimeout(2500);
if (!(await label()).includes('Close')) errs.push('second view is close');
await p.screenshot({ path: `${out}/view-close.png` });
await f.click('[data-hud="camera-view"]'); await p.waitForTimeout(2500);
if (!(await label()).includes('First')) errs.push('third view is first person');
const before = await f.evaluate(() => window.__kairosCamera.yaw);
await p.keyboard.press('f'); await p.waitForTimeout(120);
await p.screenshot({ path: `${out}/view-first.png` });
await p.keyboard.down('w'); await p.waitForTimeout(1500); await p.keyboard.up('w');
await p.keyboard.down('d'); await p.waitForTimeout(900); await p.keyboard.up('d');
await p.screenshot({ path: `${out}/view-first-turned.png` });
if (Math.abs((await f.evaluate(() => window.__kairosCamera.yaw)) - before) < 0.15) errs.push('D turns in first person');
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('Camera views work.');
