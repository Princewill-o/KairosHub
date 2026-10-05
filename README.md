# Kairos — Scripture & Play

# KairosGames

# KairosHub

Kairos is a mobile-first web app for Safari, iPhone, iPad and desktop browsers. It has a bottom tab bar, touch controls, safe-area spacing and a Home Screen manifest. On iPhone, use Safari’s Share menu and Add to Home Screen. It uses the existing web runtime, with an app-style interface; it is not a React Native binary.

Unity is disabled in the website and development server. Its source and old integration are archived under `unity/` for possible future use. Old Unity links redirect to the corresponding browser games.

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
node tests/bible-browser.mjs
node tests/welcome-browser.mjs
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

## Free Scripture reader

Every main screen includes **Read Scripture**. Enter a chapter or passage (for example `John 3:16-18`) to read World English Bible text through the same-origin `/api/scripture` endpoint. Existing KJV game quotations and answer keys remain unchanged and retain their labels. The reader identifies WEB explicitly because wording differs.

Source: [bible-api.com](https://bible-api.com), [MIT-licensed API source](https://github.com/seven1m/bible_api). WEB text is public domain. No API key, paid Bible subscription, copied Bible.com pages, or forked server is required. The public service currently limits requests to 15 per 30 seconds per IP and does not guarantee availability. Deployment hosting is separate from this free Scripture service.

Successful passages receive a one-day edge-cache header and up to 40 passages are saved locally for offline reading. Storage failures do not prevent online reading. New uncached passages require internet; errors and rate limits allow retry. Existing games continue using bundled content, so an API outage does not block their rounds. The reader accepts one chapter or verse range per lookup; split cross-book or multi-chapter references into separate lookups.

Checks: `node --test scripture.test.mjs` and `node tests/scripture-browser.mjs` (after `npm run build`; uses installed Chrome on a phone-sized viewport).
