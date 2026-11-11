import test from "node:test";
import assert from "node:assert/strict";
import { parseKharisHome, handleKharisUpdates } from "./server/kharis-updates.mjs";

const page = `<html><a href="https://kharis.org/london/">London</a><a href='https://kharis.org/luton/'>Luton</a>
<h2>Latest Message</h2><h3>The Portraits Of Christ: Part 2</h3><a href="https://www.youtube.com/watch?v=tnArAL3zxRE">Watch</a>
<p>Former Spurgeon's College</p></html>`;

test("reads the latest message, branches and notices from the kharis.org home page", () => {
  const r = parseKharisHome(page);
  assert.equal(r.latestMessage.video, "tnArAL3zxRE");
  assert.equal(r.latestMessage.title, "The Portraits Of Christ: Part 2");
  assert.deepEqual(r.branches, ["london", "luton"]);
  assert.equal(r.notices.length, 1);
});

test("falls back cleanly when kharis.org is down, and caches when up", async () => {
  const down = await handleKharisUpdates(new Request("https://x/api/kharis"), async () => new Response("", { status: 500 }));
  assert.equal(down.status, 503);
  const up = await handleKharisUpdates(new Request("https://x/api/kharis"), async () => new Response(page));
  assert.equal(up.status, 200);
  assert.match(up.headers.get("cache-control"), /max-age=3600/);
  assert.equal((await up.json()).latestMessage.video, "tnArAL3zxRE");
});
