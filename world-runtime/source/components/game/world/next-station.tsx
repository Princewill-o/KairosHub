"use client";
import { useEffect, useState } from "react";
import { RIDE_ARRIVE_MS, advanceRide, nextStop, rideFrame, type Ride } from "@/game/core/ride";

/**
 * The carriage's dot-matrix board: where you are, the next station in big
 * letters, a progress line and a countdown, and "doors open" when you can
 * step off. Reads the live ride each half-second.
 */
export function NextStationBoard({ ride }: { ride: { current: Ride | null } }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 500); return () => clearInterval(t); }, []);
  const now = performance.now();
  const r = ride.current && advanceRide(ride.current, now);
  if (!r) return null;
  const elapsed = now - r.at;
  const f = rideFrame(elapsed);
  const arriving = Math.max(0, Math.ceil((RIDE_ARRIVE_MS - elapsed) / 1000));
  const after = nextStop(r.to, r.from);
  return (
    <div className="ns-board" data-hud="next-station" role="status" aria-live="polite">
      <small>{f.canAlight ? "This station is" : "Next station"}</small>
      <b>{r.to.name}</b>
      <span className="ns-line" aria-hidden><i style={{ width: `${Math.min(100, (elapsed / RIDE_ARRIVE_MS) * 100)}%` }} /></span>
      <span className="ns-foot">
        <em>{f.canAlight ? "Doors open: press E to step off" : `Arriving in ${arriving}s`}</em>
        <em>Then: {after.name}</em>
      </span>
    </div>
  );
}
