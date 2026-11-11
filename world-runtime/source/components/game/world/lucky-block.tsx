"use client";
import { useEffect, useState } from "react";
import { TIERS, open, type Outcome, type Tier } from "@/game/core/lucky-blocks";

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
    <div className="lb-back" role="dialog" aria-modal="true" aria-label={t.name} style={{ ["--lb" as string]: t.colour, ["--lb-edge" as string]: t.edge }}>
      <p className="lb-tier">{t.name}</p>
      {!out ? (
        <>
          <button className={`lb-cube${cracked ? " lb-burst" : ""}`} onClick={hit} aria-label={`Mine the block (${hits}/${need})`} data-hits={hits}>
            <span className="lb-face lb-front">?</span><span className="lb-face lb-top" /><span className="lb-face lb-side" />
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
