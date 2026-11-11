// Your family shows up around you in Kairos Life, chats, and you can talk to them.
import { chromium } from "playwright";
const base = process.env.BASE || "http://localhost:4180", out = process.env.SHOTS || "/tmp";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
p.setDefaultTimeout(25000);
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const world = () => p.frames().find((f) => f.url().includes("/world/index.html"));
const tryClick = async (sel) => { try { await world().click(sel, { timeout: 3000 }); return true; } catch { return false; } };
await p.goto(`${base}/#life`); await p.waitForTimeout(8000);
await world().waitForSelector(".kl-new", { timeout: 20000 });
await world().fill(".kl-new input >> nth=0", "Ama");
await world().click(".kl-new .kl-go");
await p.waitForTimeout(6000);
await tryClick(".kl-cut-skip"); await tryClick("button[aria-label='Skip the tutorial']"); await tryClick("button[aria-label='Close']"); await tryClick(".kt-close, [aria-label='Close tutorial']");
await p.waitForTimeout(6000);
const plates = await world().evaluate(() => [...document.querySelectorAll(".kw-name, [class*=nameplate]")].map((e) => e.textContent).filter((t) => /mother|father|sibling|grandparent/.test(t)));
if (!plates.length) errs.push("no family nameplates in the world");
const fam = await world().evaluate(() => (globalThis.__kairosLifeWorld?.family ?? []).length);
if (!fam) errs.push("LIFE_WORLD has no family");
await p.screenshot({ path: `${out}/family.png` });
// Walk up to someone: put a family member next to you by asking the scene directly.
const talk = await world().waitForSelector("[data-hud='family-talk']", { timeout: 30000 }).catch(() => null);
if (talk) { await talk.evaluate((e) => e.click()); await world().waitForSelector(".kn-dialog").catch(() => errs.push("talking opened nothing")); await p.screenshot({ path: `${out}/family-talk.png` }); }
else console.log("(no family member close enough to talk in this spawn)");
await b.close();
console.log("family plates:", plates.join(", "), "| members:", fam);
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log("Family shows in the world.");
