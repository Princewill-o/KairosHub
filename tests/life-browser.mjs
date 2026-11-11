// Plays Kairos Life in a phone and desktop viewport: start, random details, ageing, decisions, actions, follow-up, service, ending.
import { chromium } from "playwright";
const base = process.env.BASE || "http://127.0.0.1:4173";
const out = process.env.SHOTS || "";
const browser = await chromium.launch();
const errors = [];
for (const [name, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  await page.goto(`${base}/#life`);
  await page.waitForSelector(".life-start h1");
  await page.click("#life-random");
  await page.fill("input[name=first]", "Ama");
  if (out) await page.screenshot({ path: `${out}/${name}-1-start.png`, fullPage: true });
  await page.click(".life-form .life-primary");
  await page.waitForSelector("#life-age");
  for (let i = 0; i < 26; i++) {
    if (await page.$("[data-choice]")) await page.click("[data-choice='0']");
    else await page.click("#life-age");
    if (i === 8 && out) await page.screenshot({ path: `${out}/${name}-2-child.png`, fullPage: true });
  }
  if (await page.$("[data-choice]")) await page.click("[data-choice='0']");
  const btn = await page.$("[data-act='repent']:not([disabled])"); if (btn) await btn.click();
  const preach = await page.$("[data-act='preach']:not([disabled])"); if (preach) await preach.click();
  if (out) await page.screenshot({ path: `${out}/${name}-3-adult.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (overflow) errors.push(`${name}: horizontal overflow`);
  await page.click("#life-service");
  await page.waitForSelector(".life-screen");
  await page.waitForTimeout(2500);
  if (out) await page.screenshot({ path: `${out}/${name}-4-service.png`, fullPage: true });
  await page.click("#life-done");
  await page.waitForSelector("#life-age, [data-choice]");
  // die: fast-forward
  for (let i = 0; i < 140 && !(await page.$(".life-ending")); i++) {
    if (await page.$("[data-choice]")) await page.click("[data-choice='1']");
    else if (await page.$("#life-age")) await page.click("#life-age");
  }
  await page.waitForSelector(".life-ending");
  if (out) await page.screenshot({ path: `${out}/${name}-5-ending.png`, fullPage: true });
  await page.reload();
  await page.waitForSelector(".life-ending");
  await page.close();
}
await browser.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Kairos Life browser flow passed on desktop and phone.");
