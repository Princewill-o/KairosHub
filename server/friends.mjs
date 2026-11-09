/**
 * Friends: messages and voice calls between approved friends.
 *
 * Safety model (players are 4-17):
 *  - Accounts come from the family system. Children can only add friends by
 *    friend code, and a friendship only opens once the other person accepts
 *    AND each child's parent approves it on their dashboard.
 *  - Messages are end-to-end encrypted on the device (ECDH P-256 + AES-GCM).
 *    This server only ever stores ciphertext and cannot read them.
 *  - Because the server can't read messages, "Report" works by the reporter's
 *    device disclosing the messages they choose; reports go to their parent.
 *    Blocking ends the friendship immediately for both sides.
 *  - Calls are peer-to-peer WebRTC audio; this server only relays the
 *    connection setup (offer/answer/ICE), never audio.
 * Requires FAMILY_BACKEND=d1 (family tables in D1) and migration 0003_friends.
 */
const COOKIE = "kairos_family";
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const fail = (message, status = 400) => { throw Object.assign(Error(message), { status }); };
const hex = (bytes) => Array.from(new Uint8Array(bytes), (n) => n.toString(16).padStart(2, "0")).join("");
const sha = async (text) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export async function friendCode(memberId) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("kairos-friend:" + memberId)));
  return Array.from(bytes.slice(0, 8), (b) => CODE_ALPHABET[b % 32]).join("");
}
/** Friendships are stored once, with the two member ids in sorted order. */
export const pair = (x, y) => (x < y ? [x, y] : [y, x]);
export const isActive = (f) => Boolean(f && f.accepted && f.a_parent_ok && f.b_parent_ok && !f.blocked_by);

async function who(request, db) {
  const token = (request.headers.get("cookie") || "").split(";").map((s) => s.trim()).find((s) => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) fail("Sign in with your family account to use Friends.", 401);
  const s = await db.prepare("SELECT * FROM family_sessions WHERE token_hash = ? AND expires_at > ?").bind(await sha(token), Date.now()).first();
  if (!s) fail("Your session has ended. Sign in again.", 401);
  if (s.child_id) {
    const c = await db.prepare("SELECT id, name, age FROM family_children WHERE id = ? AND family_id = ?").bind(s.child_id, s.family_id).first();
    if (!c) fail("Profile not found.", 401);
    return { id: c.id, name: c.name, family: s.family_id, child: true, age: c.age };
  }
  const p = await db.prepare("SELECT id, name FROM family_accounts WHERE id = ?").bind(s.family_id).first();
  return { id: "parent:" + p.id, name: p.name, family: s.family_id, child: false };
}
async function member(db, me) {
  const code = await friendCode(me.id);
  await db.prepare("INSERT INTO friend_members (member_id, family_id, name, code, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET name=excluded.name, updated_at=excluded.updated_at")
    .bind(me.id, me.family, me.name, code, Date.now()).run();
  return code;
}
async function friendshipWith(db, me, other) {
  const [a, b] = pair(me.id, other);
  return db.prepare("SELECT * FROM friendships WHERE a = ? AND b = ?").bind(a, b).first();
}
async function limit(db, key, max) {
  const window = Math.floor(Date.now() / 60_000);
  const row = await db.prepare("INSERT INTO family_auth_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count")
    .bind(`friends:${key}:${window}`, Date.now() + 120_000).first();
  if (row.count > max) fail("Slow down a little and try again in a minute.", 429);
}

export async function handleFriends(request, env) {
  try {
    const db = env.DB;
    if (!db || env.FAMILY_BACKEND !== "d1") fail("Friends needs the family accounts database. Ask an admin to enable it.", 503);
    const url = new URL(request.url), path = url.pathname.slice("/api/friends".length) || "/";
    if (request.method === "POST" && request.headers.get("origin") !== url.origin) fail("Origin not allowed.", 403);
    let body = {};
    if (request.method === "POST") {
      const raw = await request.text();
      if (raw.length > 12_000) fail("That's too long.", 413);
      try { body = JSON.parse(raw || "{}"); } catch { fail("Invalid request."); }
    }
    const me = await who(request, db);
    const code = await member(db, me);

    if (path === "/" && request.method === "GET") {
      const { results } = await db.prepare(
        "SELECT f.*, m.name AS other_name, m.public_key AS other_key, m.member_id AS other FROM friendships f JOIN friend_members m ON m.member_id = CASE WHEN f.a = ? THEN f.b ELSE f.a END WHERE (f.a = ? OR f.b = ?) AND f.blocked_by IS NULL",
      ).bind(me.id, me.id, me.id).all();
      const mine = await db.prepare("SELECT public_key FROM friend_members WHERE member_id = ?").bind(me.id).first();
      return json({
        me: { id: me.id, name: me.name, code, hasKey: Boolean(mine?.public_key), child: me.child },
        friends: results.map((f) => ({
          id: f.other, name: f.other_name, publicKey: isActive(f) ? f.other_key : null,
          status: isActive(f) ? "active" : !f.accepted ? (f.requested_by === me.id ? "sent" : "received") : "awaiting-parents",
        })),
      });
    }
    if (path === "/key" && request.method === "POST") {
      const key = body.publicKey;
      if (!key || typeof key !== "object" || key.kty !== "EC" || key.crv !== "P-256" || key.d) fail("Invalid public key.");
      await db.prepare("UPDATE friend_members SET public_key = ? WHERE member_id = ?").bind(JSON.stringify({ kty: "EC", crv: "P-256", x: key.x, y: key.y }), me.id).run();
      return json({ saved: true });
    }
    if (path === "/request" && request.method === "POST") {
      await limit(db, "request:" + me.id, 10);
      const other = await db.prepare("SELECT member_id, family_id FROM friend_members WHERE code = ?").bind(String(body.code || "").toUpperCase().trim()).first();
      if (!other || other.member_id === me.id) fail("No one has that friend code.", 404);
      const [a, b] = pair(me.id, other.member_id);
      const existing = await friendshipWith(db, me, other.member_id);
      if (existing?.blocked_by) fail("You can't add this person.", 403);
      if (existing) return json({ status: isActive(existing) ? "active" : "pending" });
      // Adults approve themselves; each child's parent must approve for them.
      const selfOk = (id) => (id.startsWith("parent:") ? 1 : 0);
      await db.prepare("INSERT INTO friendships (id, a, b, requested_by, accepted, a_parent_ok, b_parent_ok, created_at) VALUES (?,?,?,?,0,?,?,?)")
        .bind(crypto.randomUUID(), a, b, me.id, selfOk(a), selfOk(b), Date.now()).run();
      return json({ status: "sent" }, 201);
    }
    if (path === "/respond" && request.method === "POST") {
      const f = await friendshipWith(db, me, String(body.id));
      if (!f || f.requested_by === me.id || f.accepted) fail("No request to answer.", 404);
      if (body.accept) await db.prepare("UPDATE friendships SET accepted = 1 WHERE id = ?").bind(f.id).run();
      else await db.prepare("DELETE FROM friendships WHERE id = ?").bind(f.id).run();
      return json({ ok: true });
    }
    if (path === "/approvals" && request.method === "GET") {
      if (me.child) fail("Ask your parent to open their dashboard.", 403);
      const { results } = await db.prepare(
        "SELECT f.id, f.a, f.b, f.a_parent_ok, f.b_parent_ok, ma.name AS a_name, mb.name AS b_name, ma.family_id AS a_family, mb.family_id AS b_family FROM friendships f JOIN friend_members ma ON ma.member_id = f.a JOIN friend_members mb ON mb.member_id = f.b WHERE f.blocked_by IS NULL AND ((ma.family_id = ? AND f.a_parent_ok = 0) OR (mb.family_id = ? AND f.b_parent_ok = 0))",
      ).bind(me.family, me.family).all();
      return json({ pending: results.map((r) => ({ id: r.id, child: r.a_family === me.family ? r.a_name : r.b_name, friend: r.a_family === me.family ? r.b_name : r.a_name })) });
    }
    if (path === "/approve" && request.method === "POST") {
      if (me.child) fail("Only a parent can approve friends.", 403);
      const f = await db.prepare("SELECT f.*, ma.family_id AS a_family, mb.family_id AS b_family FROM friendships f JOIN friend_members ma ON ma.member_id = f.a JOIN friend_members mb ON mb.member_id = f.b WHERE f.id = ?").bind(String(body.id)).first();
      if (!f || (f.a_family !== me.family && f.b_family !== me.family)) fail("Not found.", 404);
      if (!body.ok) { await db.prepare("UPDATE friendships SET blocked_by = ? WHERE id = ?").bind(me.id, f.id).run(); return json({ ok: true }); }
      if (f.a_family === me.family) await db.prepare("UPDATE friendships SET a_parent_ok = 1 WHERE id = ?").bind(f.id).run();
      if (f.b_family === me.family) await db.prepare("UPDATE friendships SET b_parent_ok = 1 WHERE id = ?").bind(f.id).run();
      return json({ ok: true });
    }
    if (path === "/block" && request.method === "POST") {
      const f = await friendshipWith(db, me, String(body.id));
      if (f) await db.prepare("UPDATE friendships SET blocked_by = ? WHERE id = ?").bind(me.id, f.id).run();
      return json({ ok: true });
    }
    if (path === "/report" && request.method === "POST") {
      const f = await friendshipWith(db, me, String(body.id));
      if (!f) fail("Not found.", 404);
      const excerpt = String(body.excerpt || "").slice(0, 4000);
      await db.prepare("INSERT INTO friend_reports (id, friendship_id, reporter, excerpt, created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), f.id, me.id, excerpt, Date.now()).run();
      await db.prepare("UPDATE friendships SET blocked_by = ? WHERE id = ?").bind(me.id, f.id).run();
      return json({ ok: true });
    }
    // Messages: ciphertext only. Kept 30 days.
    const withId = url.searchParams.get("with") || body.to;
    if (path === "/messages") {
      const f = await friendshipWith(db, me, String(withId || ""));
      if (!isActive(f)) fail("You can message once you're both friends and your parents have approved.", 403);
      if (request.method === "POST") {
        await limit(db, "msg:" + me.id, 40);
        if (typeof body.ciphertext !== "string" || typeof body.iv !== "string" || body.ciphertext.length > 8000 || !/^[A-Za-z0-9+/=]+$/.test(body.ciphertext + body.iv)) fail("Invalid message.");
        const now = Date.now();
        await db.batch([
          db.prepare("INSERT INTO friend_messages (id, friendship_id, sender, ciphertext, iv, sent_at) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(), f.id, me.id, body.ciphertext, body.iv, now),
          db.prepare("DELETE FROM friend_messages WHERE sent_at < ?").bind(now - 30 * 86_400_000),
        ]);
        return json({ sent: now }, 201);
      }
      const after = Number(url.searchParams.get("after")) || 0;
      const { results } = await db.prepare("SELECT sender, ciphertext, iv, sent_at FROM friend_messages WHERE friendship_id = ? AND sent_at > ? ORDER BY sent_at LIMIT 100").bind(f.id, after).all();
      return json({ messages: results.map((m) => ({ mine: m.sender === me.id, ciphertext: m.ciphertext, iv: m.iv, at: m.sent_at })) });
    }
    // Calls: relay WebRTC set-up between active friends, deleted once read.
    if (path === "/signal") {
      if (request.method === "POST") {
        await limit(db, "sig:" + me.id, 240);
        const f = await friendshipWith(db, me, String(body.to || ""));
        if (!isActive(f)) fail("You can only call approved friends.", 403);
        if (!["offer", "answer", "ice", "hangup", "decline"].includes(body.kind) || String(body.data ?? "").length > 8000) fail("Invalid signal.");
        await db.prepare("INSERT INTO friend_signals (to_member, from_member, kind, data, created_at) VALUES (?,?,?,?,?)").bind(String(body.to), me.id, body.kind, String(body.data ?? ""), Date.now()).run();
        return json({ ok: true }, 201);
      }
      const { results } = await db.prepare("SELECT s.id, s.from_member, s.kind, s.data, s.created_at, m.name FROM friend_signals s JOIN friend_members m ON m.member_id = s.from_member WHERE s.to_member = ? AND s.created_at > ? ORDER BY s.id").bind(me.id, Date.now() - 60_000).all();
      if (results.length) await db.prepare("DELETE FROM friend_signals WHERE to_member = ? AND id <= ?").bind(me.id, results[results.length - 1].id).run();
      return json({ signals: results.map((s) => ({ from: s.from_member, name: s.name, kind: s.kind, data: s.data })) });
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    if (!error.status) console.error("Friends failure", error.code || error.name);
    return json({ error: error.status ? error.message : "Friends is temporarily unavailable. Please retry." }, error.status || 503);
  }
}
