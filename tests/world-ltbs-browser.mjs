import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("http://localhost:4180/#world"); await p.waitForTimeout(5000);
let w = p.frames().find(f => f.url().includes("/world/index.html"));
w.on?.("pageerror", e => errs.push(e.message));
await w.goto("http://localhost:4180/world/index.html?map=scripture-island&mode=online&at=19,28"); await p.waitForTimeout(9000);
w = p.frames().find(f => f.url().includes("/world/index.html"));
try { await w.click("button[aria-label='Skip the tutorial']", { timeout: 3000 }); } catch {}
// walk north-west toward the story portals
await w.focus("body").catch(()=>{});

for (let i = 0; i < 1; i++) { try { await w.click("[data-hud='zoom'] button", { timeout: 2000 }); } catch {} }
await p.waitForTimeout(2000);
await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/ltbs.png` });
console.log(errs.join("\n") || "no errors");
await b.close();
