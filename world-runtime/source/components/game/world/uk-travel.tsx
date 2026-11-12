"use client";
/** The UK travel map: every Kharis branch city, with trains, coaches and Kairos Air between them. */
import { useEffect, useMemo, useState } from "react";
import { UK_CITIES, cityById, travelOptions, distanceMiles, type TravelMode } from "@/game/core/uk";

// Great Britain coastline, projected onto the same 300 × 480 frame as the city pins.
const GB = "11,476 71,460 133,447 172,436 220,435 274,418 278,404 251,398 268,381 276,372 291,343 274,318 236,320 238,307 229,282 222,253 202,232 172,204 150,162 105,150 116,124 146,86 150,56 68,66 110,3 38,4 30,44 11,77 19,127 15,188 53,179 38,210 98,207 94,237 116,255 113,292 68,298 53,292 47,325 71,348 30,383 77,392 105,400 113,411 94,414 56,425";
// Low-poly facets: lines from an inland point to the coast give a faceted shading.
const FACETS = [[150, 340], [110, 230], [90, 120]] as const;
const MODE_ICON: Record<TravelMode, string> = { train: "M4 3h16v12H4zM6 18l-2 3M18 18l2 3M7 12h2M15 12h2M4 9h16", coach: "M3 5h18v11H3zM6 19a1.5 1.5 0 1 0 0-.1M18 19a1.5 1.5 0 1 0 0-.1M3 10h18", flight: "M2 13l9-2 4-8h2l-2 8 6 1 2-2h1l-1 4 1 4h-1l-2-2-6 1 2 8h-2l-4-8-9-2z" };

export function UkTravel({ here, mode, wallet, currency, onGo, onClose }: { here: string; mode?: TravelMode; wallet: number; currency: (n: number) => string; onGo: (to: string, mode: TravelMode, fare: number, minutes: number) => void; onClose: () => void }) {
  const [pick, setPick] = useState<string | null>(null);
  const city = pick ? cityById(pick) : null;
  const options = useMemo(() => (pick ? travelOptions(here, pick).sort((a, b) => Number(b.mode === mode) - Number(a.mode === mode)) : []), [pick, here, mode]);
  const from = cityById(here);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", k, true); return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);
  return (
    <div className="uk-backdrop" onClick={onClose}>
      <section className="uk-panel" role="dialog" aria-modal="true" aria-label="UK travel map" onClick={(e) => e.stopPropagation()}>
        <header className="uk-head">
          <div><small>KHARIS UK · {mode === "coach" ? "COACH STOP" : mode === "flight" ? "KAIROS AIR" : "NATIONAL RAIL"}</small><h2>Where to, from {from?.name ?? "here"}?</h2></div>
          <button className="kh-x" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="uk-body">
          <svg className="uk-map" viewBox="0 0 300 540" role="group" aria-label="Map of Kharis branches across the UK">
            <rect width="300" height="540" fill="#7cc3d6" />
            <polygon points={GB} fill="#9fca7a" stroke="#120c18" strokeWidth="3" strokeLinejoin="round" />
            {FACETS.map(([x, y], i) => <g key={i} opacity=".22">{GB.split(" ").filter((_, k) => k % 3 === i).map((pt, k) => { const [px, py] = pt.split(","); return <line key={k} x1={x} y1={y} x2={px} y2={py} stroke="#3d6b2e" strokeWidth="1" />; })}</g>)}
            <polygon points={GB} fill="none" stroke="#120c18" strokeWidth="3" strokeLinejoin="round" />
            <rect x="60" y="490" width="200" height="44" fill="#e9d38a" stroke="#120c18" strokeWidth="3" />
            <text x="160" y="503" textAnchor="middle" className="uk-inset">KHARIS INTERNATIONAL</text>
            {pick && from && <line x1={from.x} y1={from.y} x2={city!.x} y2={city!.y} stroke="#6b3fa0" strokeWidth="3" strokeDasharray="6 4" />}
            {UK_CITIES.map((c) => {
              const on = c.id === pick, me = c.id === here;
              const left = ["kp2", "reading", "bristol", "luton", "croydon"].includes(c.id);
              return <g key={c.id} role="button" tabIndex={0} aria-label={`${c.name}${me ? ", you are here" : ""}`} onClick={() => !me && setPick(c.id)} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !me) setPick(c.id); }} className="uk-pin" transform={`translate(${c.x} ${c.y})`}>
                <polygon points="0,-9 7,-3 4,6 -4,6 -7,-3" fill={me ? "#f2c84b" : on ? "#6b3fa0" : c.colour} stroke="#120c18" strokeWidth="2" />
                <text x={left ? -10 : 10} y={c.intl ? 18 : 3} textAnchor={c.intl ? "middle" : left ? "end" : "start"} className={me || on ? "uk-label on" : "uk-label"}>{c.name}{me ? " (here)" : ""}</text>
              </g>;
            })}
          </svg>
          <aside className="uk-side">
            {!city ? <>
              <p className="kh-note">Tap a city on the map. Every pin has a Kharis branch you can visit.</p>
              <ul className="uk-list">{UK_CITIES.filter((c) => c.id !== here).map((c) => <li key={c.id}><button onClick={() => setPick(c.id)}><i style={{ background: c.colour }} />{c.name}<small>{c.region}</small></button></li>)}</ul>
            </> : <>
              <h3>{city.name}</h3>
              <p className="uk-region">{city.region} · Kharis {city.name}{from ? ` · ${distanceMiles(from, city)} miles` : ""}</p>
              {options.length ? <ul className="uk-opts">{options.map((o) => <li key={o.mode}><button disabled={wallet < o.fare} onClick={() => onGo(city.id, o.mode, o.fare, o.minutes)}>
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden><path d={MODE_ICON[o.mode]} fill="none" stroke="#120c18" strokeWidth="2" strokeLinejoin="round" /></svg>
                <span><b>{o.label}</b><small>{o.minutes >= 60 ? `${Math.floor(o.minutes / 60)}h ${o.minutes % 60}m` : `${o.minutes} min`}</small></span>
                <em>{currency(o.fare)}</em>
              </button></li>)}</ul> : <p className="kh-note">No direct route from here. {city.intl ? "Fly from London, Birmingham, Bristol, Luton or Manchester." : ""}</p>}
              {options.some((o) => wallet < o.fare) && <p className="uk-region">Some fares are more than you have ({currency(wallet)}).</p>}
              <button className="kh-back" onClick={() => setPick(null)}>‹ All cities</button>
            </>}
          </aside>
        </div>
      </section>
    </div>
  );
}

/** The short journey card shown while you travel by train or coach. */
export function UkJourney({ mode, from, to, minutes }: { mode: TravelMode; from: string; to: string; minutes: number }) {
  const a = cityById(from), b = cityById(to);
  return <div className="uk-journey" role="status">
    <div className="uk-journey-card">
      <small>{mode === "coach" ? "COACH" : "TRAIN"} · {minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`}</small>
      <div className="uk-track"><b>{a?.name}</b><span className="uk-line"><i className={`uk-vehicle uk-${mode}`} /></span><b>{b?.name}</b></div>
      <p>{mode === "coach" ? "The coach rolls up the motorway past fields and services." : "The train hums north and south through towns and green countryside."}</p>
    </div>
  </div>;
}
