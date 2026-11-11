import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
const out = await build({ entryPoints: ["./world-runtime/source/game/core/world.ts"], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const file = `/tmp/kairos-world-${process.pid}.mjs`;
await fs.writeFile(file, out.outputFiles[0].text);
const W = await import(pathToFileURL(file).href);

test("tunnels only where a road meets the map edge", () => {
  const map = { cols: 10, rows: 8, tiles: ["gggggggggg", "gggggggggg", "====gggggg", "====gggggg", "gggggggggg", "gggggggggg", "gggggg==gg", "gggggg==gg"] };
  const ends = W.roadEnds(map, 2);
  assert.deepEqual(ends.map((e) => e.side).sort(), ["s", "w"]);
  assert.equal(ends.find((e) => e.side === "w").at, 3);
  assert.equal(ends.find((e) => e.side === "s").at, 7);
  assert.deepEqual(W.roadEnds({ cols: 4, rows: 4, tiles: ["gggg", "gggg", "gggg", "gggg"] }), []);
});

test("London Square connects to Greater London, the M25, the airport and the ferry", () => {
  const city = W.londonMap();
  const to = city.portals.map((p) => p.to.mapId).filter(Boolean);
  for (const id of ["greater-london", "m25", "ferry"]) assert.ok(to.includes(id), id);
  assert.ok(W.motorwayMap().portals.some((p) => p.to.mapId === "airport"));
  assert.ok(W.airportMap().portals.some((p) => p.to.mapId === "flight"));
  assert.ok(W.roadEnds(city).some((e) => e.side === "w") && W.roadEnds(city).some((e) => e.side === "e"));
});

test("Greater London is far bigger than the square and its stations join the Grace Line", () => {
  const big = W.greaterLondonMap(), small = W.londonMap();
  assert.ok(big.cols * big.rows > small.cols * small.rows * 5);
  assert.equal(big.id, "greater-london");
  for (const p of big.portals.filter((p) => p.to.kind === "map" && p.to.mapId.startsWith("station-"))) assert.equal(p.to.mapId, "station-london-square");
  assert.ok(big.portals.some((p) => p.to.mapId === "city"));
});

test("the flight cabin has an aisle to walk and seats either side", () => {
  const f = W.flightMap();
  const aisle = f.tiles[W.CABIN.aisle];
  assert.ok(aisle.slice(1, -1).split("").every((c) => c === "."));
  assert.ok(f.tiles[1].includes("s") && f.tiles[4].includes("s"));
});

test("LTBS: each story portal sits on its own side of the island inside a themed biome, with a description", async () => {
  const out2 = await build({ entryPoints: ["./world-runtime/source/game/core/islands.ts"], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
  const f2 = `/tmp/kairos-islands-${process.pid}.mjs`; await fs.writeFile(f2, out2.outputFiles[0].text);
  const I = await import(pathToFileURL(f2).href);
  const m = I.islandMap("scripture-island");
  const stories = m.portals.filter((p) => p.to.kind === "story-enter");
  assert.equal(stories.length, 4);
  const sides = new Set();
  for (const b of I.STORY_BIOMES) {
    const p = stories.find((q) => q.to.story === b.story);
    const px = p.rect.x / 32, py = p.rect.y / 32;
    assert.ok(px >= b.x && px + 2 <= b.x + b.w && py >= b.y && py + 2 <= b.y + b.h, `${b.story} portal inside its biome`);
    assert.ok(b.blurb.length > 30 && b.ref, b.story);
    sides.add(`${px < 26 ? "w" : "e"}${py < 30 ? "n" : "s"}`);
  }
  assert.equal(sides.size, 4, "one story on each side");
  const gates = m.portals.filter((p) => p.to.kind === "scripture-challenge").map((p) => [p.rect.x / 32 + 1, p.rect.y / 32]);
  assert.equal(gates.length, 12);
  for (let i = 0; i < gates.length; i++) for (let j = i + 1; j < gates.length; j++) assert.ok(Math.hypot(gates[i][0] - gates[j][0], gates[i][1] - gates[j][1]) >= 3, "challenge gates have room");
  for (const p of [...stories]) for (let y = p.rect.y / 32; y < (p.rect.y + p.rect.h) / 32; y++) for (let x = p.rect.x / 32; x < (p.rect.x + p.rect.w) / 32; x++) assert.notEqual(m.tiles[y][x], "X");
});

test("LTBS challenge gates are spread across the island, apart and off the biomes", async () => {
  const out3 = await build({ entryPoints: ["./world-runtime/source/game/core/islands.ts"], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
  const f3 = `/tmp/kairos-islands-g-${process.pid}.mjs`; await fs.writeFile(f3, out3.outputFiles[0].text);
  const map = (await import(pathToFileURL(f3).href)).islandMap("scripture-island");
  assert.ok(map, "scripture island map");
  const gates = map.portals.filter((p) => p.to.kind === "scripture-challenge");
  assert.ok(gates.length >= 6);
  const pts = gates.map((p) => [p.rect.x / W.TILE, p.rect.y / W.TILE]);
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) assert.ok(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) >= 4, "gates at least four tiles apart");
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 26, "gates span the island's width");
  assert.ok(Math.max(...ys) - Math.min(...ys) >= 14, "and its depth");
});
