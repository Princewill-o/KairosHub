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

test("every background has a full, respectful three-beat conversation with Scripture", async () => {
  const m = await load("./world-runtime/source/game/core/ministry.ts");
  for (const [id, s] of Object.entries(m.SCENARIOS)) {
    assert.equal(s.beats.length, 3, id);
    for (const beat of s.beats) {
      assert.equal(beat.answers.length, 3, id);
      const best = beat.answers.filter((a) => a.score === 2);
      assert.ok(best.length >= 1, `${id} has a wise answer`);
      assert.ok(best.some((a) => a.scripture), `${id} wise answers cite Scripture`);
    }
    assert.ok(s.openHeart.length > 20);
  }
  assert.ok(m.PERSONAS.every((p) => m.SCENARIOS[p.background]));
});

test("prayer readiness grows with time spent, fades without prayer, and gates conversations", async () => {
  const m = await load("./world-runtime/source/game/core/ministry.ts");
  const now = Date.UTC(2026, 10, 9, 12);
  const quick = m.prayed(m.PRAYER_DEFAULT, 30, [], now);
  const long = m.prayed(m.PRAYER_DEFAULT, 300, ["Amina", "Sam"], now);
  assert.ok(long.readiness > quick.readiness * 3);
  assert.equal(m.currentReadiness(long, now + 2 * 3_600_000), Math.max(0, long.readiness - 50));
  // Perfect answers without prayer never reach "believer".
  assert.notEqual(m.conversationOutcome(6, 6, 0, false).stage, "believer");
  assert.match(m.conversationOutcome(6, 6, 0, false).note, /John 15:5/);
  assert.equal(m.conversationOutcome(6, 6, 90, true).stage, "believer");
});

test("follow-up steps unlock in order over time and advance the person's journey", async () => {
  const m = await load("./world-runtime/source/game/core/ministry.ts");
  const now = 1_000_000;
  let c = { name: "Sam", background: "agnostic", stage: "open", met: now, steps: {}, lastContact: now, notes: [] };
  assert.equal(m.nextStep(c, now).step.id, "message");
  c = m.completeStep(c, "message", true, now);
  const call = m.nextStep(c, now);
  assert.equal(call.step.id, "call");
  assert.equal(call.ready, false);
  assert.equal(m.nextStep(c, now + 5 * 60_000).ready, true);
  c = m.completeStep(c, "call", true, now + 5 * 60_000);
  assert.equal(c.stage, "seeking");
  assert.equal(m.contactWarmth(c, now + 72 * 3_600_000), "drifting");
});

test("Kharis seasons cover the whole year and billboards rotate real sermons", async () => {
  const k = await load("./world-runtime/source/game/core/kharis-media.ts");
  for (let month = 0; month < 12; month++)
    for (const day of [1, 15, 28]) assert.ok(k.seasonFor(new Date(2026, month, day)).name);
  assert.equal(k.seasonFor(new Date(2026, 0, 10)).id, "new-year-fast");
  assert.equal(k.seasonFor(new Date(2026, 10, 9)).id, "winter-arc");
  assert.ok(k.SERMONS.every((s) => /^[A-Za-z0-9_-]{11}$/.test(s.id)));
  assert.equal(k.LATEST_UPLOADS, "UU4l8WmdF9ivMDQHHVOdYKqQ");
  const kinds = k.BILLBOARD_SPOTS.map((_, i) => k.billboardContent(i, 0).kind);
  assert.ok(kinds.includes("sermon") && kinds.includes("announcement"));
});

test("adaptive resolution steps down under load and recovers with headroom", async () => {
  const v = await load("./world-runtime/source/game/core/visual-quality.ts");
  const adapt = v.adaptivePixelRatio(1.25, 0.8);
  let ratio = 1.25;
  for (let i = 0; i < 400; i++) { const next = adapt(40); if (next !== null) ratio = next; }
  assert.equal(ratio, 0.8);
  for (let i = 0; i < 600; i++) { const next = adapt(8); if (next !== null) ratio = next; }
  assert.equal(ratio, 1.25);
  const profile = v.visualProfile("auto", false, 2);
  assert.equal(profile.postProcessing, true);
  assert.equal(profile.bloom, false);
});

test("clothing options stay modest", async () => {
  const c = await load("./world-runtime/source/game/core/cosmetics.ts");
  const names = c.COSMETICS.map((x) => x.name.toLowerCase()).join(" | ");
  for (const word of [/\bcrop/, /bikini/, /swimsuit/, /\bmini ?skirt/, /tank top/]) assert.ok(!word.test(names), String(word));
  assert.ok(names.includes("knee-length shorts"));
});

test("buildings get real doors; Kharis Church's door is at its front wall, not a teleport ring", async () => {
  const w = await load("./world-runtime/source/game/core/islands.ts");
  const d = await load("./world-runtime/source/game/core/doors.ts");
  const forest = w.islandMap("woodland");
  const doors = d.doorways(forest);
  const church = doors.find((x) => x.portal.id === "kharis-church");
  assert.ok(church, "church portal is a door");
  assert.ok(church.double && church.width < 2 && church.height < 2.6, "normal double-door size");
  assert.ok(Math.abs(church.z - 12.13) < 0.05);
  assert.equal(d.doorOpenTarget(5), 0);
  assert.equal(d.doorOpenTarget(1), 1);
  const wk = await load("./world-runtime/source/game/core/world.ts");
  const hall = wk.churchMap();
  const exit = d.doorways(hall).find((x) => x.portal.id === "church-exit");
  assert.ok(exit?.cutaway, "camera-side exit is a low cut-away");
  // Bus stops and bike docks keep their markers.
  assert.ok(!d.doorways(wk.CITY).some((x) => ["bus", "bike"].includes(x.portal.to.kind)));
});
