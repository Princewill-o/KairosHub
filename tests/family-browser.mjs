import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch();
const base = process.env.KAIROS_URL || "http://localhost:4173/";
const email = `family-${Date.now()}@example.com`,
  password = "A family test password 2026";
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  serviceWorkers: "block",
  reducedMotion: "reduce",
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const fits = async (p, label) =>
  assert.ok(
    await p.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    label + " fits screen",
  );
async function login(p) {
  await p.goto(base + "#family");
  await p.locator("[name=email]").fill(email);
  await p.locator("[name=password]").fill(password);
  await p.locator("#family-auth-form [type=submit]").click();
  await p.locator(".family-heading").waitFor();
}
try {
  await page.goto(base + "#family");
  await page.locator("[data-auth=signup]").click();
  await page.locator("[name=name]").fill("Kofi");
  await page.locator("[name=age]").fill("35");
  await page.locator("[name=email]").fill(email);
  await page.locator("[name=password]").fill(password);
  await page.locator("[name=confirm]").fill(password);
  await page.locator("[name=consent]").check();
  await page.locator("#family-auth-form [type=submit]").click();
  await page.locator("#family-child-form").waitFor();
  await fits(page, "empty parent dashboard");
  await page.locator("#family-child-form [name=name]").fill("Ama");
  await page.locator("#family-child-form [name=age]").fill("9");
  await page.locator("#family-child-form [name=character]").selectOption("ama");
  await page.locator("#family-child-form button").click();
  await page.locator("[data-play]").waitFor();
  await fits(page, "parent dashboard");
  await page.locator("[data-play]").click();
  await page.waitForURL("**/#journey");
  await page.locator(".kg-journey").waitFor();
  assert.match(await page.locator("h1").textContent(), /Ama/);
  assert.equal((await context.request.get(base + "api/family")).status(), 403);
  await page.goto(base + "#bible/quiz");
  await page.locator("#bible-start").click();
  await page.route("**/api/family/children/*/progress", (route) =>
    route.abort(),
  );
  for (let i = 0; i < 9; i++) {
    await page.locator("[data-do=answer]").first().click();
    await page.locator("[data-do=next]").click();
  }
  await page.locator(".bible-results").waitFor();
  await page
    .locator("[data-family-sync]")
    .filter({ hasText: /waiting to sync/ })
    .waitFor();
  await page.goto(base + "#journey");
  await fits(page, "child dashboard");
  assert.match(await page.locator(".kg-journey").textContent(), /Bible Quiz/);
  await page.reload();
  await page
    .locator(".kg-journey-card")
    .filter({ hasText: "Bible Quiz" })
    .waitFor();
  assert.match(
    await page
      .locator(".kg-journey-card")
      .filter({ hasText: "Bible Quiz" })
      .textContent(),
    /played 1 time/,
  );
  await page.unroute("**/api/family/children/*/progress");
  await page.locator("#family-sync-retry").click();
  await page
    .locator("[data-family-sync]")
    .filter({ hasText: /saved to your family/ })
    .waitFor();
  await page.reload();
  await page.locator(".kg-journey").waitFor();
  assert.match(await page.locator(".kg-journey").textContent(), /Bible Quiz/);
  await page.screenshot({
    path: "/tmp/kairos-family-child.png",
    fullPage: true,
  });
  const other = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      serviceWorkers: "block",
      reducedMotion: "reduce",
    }),
    parent = await other.newPage();
  parent.on("pageerror", (e) => errors.push(e.message));
  await login(parent);
  await parent
    .locator(".family-game")
    .filter({ hasText: "Bible Quiz" })
    .getByText(/1 finished/)
    .waitFor();
  assert.equal(await parent.locator(".family-activity li").count(), 1);
  await fits(parent, "desktop dashboard");
  await parent.screenshot({
    path: "/tmp/kairos-family-parent.png",
    fullPage: true,
  });
  await parent.setViewportSize({ width: 390, height: 844 });
  await fits(parent, "phone dashboard");
  await parent.screenshot({
    path: "/tmp/kairos-family-phone.png",
    fullPage: true,
  });
  await parent.locator(".family-sidebar summary").click();
  await parent.locator("#family-child-form [name=name]").fill("Leo");
  await parent.locator("#family-child-form [name=age]").fill("7");
  await parent.locator("#family-child-form button").click();
  await parent
    .locator(".family-detail h2")
    .filter({ hasText: "Leo" })
    .waitFor();
  assert.equal(await parent.locator(".family-activity li").count(), 0);
  await parent.locator("[data-play]").click();
  await parent.waitForURL("**/#journey");
  await parent.locator(".kg-journey").waitFor();
  assert.equal(
    await parent.locator(".kg-journey-card:not(.is-new)").count(),
    0,
    "second child has independent progress",
  );
  await parent.locator("#logout-journey").click();
  const gate = await parent.locator(".wl-gate p").first().textContent(),
    numbers = gate
      .match(/(\d+) × (\d+)/)
      .slice(1)
      .map(Number);
  await parent.locator("#gate-answer").fill(String(numbers[0] * numbers[1]));
  await parent.locator(".wl-gate [value=check]").click();
  await parent.locator(".wl-choices").waitFor();
  await parent.reload();
  await parent.locator(".wl-choices").waitFor();
  assert.equal(
    (await other.request.get(base + "api/family/session")).status(),
    401,
    "logout revokes cloud session",
  );
  await parent.goto(base + "#family");
  await parent.locator("#family-auth-form").waitFor();
  await fits(parent, "locked parent dashboard");
  const denied = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  await denied.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage denied", "SecurityError");
      },
    }),
  );
  const noStorage = await denied.newPage();
  noStorage.on("pageerror", (e) => errors.push(e.message));
  await login(noStorage);
  await noStorage.locator(".family-child").filter({ hasText: "Ama" }).click();
  await noStorage.locator("[data-play]").click();
  await noStorage
    .locator(".kg-journey-card")
    .filter({ hasText: "Bible Quiz" })
    .waitFor();
  await fits(noStorage, "child dashboard without local storage");
  assert.deepEqual(errors, []);
  console.log(
    "PASS family browser: sign up, add children, locked parent dashboard, offline result retry, reload, cross-device progress, sibling isolation and responsive layouts.",
  );
} finally {
  await browser.close();
}
