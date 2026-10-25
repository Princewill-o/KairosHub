import test from "node:test";
import assert from "node:assert/strict";
import {
  createPostgresFamilyDb,
  postgresQuery,
} from "./server/family-postgres.mjs";
import { handleFamilyBackend } from "./server/family-backend.mjs";
import { createFamilyEdgeHandler } from "./server/family-edge.mjs";
test("Postgres adapter binds values and scopes every family table to the private schema", async () => {
  let seen;
  const db = createPostgresFamilyDb({
    unsafe: async (sql, args) => {
      seen = { sql, args };
      return [{ runs: "2", best: 80, last: "1792900000000" }];
    },
  });
  const rows = await db
    .prepare(
      "SELECT COUNT(*) AS runs, MAX(score) AS best, MAX(completed_at) AS last FROM learning_results WHERE child_id = ?",
    )
    .bind("untrusted' child")
    .all();
  assert.match(seen.sql, /kairos_games\.learning_results/);
  assert.match(seen.sql, /\$1/);
  assert.ok(!seen.sql.includes("untrusted'"));
  assert.deepEqual(seen.args, ["untrusted' child"]);
  assert.equal(rows.results[0].runs, 2);
  assert.equal(rows.results[0].last, 1792900000000);
  assert.match(
    postgresQuery(
      "SELECT DISTINCT substr(datetime(completed_at / 1000, 'unixepoch'),1,10) AS day FROM learning_results WHERE child_id = ? ORDER BY day DESC LIMIT 366",
    ),
    /AT TIME ZONE 'UTC'/,
  );
});
test("Supabase relay forwards only the family cookie and enforces origin before sending passwords", async () => {
  let seen;
  const fetcher = async (url, options) => {
    seen = { url, options };
    return Response.json(
      { role: "child" },
      {
        headers: {
          "Set-Cookie": "kairos_family=abc; Path=/; HttpOnly; SameSite=Strict",
        },
      },
    );
  };
  const request = new Request("http://localhost:4173/api/family/login", {
    method: "POST",
    headers: {
      Origin: "http://localhost:4173",
      Cookie: "kairos_family=abc; unrelated=secret",
      "oai-authenticated-user-id": "forged",
    },
    body: '{"email":"k@example.com","password":"example password"}',
  });
  const r = await handleFamilyBackend(request, {}, fetcher);
  assert.equal(r.status, 200);
  assert.match(
    seen.url,
    /supabase.co\/functions\/v1\/kairos-family\/api\/family\/login$/,
  );
  assert.equal(seen.options.headers.get("cookie"), "kairos_family=abc");
  assert.equal(seen.options.headers.get("origin"), "http://localhost:4173");
  assert.ok(!seen.options.headers.has("oai-authenticated-user-id"));
  assert.match(r.headers.get("set-cookie"), /HttpOnly/);
  const foreign = new Request(request.url, {
    method: "POST",
    headers: { Origin: "https://evil.test" },
    body: "{}",
  });
  assert.equal((await handleFamilyBackend(foreign, {}, fetcher)).status, 403);
});
test("a Supabase outage fails closed instead of creating a different family in local D1", async () => {
  const r = await handleFamilyBackend(
    new Request("http://localhost:4173/api/family"),
    {},
    async () => {
      throw Error("offline");
    },
  );
  assert.equal(r.status, 503);
  assert.equal(r.headers.get("cache-control"), "no-store");
});
test("edge wrapper rejects unapproved hosts and maps the trusted origin for existing family checks", async () => {
  const handler = createFamilyEdgeHandler({ DB: {} }, [
    "http://localhost:4173",
  ]);
  assert.equal(
    (
      await handler(
        new Request(
          "https://project.supabase.co/functions/v1/kairos-family/api/family",
          { headers: { Origin: "https://evil.test" } },
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        new Request(
          "https://project.supabase.co/functions/v1/kairos-family/api/family",
          { headers: { Origin: "http://localhost:4173" } },
        ),
      )
    ).status,
    401,
  );
});

test("family relay never follows redirects with a password or session cookie", async () => {
  let redirect;
  const r = await handleFamilyBackend(
    new Request("http://localhost:4173/api/family"),
    {},
    async (_url, options) => {
      redirect = options.redirect;
      return Response.json(
        { message: "moved" },
        { status: 302, headers: { Location: "https://other.test" } },
      );
    },
  );
  assert.equal(redirect, "manual");
  assert.equal(r.status, 503);
});

test("Supabase gateway cookies cannot hide or corrupt the family session cookie", async () => {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", "__cf_bm=gateway; Path=/; Secure");
  headers.append(
    "Set-Cookie",
    "kairos_family=abc; Path=/; HttpOnly; SameSite=Strict",
  );
  const r = await handleFamilyBackend(
    new Request("http://localhost:4173/api/family"),
    {},
    async () => new Response("{}", { headers }),
  );
  assert.equal(
    r.headers.get("set-cookie"),
    "kairos_family=abc; Path=/; HttpOnly; SameSite=Strict",
  );
});
