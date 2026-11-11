// Residents talk to you: open a conversation, choose, hear their reply.
import { chromium } from 'playwright';
const base = process.env.BASE ?? 'http://localhost:4180', out = process.env.SHOTS ?? '/tmp';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
let f = p.frames().find((x) => x.url().includes('/world/index.html'));
await f.goto(`${base}/world/index.html?map=city&mode=online&talk=${process.env.TALK ?? 4}`);
f = p.frames().find((x) => x.url().includes('/world/index.html'));
try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 5000 }); } catch {}
{
  await f.waitForSelector('.kn-dialog', { timeout: 5000 }).catch(() => errs.push('conversation did not open'));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/npc-chat.png` });
  await f.click('.kn-choices button >> nth=0').catch(() => errs.push('no choices'));
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/npc-chat-reply.png` });
  if (!(await f.$('.kn-done'))) errs.push('reply should finish with Carry on');
}
await b.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log('Conversations work.');
