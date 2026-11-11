// Screenshots every Blender cutscene set and an in-game motion lesson. SHOTS=dir.
import { chromium } from 'playwright';
const out = process.env.SHOTS ?? '/tmp';
const base = process.env.BASE ?? 'http://localhost:4180';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
const frame = () => p.frames().find((f) => f.url().includes('/world/index.html'));
const visit = async (q, sel, name, wait) => {
  await frame().goto(`${base}/world/index.html?map=city&mode=online&${q}`);
  try { await frame().waitForSelector(sel, { timeout: 40000 }); } catch { errs.push(`no ${sel} for ${q}`); }
  await p.waitForTimeout(wait);
  await p.screenshot({ path: `${out}/${name}.png` });
};
for (const set of (process.env.SETS ?? 'hospital,home,school,office,park,temptation,cafe,church,birth').split(',')) await visit(`cutscene=${set}`, '.kl-cut', `cut-${set}`, 4000);
if (!process.env.SETS) await visit('lesson=temptation', '.ml-player', 'lesson-ingame', 8000);
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('cutscenes rendered');
