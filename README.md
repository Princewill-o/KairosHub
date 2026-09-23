# Kairos — Scripture & Play

# KairosGames

# KairosHub

Unity source integration is under [`unity/`](unity/README.md). The **Unity preview** navigation link loads an installed export or offers the working browser game. Five prototype game loops and a direct-IP networking layer are present in source; Unity compilation and device/LAN verification remain pending. See the Unity README for exact feature gaps and build commands.

A server-backed Scripture & Play game library with randomized solo rounds, two 2D adventures, and online multiplayer.

## Run

```sh
npm run dev
```

Open http://localhost:4173. `npm run dev` builds the Worker, applies the local D1 migration, and starts Wrangler. All game assets are local.

## Games

1. Verse Rebuild — randomized passage choices and phrase tiles in Seeker mode; individual words and distractors in Growth. Correct slots stay locked on retry.
2. Prayer Compass — three ACTS scenarios, click or drag placement, optional browser speech readback.
3. Walk in Their Sandals — five story arcs, canon outcomes, explicitly fictional alternate branches, and return-to-Scripture dialogs.
4. Parable Detective — three randomized parables, illustrated clue panels, and interpretation matching.
5. Covenant Timeline — eight connected events, click/drag ordering, and bridge captions.
6. Armor Up — six scenarios, equipment slots, and contextual explanations.
7. Wisdom or World — eighteen sayings selected from an expanded bank, tap/swipe/arrow sorting, explanations, and optional round deadlines.
8. Trace the Journey — four legs of Paul’s first missionary journey on a simplified geographical map with zoom and scroll/pan.
9. Fruit Garden — nine scenario matches; persistent seed → sprout → bud → bloom growth over repeated plays.
10. Psalms Fill-the-Blank — an expanded Psalm and short-verse bank, three progressively harder recall passes, multiple choice in Seeker and timed typing in Growth.
11. Shepherd’s Meadow — a randomly generated 2D map, WASD/arrow movement, wall collision, touch D-pad, and five sheep to lead home.
12. Scroll Quest — a new 2D map each run, WASD/arrow movement, touch D-pad, six hidden scrolls, and randomized Bible questions.
13. Guess the Chapter — 2–8 player D1-backed rooms with invite codes, rotating describers, hidden chapter cards, live clues, server-authoritative guesses and scoring, timed rounds, reconnection, host handoff, rematches, and room expiry.

The supplied specification informs content and interactions. The user's explicit asset request overrides its suggested line-art visual direction. UI uses parchment, purple, gold, supplied cartoon icons, supplied button textures, and pixel-art environments. Scene illustrations are imaginative, not historical reconstructions. Prayer lines and story summaries are original paraphrases. Quoted passages are labeled KJV.

## Progress

Solo mode, sound preference, best scores, completion counts, daily streaks, garden growth, mastered verses, and optional reflections are stored in this browser under `kairos-learning-v2`. Multiplayer room state, scores, messages, rate limits, expiry, and reconnect sessions are stored in Cloudflare D1. Secret chapter cards are only returned to the describer or after reveal.

Seeker mode has no deadline. Growth adds an elapsed-time indicator, a verse score time penalty, timed wisdom sorting, and timed Psalm recall. Pause and hidden tabs suspend game clocks; prayer speech pauses with the pause control. The garden, geography, and prayer games retain forgiving retries.

## Checks

```sh
npm test
npm run build
node tests/api-check.mjs
node tests/multiplayer-browser.mjs
```

The checks cover randomized decks, generated map reachability and movement collision, D1/API authorization and idempotency, hidden multiplayer answers, concurrent scoring, rejected chapter leaks, reconnection, host permissions, and browser multiplayer flows.

## Files

- `public/`: browser shell, solo games, randomization, 2D adventure modules, and multiplayer UI.
- `server/`: D1 room API, secret chapter deck, rate limiting, authorization, and Worker entrypoint.
- `db/schema.ts`, `drizzle/`: rooms and rate-limit schema/migration.
- `scripts/build.mjs`, `scripts/dev.mjs`: local Worker build and D1/Wrangler development commands.
- `dist/server/index.js`: generated deployable Worker bundle.
- `ARTWORK.md`: asset provenance and supplied license limitations.

The old mini-game implementations, generated world/ark artwork, downloaded asset bundle, and obsolete tests have been removed. The unrelated `src/ChristmasGift.java` and IDE files are preserved.
