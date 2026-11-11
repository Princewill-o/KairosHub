"use client";
import { useEffect, useState } from "react";
import { TIERS, open, type Outcome, type Tier } from "@/game/core/lucky-blocks";

/**
 * The block's face as 16×16 pixel art (like the Lucky Block mod): a textured
 * gold (or diamond, emerald, obsidian) block with a darker rim and a chunky
 * pixel question mark with a drop shadow. Returned as a data URL.
 */
const Q = ["", "", "    XXXXXX", "   XX    XX", "   XX    XX", "         XX", "        XX", "       XX", "      XX", "      XX", "", "      XX", "      XX"];
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))));
  return `rgb(${c.join(",")})`;
}
/** The block sitting in the 3D world, shared with the scene (one object across bundles). */
export type LuckyInWorld = { tier: Tier; url: string; x: number; z: number } | null;
export const LUCKY_WORLD: { current: LuckyInWorld } = ((globalThis as { __kairosLucky?: { current: LuckyInWorld } }).__kairosLucky ??= { current: null });
export const luckyFaceUrl = (base: string, edge: string) => luckyFace(base, edge).slice(5, -2);
export function luckyFace(base: string, edge: string, seed = 7) {
  let r = seed; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const px: string[] = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const rim = x === 0 || y === 0 || x === 15 || y === 15, inner = x === 1 || y === 1 || x === 14 || y === 14;
    const fill = rim ? edge : inner ? shade(base, -0.18) : shade(base, (rnd() - 0.5) * 0.28);
    px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`);
  }
  Q.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "X") { px.push(`<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="${shade(edge, -0.35)}"/>`); } }));
  Q.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "X") px.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#ffffff"/>`); }));
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${px.join("")}</svg>`)}")`;
}

/**
 * Mining and unpacking a lucky block: you hit it until it cracks, it bursts
 * open in a shower of pixels, and the card inside shows what changed.
 */
export function LuckyBlock({ tier, onDone }: { tier: Tier; onDone: (o: Outcome) => void }) {
  const t = TIERS.find((x) => x.id === tier)!;
  const [hits, setHits] = useState(0);
  const [out, setOut] = useState<Outcome | null>(null);
  const need = tier === "gold" ? 3 : tier === "diamond" ? 5 : tier === "emerald" ? 7 : 9;
  const hit = () => { if (out) return; const n = hits + 1; setHits(n); if (n >= need) setTimeout(() => setOut(open(tier)), 650); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === " " || e.key.toLowerCase() === "f" || e.key === "Enter") { e.preventDefault(); if (out) onDone(out); else hit(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  const cracked = hits >= need;
  return (
    <div className="lb-back" role="dialog" aria-modal="true" aria-label={t.name} style={{ ["--lb" as string]: t.colour, ["--lb-edge" as string]: t.edge, ["--lb-face" as string]: luckyFace(t.colour, t.edge) }}>
      <p className="lb-tier">{t.name}</p>
      {!out ? (
        <>
          <button className={`lb-cube${cracked ? " lb-burst" : ""}`} onClick={hit} aria-label={`Mine the block (${hits}/${need})`} data-hits={hits}>
            <span className="lb-face lb-front" /><span className="lb-face lb-top" /><span className="lb-face lb-side" />
            {Array.from({ length: Math.min(hits, need) }, (_, i) => <i key={i} className="lb-crack" style={{ transform: `rotate(${i * 47}deg)` }} />)}
            {cracked && Array.from({ length: 18 }, (_, i) => <b key={i} className="lb-bit" style={{ ["--a" as string]: `${i * 20}deg` }} />)}
          </button>
          <p className="lb-hint">{cracked ? "It's opening…" : `Mine it! Click or press F (${hits}/${need})`}</p>
        </>
      ) : (
        <div className={`lb-card${out.good ? " lb-good" : " lb-bad"}`} data-outcome={out.id}>
          <small>{out.good ? "Your life just changed" : "Not every block is lucky"}</small>
          <h2>{out.title}</h2>
          <p>{out.text}</p>
          <button onClick={() => onDone(out)}>Carry on</button>
        </div>
      )}
    </div>
  );
}
