import { bibleGames } from "../public/bible/content.mjs";
import { checkName } from "../public/accounts.mjs";
const COOKIE = "kairos_family";
const characters = ["kai", "ama", "leo", "mei", "theo"];
const json = (data, status = 200, cookie) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
const fail = (message, status = 400) => {
  throw Object.assign(Error(message), { status });
};
const hex = (bytes) =>
  Array.from(new Uint8Array(bytes), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
const hash = async (text) =>
  hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256,
    ),
  );
}
const equal = (a, b) => {
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++)
    diff |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
};
const name = (value) => {
  const r = checkName(value);
  if (!r.ok) fail(r.error);
  return r.name;
};
const email = (value) => {
  const s = String(value || "")
    .trim()
    .toLowerCase();
  if (s.length > 254 || !/^\S+@[^\s@]+\.[^\s@]{2,}$/.test(s))
    fail("Enter a valid email address.");
  return s;
};
const cookieFor = (request, token, seconds) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
async function session(request, db) {
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db
    .prepare(
      "SELECT * FROM family_sessions WHERE token_hash = ? AND expires_at > ?",
    )
    .bind(await hash(token), Date.now())
    .first();
}
async function issue(request, db, familyId, childId = null) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32))),
    seconds = childId ? 30 * 86400 : 12 * 3600;
  await db
    .prepare(
      "INSERT INTO family_sessions (token_hash, family_id, child_id, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(await hash(token), familyId, childId, Date.now() + seconds * 1000)
    .run();
  return cookieFor(request, token, seconds);
}
async function throttle(db, key) {
  const now = Date.now();
  await db
    .prepare(
      "INSERT INTO family_auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN family_auth_limits.expires_at < ? THEN 1 ELSE family_auth_limits.count+1 END, expires_at=CASE WHEN family_auth_limits.expires_at < ? THEN excluded.expires_at ELSE family_auth_limits.expires_at END",
    )
    .bind(key, now + 15 * 60000, now, now)
    .run();
  const row = await db
    .prepare("SELECT count FROM family_auth_limits WHERE key = ?")
    .bind(key)
    .first();
  if (row.count > 20) fail("Too many attempts. Try again in 15 minutes.", 429);
}
async function childFor(db, s, id) {
  if (s.child_id && s.child_id !== id)
    fail("Ask your parent to open their dashboard.", 403);
  const child = await db
    .prepare(
      "SELECT id,name,age,character,created_at FROM family_children WHERE id = ? AND family_id = ?",
    )
    .bind(id, s.family_id)
    .first();
  if (!child) fail("Child profile not found.", 404);
  return child;
}
export async function childProgress(db, id) {
  const { results } = await db
    .prepare(
      "SELECT game_id, COUNT(*) AS runs, MAX(score) AS best, MAX(completed_at) AS last FROM learning_results WHERE child_id = ? GROUP BY game_id",
    )
    .bind(id)
    .all();
  const { results: recent } = await db
    .prepare(
      "SELECT event_id,game_id,score,completed_at FROM learning_results WHERE child_id = ? ORDER BY completed_at DESC,event_id DESC LIMIT 12",
    )
    .bind(id)
    .all();
  const { results: days } = await db
    .prepare(
      "SELECT DISTINCT substr(datetime(completed_at / 1000, 'unixepoch'),1,10) AS day FROM learning_results WHERE child_id = ? ORDER BY day DESC LIMIT 366",
    )
    .bind(id)
    .all();
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0,
    expected = today;
  if (days[0]?.day !== today)
    expected = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  for (const { day } of days) {
    if (day !== expected) break;
    streak++;
    expected = new Date(Date.parse(day) - 86400000).toISOString().slice(0, 10);
  }
  const records = Object.fromEntries(
    results.map((r) => [
      r.game_id,
      {
        runs: r.runs,
        best: r.best,
        last: new Date(r.last).toISOString().slice(0, 10),
      },
    ]),
  );
  return {
    records,
    recent,
    meta: { lastDay: days[0]?.day || null, streak },
    summary: {
      games: results.length,
      rounds: results.reduce((n, r) => n + r.runs, 0),
      stars: results.reduce(
        (n, r) => n + (r.best >= 90 ? 3 : r.best >= 60 ? 2 : 1),
        0,
      ),
      streak,
      lastPlayed: recent[0]?.completed_at || null,
    },
  };
}
export async function handleFamily(request, env) {
  try {
    const url = new URL(request.url),
      path = url.pathname.slice("/api/family".length),
      db = env.DB;
    if (!["GET", "POST"].includes(request.method))
      return json({ error: "Method not allowed." }, 405);
    if (
      request.method === "POST" &&
      request.headers.get("origin") !== url.origin
    )
      fail("Origin not allowed.", 403);
    let body = {};
    if (request.method === "POST") {
      const raw = await request.text();
      if (raw.length > 8192) fail("Request too large.", 413);
      try {
        body = JSON.parse(raw);
      } catch {
        fail("Invalid request.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        fail("Invalid request.");
    }
    if (request.method === "POST" && ["/signup", "/login"].includes(path)) {
      const em = email(body.email),
        pw = body.password;
      if (typeof pw !== "string" || pw.length < 12 || pw.length > 128)
        fail("Use a password between 12 and 128 characters.");
      await throttle(db, "email:" + (await hash(em)));
      await throttle(
        db,
        "ip:" +
          (await hash(request.headers.get("cf-connecting-ip") || "local")),
      );
      let account;
      if (path === "/signup") {
        const nm = name(body.name);
        if (!Number.isInteger(body.age) || body.age < 18 || body.age > 99)
          fail("A parent or guardian must be 18 or over.");
        if (body.consent !== true)
          fail("Confirm parental consent to create a family account.");
        if (
          await db
            .prepare("SELECT id FROM family_accounts WHERE email = ?")
            .bind(em)
            .first()
        )
          fail("Unable to create this account. Try signing in.", 409);
        const salt = hex(crypto.getRandomValues(new Uint8Array(16))),
          id = crypto.randomUUID();
        await db
          .prepare(
            "INSERT INTO family_accounts (id,name,email,password_hash,salt,consent_at,created_at) VALUES (?,?,?,?,?,?,?)",
          )
          .bind(
            id,
            nm,
            em,
            await passwordHash(pw, salt),
            salt,
            Date.now(),
            Date.now(),
          )
          .run();
        account = { id, name: nm, email: em };
      } else {
        const row = await db
          .prepare("SELECT * FROM family_accounts WHERE email = ?")
          .bind(em)
          .first();
        const derived = await passwordHash(
          pw,
          row?.salt || "missing-account-salt",
        );
        if (!row || !equal(derived, row.password_hash))
          fail("Email or password is incorrect.", 401);
        account = { id: row.id, name: row.name, email: row.email };
      }
      const old = await session(request, db);
      if (old)
        await db
          .prepare("DELETE FROM family_sessions WHERE token_hash = ?")
          .bind(old.token_hash)
          .run();
      await db
        .prepare("DELETE FROM family_sessions WHERE expires_at < ?")
        .bind(Date.now())
        .run();
      await db
        .prepare("DELETE FROM family_auth_limits WHERE expires_at < ?")
        .bind(Date.now())
        .run();
      return json(
        { parent: account },
        path === "/signup" ? 201 : 200,
        await issue(request, db, account.id),
      );
    }
    const s = await session(request, db);
    if (!s) fail("Sign in to your family account.", 401);
    if (path === "/logout" && request.method === "POST") {
      await db
        .prepare("DELETE FROM family_sessions WHERE token_hash = ?")
        .bind(s.token_hash)
        .run();
      return json({ ok: true }, 200, cookieFor(request, "", 0));
    }
    if (path === "/session" && request.method === "GET")
      return json({
        role: s.child_id ? "child" : "parent",
        child: s.child_id ? await childFor(db, s, s.child_id) : null,
      });
    const progress = path.match(/^\/children\/([a-f0-9-]{36})\/progress$/);
    if (progress) {
      const child = await childFor(db, s, progress[1]);
      if (request.method === "POST") {
        if (
          typeof body.eventId !== "string" ||
          !/^[a-f0-9-]{36}$/.test(body.eventId) ||
          !bibleGames.some((g) => g.id === body.gameId) ||
          !Number.isInteger(body.score) ||
          body.score < 0 ||
          body.score > 100
        )
          fail("Invalid game result.");
        // Preserve offline play dates; clamp device clock errors to the past year.
        const now = Date.now();
        const completedAt = Number.isSafeInteger(body.at)
          ? Math.max(now - 366 * 86400000, Math.min(now, body.at))
          : now;
        await db
          .prepare(
            "INSERT INTO learning_results (child_id,event_id,game_id,score,completed_at) VALUES (?,?,?,?,?) ON CONFLICT(child_id,event_id) DO NOTHING",
          )
          .bind(child.id, body.eventId, body.gameId, body.score, completedAt)
          .run();
      }
      return json({ child, ...(await childProgress(db, child.id)) });
    }
    if (s.child_id) fail("Ask your parent to sign in to their dashboard.", 403);
    if (path === "" && request.method === "GET") {
      const parent = await db
        .prepare(
          "SELECT id,name,email,consent_at FROM family_accounts WHERE id = ?",
        )
        .bind(s.family_id)
        .first();
      const { results } = await db
        .prepare(
          "SELECT id,name,age,character,created_at FROM family_children WHERE family_id = ? ORDER BY created_at,id",
        )
        .bind(s.family_id)
        .all();
      return json({
        parent,
        children: await Promise.all(
          results.map(async (child) => ({
            ...child,
            ...(await childProgress(db, child.id)),
          })),
        ),
      });
    }
    if (path === "/children" && request.method === "POST") {
      const nm = name(body.name);
      if (!Number.isInteger(body.age) || body.age < 4 || body.age > 17)
        fail("Choose a child’s age between 4 and 17.");
      const count = await db
        .prepare(
          "SELECT COUNT(*) AS n FROM family_children WHERE family_id = ?",
        )
        .bind(s.family_id)
        .first();
      if (count.n >= 12) fail("This family has reached its 12-profile limit.");
      const child = {
        id: crypto.randomUUID(),
        name: nm,
        age: body.age,
        character: characters.includes(body.character) ? body.character : "kai",
      };
      await db
        .prepare(
          "INSERT INTO family_children (id,family_id,name,age,character,created_at) VALUES (?,?,?,?,?,?)",
        )
        .bind(
          child.id,
          s.family_id,
          child.name,
          child.age,
          child.character,
          Date.now(),
        )
        .run();
      return json({ child }, 201);
    }
    if (path === "/play" && request.method === "POST") {
      const child = await childFor(db, s, String(body.childId));
      const cookie = await issue(request, db, s.family_id, child.id);
      await db
        .prepare("DELETE FROM family_sessions WHERE token_hash = ?")
        .bind(s.token_hash)
        .run();
      return json({ child }, 200, cookie);
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    if (!error.status) console.error("Family database failure", error.code || error.name);
    return json(
      {
        error: error.status
          ? error.message
          : "Family saves are temporarily unavailable. Please retry.",
      },
      error.status || 503,
    );
  }
}
