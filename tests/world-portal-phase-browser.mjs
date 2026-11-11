// LTBS portals phase in purple while you stand in them, then take you through.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
await f.goto(`${base}/world/index.html?map=scripture-island&mode=online&at=9,23`);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
let peak = 0, shot = false;
for (let i = 0; i < 60; i++) {
  await p.waitForTimeout(150);
  const o = await f.$eval('[data-hud="portal-phase"]', (c) => Number(c.style.opacity)).catch(() => 0);
  if (o > peak) peak = o;
  if (o > 0.35 && !shot) { shot = true; await p.screenshot({ path: `${out}/portal-phasing.png` }); }
}
if (!(peak > 0.3)) errs.push(`portal should phase in purple (peak ${peak})`);
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`Portal phasing works (peak ${peak.toFixed(2)}).`);
