"use client";
import { useState, type ComponentProps } from "react";
import { X, MapPin } from "lucide-react";
import { IslandAtlas } from "./island-atlas";
import { LocationMap } from "./location-map";
export function WorldMapPanel(props: ComponentProps<typeof LocationMap>) {
  const [local, setLocal] = useState(false);
  if (local || !props.map.island) return <LocationMap {...props} onClose={() => props.map.island ? setLocal(false) : props.onClose()} />;
  const station = props.map.portals.find(portal => portal.id.startsWith("tube-"));
  return <div className="absolute inset-0 z-[100007] grid place-items-center bg-black/65 p-3"><section role="dialog" aria-modal="true" aria-label="Kairos islands map" className="max-h-[92%] w-full max-w-4xl overflow-auto rounded-3xl bg-[#f8f3e8] p-5 text-[#281c37]">
    <header className="mb-4 flex items-center gap-3"><div className="flex-1"><p className="text-xs font-black uppercase tracking-[.2em] text-[#7045a2]">London branch</p><h2 className="text-2xl font-black">Your island journey</h2></div><button type="button" onClick={props.onClose} aria-label="Close islands map" className="grid size-11 place-items-center rounded-full bg-black/5"><X/></button></header>
    <IslandAtlas here={props.map.id} onSelect={() => { if (station) props.onPick({ id: station.id, name: station.label, kind: "station", x: station.rect.x+station.rect.w/2, y: station.rect.y+station.rect.h/2 }); props.onClose(); }} />
    <p className="my-4 text-sm">Each island is a separate place. Pick an island to mark your nearest station, then board a train and choose your destination.</p>
    <button type="button" onClick={() => setLocal(true)} className="flex min-h-12 items-center gap-2 rounded-full bg-[#7045a2] px-5 font-bold text-white"><MapPin size={18}/>Street map · {props.map.name}</button>
  </section></div>;
}
