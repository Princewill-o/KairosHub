import { ISLANDS } from "./islands";

/**
 * One continuous train ride between two stations: no cutscene. You walk into a
 * real carriage, the doors close, the line runs past outside the windows (and
 * through a tunnel), the train brakes into the next platform and the doors
 * open. Stay on and it carries on to the station after that.
 * Units: milliseconds on the performance clock; distance in tiles.
 */
export type RideStop = { kind: "station"; id: string; name: string } | { kind: "map"; mapId: string; name: string };
export interface Ride { from: RideStop; to: RideStop; at: number; leg: number }

export const RIDE_CLOSE_MS = 2500;
export const RIDE_ACCEL_MS = 4000;
export const RIDE_CRUISE_MS = 11500;
export const RIDE_BRAKE_MS = 6000;
export const RIDE_ARRIVE_MS = RIDE_CLOSE_MS + RIDE_ACCEL_MS + RIDE_CRUISE_MS + RIDE_BRAKE_MS;
/** Doors stay open this long at each stop before the train moves on. */
export const RIDE_DWELL_MS = 11000;
export const RIDE_LEG_MS = RIDE_ARRIVE_MS + RIDE_DWELL_MS;
export const RIDE_TOP_SPEED = 14;
export const RIDE_DISTANCE = RIDE_TOP_SPEED * (RIDE_ACCEL_MS / 2 + RIDE_CRUISE_MS + RIDE_BRAKE_MS / 2) / 1000;
/** The middle stretch of every run is underground. */
export const RIDE_TUNNEL = [RIDE_DISTANCE * 0.34, RIDE_DISTANCE * 0.66] as const;

export const stationStop = (id: string): RideStop => {
  const island = ISLANDS.find((i) => i.station === id);
  return { kind: "station", id, name: island?.name ?? id };
};
/** Stations in line order; the Grace Line runs as a loop. */
export function nextStop(stop: RideStop, origin?: RideStop): RideStop {
  if (stop.kind === "map") return origin ?? stationStop(ISLANDS[0].station);
  const order = ISLANDS.map((i) => i.station as string);
  const i = order.indexOf(stop.id);
  return stationStop(order[(i + 1 + order.length) % order.length]);
}

export function rideFrame(elapsed: number) {
  const t = Math.max(0, elapsed);
  const v = RIDE_TOP_SPEED;
  const a = RIDE_CLOSE_MS, b = a + RIDE_ACCEL_MS, c = b + RIDE_CRUISE_MS, d = c + RIDE_BRAKE_MS;
  let distance = 0, speed = 0;
  if (t < a) distance = 0;
  else if (t < b) { const u = (t - a) / 1000; speed = v * u / (RIDE_ACCEL_MS / 1000); distance = speed * u / 2; }
  else if (t < c) { speed = v; distance = v * RIDE_ACCEL_MS / 2000 + v * (t - b) / 1000; }
  else if (t < d) {
    const w = (t - c) / RIDE_BRAKE_MS, T = RIDE_BRAKE_MS / 1000;
    speed = v * (1 - w);
    distance = v * RIDE_ACCEL_MS / 2000 + v * RIDE_CRUISE_MS / 1000 + v * T * (w - w * w / 2);
  } else distance = RIDE_DISTANCE;
  const smooth = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
  // Doors: open as you board, shut before moving, open on arrival, shut before leaving.
  const doorOpen = t < a ? 1 - smooth((t - 1200) / 1000)
    : t < d ? 0
    : t < RIDE_LEG_MS - 1300 ? smooth((t - d) / 900)
    : 1 - smooth((t - (RIDE_LEG_MS - 1300)) / 1000);
  const phase = t < a ? "closing" : t < b ? "departing" : t < c ? "running" : t < d ? "braking" : t < RIDE_LEG_MS ? "arrived" : "leaving";
  const tunnel = distance >= RIDE_TUNNEL[0] && distance <= RIDE_TUNNEL[1];
  return { phase, distance, speed, doorOpen, tunnel, canAlight: t >= d + 600 && t < RIDE_LEG_MS - 1300 };
}

/** Rolls a ride on to its next leg when you stayed aboard. Returns the live ride. */
export function advanceRide(ride: Ride, now: number): Ride {
  let r = ride;
  while (now - r.at >= RIDE_LEG_MS) r = { from: r.to, to: nextStop(r.to, r.from), at: r.at + RIDE_LEG_MS, leg: r.leg + 1 };
  return r;
}
