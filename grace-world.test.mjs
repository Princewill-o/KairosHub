import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";

test("Grace routes cannot navigate outside the in-game platform", async () => {
  const { graceRoute, gameBuildings } = await import(
    "./public/grace-catalog.mjs"
  );
  assert.equal(graceRoute("bible/quiz"), "bible/quiz");
  assert.equal(graceRoute("https://evil.test"), "home");
  assert.equal(graceRoute("world"), "home");
  assert.equal(graceRoute("messages/still-waters"), "messages/still-waters");
  assert.equal(new Set(gameBuildings.map((x) => x.game)).size, 16);
});
test("all game buildings have reachable doors and preserve the five-island layout", async () => {
  const output = await build({
    stdin: {
      contents: `export {islandMap,ISLANDS} from './world-runtime/source/game/core/islands.ts';export {walkingRoute} from './world-runtime/source/game/core/map-guide.ts';`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
  });
  const { islandMap, ISLANDS, walkingRoute } = await import(
    "data:text/javascript;base64," +
      Buffer.from(output.outputFiles[0].text).toString("base64")
  );
  const ltbs = islandMap("scripture-island"),
    city = islandMap("city");
  assert.equal(ISLANDS.length, 5);
  const doors = ltbs.portals.filter(
    (p) => p.to.kind === "grace" && p.to.route.startsWith("bible/"),
  );
  assert.equal(doors.length, 16);
  for (const p of doors)
    assert.ok(
      walkingRoute(ltbs, ltbs.spawn, {
        x: p.rect.x + p.rect.w / 2,
        y: p.rect.y + p.rect.h / 2,
      }).length,
      p.id,
    );
  assert.ok(
    city.portals.some((p) => p.to.kind === "grace" && p.to.route === "social"),
  );
  assert.ok(ltbs.structures.filter((s) => s.game).length === 16);
  for (const p of ltbs.portals.filter(
    (p) => p.to.kind === "scripture-challenge" || p.to.kind === "story-enter",
  ))
    assert.ok(
      walkingRoute(ltbs, ltbs.spawn, {
        x: p.rect.x + p.rect.w / 2,
        y: p.rect.y + p.rect.h / 2,
      }).length,
      p.id,
    );
});
test("new residents are original Blender meshes with articulated bodies", async () => {
  const bytes = await fs.readFile("public/world3d/kairos-citizen.glb");
  const size = bytes.readUInt32LE(12),
    gltf = JSON.parse(bytes.subarray(20, 20 + size).toString());
  for (const name of ["Head", "ArmL", "ArmR", "LegL", "LegR"])
    assert.ok(
      gltf.nodes.some((n) => n.name === name),
      name,
    );
  assert.ok(gltf.nodes.some((n) => n.name.startsWith("hair_braids")));
  assert.ok(gltf.nodes.some((n) => n.name.startsWith("outfit_jacket")));
  const { WORLD_ENABLED } = await import("./public/world-availability.mjs");
  assert.equal(WORLD_ENABLED, true);
});

test("the real citizen changes appearance and animates without modifying shared geometry", async () => {
  const output = await build({
    stdin: {
      contents: `export {buildCharacter} from './world-runtime/source/components/game/kairos-citizen3d.ts'; export {DEFAULT_AVATAR} from './world-runtime/source/game/core/cosmetics.ts';export {worldAppearance} from './public/grace-avatar.mjs';`,
      resolveDir: process.cwd(),
    },
    alias: { "@": process.cwd() + "/world-runtime/source" },
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
  });
  const oldFetch = globalThis.fetch,
    oldProgress = globalThis.ProgressEvent,
    oldRequest = globalThis.Request;
  const bytes = await fs.readFile("public/world3d/kairos-citizen.glb");
  globalThis.ProgressEvent = class {
    constructor(type, fields) {
      Object.assign(this, { type }, fields);
    }
  };
  globalThis.Request = class extends oldRequest {
    constructor(input, options) {
      super(new URL(input, "https://kairos.test"), options);
    }
  };
  globalThis.fetch = async () =>
    new Response(bytes, {
      headers: { "Content-Length": String(bytes.length) },
    });
  let one, two;
  try {
    await fs.mkdir(".tools", { recursive: true });
    await fs.writeFile(
      ".tools/grace-citizen-test.mjs",
      output.outputFiles[0].text,
    );
    const { buildCharacter, DEFAULT_AVATAR, worldAppearance } = await import(
      pathToFileURL(process.cwd() + "/.tools/grace-citizen-test.mjs")
    );
    one = await buildCharacter({
      ...DEFAULT_AVATAR,
      ...worldAppearance({
        hair: "braids",
        top: "#e0ab3c",
        trousers: "cargo",
        outfit: "jacket",
      }),
    });
    two = await buildCharacter({
      ...DEFAULT_AVATAR,
      ...worldAppearance({ hair: "curly", top: "#367c73", outfit: "hoodie" }),
    });
    assert.equal(one.object.getObjectByName("hair_braids").visible, true);
    assert.equal(one.object.getObjectByName("hair_curly").visible, false);
    assert.equal(two.object.getObjectByName("hair_curly").visible, true);
    assert.equal(one.object.getObjectByName("outfit_jacket").visible, true);
    let meshes = 0;
    one.object.traverseVisible((o) => {
      if (o.isMesh) meshes++;
    });
    assert.ok(
      meshes <= 30,
      `Citizen uses ${meshes} draw meshes; batch details within articulated parts.`,
    );
    const leg = one.object.getObjectByName("LegL");
    one.play("walk");
    one.update(0.1);
    assert.notEqual(leg.rotation.x, 0);
    const arm = one.object.getObjectByName("ArmR");
    one.play("wave");
    one.update(0.1);
    assert.ok(arm.rotation.z < -0.5);
    one.play("jump");
    one.update(0.1);
    assert.ok(one.object.getObjectByName("ArmL").rotation.x < 0);
  } finally {
    one?.dispose();
    two?.dispose();
    globalThis.fetch = oldFetch;
    globalThis.Request = oldRequest;
    if (oldProgress === undefined) delete globalThis.ProgressEvent;
    else globalThis.ProgressEvent = oldProgress;
  }
});

test("Grace history, pause/resume and frame messages preserve the live world", async () => {
  const { mountGraceBrowser } = await import("./public/grace-browser.mjs");
  const oldWindow = globalThis.window,
    oldLocation = globalThis.location;
  const messages = [],
    listeners = new Map(),
    events = new Map();
  globalThis.location = { origin: "https://kairos.test" };
  globalThis.window = {
    addEventListener: (key, fn) => listeners.set(key, fn),
    removeEventListener: (key) => listeners.delete(key),
  };
  const frame = {
    src: "",
    contentWindow: { location: { hash: "#bible/quiz" }, addEventListener() {} },
  };
  const selectors = new Map();
  for (const key of [
    ".grace-close",
    "input",
    '[data-nav="back"]',
    '[data-nav="forward"]',
    '[data-nav="refresh"]',
    '[data-nav="home"]',
  ])
    selectors.set(key, {});
  selectors.set("iframe", frame);
  const dialog = {
    open: false,
    dataset: { island: "city" },
    querySelector: (key) => selectors.get(key),
    querySelectorAll: () => [],
    addEventListener: (key, fn) => events.set(key, fn),
    removeEventListener: (key) => events.delete(key),
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
      events.get("close")?.();
    },
  };
  const world = {
    inert: false,
    focus() {
      this.focused = true;
    },
  };
  let browser;
  try {
    browser = mountGraceBrowser(dialog, {
      world,
      profile: { id: "test" },
      appearance: () => ({}),
      send: (message) => messages.push(message),
    });
    browser.open("bible/quiz");
    assert.equal(world.inert, true);
    assert.equal(messages.at(-1).open, true);
    frame.onload();
    browser.open("social");
    frame.contentWindow.location.hash = "#social";
    frame.onload();
    selectors.get('[data-nav="back"]').onclick();
    assert.match(frame.src, /#bible\/quiz$/);
    frame.contentWindow.location.hash = "#bible/quiz";
    frame.onload();
    selectors.get('[data-nav="forward"]').onclick();
    assert.match(frame.src, /#social$/);
    const receive = listeners.get("message"),
      count = messages.length;
    receive({
      origin: "https://other.test",
      source: frame.contentWindow,
      data: {
        type: "kairos-grace:action",
        action: "visit",
        value: "game-quiz",
      },
    });
    assert.equal(messages.length, count);
    receive({
      origin: location.origin,
      source: {},
      data: {
        type: "kairos-grace:action",
        action: "visit",
        value: "game-quiz",
      },
    });
    assert.equal(messages.length, count);
    receive({
      origin: location.origin,
      source: frame.contentWindow,
      data: {
        type: "kairos-grace:action",
        action: "visit",
        value: "game-quiz",
      },
    });
    assert.ok(
      messages.some(
        (m) => m.type === "kairos-world:visit" && m.destination === "game-quiz",
      ),
    );
    assert.equal(world.inert, false);
    assert.equal(world.focused, true);
    assert.equal(frame.src, "about:blank");
    assert.ok(
      messages.some(
        (m) => m.type === "kairos-world:grace-state" && m.open === false,
      ),
    );
  } finally {
    browser?.dispose();
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldLocation === undefined) delete globalThis.location;
    else globalThis.location = oldLocation;
  }
});
