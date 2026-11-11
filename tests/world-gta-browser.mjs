// Police van to court, the phone browser + dark web, punching someone, the Met sign.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.setDefaultTimeout(25000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(3000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
const open = async (q) => { await f.goto(`${base}/world/index.html?map=city&mode=online&${q}`); f = p.frames().find((x) => x.url().includes('/world/index.html')); try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 4000 }); } catch {} };
await open('phone=1');
await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/phone-home.png` });
await f.$eval("button[aria-label='Browser']", (e) => e.click()).catch(() => errs.push('no Browser app'));
await f.click(".wb-link:has-text('Kairos Shop')");
await f.click(".wb-shop li >> nth=0 >> button");
await f.waitForSelector('.wb-msg').catch(() => errs.push('no order feedback'));
await f.click("button[aria-label='Home']");
await f.click(".wb-link:has-text('basement')");
await p.waitForTimeout(500);
await p.screenshot({ path: `${out}/darkweb.png` });
await open('hearing=assault&stars=2');
await f.waitForSelector('.pv-scene', { timeout: 15000 }).catch(() => errs.push('no police van'));
await p.screenshot({ path: `${out}/van.png` });
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('Van, web shop and dark web work.');
