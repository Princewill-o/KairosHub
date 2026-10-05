# Kairos design

A parchment game library with deep purple text and controls, gentle gold success states, clay retry states, and pastel category cards. The supplied cartoon icon pack illustrates the games; the supplied Cartoon UI Pack textures primary buttons and reward stars. Cute Fantasy pixel sprites form the home village and story environments. Preserve crisp pixel scaling with `image-rendering: pixelated`.

The home screen leads with three new activities: Shepherd’s Meadow, Scroll Quest, and Guess the Chapter. The solo library follows with the original cards. Multiplayer has a room code, connection state, player list, live log, and responsive host/guest states. Mobile maps and timelines scroll internally without widening the page.

Use native buttons, links, selects, text fields, and dialogs. All drag interactions have click/tap alternatives. Wisdom supports arrow keys and swipes. Native dialogs trap focus and close safely to the scriptural account. Controls have visible focus states, text feedback accompanies sound, and reduced motion disables decorative animation. Pause hides and disables the game surface and suspends timing; browser-hidden tabs suspend clocks.

Scenes are imaginative illustrations. Alternate story outcomes are explicitly labeled Non-Canon Branch and cannot silently rejoin the biblical narrative. Scripture quotations identify their translation; summaries and prayers are distinguished from quotations. Solo progress and reflections are device-local. Multiplayer room state is server-backed; the client retains only a room token needed to reconnect this tab. Secret chapter data is never sent to guessers during an active round.

2D adventures use crisp pixel art, a canvas playfield, WASD and arrow controls, a touch D-pad, generated walkable maps, reachable objectives, and a home exit.

## October 2026 kids refresh (Bible collection)

The Bible collection uses a "board-game pieces" look: chunky tiles with a 2.5px plum outline and a hard drop shadow that presses down when tapped. Tokens live in `public/theme.css` (`--kg-*`), loaded last so they settle older styles. Colours: parchment `#fbf4e2`, plum ink `#2e1a47`, Kharis violet `#6b3fa0`, halo gold `#f5b83d`, green for right answers and rose for retries. Category tints: Knowledge lilac, Puzzles mint, Together peach, Explore sky. Type: Fredoka for headings and buttons, Nunito for body text (Google Fonts, allowed by the Worker CSP; rounded system fonts are the offline fallback).

Each game card shows its own supplied cartoon icon. Answer buttons turn green or rose with a tick or cross, feedback sits inside the game board and scrolls into view, and a gold progress bar tracks each round. Results award one to three stars (any finish, 60%, 90%), and My journey shows stars, games played, the daily streak and each game's best score. The map game uses simplified real coastlines with unlabelled pins, so the answer is no longer given away. Word Search supports dragging; Story Ordering supports tap-to-swap; Memory cards flip. Phone navigation has three tabs: Games, Together, My journey.

Guide characters (`public/bible/mascot.mjs`) are drawn in the same outlined style. Children choose one of five (Kai, Ama, Leo, Mei, Theo) at `#character`, reached from the hero and My journey; the choice is saved on the device under `kairos-guide-v1`, and Kai is the default. The chosen guide waves from the hero scene, reads a scroll on game intros, cheers or encourages beside answer feedback and results, thinks on the pause screen and in empty searches, and celebrates in My journey. Their eyes blink and the hero lamb nibbles only when reduced motion is off.

The site logo is the dove with an olive branch the user supplied, traced to keep its exact shape and restyled with white strokes, a plum outline and a hard shadow (`public/assets/brand/`). It sits on a violet badge in the top bar and is used for the favicon and the Home Screen icons. The library has a "Coming soon" banner for PlayMessages, a bigger game still in development. It is deliberately not clickable.

## Accounts, age check and two platforms (October 2026)

With no active player, every route goes to `#welcome` (`public/welcome.mjs`): "Who's playing?" lists saved players and offers "I'm playing" or "I'm a parent or guardian". Ages are picked on a scroll-snap age bar (also arrow keys, Home/End, and plus/minus buttons). Players aged 16 or over create their own account (first name, email typed twice, terms). Players under 16 see "Let's get a grown-up"; the parent (18+) gives a first name, email typed twice and consent, then adds the child with a first name or nickname only. Rules and storage are in `public/accounts.mjs` (tested in `accounts.test.mjs`); no passwords are collected, and each sign-up fires a `kairos:account` window event so the host platform can create real accounts, verify emails and record consent. Progress is stored per player.

Players 18 and over get **KairosGames**: `html[data-audience="adult"]` switches `public/audience.css` to a dark neon gaming look (Sora and Manrope, soft glows instead of toy shadows, a night hero scene) and draws the characters with older proportions. Everyone younger gets **KairosGames Kids** with the Kids badge in the top bar. "Switch player" in My journey asks a simple grown-up maths question on a Kids profile.
