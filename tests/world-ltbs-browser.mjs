// Visits each LTBS story biome and the challenge ring. SHOTS=dir saves screenshots.
import { chromium } from "playwright";
const base = process.env.BASE || "http://127.0.0.1:4173", out = process.env.SHOTS || "/tmp";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on("pageerror", e => errs.push(e.message));
for (const [name, at] of [["david", "9,27"], ["esther", "42,27"], ["ruth", "11,42"], ["daniel", "40,42"], ["ring", "26,30"]]) {
  await p.goto(`${base}/#world`); await p.waitForTimeout(4000);
  let w = p.frames().find(f => f.url().includes("/world/index.html"));
  await w.goto(`${base}/world/index.html?map=scripture-island&mode=online&at=${at}`); await p.waitForTimeout(8000);
  w = p.frames().find(f => f.url().includes("/world/index.html"));
  try { await w.click("button[aria-label='Skip the tutorial']", { timeout: 3000 }); } catch {}
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/ltbs-${name}.png` });
}
await b.close();
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log("LTBS biomes rendered.");
