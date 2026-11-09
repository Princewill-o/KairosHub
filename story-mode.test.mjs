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

test("every chapter has a cast, a set and three things to discover", async () => {
  const s = await load("./world-runtime/source/game/core/ltbs-stories.ts");
  const c = await load("./world-runtime/source/game/core/story-cast.ts");
  for (const story of s.BIBLE_STORIES) {
    assert.ok(c.CHARACTERS[story.hero], story.id);
    assert.equal(story.chapters.length, 6);
    for (const [i, ch] of story.chapters.entries()) {
      assert.equal(ch.talk.length, 3, `${story.id} ${i}`);
      for (const t of ch.talk) {
        assert.ok(t.who || t.item, `${story.id} ${i} talk has a person or an object`);
        if (t.who) assert.ok(c.CHARACTERS[t.who], `${t.who} is a known character`);
        assert.ok(t.text.length > 20);
      }
      for (const [who] of ch.cast) assert.ok(c.CHARACTERS[who], `${who} is a known character`);
      assert.ok(ch.set.length > 0, `${story.id} ${i} has scenery`);
      assert.match(ch.opening, /\byou\b|\bYou\b/, `${story.id} ${i} is told to you, the player`);
    }
  }
});

test("everyone is modestly dressed and women's heads are covered", async () => {
  const c = await load("./world-runtime/source/game/core/story-cast.ts");
  const women = ["ruth", "naomi", "orpah", "reaper", "villager", "esther", "attendant"];
  for (const id of women) assert.ok(/veil/.test(c.CHARACTERS[id].costume.head ?? ""), id);
  for (const [id, ch] of Object.entries(c.CHARACTERS)) assert.ok(ch.costume.robe, `${id} wears a full robe`);
});

test("story maps keep discoveries reachable", async () => {
  const w = await load("./world-runtime/source/game/core/story-world.ts");
  const s = await load("./world-runtime/source/game/core/ltbs-stories.ts");
  for (const story of s.BIBLE_STORIES) for (let i = 0; i < 6; i++) {
    const map = w.storyWorldMap(`story-${story.id}-${i}`);
    for (const portal of map.portals) {
      const tx = Math.floor((portal.rect.x + portal.rect.w / 2) / 32), ty = Math.floor((portal.rect.y + portal.rect.h / 2) / 32);
      assert.equal(map.tiles[ty][tx], "g", `${map.id} ${portal.id} stands on open ground`);
    }
    assert.equal(map.tiles[Math.floor(map.spawn.y / 32)][Math.floor(map.spawn.x / 32)], "g");
  }
});
