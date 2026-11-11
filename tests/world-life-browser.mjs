import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs=[]; p.on("pageerror", e => errs.push(e.message));
await p.goto(`${process.env.BASE || "http://127.0.0.1:4173"}/#life`);
await p.waitForTimeout(9000);
const w = p.frames().find(f => f.url().includes("/world/index.html"));
w.on?.("pageerror", e => errs.push(e.message));

await w.waitForSelector(".kl-new", { timeout: 15000 });
await w.fill(".kl-new input >> nth=0", "Ama");
await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/w2-new.png` });
await w.click(".kl-new .kl-go");
for (const sel of ["button[aria-label='Skip the tutorial']", "button[aria-label='Close']", "button[aria-label*='lose']"]) { const c = await w.$(sel); if (c) { await c.click().catch(()=>{}); break; } }

await p.waitForTimeout(6000);
await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/w2-baby.png` });
// grow up 20 years
for (let i = 0; i < 24; i++) {
  if (await w.$(".kl-decision")) { await w.click(".kl-choices button >> nth=0"); continue; }
  await w.click(".kl-chip"); await w.click(".kl-panel .kl-wide"); await w.click(".kl-panel .ks-leave");
}
await p.waitForTimeout(5000);
await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/w2-grown.png` });
await w.click(".kl-chip"); await p.waitForTimeout(500);
await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/w2-panel.png` });
console.log(errs.slice(0,6).join("\n") || "no page errors");
await b.close();
