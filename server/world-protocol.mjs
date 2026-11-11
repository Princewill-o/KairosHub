/**
 * Kairos World realtime rooms: one room per map and server (e.g. city · lse-1).
 * Transport-agnostic: the Cloudflare Durable Object and the Node `ws` server
 * both feed sockets into the same room logic.
 *
 * Client → server  {t:"hello", name, avatar, badge, affiliation, x, y}
 *                  {t:"move", x, y, d, car, heading}
 *                  {t:"chat", text}      {t:"ping", at}
 * Server → client  {t:"welcome", id, players, capacity}
 *                  {t:"join", p}  {t:"leave", id}  {t:"chat", id, name, text}
 *                  {t:"state", ps:[[id, x, y, heading, car, d]]}  (10 per second, only who moved)
 *                  {t:"pong", at, count}  {t:"full"}  {t:"error", message}
 */
export const ROOM_CAPACITY = 40;
export const TICK_MS = 100;
const MAX_MESSAGE = 6000;
const CHAT_GAP_MS = 900;
const MOVE_GAP_MS = 40;
const IDLE_KICK_MS = 120_000;

const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
const num = (v, lo, hi, d = 0) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : d);
const BLOCKED = /\b(fuck|shit|cunt|nigg|fag|retard|bitch|whore|slut|kys)\w*/gi;
export const filterChat = (text) => clean(text, 140).replace(BLOCKED, (w) => "*".repeat(w.length));

/** Keep only plain JSON avatar fields of bounded size. */
function safeAvatar(a) {
  if (!a || typeof a !== "object" || Array.isArray(a)) return {};
  const out = {};
  for (const [k, v] of Object.entries(a).slice(0, 40)) {
    if (typeof v === "string" && v.length <= (k === "skin64" ? 40000 : 64)) out[k] = v;
    else if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (v && typeof v === "object" && !Array.isArray(v) && JSON.stringify(v).length < 42000) out[k] = safeAvatar(v);
  }
  return out;
}

export function createRoom({ capacity = ROOM_CAPACITY, now = () => Date.now() } = {}) {
  /** id → { send, p:{id,username,avatar,badge,affiliation,x,y,d,heading,car}, dirty, lastMove, lastChat, seen } */
  const clients = new Map();
  let seq = 0;
  const others = (id) => [...clients.entries()].filter(([k, c]) => k !== id && c.p);
  const broadcast = (msg, except) => { const s = JSON.stringify(msg); for (const [id, c] of clients) if (id !== except && c.p) c.send(s); };
  const pub = (p) => ({ id: p.id, username: p.username, avatar: p.avatar, badge: p.badge, affiliation: p.affiliation, x: p.x, y: p.y, d: p.d, heading: p.heading, car: p.car });

  return {
    get size() { return [...clients.values()].filter((c) => c.p).length; },
    /** A socket connected. Returns its id, or null if the room is full. */
    open(send) {
      if (clients.size >= capacity) { send(JSON.stringify({ t: "full" })); return null; }
      const id = `p${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      clients.set(id, { send, p: null, dirty: false, lastMove: 0, lastChat: 0, seen: now() });
      return id;
    },
    close(id) {
      const c = clients.get(id);
      clients.delete(id);
      if (c?.p) broadcast({ t: "leave", id });
    },
    message(id, raw) {
      const c = clients.get(id);
      if (!c || typeof raw !== "string" || raw.length > MAX_MESSAGE * 8) return;
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (!m || typeof m !== "object") return;
      const t = now();
      c.seen = t;
      if (m.t === "hello" && !c.p) {
        c.p = { id, username: clean(m.name, 24) || "Guest", avatar: safeAvatar(m.avatar), badge: clean(m.badge, 32) || null, affiliation: m.affiliation && typeof m.affiliation === "object" ? { kind: clean(m.affiliation.kind, 12), label: clean(m.affiliation.label, 40), icon: clean(m.affiliation.icon, 16) } : null, x: num(m.x, 0, 1e5), y: num(m.y, 0, 1e5), d: 0, heading: 0, car: null };
        c.send(JSON.stringify({ t: "welcome", id, capacity, players: others(id).map(([, o]) => pub(o.p)) }));
        broadcast({ t: "join", p: pub(c.p) }, id);
        return;
      }
      if (!c.p) return;
      if (m.t === "move") {
        if (t - c.lastMove < MOVE_GAP_MS) return;
        c.lastMove = t;
        // No teleporting: a single update can move at most ~60 tiles' worth of pixels.
        const nx = num(m.x, 0, 1e5, c.p.x), ny = num(m.y, 0, 1e5, c.p.y);
        if (Math.hypot(nx - c.p.x, ny - c.p.y) > 2000 && m.teleport !== true) return;
        Object.assign(c.p, { x: nx, y: ny, d: num(m.d, 0, 7), heading: num(m.heading, -10, 10), car: m.car ? clean(m.car, 32) : null });
        c.dirty = true;
      } else if (m.t === "chat") {
        if (t - c.lastChat < CHAT_GAP_MS) return;
        c.lastChat = t;
        const text = filterChat(m.text);
        if (text) broadcast({ t: "chat", id, name: c.p.username, text });
      } else if (m.t === "avatar") {
        c.p.avatar = safeAvatar(m.avatar);
        broadcast({ t: "join", p: pub(c.p) }, id);
      } else if (m.t === "ping") {
        c.send(JSON.stringify({ t: "pong", at: num(m.at, 0, 1e15), count: this.size }));
      }
    },
    /** Called every TICK_MS: send who moved, drop idle sockets. */
    tick() {
      const t = now();
      for (const [id, c] of clients) if (t - c.seen > IDLE_KICK_MS) { try { c.send(JSON.stringify({ t: "error", message: "Disconnected for being idle." })); } catch { /* gone */ } this.close(id); }
      const moved = [...clients.values()].filter((c) => c.p && c.dirty);
      if (!moved.length) return;
      const ps = moved.map((c) => { c.dirty = false; return [c.p.id, Math.round(c.p.x), Math.round(c.p.y), Math.round(c.p.heading * 100) / 100, c.p.car, c.p.d]; });
      broadcast({ t: "state", ps });
    },
  };
}

/** Room key from the URL: map and server ids, both short and safe. */
export function roomKey(url) {
  const u = new URL(url);
  const map = (u.searchParams.get("map") || "city").replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "city";
  const server = (u.searchParams.get("server") || "lse-1").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "lse-1";
  return `${map}:${server}`;
}
