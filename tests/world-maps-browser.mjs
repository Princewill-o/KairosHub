import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const tryc = async (f, sel) => { try { await f.click(sel, { timeout: 3000 }); return true; } catch { return false; } };
for (const map of ["city", "greater-london"]) {
  await p.goto("http://localhost:4180/#world"); await p.waitForTimeout(5000);
  let w = p.frames().find(f => f.url().includes("/world/index.html"));
  await w.goto(`http://localhost:4180/world/index.html?map=${map}&mode=online`); await p.waitForTimeout(8000);
  w = p.frames().find(f => f.url().includes("/world/index.html"));
  await tryc(w, "button[aria-label='Skip the tutorial']");
  await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/m2-hud-${map}.png` });
  await tryc(w, "[data-hud='minimap']"); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/m2-map-${map}.png` });
}
await p.goto("http://localhost:4180/#world"); await p.waitForTimeout(6000);
await tryc(p, "text=World map"); await p.waitForTimeout(3000);
await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/m2-atlas.png` });
const g = p.frames().find(f => f.url().includes("grace=1"));
if (g) { await g.evaluate(() => window.scrollTo(0, 650)); await p.waitForTimeout(800); await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/m2-atlas2.png` }); }
await b.close();
