"use client";

import { useEffect, useState, useTransition } from "react";

import { Gavel, Pill, ShoppingBasket, Siren, Star, X } from "lucide-react";

import { CutsceneBrand } from "./cutscene-brand";

import { buyWorldItem } from "@/app/games/world/actions";
import * as PR from "@/game/core/prison-routine";
import { SHOP, type ShopItem, acquittalChance, sentenceMs } from "@/game/core/law";
import { cn } from "@/lib/utils";

/** Tesco Express and Bootz Pharmacy: spend Grace to top up your needs. */
export function ShopDialog({ shop, clout, onBought, onClose }: { shop: "tescow" | "bootz"; clout: number; onBought: (item: ShopItem, clout: number | null) => void; onClose: () => void }) {
  const items: ShopItem[] = shop === "bootz" ? ["medicine"] : ["drink", "meal", "coffee"];
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="absolute inset-0 z-[100004] grid place-items-end bg-black/60 md:place-items-center" onClick={onClose}>
      <div role="dialog" aria-label={shop === "bootz" ? "Bootz Pharmacy" : "Tesco Express"} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-[#f7f1e6] p-5 text-[#13203a] md:rounded-3xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: shop === "bootz" ? "#2b5fd9" : "#c8322d" }}>
              {shop === "bootz" ? "Bootz Pharmacy" : "Tesco Express"}
            </p>
            <h2 className="mt-1 text-2xl font-black">{shop === "bootz" ? "Feeling rough?" : "Grab something"}</h2>
            <p className="text-sm text-[#13203a]/70">You have {clout} Grace.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-white">
            <X className="size-4" />
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {items.map((id) => {
            const it = SHOP[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={pending || clout < it.price}
                  onClick={() =>
                    start(async () => {
                      setError(null);
                      const r = await buyWorldItem(id);
                      if (r.ok) onBought(id, r.clout);
                      else setError(r.error);
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left disabled:opacity-50"
                >
                  <span className={cn("grid size-11 place-items-center rounded-xl text-white", id === "medicine" ? "bg-[#2b5fd9]" : "bg-[#c8322d]")}>
                    {id === "medicine" ? <Pill className="size-6" aria-hidden /> : <ShoppingBasket className="size-6" aria-hidden />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-black">{it.name}</span>
                    <span className="block text-xs text-[#13203a]/70">{it.blurb}</span>
                  </span>
                  <span className="rounded-full bg-[#f2d9a6] px-3 py-1 text-sm font-black">{it.price}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {error && <p className="mt-3 text-sm font-bold text-[#c8322d]">{error}</p>}
      </div>
    </div>
  );
}

/** GTA-style wanted stars, top centre under your level. */
export function WantedStars({ stars }: { stars: number }) {
  if (!stars) return null;
  return (
    <div className="pointer-events-none absolute top-[60px] left-1/2 z-[60] flex -translate-x-1/2 gap-1 rounded-full bg-[#13203a]/85 px-3 py-1.5" role="status" aria-label={`Wanted level ${stars} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-5", i < stars ? "wanted-on fill-[#ffd166] text-[#ffd166]" : "text-white/30")} aria-hidden />
      ))}
    </div>
  );
}

/** Blue lights: the police have caught up with you. */
export function ArrestOverlay() {
  return (
    <div className="arrest-flash pointer-events-none absolute inset-x-0 top-[96px] z-[100006] grid place-items-center" role="alert">
      <div className="rounded-3xl border border-white/30 bg-[#13203a]/95 px-6 py-4 text-center text-white shadow-2xl">
        <div className="flex justify-center"><CutsceneBrand kind="police"/></div>
        <p className="mt-2 flex items-center justify-center gap-2 text-xl font-black"><Siren className="size-6 animate-pulse" aria-hidden/>Police! You&apos;re under arrest.</p>
        <p className="mt-1 text-sm text-white/75">Officers walk over, take hold of you and put you in handcuffs.</p>
      </div>
    </div>
  );
}

/** The hearing: choose a plea in this fictional city-world scenario. */
export function HearingDialog({
  charge,
  stars,
  onVerdict,
}: {
  charge: string;
  stars: number;
  onVerdict: (v: "acquitted" | "guilty") => void;
}) {
  const [stage, setStage] = useState<"plea" | "deciding" | "done">("plea");
  const [result, setResult] = useState<"acquitted" | "guilty" | null>(null);
  const decide = (plea: "guilty" | "not") => {
    setStage("deciding");
    setTimeout(() => {
      const r = plea === "guilty" ? "guilty" : Math.random() < acquittalChance(stars) ? "acquitted" : "guilty";
      setResult(r);
      setStage("done");
    }, 2200);
  };
  return (
    <div className="absolute inset-0 z-[100004] grid place-items-end bg-black/50 md:place-items-center">
      <div role="dialog" aria-label="Court hearing" className="w-full max-w-md rounded-t-3xl bg-[#f7f1e6] p-5 text-[#13203a] md:rounded-3xl">
        <p className="text-xs font-black tracking-[0.25em] text-[#7a4f32] uppercase">Crown Court · Hearing</p>
        <h2 className="mt-1 text-2xl font-black">{charge}</h2>
        <p className="mt-1 text-sm text-[#13203a]/70">
          Wanted level {stars}. If found guilty: {Math.round(sentenceMs(stars) / 1000)} seconds in HMP Thames.
        </p>
        {stage === "plea" && (
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={() => decide("not")} className="rounded-2xl bg-white px-4 py-3 text-left font-black">
              Plead not guilty <span className="text-xs font-bold text-[#13203a]/60">({Math.round(acquittalChance(stars) * 100)}% chance)</span>
            </button>
            <button type="button" onClick={() => decide("guilty")} className="rounded-2xl bg-white px-4 py-3 text-left font-black">
              Plead guilty
            </button>
          </div>
        )}
        {stage === "deciding" && (
          <p className="mt-6 flex items-center gap-2 font-black">
            <Gavel className="gavel size-6" aria-hidden /> The judge is deciding...
          </p>
        )}
        {stage === "done" && result && (
          <div className="mt-4">
            <p className={cn("rounded-2xl p-3 text-lg font-black", result === "acquitted" ? "bg-[#e3f5ec] text-[#15987f]" : "bg-[#fdeceb] text-[#c8322d]")}>{result === "acquitted" ? "Not guilty. You're free to go." : "Guilty. Take them down."}</p>
            <button type="button" onClick={() => onVerdict(result)} className="mt-3 w-full rounded-full bg-[#13203a] py-3 font-black text-white">
              {result === "acquitted" ? "Leave the court" : "Go to prison"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Inside HMP Thames: sentence timer for this fictional city-world scenario. */
export function PrisonHud({ leftMs, state, offline, until, age, onParole, onServe, onCraft }: { leftMs: number; state?: PR.PrisonState; offline?: boolean; until?: number; age?: number; onParole?: () => void; onServe?: () => void; onCraft?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const s = state ?? PR.emptyPrison();
  const p = PR.prisonPhase(now);
  const seconds = Math.max(0, Math.ceil(leftMs / 1000));
  const dayLeft = Math.max(1, Math.ceil(leftMs / PR.PRISON_DAY_MS));
  const heat = Math.min(100, s.heat);
  return <div className="pr-hud" role="status" aria-label="HMP Thames routine">
    <div className="pr-top"><b>HMP THAMES</b><span>Day {s.days + 1}</span></div>
    <ol className="pr-clock" aria-label="Today's routine">{PR.ROUTINE.map((r, i) => <li key={r.id} className={i === p.index ? "on" : i < p.index ? "done" : ""} style={{ flex: r.to - r.from }} title={r.label}><span>{r.label}</span>{i === p.index && <i style={{ left: `${((p.t - r.from) / (r.to - r.from)) * 100}%` }} />}</li>)}</ol>
    <p className="pr-now"><b>{p.phase.label}</b> · {p.phase.where} <em>{Math.ceil(p.leftMs / 1000)}s</em></p>
    <div className="pr-meters">
      <label>Behaviour <meter min={0} max={PR.PAROLE_POINTS} value={Math.min(s.behaviour, PR.PAROLE_POINTS)} /> <small>{s.behaviour}/{PR.PAROLE_POINTS}</small></label>
      <label className={heat >= 60 ? "hot" : ""}>Heat <meter min={0} max={100} low={30} high={60} optimum={0} value={heat} /> <small>{heat}%</small></label>
    </div>
    <div className="pr-slots" aria-label="Hidden items">{(Object.keys(PR.ITEMS) as PR.PrisonItem[]).map(i => <span key={i} className={s.items.includes(i) || s.kit ? "got" : ""} title={`${PR.ITEMS[i].name}: ${PR.ITEMS[i].where}`}>{PR.ITEMS[i].name}</span>)}{s.kit && <span className="kit">Escape kit</span>}</div>
    <p className="pr-time">{offline && until !== undefined && age !== undefined ? `Sentence: inside until age ${until} (now ${age}). ` : ""}Release in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} · about {dayLeft} routine day{dayLeft === 1 ? "" : "s"}</p>
    <div className="pr-actions">
      {!s.kit && s.items.length === 3 && <button onClick={onCraft}>Craft escape kit</button>}
      <button disabled={!PR.paroleReady(s)} onClick={onParole} title="Reach full behaviour with heat under 30%">{PR.paroleReady(s) ? "Apply for parole" : "Parole: keep to the routine"}</button>
      {offline && <button onClick={onServe}>Serve the full sentence (age up)</button>}
    </div>
  </div>;
}
