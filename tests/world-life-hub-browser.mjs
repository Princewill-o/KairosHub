// The Life hub: do a hobby, take a job, see the skyline.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
p.setDefaultTimeout(25000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(3000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
await f.goto(`${base}/world/index.html?map=city&mode=online&lifehub=1`);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 4000 }); } catch {}
await f.waitForSelector('.lh-panel').catch(() => errs.push('no life hub'));
for (let i = 0; i < 3; i++) await f.click("[data-activity='guitar']");
if (!(await f.textContent('.lh-msg'))) errs.push('activity gave no feedback');
await p.screenshot({ path: `${out}/lifehub-hobbies.png` });
await f.click(".lh-tabs button:has-text('Work')");
await f.click(".lh-card:has-text('Tech')");
await f.click(".lh-row button:has-text('Work hard')");
await p.screenshot({ path: `${out}/lifehub-work.png` });
await f.click(".lh-tabs button:has-text('Property')");
await p.screenshot({ path: `${out}/lifehub-property.png` });
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('Life hub works.');
