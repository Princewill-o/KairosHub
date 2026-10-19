"use client";

import { useState } from "react";
import { Bus, Trees, X } from "lucide-react";
import { BusJourneyScene, BusRide } from "./transport";

export type BusTrip =
  | { kind: "stop"; id: string; name: string }
  | { kind: "map"; mapId: string; label: string };

interface Stop { id: string; name: string; route: string }

/** London's bus stop: departures and city destinations, with no school or homework activities. */
export function BusStop({ here, stops, onGo, onClose }: {
  here: string;
  stops: Stop[];
  onGo: (trip: BusTrip, revised: false) => void;
  onClose: () => void;
}) {
  const current = stops.find((stop) => stop.id === here);
  const [cruising, setCruising] = useState<(BusTrip & { route: string }) | null>(null);
  const departures = stops.filter((stop) => stop.id !== here).map((stop) => ({ kind: "stop" as const, ...stop }));
  const trips: (BusTrip & { route: string })[] = [
    ...departures,
    { kind: "map", mapId: "woodland", label: "Kharis Woodland", route: "KH1" },
  ];
  const mins = (i: number) => ((new Date().getMinutes() + i * 4) % 9) + 1;

  if (cruising) return <BusRide route={cruising.route} to={cruising.kind === "stop" ? cruising.name : cruising.label} onArrive={() => onGo(cruising, false)} />;
  return (
    <div className="absolute inset-0 z-[100000] grid place-items-end bg-black/60 md:place-items-center" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label="London bus stop" onClick={(event) => event.stopPropagation()} className="max-h-[88%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-[#f7f1e6] p-5 text-[#26133e] shadow-2xl md:rounded-3xl">
        <header className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#6d45a2] text-white"><Bus className="size-6" aria-hidden /></span>
          <div className="min-w-0 flex-1"><p className="text-xs font-black tracking-[0.25em] text-[#6d45a2] uppercase">London transport</p><h2 className="truncate text-2xl font-black">{current?.name ?? "London"}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full bg-[#26133e]/10"><X className="size-4" /></button>
        </header>
        <div className="mt-4 rounded-2xl bg-[#26133e] p-3 font-mono text-sm text-[#ffd84d]" aria-label="Departures">
          {trips.slice(0, 5).map((trip, i) => <p key={trip.kind === "stop" ? trip.id : trip.mapId} className="flex justify-between"><span>{trip.route.padEnd(4)} {trip.kind === "stop" ? trip.name : trip.label}</span><span>{i === 0 ? "due" : `${mins(i)} min`}</span></p>)}
        </div>
        <p className="mt-4 text-xs font-black tracking-widest text-[#655972] uppercase">Choose a destination</p>
        <ul className="mt-2 grid gap-2">
          {trips.map((trip) => <li key={trip.kind === "stop" ? trip.id : trip.mapId}>
            <button type="button" onClick={() => setCruising(trip)} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 border-white bg-white/80 px-3 py-2.5 text-left font-bold hover:border-[#6d45a2]">
              <span className="grid h-8 min-w-11 place-items-center rounded-md bg-[#6d45a2] px-1.5 text-xs font-black text-white">{trip.route}</span>
              <span className="flex-1">{trip.kind === "stop" ? trip.name : trip.label}</span>
              {trip.kind === "map" && <Trees className="size-4 text-[#6d45a2]" aria-hidden />}
            </button>
          </li>)}
        </ul>
      </section>
    </div>
  );
}
