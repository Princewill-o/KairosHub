# Kairos World online

Everyone on the same map and server (e.g. `city` · `lse-1`) shares one realtime room.

- **Protocol and rooms:** `server/world-protocol.mjs` (40 players a room, 10 updates a second,
  chat filter and rate limits, no teleporting, idle kick).
- **Cloudflare (default):** `server/world-durable.mjs`, a Durable Object `WorldRoom` per room, routed from
  `/api/world/connect?map=…&server=…` in `server/worker.mjs`. Bound in `wrangler.jsonc` as `WORLD_ROOMS`.
  `npm run dev` runs it locally through wrangler.
- **Self-hosted Node:** `npm run world-server` (`PORT`, `ALLOWED_ORIGINS`), health at `/health`.
  Point the game at it with `<meta name="kairos-world-server" content="wss://your-host">`,
  `window.KAIROS_WORLD_SERVER`, or `localStorage['kairos-world-server']` (and add that host to `connect-src`).
- **Client:** `world-runtime/bridge/platform.tsx` `useWorld`: hello, moves, chat, ping, reconnect with backoff.
  Kairos Life (offline), story mode and your home stay solo.

Vercel can't hold WebSockets; on Vercel use the Node server elsewhere and set `kairos-world-server`.
