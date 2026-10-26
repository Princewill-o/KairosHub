import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  serviceWorkers: "block",
  reducedMotion: "reduce",
});
await context.addInitScript(() => {
  if (!localStorage.getItem("kairos-accounts-v1"))
    localStorage.setItem(
      "kairos-accounts-v1",
      JSON.stringify({
        parents: [],
        players: [
          {
            id: "replay-test",
            name: "Explorer",
            age: 9,
            band: "kids",
            character: "kai",
          },
        ],
        active: "replay-test",
      }),
    );
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.KAIROS_URL || "http://localhost:4173/";
const fits = async (label) =>
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    label + " fits on a phone",
  );
async function quiz() {
  await page.goto(base + "#bible/quiz");
  await page.locator("#bible-start").click();
  const seen = [];
  for (let i = 0; i < 9; i++) {
    seen.push(await page.locator("#bible-stage h2").textContent());
    await page.locator("[data-do=answer]").first().click();
    await page.locator("[data-do=next]").click();
  }
  await page.locator(".bible-results").waitFor();
  return seen;
}
try {
  const first = await quiz();
  await page.reload();
  const second = await quiz();
  assert.equal(
    new Set([...first, ...second]).size,
    18,
    "reloading does not restart the question rotation",
  );
  const signatures = [];
  for (let n = 0; n < 3; n++) {
    await page.goto(base + "#bible");
    await page.locator(".bible-library").waitFor();
    await page.goto(base + "#bible/crossword");
    await page.locator("#bible-start").click();
    await fits("crossword");
    const clues = await page.locator(".bible-clues").textContent();
    signatures.push(clues);
  }
  assert.equal(new Set(signatures).size, 3, "new crossword on each play");
  for (const game of ["scavenger", "character", "ordering", "escape"]) {
    await page.goto(base + "#bible/" + game);
    await page.locator("#bible-start").click();
    await page.locator("#bible-stage").waitFor();
    await fits(game);
    const text = await page.locator("#bible-stage").textContent();
    assert.doesNotMatch(text, /undefined|NaN/);
  }
  await page.goto(base + "#bible/map");
  await page.locator("#bible-start").click();
  assert.equal(
    await page.locator(".map-pin").count(),
    4,
    "four candidate pins keep the larger atlas usable",
  );
  await fits("expanded map");
  await page.goto(base + "#multiplayer");
  await page.locator(".world-invitation").waitFor();
  await fits("Together");
  assert.match(await page.locator('.world-locked').textContent(), /Coming soon/);
  assert.equal(await page.locator('a[href="#world"]').count(), 0);
  await page.goto(base + '#world');
  await page.locator('.world-locked').waitFor();
  assert.equal(await page.locator('iframe').count(), 0);
  await fits('locked World');
  await page.goto(base + 'world/index.html');
  await page.locator('.world-locked').waitFor();
  assert.equal(await page.locator('script[src*="app.js"],iframe').count(), 0);
  await fits('direct locked entry');
  assert.deepEqual(errors, []);
  console.log(
    "PASS expanded-content browser: 18 distinct quiz questions across reload, varied crosswords, bounded quest rounds, accessible map choices and locked Kairos World entries.",
  );
} finally {
  await browser.close();
}
