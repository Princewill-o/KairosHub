// Arrest scene, then the court: a deal, the judge, a verdict and prison.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
const frame = () => p.frames().find((x) => x.url().includes('/world/index.html'));
await frame().goto(`${base}/world/index.html?map=city&mode=online&arrest=1`);
try { await frame().click("button[aria-label='Skip the tutorial']", { timeout: 4000 }); } catch {}
await p.waitForTimeout(9000);
await p.screenshot({ path: `${out}/arrest.png` });
await frame().goto(`${base}/world/index.html?map=city&mode=online&hearing=Assault&stars=3`);
let f;
for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); f = frame(); if (f && await f.$('.kj-card').catch(() => null)) break; }
if (!(await f.$('.kj-card'))) errs.push('court case did not open');
await p.screenshot({ path: `${out}/court-deal.png` });
await f.click('.kj-ghost'); await p.waitForTimeout(600);
if (!(await f.$('.kj-arg'))) errs.push('judge stage shows arguments');
await p.screenshot({ path: `${out}/court-judge.png` });
await f.click('.kj-arg >> nth=0'); await p.waitForTimeout(3200);
const verdict = await f.$eval('.kj-guilty, .kj-free', (e) => e.textContent).catch(() => '');
if (!/Guilty/.test(verdict)) errs.push(`telling the truth means a guilty plea (saw "${verdict}")`);
await p.screenshot({ path: `${out}/court-verdict.png` });
await f.click('.kj-primary'); await p.waitForTimeout(9000);
await p.screenshot({ path: `${out}/prison.png` });
if (!frame().url() || !(await frame().$('[aria-label*="3D"]'))) errs.push('should arrive in prison');
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`Justice flow works: ${verdict}.`);
