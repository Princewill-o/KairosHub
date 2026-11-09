import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";

async function load(entry) {
  const out = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
  const file = `/tmp/kairos-${Math.random().toString(36).slice(2)}.mjs`;
  await fs.writeFile(file, out.outputFiles[0].text);
  return import(pathToFileURL(file).href);
}

test("conversations are harder: near-miss answers, shuffled, and people can say no", async () => {
  const d = await load("./world-runtime/source/game/core/discipleship.ts");
  const m = await load("./world-runtime/source/game/core/ministry.ts");
  const beat = m.SCENARIOS.muslim.beats[0];
  const answers = d.harderAnswers(beat, d.seeded("x"));
  assert.ok(answers.length >= 3);
  assert.ok(answers.some((a) => a.score === 2));
  assert.ok(!answers.some((a) => /religion is wrong/i.test(a.text)), "the cartoonishly rude answer is gone");
  const orders = new Set(Array.from({ length: 12 }, (_, i) => d.harderAnswers(beat, d.seeded(`s${i}`)).findIndex((a) => a.score === 2)));
  assert.ok(orders.size > 1, "the best answer isn't always in the same place");
  const atheist = m.PERSONAS.find((p) => p.background === "atheist");
  assert.equal(d.harderOutcome(1, 6, 0, false, atheist, d.seeded("a")).rejected, true, "no prayer and poor answers: a no");
  assert.equal(d.harderOutcome(6, 6, 100, true, atheist, d.seeded("b")).rejected, false, "prayer and wisdom open the door");
  assert.equal(d.walksAway([2, 0, 0]), true);
});

test("believers fall into different sins and need wise guidance", async () => {
  const d = await load("./world-runtime/source/game/core/discipleship.ts");
  assert.ok(d.STRUGGLES.length >= 6);
  for (const s of d.STRUGGLES) assert.deepEqual(new Set(s.options.map((o) => o.quality)), new Set(["wise", "harsh", "soft", "vague"]));
  const now = Date.now();
  let c = { name: "Amina", background: "muslim", stage: "believer", met: now - 3 * 86_400_000, steps: {}, lastContact: now - 86_400_000, notes: [] };
  for (let i = 0; i < 20 && !c.struggle; i++) c = d.maybeStruggle(c, now + i * 86_400_000);
  assert.ok(c.struggle, "a struggle eventually comes");
  const harsh = d.guide(c, "harsh");
  assert.ok(harsh.contact.struggle && harsh.contact.stage === "seeking", "condemnation pushes them back");
  const wise = d.guide(c, "wise");
  assert.equal(wise.contact.struggle, undefined);
});

test("the mall sells yellow Kharis hoodies on sale and delivers to your door", async () => {
  const mall = await load("./world-runtime/source/game/core/mall.ts");
  const hoodies = mall.MALL.filter((m) => m.dept === "Kharis Wear");
  assert.deepEqual(hoodies.map((h) => h.wear.print).sort(), ["kharis-church", "kharis-on-campus", "kharis-phase-2"]);
  for (const h of hoodies) { assert.equal(h.wear.top, mall.KHARIS_YELLOW); assert.ok(h.was > h.price, "on sale"); }
  assert.ok(mall.MALL.some((m) => m.furniture), "furniture too");
  const t0 = 1_000_000;
  let s = mall.placeOrder(mall.EMPTY_MALL, "hoodie-kharis-church", "express", t0);
  assert.equal(mall.orderStatus(s.orders[0], t0 + 1000), "packing");
  assert.equal(mall.orderStatus(s.orders[0], t0 + 89_000), "arriving");
  assert.equal(mall.orderStatus(s.orders[0], t0 + 91_000), "delivered");
  const opened = mall.collectDeliveries(s, t0 + 91_000);
  assert.deepEqual(opened.clothes, ["hoodie-kharis-church"]);
  assert.equal(mall.wear(opened.state, "hoodie-kharis-church").wearing.print, "kharis-church");
  assert.ok(mall.orderCost("hoodie-kharis-church", "express") > mall.orderCost("hoodie-kharis-church", "standard"));
});

test("game buildings are walk-in lobbies with a cabinet per game", async () => {
  const l = await load("./world-runtime/source/game/core/lobbies.ts");
  const hall = l.lobbyMap("lobby-grace-hall@city");
  assert.equal(hall.portals.filter((p) => p.id.startsWith("cab-")).length, 16);
  assert.ok(hall.portals.some((p) => p.to.kind === "map" && p.to.mapId === "city"));
  const mall = l.mallMap();
  assert.equal(mall.portals.filter((p) => p.to.kind === "mall").length, 5);
  const i = await load("./world-runtime/source/game/core/islands.ts");
  const city = i.islandMap("city");
  for (const id of ["grace-hall", "social-house", "mall", "my-house"]) assert.ok(city.portals.find((p) => p.id === id)?.to.kind === "map", id);
});

test("friend codes are stable and friendships need both parents", async () => {
  const f = await import("./server/friends.mjs");
  assert.equal(await f.friendCode("child-1"), await f.friendCode("child-1"));
  assert.match(await f.friendCode("child-1"), /^[A-Z2-9]{8}$/);
  assert.deepEqual(f.pair("b", "a"), ["a", "b"]);
  assert.equal(f.isActive({ accepted: 1, a_parent_ok: 1, b_parent_ok: 0 }), false);
  assert.equal(f.isActive({ accepted: 1, a_parent_ok: 1, b_parent_ok: 1 }), true);
  assert.equal(f.isActive({ accepted: 1, a_parent_ok: 1, b_parent_ok: 1, blocked_by: "x" }), false);
});
