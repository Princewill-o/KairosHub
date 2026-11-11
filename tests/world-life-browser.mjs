// Plays offline Kairos Life inside Kairos World: birth cutscene, full bars and your name,
// the age circle (decision + issue cutscenes), the family call list. SHOTS=dir saves screenshots.
import { chromium } from "playwright";
const base = process.env.BASE || "http://127.0.0.1:4173", out = process.env.SHOTS;
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message)); 
const world = () => p.frames().find((f) => f.url().includes("/world/index.html"));
const shot = (n) => out && p.screenshot({ path: `${out}/life-${n}.png` });
const tryClick = async (sel) => { try { await world().click(sel, { timeout: 3000 }); return true; } catch { return false; } };
const has = async (sel) => { try { return !!(await world().$(sel)); } catch { return false; } };
const skipTutorial = async () => { await tryClick("button[aria-label='Skip the tutorial']"); };
const until = async (sel, ms = 25000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await has(sel)) return true; await p.waitForTimeout(250); } return false; };
await p.goto(`${base}/#life`);
await p.waitForTimeout(8000);
await world().waitForSelector(".kl-new", { timeout: 20000 });
await world().fill(".kl-new input >> nth=0", "Ama");
await world().click(".kl-new .kl-go");
await p.waitForTimeout(3000);                       // the world reloads into the new life's own storage
if (!(await until(".kl-cut"))) errs.push("no birth cutscene");
await p.waitForTimeout(1500); await shot("1-birth");
await tryClick(".kl-cut-skip"); await skipTutorial();
await p.waitForTimeout(1500); await shot("2-born-hud");
const name = await world().textContent("[data-hud='kairos-life'] .kl-chip b");
if (name !== "Ama") errs.push(`chip name ${name}`);
let cuts = 0;
for (let i = 0; i < 16; i++) {
  if (await has(".kl-cut")) { cuts++; if (cuts === 3) { await p.waitForTimeout(2000); await shot("3-year-cutscene"); } await tryClick(".kl-cut-skip"); await p.waitForTimeout(400); continue; }
  if (await has(".kl-decision")) { if (cuts === 3) await shot("4-decision"); await tryClick(".kl-choices button >> nth=0"); await p.waitForTimeout(400); continue; }
  await p.waitForTimeout(500);
  if (await has(".kl-cut") || await has(".kl-decision")) continue;
  if (await has(".kl-age:disabled")) { await shot("stuck"); errs.push("stuck: age circle disabled with nothing to answer"); break; }
  await tryClick(".kl-age"); await p.waitForTimeout(700);
}
if (cuts < 3) errs.push(`only ${cuts} cutscenes`);
const age = Number(await world().textContent("[data-hud='kairos-life'] svg text"));
if (!(age >= 3)) errs.push(`age ${age}`);
await world().click("[data-hud='phone']"); await p.waitForTimeout(600);
await world().click(".kp-app[aria-label^=\"Phone\"]"); await p.waitForTimeout(2000);
await shot("5-family-calls");
if (!(await has("text=/^Call /"))) errs.push("no family in call list");
await b.close();
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log(`Kairos Life world flow passed: ${cuts} cutscenes, age ${age}.`);
