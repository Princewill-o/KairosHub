// Captures clean in-game shots (no HUD) for the Kairos World menu tiles.
// Usage: node tests/capture-menu-art.mjs [names] — writes public/menu/<name>.jpg
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const base = process.env.BASE ?? 'http://localhost:4180';
mkdirSync('public/menu', { recursive: true });
const SHOTS = {
  preacher: { q: 'map=city&mode=online&cutscene=church&lead=preacher&leadAt=0,0.4,-1.9&pose=wave&solo=1', wait: 6000 },
  london: { q: 'map=city&mode=online', wait: 9000 },
  ltbs: { q: 'map=scripture-island&mode=online&at=40,42', wait: 9000 },
  church: { q: 'map=church&mode=online', wait: 9000 },
  airport: { q: 'map=airport&mode=online', wait: 9000 },
  ferry: { q: 'map=ferry&mode=online', wait: 9000 },
  birth: { q: 'map=city&mode=online&cutscene=birth', wait: 5000 },
  cafe: { q: 'map=city&mode=online&cutscene=cafe', wait: 5000 },
  temptation: { q: 'map=city&mode=online&cutscene=temptation', wait: 5000 },
  park: { q: 'map=city&mode=online&cutscene=park', wait: 5000 },
};
const names = process.argv[2]?.split(',') ?? Object.keys(SHOTS);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
const frame = () => p.frames().find((f) => f.url().includes('/world/index.html'));
for (const name of names) {
  const s = SHOTS[name];
  await frame().goto(`${base}/world/index.html?${s.q}`);
  await p.waitForTimeout(3000);
  try { await frame().click("button[aria-label='Skip the tutorial']", { timeout: 2000 }); } catch {}
  await p.waitForTimeout(s.wait);
  await frame().addStyleTag({ content: 'body *{visibility:hidden!important} canvas{visibility:visible!important}' });
  await p.addStyleTag({ content: 'body *{visibility:hidden!important} iframe{visibility:visible!important}' });
  await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/menu-${name}.png` });
  await p.addStyleTag({ content: 'body *{visibility:visible!important}' });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `/tmp/menu-${name}.png`, '-vf', 'scale=1280:-2', '-q:v', '4', `public/menu/${name}.jpg`]);
  console.log('shot', name);
}
await b.close();
