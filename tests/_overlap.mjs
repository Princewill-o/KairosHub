import { chromium } from 'playwright';
const base='http://localhost:4180';
const sizes = [[1280,800],[1440,900],[390,844]];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [w,h] of sizes) {
  const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  p.setDefaultTimeout(25000);
  await p.goto(`${base}/#world`); await p.waitForTimeout(3000);
  let f = p.frames().find((x) => x.url().includes('/world/index.html'));
  await f.goto(`${base}/world/index.html?map=city&mode=online`);
  f = p.frames().find((x) => x.url().includes('/world/index.html'));
  try { await f.click("button[aria-label='Skip the tutorial']", { timeout: 4000 }); } catch {}
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `/tmp/ov-${w}.png` });
  const res = await p.evaluate(() => {
    // outer page elements (nav bar) + iframe HUD elements
    const out = [];
    const grab = (doc, ox, oy, tag) => {
      const els = [...doc.querySelectorAll('[data-hud], header, nav, button, [role=status]')].filter(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 4 && r.height > 4 && (s.position === 'absolute' || s.position === 'fixed' || e.closest('[data-hud]') === e); });
      for (const e of els) { const r = e.getBoundingClientRect(); out.push({ tag, name: (e.getAttribute('data-hud') || e.getAttribute('aria-label') || e.className || e.tagName).toString().slice(0,40), x: r.x+ox, y: r.y+oy, w: r.width, h: r.height }); }
    };
    grab(document, 0, 0, 'top');
    const fr = document.querySelector('iframe'); const fr2 = fr.getBoundingClientRect();
    grab(fr.contentDocument, fr2.x, fr2.y, 'world');
    return out;
  });
  const hit = (a, b) => a.x < b.x + b.w - 2 && b.x < a.x + a.w - 2 && a.y < b.y + b.h - 2 && b.y < a.y + a.h - 2;
  const contains = (a, b) => a.x <= b.x+1 && a.y <= b.y+1 && a.x + a.w >= b.x + b.w-1 && a.y + a.h >= b.y + b.h-1;
  const pairs = new Set();
  for (let i = 0; i < res.length; i++) for (let j = i + 1; j < res.length; j++) { const a = res[i], c = res[j]; if (hit(a, c) && !contains(a, c) && !contains(c, a)) pairs.add(`${a.tag}:${a.name} [${a.x|0},${a.y|0},${a.w|0}x${a.h|0}]  <->  ${c.tag}:${c.name} [${c.x|0},${c.y|0},${c.w|0}x${c.h|0}]`); }
  console.log(`== ${w}x${h}`); for (const pr of pairs) console.log(pr);
  await p.close();
}
await b.close();
