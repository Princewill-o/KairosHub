import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { handleFamily } from "./server/family.mjs";
function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync("drizzle/0002_family.sql", "utf8"));
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            const statement = db.prepare(sql);
            return {
              first: async () => statement.get(...args),
              all: async () => ({ results: statement.all(...args) }),
              run: async () => ({
                meta: { changes: statement.run(...args).changes },
              }),
            };
          },
        };
      },
    },
  };
  let cookie = "";
  return {
    env,
    async call(path, body, method = body ? "POST" : "GET", override) {
      const r = await handleFamily(
        new Request("https://kairos.test/api/family" + path, {
          method,
          headers: {
            Origin: "https://kairos.test",
            "Content-Type": "application/json",
            Cookie: override ?? cookie,
          },
          body: body ? JSON.stringify(body) : undefined,
        }),
        env,
      );
      if (r.headers.get("set-cookie"))
        cookie = r.headers.get("set-cookie").split(";")[0];
      return { status: r.status, data: await r.json(), cookie };
    },
  };
}
const parent = {
  name: "Kofi",
  age: 35,
  email: "kofi@example.com",
  password: "a long family password",
  consent: true,
};
test("family signup, password login, scoped child sessions, persistence and idempotent progress", async () => {
  const a = setup();
  assert.equal((await a.call("")).status, 401);
  const signup = await a.call("/signup", parent);
  assert.equal(signup.status, 201);
  const parentCookie = signup.cookie;
  const child = await a.call("/children", {
    name: "Ama",
    age: 9,
    character: "ama",
  });
  assert.equal(child.status, 201);
  const id = child.data.child.id;
  const other = await a.call("/children", { name: "Leo", age: 12 });
  assert.equal((await a.call("/play", { childId: id })).status, 200);
  assert.equal(
    (await a.call("")).status,
    403,
    "child cannot read parent dashboard",
  );
  assert.equal(
    (await a.call("/children", { name: "Eve", age: 8 })).status,
    403,
  );
  assert.equal(
    (await a.call(`/children/${other.data.child.id}/progress`)).status,
    403,
  );
  const result = { eventId: crypto.randomUUID(), gameId: "quiz", score: 80 };
  assert.equal((await a.call(`/children/${id}/progress`, result)).status, 200);
  assert.equal((await a.call(`/children/${id}/progress`, result)).status, 200);
  let progress = await a.call(`/children/${id}/progress`);
  assert.equal(progress.data.records.quiz.runs, 1);
  assert.equal(progress.data.records.quiz.best, 80);
  assert.equal(progress.data.summary.stars, 2);
  assert.equal(
    (
      await a.call(`/children/${id}/progress`, {
        ...result,
        eventId: crypto.randomUUID(),
        score: 101,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await a.call("/login", {
        email: parent.email,
        password: "incorrect password",
      })
    ).status,
    401,
  );
  assert.equal(
    (await a.call("/login", { email: parent.email, password: parent.password }))
      .status,
    200,
  );
  const dashboard = await a.call("");
  assert.equal(dashboard.data.children.length, 2);
  assert.equal(
    dashboard.data.children.find((c) => c.id === id).summary.rounds,
    1,
  );
  assert.equal(
    dashboard.data.children.find((c) => c.id === id).recent.length,
    1,
  );
  assert.equal((await a.call("/logout", {})).status, 200);
  assert.equal((await a.call("")).status, 401);
  assert.equal(
    (await a.call("", undefined, "GET", parentCookie)).status,
    401,
    "play revokes the parent session",
  );
});
test("server validates consent, age, password, origin and foreign child ownership", async () => {
  const a = setup();
  assert.equal(
    (await a.call("/signup", { ...parent, consent: false })).status,
    400,
  );
  assert.equal((await a.call("/signup", { ...parent, age: 17 })).status, 400);
  assert.equal(
    (await a.call("/signup", { ...parent, password: "short" })).status,
    400,
  );
  await a.call("/signup", parent);
  const child = await a.call("/children", { name: "Ama", age: 9 });
  await a.call("/signup", { ...parent, email: "other@example.com" });
  assert.equal(
    (await a.call(`/children/${child.data.child.id}/progress`)).status,
    404,
  );
  assert.equal(
    (await a.call("/play", { childId: child.data.child.id })).status,
    404,
  );
  const cross = await handleFamily(
    new Request("https://kairos.test/api/family/logout", {
      method: "POST",
      headers: { Origin: "https://evil.test" },
    }),
    a.env,
  );
  assert.equal(cross.status, 403);
});

test("passwords and session tokens are hashed, cookies are protected and expired sessions cannot read progress", async () => {
  const a = setup();
  const result = await a.call("/signup", parent);
  assert.equal(result.status, 201);
  const expired = await a.call("/logout", {});
  assert.equal(expired.status, 200);
  assert.equal((await a.call("", undefined, "GET", result.cookie)).status, 401);
  const response = await handleFamily(
    new Request("https://kairos.test/api/family/login", {
      method: "POST",
      headers: { Origin: "https://kairos.test" },
      body: JSON.stringify({ email: parent.email, password: parent.password }),
    }),
    a.env,
  );
  assert.match(response.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/);
  assert.match(response.headers.get("set-cookie"), /Secure/);
  const account = await a.env.DB.prepare(
    "SELECT password_hash,salt FROM family_accounts WHERE email = ?",
  )
    .bind(parent.email)
    .first();
  assert.equal(account.password_hash.length, 64);
  assert.notEqual(account.password_hash, parent.password);
  assert.ok(account.salt.length >= 32);
  await a.env.DB.prepare(
    "UPDATE family_sessions SET expires_at = ? WHERE family_id = ?",
  )
    .bind(Date.now() - 1, result.data.parent.id)
    .run();
  assert.equal(
    (
      await a.call(
        "",
        undefined,
        "GET",
        response.headers.get("set-cookie").split(";")[0],
      )
    ).status,
    401,
  );
});
test("login attempts are limited even for an existing email", async () => {
  const a = setup();
  await a.call("/signup", parent);
  for (let n = 0; n < 19; n++)
    assert.equal(
      (
        await a.call("/login", {
          email: parent.email,
          password: "incorrect password",
        })
      ).status,
      401,
    );
  assert.equal(
    (await a.call("/login", { email: parent.email, password: parent.password }))
      .status,
    429,
  );
});

test("offline completions keep their original date when uploaded later", async () => {
  const a = setup();
  await a.call("/signup", parent);
  const {
    data: { child },
  } = await a.call("/children", { name: "Ama", age: 9 });
  const at = Date.now() - 86400000;
  const result = await a.call(`/children/${child.id}/progress`, {
    eventId: crypto.randomUUID(),
    gameId: "quiz",
    score: 70,
    at,
  });
  assert.equal(result.data.recent[0].completed_at, at);
});
