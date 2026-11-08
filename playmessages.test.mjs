import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { series } from "./public/playmessages/content.mjs";
import {
  freshRun,
  advance,
  choose,
  restoreRun,
  endingFor,
  graceFor,
} from "./public/playmessages/engine.mjs";
import { storyStorage } from "./public/playmessages/storage.mjs";

test("ten distinct messages have complete playable chapters and local transcripts", async () => {
  assert.equal(series.length, 10);
  assert.equal(new Set(series.map((s) => s.video)).size, 10);
  for (const s of series) {
    assert.match(s.video, /^[\w-]{11}$/);
    assert.equal(s.episodes.length, 3);
    assert.equal(s.endings.length, 3);
    await access(`public/playmessages/transcripts/${s.video}.txt`);
    for (const e of s.episodes) {
      assert.equal(e.choices.length, 3);
      assert.ok(e.clip.start >= 0 && e.clip.end > e.clip.start);
      assert.ok(e.clip.end - e.clip.start <= 150);
      assert.ok(e.reading);
      for (const c of e.choices) {
        assert.ok(c.reply && c.consequence && c.action && c.resolution);
      }
    }
  }
});
const play = (s, choice, act) => {
  let r = freshRun();
  for (let i = 0; i < 3; i++) {
    r = advance(r, s);
    r = choose(r, s, choice);
    r = advance(r, s);
    r = advance(r, s);
    r = choose(r, s, act);
    r = advance(r, s);
    r = advance(r, s);
  }
  return r;
};
test("every series branches, reaches three conclusions and earns bounded progress", () => {
  for (const s of series) {
    const good = play(s, 0, 0),
      mixed = play(s, 1, 1),
      poor = play(s, 2, 1);
    assert.equal(good.stage, "ending");
    assert.equal(poor.stage, "ending");
    assert.equal(
      new Set([
        endingFor(good, s).title,
        endingFor(mixed, s).title,
        endingFor(poor, s).title,
      ]).size,
      3,
    );
    assert.ok(graceFor(good) > graceFor(poor));
    assert.deepEqual(advance(good, s), good);
  }
});
test("blocked transitions and invalid choices never alter a run", () => {
  const s = series[0],
    r = freshRun();
  assert.deepEqual(choose(r, s, 0), r);
  assert.deepEqual(choose(advance(r, s), s, 99), advance(r, s));
});
test("saves are reconstructed from validated events and corrupted saves safely reset", () => {
  const s = series[0],
    r = play(s, 0, 0);
  assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(r)), s), r);
  assert.deepEqual(
    restoreRun({ events: [{ type: "choice", index: 100 }] }, s),
    freshRun(),
  );
  assert.deepEqual(restoreRun(null, s), freshRun());
  assert.deepEqual(
    restoreRun({ events: Array(1000).fill({ type: "next" }) }, s),
    freshRun(),
  );
});
test("routes expose PlayMessages while preserving the World lock", async () => {
  const app = await readFile("public/app.js", "utf8"),
    lib = await readFile("public/bible/games.mjs", "utf8");
  assert.match(app, /mountPlayMessages/);
  assert.match(lib, /#messages/);
  assert.doesNotMatch(lib, /A bigger game is on its way/);
});
test("every clip is inside the official message and has caption cues", async () => {
  const sources = JSON.parse(
    await readFile("public/playmessages/sources.json", "utf8"),
  ).sources;
  for (const s of series) {
    const source = sources.find((v) => v.id === s.video);
    assert.equal(source.channelId, "UC4l8WmdF9ivMDQHHVOdYKqQ");
    const text = await readFile(
      `public/playmessages/transcripts/${s.video}.txt`,
      "utf8",
    );
    const times = [...text.matchAll(/\[(\d+:\d+(?::\d+)?)\]/g)].map((m) =>
      m[1].split(":").reduce((n, v) => n * 60 + Number(v), 0),
    );
    await access(`public/playmessages/art/${s.id}.webp`);
    for (const ep of s.episodes) {
      assert.ok(ep.clip.end <= Number(source.durationSeconds));
      assert.ok(times.some((t) => t >= ep.clip.start && t < ep.clip.end));
    }
  }
});
test("all 216 decision routes per story terminate and restore identically", () => {
  // Three main choices and two follow-through choices per chapter: 6^3 routes.
  for (const s of series)
    for (let route = 0; route < 216; route++) {
      let n = route,
        r = freshRun();
      for (let chapter = 0; chapter < 3; chapter++) {
        const choice = n % 3;
        n = Math.floor(n / 3);
        const act = n % 2;
        n = Math.floor(n / 2);
        r = advance(r, s);
        r = choose(r, s, choice);
        r = advance(r, s);
        r = advance(r, s);
        r = choose(r, s, act);
        r = advance(r, s);
        r = advance(r, s);
      }
      assert.equal(r.stage, "ending");
      assert.deepEqual(restoreRun(r, s), r);
    }
});
test("profile saves stay isolated, keep endings on replay, and never farm Grace", () => {
  const map = new Map(),
    storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) },
    s = series[0];
  const a = storyStorage("player-a", series, storage),
    b = storyStorage("player-b", series, storage);
  a.set(s.id, play(s, 0, 0));
  const reward = a.get(s.id).best;
  assert.equal(b.get(s.id).run.events.length, 0);
  a.restart(s.id);
  assert.equal(a.get(s.id).endings.length, 1);
  assert.equal(a.get(s.id).best, reward);
  a.set(s.id, play(s, 2, 1));
  assert.equal(a.get(s.id).endings.length, 2);
  assert.equal(a.get(s.id).best, reward);
  assert.equal(
    storyStorage("player-a", series, storage).get(s.id).run.stage,
    "ending",
  );
  const blocked = storyStorage("blocked-test", series, {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  });
  blocked.set(s.id, advance(freshRun(), s));
  assert.equal(blocked.saved, false);
  assert.equal(blocked.get(s.id).run.stage, "choice");
  assert.equal(
    storyStorage("blocked-test", series, null).get(s.id).run.stage,
    "choice",
  );
});
