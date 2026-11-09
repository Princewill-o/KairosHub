import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";

async function load(entry) {
  const out = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent", loader: { ".json": "json" } });
  const file = `/tmp/kairos-${Math.random().toString(36).slice(2)}.mjs`;
  await fs.writeFile(file, out.outputFiles[0].text);
  return import(pathToFileURL(file).href);
}

test("a ride closes its doors, runs through the tunnel, stops exactly at the next platform", async () => {
  const r = await load("./world-runtime/source/game/core/ride.ts");
  assert.equal(r.rideFrame(0).doorOpen, 1);
  assert.equal(r.rideFrame(r.RIDE_CLOSE_MS - 1).distance, 0);
  let last = 0, sawTunnel = false;
  for (let t = 0; t <= r.RIDE_ARRIVE_MS; t += 100) {
    const f = r.rideFrame(t);
    assert.ok(f.distance >= last - 1e-9, `never runs backwards at ${t}`);
    if (f.speed > 0) assert.equal(f.doorOpen, 0, "doors shut while moving");
    assert.equal(f.canAlight, false);
    sawTunnel ||= f.tunnel;
    last = f.distance;
  }
  assert.ok(sawTunnel);
  assert.ok(Math.abs(r.rideFrame(r.RIDE_ARRIVE_MS).distance - r.RIDE_DISTANCE) < 1e-6);
  assert.equal(r.rideFrame(r.RIDE_ARRIVE_MS + 2000).canAlight, true);
  assert.equal(r.rideFrame(r.RIDE_ARRIVE_MS + 2000).doorOpen, 1);
});

test("staying aboard carries you round the Grace Line loop", async () => {
  const r = await load("./world-runtime/source/game/core/ride.ts");
  const from = r.stationStop("london-square");
  const ride = { from, to: r.nextStop(from), at: 0, leg: 0 };
  const later = r.advanceRide(ride, r.RIDE_LEG_MS * 2 + 10);
  assert.equal(later.leg, 2);
  assert.equal(later.from.id, r.nextStop(ride.to).id);
  assert.notEqual(later.to.id, later.from.id);
});

test("the carriage is walkable, with seats and three platform-side doors", async () => {
  const w = await load("./world-runtime/source/game/core/world.ts");
  const d = await load("./world-runtime/source/game/core/doors.ts");
  const car = w.trainCarriageMap();
  assert.equal(car.kind, "train");
  assert.equal(car.portals.filter((p) => p.to.kind === "alight").length, 3);
  assert.ok(car.tiles[1].includes("s") && car.tiles[car.rows - 2].includes("s"));
  for (const x of w.CARRIAGE_DOORS) assert.equal(car.tiles[1][x], ".");
  // Station entrances are stairs, never doors or teleports.
  const station = w.stationMap("london-square");
  assert.ok(station.portals.some((p) => d.isStairway(station, p)));
  assert.equal(d.doorways(station).some((x) => d.isStairway(station, x.portal)), false);
  assert.ok(d.stairLift(station, 15, 1.2) > 1);
});
