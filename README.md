# Kairos — Scripture & Play

# KairosGames

# KairosHub

PlayMessages is now playable at `#messages`: ten different sermon-inspired stories with original casts, thirty illustrated scenes, branching decisions, timed David Antwi sermon snippets, transcripts and saved conclusions. See [PLAYMESSAGES.md](PLAYMESSAGES.md) for sources, controls, save behaviour and verification. The Bible library uses original low-poly SVG objects and includes additional November content. Kairos World remains temporarily locked.

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

Device-only profiles retain local progress. Family accounts save the 16 Bible games’ per-child results, best scores, stars and streaks in the Kharis Supabase Postgres database, with an offline retry queue. Legacy solo mode, sound preference, garden growth, mastered verses and optional reflections remain in this browser under `kairos-learning-v2`. Multiplayer room state, scores, messages, rate limits, expiry, and reconnect sessions are stored in Cloudflare D1. Secret chapter cards are only returned to the describer or after reveal.

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

## Vercel deployment

`vercel.json` serves `public/` and runs `/api/gateway` as a Node function. `node scripts/build-vercel.mjs` refreshes the offline manifest without bundling Unity. Deploy with `npx vercel --prod` after signing in.

Scripture lookup runs directly on Vercel. Online Guess the Chapter rooms use the existing public Kairos backend at `https://kairos-story-games.packzpackz50.chatgpt.site`; keep that service running. The room proxy forwards bearer room tokens, never client-supplied account identity headers. The separate family relay forwards only its dedicated family cookie and validated origin. Solo games and device-only profiles work on Vercel. The family dashboard uses Supabase; add the exact deployed Vercel origin to the Edge Function’s `KAIROS_ALLOWED_ORIGINS` setting before using it there. The separate arcade account sign-in opens the original Kairos site; its account session and browser-local progress are not shared across domains. LAN arcade multiplayer still requires the local `npm run lan` server; Vercel does not host its WebSocket relay.

## Family accounts and dashboards

Choose **I’m a parent or guardian** on the welcome screen, or open `#family` for sign-in (`#family/signup` for registration). A parent creates an email/password account, records consent, and adds children aged 4–17 using a nickname, age and guide character. The dashboard shows each child’s game results, stars, category coverage, streak and recent activity across all 16 Bible games. Children use **My journey**; starting a child session locks parent access until the password is entered again. Family accounts do not depend on ChatGPT sign-in.

`server/family.mjs` runs in the deployed `kairos-family` Supabase Edge Function. `server/family-postgres.mjs` binds its queries to the private `kairos_games` schema. `supabase/migrations/20261025220759_kairos_games_family.sql` adds accounts, children, scoped sessions, individual game results and authentication rate limits. The existing family password/session system is retained; it is independent of the older Kharis application’s Supabase Auth users. Passwords use salted PBKDF2; session tokens are random and only hashes are stored. Cookies are HttpOnly, SameSite=Strict and Secure on HTTPS. Write requests require the same origin. Reads and writes check family ownership and child scope. Repeated result IDs count once. Dates and streaks in family accounts use UTC. Offline completion times come from the device clock, capped to the past year; results are practice scores reported by the game, not an independently verified assessment.

Completed games queue locally when offline and retry when the connection returns or **Sync now** is selected. If browser storage is blocked, pending results remain in memory only until the page closes. Older device-only profiles remain available and are not silently uploaded or merged into new family profiles. Email ownership verification and password recovery are not connected; keep the family password safe. Device-only profiles and their grown-up maths check remain a separate option.

`npm run dev` applies local D1 migrations for multiplayer and starts the app connected to the real Supabase family backend. Both the Worker and Vercel relay family requests to Supabase. The Kharis project (`yrqkafiqwllkphroztqk`) is restored and the family migration and Edge Function are deployed. Building alone does not update the public website; deploy the merged frontend/Worker separately. Sessions are separate on each site hostname, but signing in with the same family credentials retrieves the same children and results. `/api/profile` continues to use the separate hosted arcade identity.

Additional checks:

```sh
node --test family.test.mjs family-client.test.mjs vercel-deployment.test.mjs
node tests/family-browser.mjs
```

The browser flow covers family registration, parent locking, offline results, retries, reloads, a second browser, sibling isolation, logout, offline reloads, blocked browser storage and phone/desktop layouts. Run it against the local development server; it creates fictional test families. It requires an installed Playwright Chromium browser (`npx playwright install chromium --only-shell`).

## Kairos World integration

Together now includes **Kairos World**, imported from the local KairosLife game. Run `npm run dev` and open `http://127.0.0.1:4173/#multiplayer`. Choose a player, then enter the world. KairosHub's existing landing page is preserved. See [world-runtime/README.md](world-runtime/README.md) for builds, source models, local progress, and backend limitations.


## Expanded game resources and replay

All 16 Bible games use larger bundled banks and per-player replay bags saved under `kairos-replay-v1:`. A bag uses its available content before reshuffling; reloading the page does not restart the rotation. Storage failure falls back to memory. Questions, clues and story summaries are original paraphrases with Scripture references. KJV verse and scavenger-hunt excerpts were checked against the public-domain KJV text served by [HelloAO](https://bible.helloao.org/api/eng_kjv/books.json).

| Resource | Previous | Expanded |
| --- | ---: | ---: |
| Quiz / Trivia / Jeopardy questions | 38 | 220 |
| KJV excerpts | 16 | 56 |
| Word-search sets | 3 | 29 |
| Crossword boards | 1 | 12 |
| Charades / Pictionary prompts | 12 | 70 |
| Character clue sets | 6 | 48 |
| Ordered stories | 3 | 28 |
| Scripture hunts | 5 | 36 |
| Map locations | 8 | 31 |
| Escape puzzles | 4 | 40 |
| Memory names | 8 | 65 |
| Hangman names | 6 | 63 |

Bingo draws distinct answer tiles. Map rounds show four candidate pins to keep the expanded atlas usable on phones. Crosswords rotate complete boards, rather than repeating the same six clues. Round sizes remain 9 Quiz questions, 8 Trivia questions, 6 verse/map rounds, 5 hunts or party prompts, 4 character/escape rounds, 3 story sequences or hangman names, and 6 Memory pairs. Difficulty levels remain separate in Quiz and Jeopardy.

Scroll Quest shares the larger question bank (253 questions), older verse games have 60 passages, and Armor Up and Fruit Garden each have seven scenarios per item or virtue. The latest Kairos World integration is retained; its 24-chapter story campaign and world saves remain separate, device-local features.

Run `node --test content-expansion.test.mjs supabase.test.mjs` and `node tests/content-browser.mjs` alongside the existing checks.

## Kairos World temporarily locked

Kairos World is currently unavailable while it is unfinished. Together and `#world` display a Coming soon notice; the standalone `/world/index.html` entry also shows the notice without loading the game. The runtime refuses to mount while `WORLD_ENABLED` is false in `public/world-availability.mjs`. Existing source, artwork and saved progress are preserved. Re-enabling it requires changing the flag and rebuilding.
