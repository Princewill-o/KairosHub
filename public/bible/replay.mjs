import { drawFromBag } from "../random.mjs";
// Keep independently shuffled, persistent bags per player and activity. Only
// pool indices are saved; answers and personal profile details are not copied.
export function createReplayDecks({
  storage,
  playerId = "guest",
  rng = Math.random,
} = {}) {
  const memory = new Map();
  return function draw(key, pool, count = 1) {
    if (!pool.length || count <= 0) return [];
    const player = typeof playerId === "function" ? playerId() : playerId;
    const storeKey = `kairos-replay-v1:${player || "guest"}:${key}`;
    let fingerprint = 2166136261;
    for (const char of JSON.stringify(pool))
      fingerprint = Math.imul(fingerprint ^ char.charCodeAt(0), 16777619) >>> 0;
    let state = memory.get(storeKey) || {};
    try {
      const target = storage === undefined ? globalThis.localStorage : storage;
      const raw = JSON.parse(target?.getItem(storeKey) || "null");
      if (raw && typeof raw === "object") state = raw;
    } catch {}
    if (state.fingerprint !== fingerprint) state = {};
    const result = drawFromBag(
      pool,
      Math.min(Math.floor(count), pool.length),
      state,
      rng,
    );
    const next = { ...result.state, fingerprint };
    memory.set(storeKey, next);
    try {
      const target = storage === undefined ? globalThis.localStorage : storage;
      target?.setItem(storeKey, JSON.stringify(next));
    } catch {}
    return result.items;
  };
}
