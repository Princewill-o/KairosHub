"use client";
import { TrainFront, X } from "lucide-react";
import { ISLANDS } from "@/game/core/islands";
import { IslandAtlas } from "./island-atlas";
export type TubeTrip = { kind: "station"; id: string } | { kind: "map"; mapId: string; label: string };
export function TubeBadge({ size = 28 }: { size?: number }) {
  return <span className="inline-grid place-items-center rounded-lg bg-[#7045a2] text-white" style={{ width: size, height: size }}><TrainFront size={size*.65} /></span>;
}
export function TubeMap({ here, stations, onGo, onClose }: { here: string; stations: { id: string; name: string; lines: string[] }[]; onGo: (trip: TubeTrip) => void; onClose: () => void }) {
  const current = stations.find(station => station.id === here);
  const travel = (id: string) => { if (id !== here) onGo({ kind: "station", id }); };
  return <div className="absolute inset-0 z-[100007] grid place-items-center bg-black/65 p-3" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="Grace Line island train destinations" onClick={event => event.stopPropagation()} className="max-h-[92%] w-full max-w-3xl overflow-auto rounded-3xl bg-[#f8f3e8] p-4 text-[#281c37] sm:p-6">
      <header className="flex items-center gap-3"><TubeBadge size={40}/><div className="flex-1"><p className="text-xs font-black uppercase tracking-[.2em] text-[#7045a2]">Grace Line · London branch</p><h2 className="text-2xl font-black">{current?.name ?? "Choose an island"}</h2></div><button type="button" onClick={onClose} aria-label="Close train map" className="grid size-11 place-items-center rounded-full bg-black/5"><X/></button></header>
      <p className="my-3 text-sm">You’re on the train. Choose a station, then leave through Way Out to explore its island.</p>
      <IslandAtlas here={here} onSelect={travel}/>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{ISLANDS.map(island => <button type="button" key={island.id} disabled={island.station===here} onClick={() => travel(island.station)} className="rounded-2xl border border-[#e2d5e9] bg-white p-3 text-left disabled:bg-[#eee4f6]"><span className="block font-black">{island.name}{island.station===here ? " · here" : ""}</span><span className="text-xs">{island.subtitle}</span></button>)}</div>
    </section>
  </div>;
}
