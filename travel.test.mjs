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
