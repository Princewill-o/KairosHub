import test from "node:test";
import assert from "node:assert/strict";
import * as content from "./public/bible/content.mjs";
import { bibleCrossword, bibleWordGrid } from "./public/learning-engine.mjs";
import { createReplayDecks } from "./public/bible/replay.mjs";
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) || null, setItem: (k, v) => m.set(k, v) };
};
test("every Bible activity has a substantially larger, referenced content bank", () => {
  for (const [key, min] of Object.entries({
    questions: 180,
    verses: 48,
    wordSets: 24,
    crosswords: 12,
    prompts: 60,
    characters: 36,
    stories: 24,
    hunts: 30,
    locations: 24,
    escapeRooms: 32,
    memoryLabels: 48,
    hangmanWords: 48,
  }))
    assert.ok(
      content[key]?.length >= min,
      `${key} needs at least ${min} entries`,
    );
  for (const q of content.questions) {
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.answer));
    assert.ok(q.ref);
    assert.ok([1, 2, 3].includes(q.level));
  }
  assert.equal(
    new Set(content.questions.map((q) => q.prompt)).size,
    content.questions.length,
    "no duplicate questions to inflate the bank",
  );
  for (const category of ["People", "Places", "Books"])
    for (const level of [1, 2, 3])
      assert.ok(
        content.questions.filter(
          (q) => q.category === category && q.level === level,
        ).length >= 8,
        `${category} ${level} has a varied Jeopardy bank`,
      );
  for (const key of [
    "verses",
    "prompts",
    "characters",
    "stories",
    "hunts",
    "locations",
    "escapeRooms",
  ])
    for (const item of content[key])
      assert.ok(item.ref, `${key} needs Scripture references`);
});
test("all added word searches and crossword variants have valid, complete solutions", () => {
  for (const words of content.wordSets) {
    assert.equal(words.length, 6);
    assert.equal(new Set(words).size, 6);
    for (const word of words) assert.match(word, /^[A-Z]{2,10}$/);
    const { grid, paths } = bibleWordGrid(words, () => 0);
    for (const word of words)
      assert.equal(
        paths[word].map((i) => grid[Math.floor(i / 10)][i % 10]).join(""),
        word,
      );
  }
  for (const entries of content.crosswords) {
    const board = bibleCrossword(entries);
    assert.ok(entries.length >= 5);
    for (const entry of entries)
      for (let i = 0; i < entry.word.length; i++)
        assert.equal(
          board[entry.row + (entry.dir === "down" ? i : 0)][
            entry.col + (entry.dir === "across" ? i : 0)
          ],
          entry.word[i],
          entry.word + " crossing",
        );
  }
});
test("replay decks exhaust the pool before repeating and persist across reloads per player", () => {
  const storage = memory(),
    pool = Array.from({ length: 12 }, (_, id) => ({ id }));
  const draw = createReplayDecks({ storage, playerId: "ama", rng: () => 0.2 });
  const first = draw("quiz", pool, 6);
  const reloaded = createReplayDecks({
    storage,
    playerId: "ama",
    rng: () => 0.2,
  });
  const next = reloaded("quiz", pool, 6);
  assert.equal(new Set([...first, ...next].map((q) => q.id)).size, 12);
  const sibling = createReplayDecks({
    storage,
    playerId: "leo",
    rng: () => 0.2,
  });
  assert.deepEqual(sibling("quiz", pool, 6), first);
  const lap = reloaded("quiz", pool, 6);
  assert.equal(new Set(lap.map((q) => q.id)).size, 6);
  assert.notEqual(lap[0].id, next.at(-1).id);
});
test("blocked or corrupt storage keeps non-repeating rounds usable in memory", () => {
  const storage = {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("blocked");
      },
    },
    pool = ["A", "B", "C", "D"];
  const draw = createReplayDecks({ storage, rng: () => 0.3 });
  assert.equal(
    new Set([...draw("words", pool, 2), ...draw("words", pool, 2)]).size,
    4,
  );
  const corrupt = createReplayDecks({
    storage: { getItem: () => "{broken", setItem() {} },
    rng: () => 0.4,
  });
  assert.equal(corrupt("words", pool, 3).length, 3);
});

test("Scroll Quest and the older verse games share the larger content bank", async () => {
  const { trivia, armorAlternates, fruitAlternates } = await import(
    "./public/extra-content.mjs"
  );
  const { verses } = await import("./public/content.mjs");
  assert.ok(trivia.length >= 200);
  assert.ok(verses.length >= 48);
  for (const options of Object.values(armorAlternates))
    assert.ok(options.length >= 6);
  for (const options of Object.values(fruitAlternates))
    assert.ok(options.length >= 6);
});
