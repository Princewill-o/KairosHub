import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const errs = [];
for (const map of (process.argv[2] || "airport,flight,ferry,church,greater-london,city").split(",")) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on("pageerror", e => errs.push(map + ": " + e.message));
  await p.goto(`${process.env.BASE || "http://127.0.0.1:4173"}/#world`);
  await p.waitForTimeout(5000);
  const f = p.frames().find(x => x.url().includes("/world/index.html"));
  await f.goto(`${process.env.BASE || "http://127.0.0.1:4173"}/world/index.html?map=${map}&mode=${map === "church" ? "offline" : "online"}`);
  await p.waitForTimeout(5000);
  const w = p.frames().find(x => x.url().includes("/world/index.html"));
  const skip = await w.$("button[aria-label='Skip the tutorial']"); if (skip) await skip.click();
  if (map === "church") { if (await w.$(".kl-new")) { await w.click(".kl-new .kl-go"); await p.waitForTimeout(1500); } const go = await w.$(".kl-service-go"); console.log("church button:", go ? await go.textContent() : "none"); }
  await p.waitForTimeout(map === "greater-london" ? 16000 : 9000);
  if (process.env.ZOOM) for (let i = 0; i < 6; i++) { const z = await w.$("[data-hud='zoom'] button"); if (z) await z.click(); }
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${process.env.SHOTS || "/tmp"}/m-${map}${process.env.ZOOM ? "-far" : ""}.png` });
  await p.close();
}
console.log(errs.join("\n") || "no page errors");
await b.close();
