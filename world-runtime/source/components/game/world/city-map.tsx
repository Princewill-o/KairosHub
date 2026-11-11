"use client";

import { useEffect, useMemo, useRef } from "react";

import { ArrowUp, Map as MapIcon } from "lucide-react";

import { PLAYER } from "./art";

import { KIND, placesFor, type Place, type PlaceKind } from "@/game/core/map-guide";
import { CITY, TILE, type WorldMap } from "@/game/core/world";
import { paintLowPolyMap } from "../../../../../public/lowpoly-map.mjs";

/**
 * London map: a minimap that follows you, and a full map with every station,
 * bus stop, bike dock, job and venue. Pick a place (or a task) to set a
 * waypoint; an arrow and distance then guide you there.
 */
const COLOUR: Record<string, string> = {
  w: "#5aa9e6",
  g: "#9fd37a",
  f: "#9fd37a",
  T: "#6fb15a",
  "=": "#55596a",
  ":": "#55596a",
  "-": "#e9e2d2",
  _: "#e2d3a8",
  "|": "#c9c2b2",
  L: "#e9e2d2",
};

export { placesFor, type Place, type PlaceKind } from "@/game/core/map-guide";
export const PLACES = placesFor(CITY);

/** Where a task sends you: the nearest matching place. */
export function placeForTask(tag: string, title: string): PlaceKind | null {
  const t = `${tag} ${title}`.toLowerCase();
  if (t.includes("bus")) return "bus";
  if (t.includes("study") || t.includes("learn")) return "study";
  if (t.includes("job") || t.includes("shift")) return "job";
  if (t.includes("arcade") || t.includes("game")) return "games";
  if (t.includes("homework")) return "home";
  return null;
}

export const nearest = (kind: PlaceKind, places: Place[] = PLACES) =>
  places.filter((p) => p.kind === kind).sort((a, b) => Math.hypot(a.x - PLAYER.x, a.y - PLAYER.y) - Math.hypot(b.x - PLAYER.x, b.y - PLAYER.y))[0] ?? null;

function useCityCanvas(map: WorldMap, scale: number) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    c.width = map.cols * scale;
    c.height = map.rows * scale;
    // Low-poly terrain with ink outlines, the same look as the 3D world.
    paintLowPolyMap(ctx, map, scale, { frame: false });
  }, [map, scale]);
  return ref;
}

export { WorldMapPanel as CityMap } from "./world-map";

/** Small map that follows you, with an arrow and distance to your waypoint. */
export function MiniMap({ map, waypoint, onOpen, onArrive, searchArea }: { searchArea?: { origin: { x: number; y: number }; radius: number } | null; map: WorldMap; waypoint: Place | null; onOpen: () => void; onArrive: () => void }) {
  const S = 4;
  const canvas = useCityCanvas(map, S);
  const wrap = useRef<HTMLSpanElement>(null);
  const viewport = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLDivElement>(null);
  const dist = useRef<HTMLSpanElement>(null);
  const pin = useRef<HTMLSpanElement>(null);
  const places = useMemo(() => placesFor(map), [map]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const mx = (PLAYER.x / TILE) * S;
      const my = (PLAYER.y / TILE) * S;
      if (wrap.current && viewport.current) wrap.current.style.transform = `translate(${viewport.current.clientWidth / 2 - mx}px, ${viewport.current.clientHeight / 2 - my}px)`;
      if (waypoint) {
        const dx = waypoint.x - PLAYER.x;
        const dy = waypoint.y - PLAYER.y;
        if (arrow.current) arrow.current.style.transform = `rotate(${Math.atan2(dy, dx) + Math.PI / 2}rad)`;
        // Rough metres: a tile is about 8 m of London.
        if (Math.hypot(dx, dy) < TILE * 1.6) onArrive();
        if (dist.current) dist.current.textContent = `${Math.round((Math.hypot(dx, dy) / TILE) * 8)} m`;
        if (pin.current) {
          pin.current.style.left = `${(waypoint.x / TILE) * S}px`;
          pin.current.style.top = `${(waypoint.y / TILE) * S}px`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [waypoint, onArrive]);
  return (
    <button type="button" data-hud="minimap" onClick={onOpen} aria-label="Open the map" className="absolute top-[118px] right-3 z-[100001] block text-left">
      <span ref={viewport} className="relative block size-20 overflow-hidden rounded-full border-[3px] border-[#120c18] bg-[#46a6cf] shadow-[4px_4px_0_#120c18] sm:size-[104px] xl:size-28">
        <span ref={wrap} className="absolute top-0 left-0 block" style={{ width: map.cols * S, height: map.rows * S }}>
          {searchArea && <span aria-label="Police search area" className="pointer-events-none absolute z-10 rounded-full border-2 border-[#e04a3f] bg-[#e04a3f]/20" style={{left:(searchArea.origin.x-searchArea.radius)/TILE*S,top:(searchArea.origin.y-searchArea.radius)/TILE*S,width:searchArea.radius*2/TILE*S,height:searchArea.radius*2/TILE*S}}/>}
            <canvas ref={canvas} className="absolute inset-0" aria-hidden />
          {places.map((p) => (
            <span key={p.id} className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#120c18]" style={{ left: (p.x / TILE) * S, top: (p.y / TILE) * S, background: KIND[p.kind].colour }} />
          ))}
          {waypoint && <span ref={pin} className="map-me absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#d4241f]" />}
        </span>
        <span className="absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-[2.5px] border-[#120c18] bg-[#f5b83d]" aria-hidden />
        <span className="absolute right-1 bottom-1 grid size-7 place-items-center rounded-full border-2 border-[#120c18] bg-[#2a1d44] text-white">
          <MapIcon className="size-4" aria-hidden />
        </span>
      </span>
      {waypoint && (
        <span className="mt-2 flex items-center justify-center gap-1.5 rounded-full border-[3px] border-[#120c18] bg-[#2a1d44] px-2 py-1 text-xs font-black text-white shadow-[3px_3px_0_#120c18]">
          <span ref={arrow} className="inline-block">
            <ArrowUp className="size-3.5" aria-hidden />
          </span>
          <span className="hidden max-w-24 truncate sm:inline">{waypoint.name}</span>
          <span ref={dist} className="text-[#f2d9a6]" />
        </span>
      )}
    </button>
  );
}
