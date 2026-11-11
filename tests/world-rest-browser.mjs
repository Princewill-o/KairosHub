// Music playlist, politics, pixel titles, game-show presenter.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
p.setDefaultTimeout(25000);
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(3000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
const open = async (q) => { await f.goto(`${base}/world/index.html?map=city&mode=online&${q}`); f = p.frames().find((x) => x.url().includes('/world/index.html')); try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 4000 }); } catch {} };
await open('phone=1');
await f.click("button[aria-label='Music']").catch(() => errs.push('no Music app'));
await f.click('.mu-play').catch(() => errs.push('no play button'));
await f.waitForSelector("[data-hud='now-playing']").catch(() => errs.push('no now-playing pill'));
await f.click("button[aria-label='Next']");
await p.screenshot({ path: `${out}/music.png` });
await open('lifehub=1');
await f.click(".lh-tabs button:has-text('Politics')");
await f.click(".lh-card >> nth=0");
await f.click(".lh-card:has-text('Knock on doors')");
await p.screenshot({ path: `${out}/politics.png` });
const font = await f.evaluate(() => getComputedStyle(document.querySelector('.lh-head h2')).fontFamily);
if (!/Kairos Pixel/.test(font)) errs.push('no pixel font: ' + font);
await open('gameshow=1');
await f.waitForSelector('.gs-q');
await p.screenshot({ path: `${out}/gameshow2.png` });
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('Music, politics and pixel titles work.');
