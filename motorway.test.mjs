import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";

async function load(entry) {
  const out = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
  const file = `/tmp/kairos-${Math.random().toString(36).slice(2)}.mjs`;
  await fs.writeFile(file, out.outputFiles[0].text);
  return import(pathToFileURL(file).href);
}

test("the M25 has three lanes each way, a barrier, a tunnel and slip roads", async () => {
  const w = await load("./world-runtime/source/game/core/world.ts");
  const m = w.motorwayMap();
  for (const lane of [...w.M25.east, ...w.M25.west]) assert.equal(m.tiles[Math.floor(lane)][5], "=", `lane ${lane} is road`);
  assert.equal(m.tiles[w.M25.barrier][5], "|");
  assert.equal(m.tiles[9][(w.M25.tunnel[0] + w.M25.tunnel[1]) >> 1], "=", "the road runs through the tunnel");
  assert.equal(m.tiles[3][(w.M25.tunnel[0] + w.M25.tunnel[1]) >> 1], "X", "the hill sits over it");
  const ids = m.portals.map((p) => p.to.kind === "map" && p.to.mapId);
  assert.ok(ids.includes("city") && ids.includes("highlands"));
  const i = await load("./world-runtime/source/game/core/islands.ts");
  assert.ok(i.islandMap("city").portals.some((p) => p.to.kind === "map" && p.to.mapId === "m25"));
});
