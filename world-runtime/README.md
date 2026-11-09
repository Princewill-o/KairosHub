# Kairos World in KairosHub

Imported from local KairosLife into KairosHub on 20 October 2026. As of 9 November, the platform opens directly into fullscreen Kairos World. Its game library, stories, character studio, social space, Scripture and progress open in the in-game browser **Grace**. See [GRACE_WORLD.md](../GRACE_WORLD.md). Guess the Chapter and its online room entry points remain removed.

## Run and build

`npm install`, then `npm run dev`. Open `http://127.0.0.1:4173/` to enter the world with a local guest profile. `npm run build:world` builds the world alone, including the actual 3D character studio preview. `npm run build` and the Vercel build include it automatically. Workers use the `ASSETS` binding for the models and runtime rather than embedding them in the Worker bundle.

`source/` contains the imported game modules. `bridge/` replaces Next.js navigation and server actions with KairosHub navigation and device storage. React and Three.js run inside a same-origin frame, keeping the existing site styles separate. Source Blender models and generation scripts are in `art-sources/`.

## Included

London, church woodland, train stations and islands, LTBS, four six-chapter story adventures (David, Ruth, Esther and Daniel), Scripture challenges, outreach NPCs, toy character customisation, walking/jumping, zoom, buses, mountains, and the church model. The inherited soft lighting is retained. Large world assets load on entry and are excluded from the initial offline precache.

## Data and limits

Progress is saved in this browser under `kairos-world:<selected player id>:`. The frame receives only the player's ID and display name after origin and source checks. Story Grace, chapters, appearance, home layout, purchases and activities use scoped storage. My journey displays a world summary. Storage failures fall back to memory for this session. Saves from the separate KairosLife origin are not automatically imported.

World exploration is local with fictional NPCs. The London branch label does not represent verified church membership or an online connection. Supabase credentials, sessions and backend tables were not copied. Cross-device world saves, shared world presence and remote parental reporting require an authenticated backend integration.

The in-world reader offers KJV and NKJV only. KJV uses a fixed HelloAO source through a same-origin route; NKJV links to the publisher reader because licensed in-app access is not configured. No translation is silently substituted. The pre-existing KairosHub passage reader retains its implementation.

Checks: `npm test`, `npm run build`, and HTTP checks of the local entry, chunks, styles, models and Scripture routes. The 9 November browser pass covered world entry, actual 3D character customization and Quiz Arena door → Grace → playable Bible Quiz. Later visual verification was limited when browser control became disabled in Work settings. See `artwork/verification/grace-world-checks.md`.
