import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createAccounts } from "./public/accounts.mjs";
import {
  avatarDefaults,
  avatarOptions,
  normalizeAvatar,
  createAvatarStore,
  avatarSvg,
} from "./public/avatar.mjs";
import {
  freshRun,
  discover,
  discovered,
  advance,
  restoreRun,
} from "./public/playmessages/engine.mjs";
import { series } from "./public/playmessages/content.mjs";
import { interactionsFor } from "./public/playmessages/interactions.mjs";
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k), setItem: (k, v) => m.set(k, v) };
};
test("every customization choice changes the rendered design", () => {
  for (const [field, options] of Object.entries(avatarOptions)) {
    const variants = options.map((o) =>
      avatarSvg({ ...avatarDefaults, [field]: o.value }, "wave"),
    );
    assert.equal(
      new Set(variants).size,
      options.length,
      field + " options must have distinct designs",
    );
  }
});
test("public guest play needs no email, password or remote session and reuses its local identity", () => {
  const st = memory(),
    a = createAccounts(st),
    guest = a.ensureGuest();
  assert.equal(guest.guest, true);
  assert.equal(guest.cloud, undefined);
  assert.equal(guest.email, undefined);
  assert.equal(createAccounts(st).ensureGuest().id, guest.id);
  const b = createAccounts({
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  });
  assert.ok(b.ensureGuest().id);
  assert.equal(b.saved, false);
});
test("guest play never borrows a cloud child identity or its progress scope", () => {
  const a = createAccounts(memory());
  a.importCloudChild({
    id: "child-secret",
    name: "Child",
    age: 9,
    character: "kai",
  });
  const guest = a.ensureGuest();
  assert.notEqual(guest.id, "child-secret");
  assert.equal(guest.guest, true);
  assert.ok(!a.progressKey("test").includes("child-secret"));
});
test("customization validates options, persists independently and renders original faceted characters", () => {
  const st = memory(),
    a = createAvatarStore("a", st),
    b = createAvatarStore("b", st),
    next = {
      ...avatarDefaults,
      skin: avatarOptions.skin.at(-1).value,
      hair: "braids",
      outfit: "jacket",
      trousers: "cargo",
      glasses: true,
    };
  a.set(next);
  assert.equal(createAvatarStore("a", st).get().hair, "braids");
  assert.equal(b.get().hair, avatarDefaults.hair);
  assert.equal(
    normalizeAvatar({ hair: "<script>", top: "red;url(x)" }).hair,
    avatarDefaults.hair,
  );
  const svg = avatarSvg(next, "wave");
  assert.match(svg, /<polygon/);
  assert.match(svg, /low-poly-avatar/);
  assert.doesNotMatch(svg, /<script|undefined/);
  assert.notEqual(svg, avatarSvg(avatarDefaults, "wave"));
});
test("talking and inspecting create unique, validated chapter discoveries", () => {
  for (const s of series) {
    assert.equal(interactionsFor(s.id).length, 3);
    let r = freshRun();
    r = discover(r, s, "talk", "listen");
    r = discover(r, s, "item");
    assert.ok(discovered(r, "talk"));
    assert.ok(discovered(r, "item"));
    assert.equal(discover(r, s, "item"), r);
    assert.deepEqual(restoreRun(r, s), r);
    assert.equal(discover(r, s, "unknown"), r);
    assert.equal(discover(advance(r, s), s, "talk", "share").stage, "choice");
  }
});
test("public navigation and fullscreen story presentation are integrated", async () => {
  const app = await fs.readFile("public/app.js", "utf8"),
    css = await fs.readFile("public/story-screen.css", "utf8");
  assert.match(app, /PUBLIC_PLAY/);
  assert.match(app, /mountCharacterStudio/);
  assert.match(css, /100dvh/);
  assert.match(css, /position:\s*fixed/);
});
