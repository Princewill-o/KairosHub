"use client";
import { useCallback, useState } from "react";
import { GAME_HOUR_MS } from "@/game/core/game-clock";
import * as S from "@/game/core/sims";

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;
type Tab = "hobbies" | "work" | "business" | "property" | "clubs" | "politics";

/**
 * Everyday life: hobbies and skills, careers and freelancing, businesses,
 * property up to skyscrapers, and clubs. Spends and earns the world wallet.
 */
export function LifeHub({ wallet, setWallet, onClose }: { wallet: number; setWallet: (f: (w: number) => number) => void; onClose: () => void }) {
  const [sims, setSims] = useState<S.Sims>(() => S.readSims(typeof localStorage === "undefined" ? null : localStorage));
  const [tab, setTab] = useState<Tab>("hobbies");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const run = useCallback((res: S.Result) => {
    setMsg({ text: res.text, ok: res.ok });
    if (!res.ok) return;
    setSims(res.sims); S.writeSims(localStorage, res.sims);
    if (res.money) setWallet((w) => Math.max(0, w + res.money));
    if (Object.keys(res.life).length) window.dispatchEvent(new CustomEvent("kairos-app-offer", { detail: { app: "Life", label: res.text, life: res.life } }));
  }, [setWallet]);
  const now = Date.now();
  const pending = sims.businesses.reduce((t, b) => t + Math.min(48, (now - b.collected) / GAME_HOUR_MS) * S.BUSINESSES.find((x) => x.id === b.id)!.perHour, 0)
    + sims.properties.reduce((t, p) => t + Math.min(48, (now - p.collected) / GAME_HOUR_MS) * S.PROPERTIES.find((x) => x.id === p.id)!.perHour, 0);
  return (
    <div className="lh-back" role="dialog" aria-modal="true" aria-label="Life">
      <div className="lh-panel">
        <header className="lh-head">
          <h2>Life</h2>
          <span className="lh-wallet" data-wallet={wallet}>{gbp(wallet)}</span>
          <span className="lh-job">{S.careerTitle(sims.career)}</span>
          <button className="lh-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <nav className="lh-tabs">
          {(["hobbies", "work", "business", "property", "clubs", "politics"] as Tab[]).map((t) => <button key={t} aria-pressed={tab === t} onClick={() => { setTab(t); setMsg(null); }}>{t[0].toUpperCase() + t.slice(1)}</button>)}
        </nav>
        {msg && <p className={`lh-msg${msg.ok ? "" : " lh-no"}`} aria-live="polite">{msg.text}</p>}
        <div className="lh-body">
          {tab === "hobbies" && (
            <>
              <div className="lh-skills">
                {S.SKILLS.map((k) => { const xp = sims.skills[k.id] ?? 0, lv = S.level(xp), next = S.xpFor(lv + 1), prev = S.xpFor(lv); return (
                  <div key={k.id} className="lh-skill" style={{ ["--k" as string]: k.colour }}>
                    <b>{k.name}</b><small>Lv {lv}</small>
                    <span className="lh-xp"><i style={{ width: `${lv >= 10 ? 100 : ((xp - prev) / (next - prev)) * 100}%` }} /></span>
                  </div>
                ); })}
              </div>
              <div className="lh-grid">
                {S.ACTIVITIES.map((a) => { const locked = S.level(sims.skills[a.skill]) < a.min; return (
                  <button key={a.id} className="lh-card" disabled={locked} data-activity={a.id} onClick={() => run(S.doActivity(sims, a.id, wallet))} style={{ ["--k" as string]: S.SKILLS.find((k) => k.id === a.skill)!.colour }}>
                    <b>{a.name}</b><small>{locked ? `Needs level ${a.min}` : `${S.SKILLS.find((k) => k.id === a.skill)!.name}${a.cost ? ` · ${gbp(a.cost)}` : ""}${a.makes ? ` · makes ${a.makes}` : ""}`}</small>
                  </button>
                ); })}
              </div>
              {Object.keys(sims.items).length > 0 && (
                <section className="lh-items"><h3>Things you've made</h3>
                  {Object.entries(sims.items).map(([it, n]) => <button key={it} onClick={() => run(S.sell(sims, it))}>{n} × {it} · sell for {gbp(n * (S.PRICES[it] ?? 5))}</button>)}
                </section>
              )}
            </>
          )}
          {tab === "work" && (
            <>
              {sims.career ? (
                <section className="lh-job-card">
                  <h3>{S.careerTitle(sims.career)} <small>({S.CAREERS.find((c) => c.id === sims.career!.id)!.name}, level {sims.career.level}/10)</small></h3>
                  <p>Pay per shift: {gbp(S.shiftPay(sims.career))}</p>
                  <span className="lh-xp lh-perf"><i style={{ width: `${Math.max(0, sims.career.performance)}%` }} /></span>
                  <div className="lh-row">
                    <button onClick={() => run(S.workShift(sims, "hard"))}>Work hard</button>
                    <button onClick={() => run(S.workShift(sims, "normal"))}>Normal shift</button>
                    <button onClick={() => run(S.workShift(sims, "slack"))}>Slack off</button>
                    <button className="lh-quiet" onClick={() => { const s = { ...sims, career: null }; setSims(s); S.writeSims(localStorage, s); setMsg({ text: "You handed in your notice.", ok: true }); }}>Quit</button>
                  </div>
                </section>
              ) : (
                <div className="lh-grid">{S.CAREERS.map((c) => <button key={c.id} className="lh-card" onClick={() => run(S.joinCareer(sims, c.id))}><b>{c.name}</b><small>Start as {c.titles[0]} · up to {c.titles[9]}</small></button>)}</div>
              )}
              <h3 className="lh-sub">Freelance gigs</h3>
              <div className="lh-grid">{S.GIGS.map((g) => { const lv = S.level(sims.skills[g.skill]); return <button key={g.id} className="lh-card" disabled={lv < g.min} onClick={() => run(S.freelance(sims, g.id))}><b>{g.name}</b><small>{lv < g.min ? `Needs ${g.skill} ${g.min}` : `Pays ${gbp(S.gigPay(g.base, lv))}`}</small></button>; })}</div>
            </>
          )}
          {tab === "business" && (
            <>
              <button className="lh-collect" disabled={pending < 1} onClick={() => run(S.collect(sims, Date.now(), GAME_HOUR_MS))}>Collect {gbp(pending)}</button>
              <div className="lh-grid">{S.BUSINESSES.map((b) => { const owned = sims.businesses.filter((x) => x.id === b.id).length; return <button key={b.id} className="lh-card" disabled={wallet < b.cost} onClick={() => run(S.openBusiness(sims, b.id, wallet, Date.now()))}><b>{b.name}{owned ? ` (${owned} owned)` : ""}</b><small>{gbp(b.cost)} · earns {gbp(b.perHour)}/hr, more with {b.skill}</small></button>; })}</div>
            </>
          )}
          {tab === "property" && (
            <>
              <div className="lh-skyline" aria-label="Your buildings">
                {sims.properties.length === 0 && <p>Your skyline is empty. Buy your first property.</p>}
                {sims.properties.map((p, i) => { const d = S.PROPERTIES.find((x) => x.id === p.id)!; return (
                  <span key={i} className="lh-tower" title={`${d.name}, ${p.area}`} style={{ height: 20 + d.floors * 9, ["--c" as string]: d.colour, width: d.floors > 10 ? 46 : 34 }}>
                    {Array.from({ length: Math.min(d.floors, 30) }, (_, f) => <i key={f} />)}
                  </span>
                ); })}
              </div>
              <button className="lh-collect" disabled={pending < 1} onClick={() => run(S.collect(sims, Date.now(), GAME_HOUR_MS))}>Collect rent {gbp(pending)}</button>
              <div className="lh-grid">{S.PROPERTIES.map((p) => <button key={p.id} className="lh-card" disabled={wallet < p.cost} onClick={() => run(S.buildProperty(sims, p.id, wallet, Date.now()))}><b>{p.name}</b><small>{gbp(p.cost)} · rent {gbp(p.perHour)}/hr · {p.floors} floors</small></button>)}</div>
            </>
          )}
          {tab === "politics" && (!sims.politics ? (
            <div className="lh-grid">{S.PARTIES.map((p) => <button key={p} className="lh-card" onClick={() => run(S.joinParty(sims, p))}><b>{p}</b><small>Join for £25 and start your political career</small></button>)}</div>
          ) : (
            <>
              <section className="lh-job-card" data-office={sims.politics.office}>
                <h3>{S.OFFICES[sims.politics.office]} <small>({sims.politics.party})</small></h3>
                <p>Support: {sims.politics.support}%{sims.politics.office < 5 ? ` · next: ${S.OFFICES[sims.politics.office + 1]} (needs ~${S.NEEDED[sims.politics.office + 1]}%)` : ""}</p>
                <span className="lh-xp lh-perf"><i style={{ width: `${sims.politics.support}%` }} /></span>
                <div className="lh-row">
                  {sims.politics.office < 5 && <button onClick={() => run(S.standForElection(sims))}>Stand for {S.OFFICES[sims.politics.office + 1]}</button>}
                  {sims.politics.office >= 1 && <button onClick={() => run(S.sitting(sims))}>{sims.politics.office >= 2 ? "Sit in Parliament" : "Council meeting"}</button>}
                </div>
              </section>
              <div className="lh-grid">{S.CAMPAIGN.map((c) => <button key={c.id} className="lh-card" onClick={() => run(S.campaign(sims, c.id, wallet))}><b>{c.name}</b><small>{c.cost ? gbp(c.cost) + " · " : ""}{c.id === "spin" ? "More support, at a cost to your soul" : c.id === "debate" ? "Risky, but honest" : "Builds support"}</small></button>)}</div>
              {sims.politics.office >= 5 && (
                <section className="lh-pm"><h3>Number 10: your decisions</h3>
                  {S.PM_DECISIONS.map((d, qi) => <div key={qi} className="lh-pm-q"><p>{d.q}</p><div className="lh-row">{d.a.map((a, ai) => <button key={ai} onClick={() => run(S.decide(sims, qi, ai))}>{a.label}</button>)}</div></div>)}
                </section>
              )}
            </>
          ))}
          {tab === "clubs" && <div className="lh-grid">{S.CLUBS.map((c) => <button key={c.id} className="lh-card" aria-pressed={sims.clubs.includes(c.id)} onClick={() => run(S.toggleClub(sims, c.id))}><b>{c.name}</b><small>{sims.clubs.includes(c.id) ? "Member · tap to leave" : c.perk}</small></button>)}</div>}
        </div>
      </div>
    </div>
  );
}
