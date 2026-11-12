"use client";
/**
 * Kharis Church hub: pick your branch and department (your name tag), serve in your
 * department through real-life scenarios, play sermon study games where your character
 * acts out the message, and see branches ranked. Signed-in family accounts sync to the
 * Kairos backend (Supabase); otherwise everything is kept on this device.
 */
import { useCallback, useEffect, useState } from "react";
import { BRANCHES, DEPARTMENTS, SERMON_GAMES, SERVING, KHARIS_SOURCE, branchById, departmentById, nameTagLabel } from "../../../../../public/kharis-data.mjs";

export type KharisTag = { branch: string; department: string | null };
const KEY = "kairos-kharis-v1";
export function readKharisTag(): KharisTag | null {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); return v && branchById(v.branch) ? { branch: v.branch, department: departmentById(v.department) ? v.department : null } : null; } catch { return null; }
}
function writeKharisTag(t: KharisTag) { try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* device storage optional */ } }
type Remote = { member: { branch: string; department: string | null } | null; name: string | null; mine: { kind: string; n: number; points: number }[]; board: { branch: string; points: number; members: number }[] };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16)));
async function api(path: string, body?: object): Promise<{ status: number; data: Remote | { error: string } }> {
  const r = await fetch("/api/family/kharis" + path, { method: body ? "POST" : "GET", credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({ error: "Offline" })) };
}

type Tab = "church" | "serve" | "sermons" | "board";
export function KharisHub({ tag, onTag, onClose, onEmote, onAward }: { tag: KharisTag | null; onTag: (t: KharisTag) => void; onClose: () => void; onEmote: (anim: string) => void; onAward: (id: string, grace: number, message: string) => void }) {
  const [tab, setTab] = useState<Tab>(tag ? "serve" : "church");
  const [remote, setRemote] = useState<Remote | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [scenario, setScenario] = useState<string | null>(null);
  const [sermon, setSermon] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const r = await api("");
      if (r.status === 200) { setSignedIn(true); setRemote(r.data as Remote); const m = (r.data as Remote).member; if (m && (!tag || tag.branch !== m.branch || tag.department !== m.department)) { const t = { branch: m.branch, department: m.department }; writeKharisTag(t); onTag(t); } }
      else setSignedIn(false);
    } catch { setSignedIn(false); }
  }, [tag, onTag]);
  useEffect(() => { void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); if (scenario || sermon) { setScenario(null); setSermon(null); } else onClose(); } };
    window.addEventListener("keydown", k, true); return () => window.removeEventListener("keydown", k, true);
  }, [scenario, sermon, onClose]);

  const save = async (t: KharisTag) => {
    writeKharisTag(t); onTag(t);
    if (signedIn) { const r = await api("/member", t).catch(() => null); if (r?.status === 201) setRemote(r.data as Remote); }
  };
  const record = async (kind: "serve" | "sermon", ref: string, score: number) => {
    if (signedIn && tag) { const r = await api("/activity", { kind, ref, score, eventId: uuid() }).catch(() => null); if (r?.status === 201) setRemote(r.data as Remote); }
  };

  const dept = tag?.department ? departmentById(tag.department) : null;
  const sc = SERVING.find((s) => s.id === scenario);
  const sg = SERMON_GAMES.find((s) => s.id === sermon);
  return (
    <div className="kh-backdrop" role="dialog" aria-modal="true" aria-label="Kharis Church">
      <section className={sg ? "kh-panel kh-panel-low" : "kh-panel"}>
        <header className="kh-head">
          <img src="/brand/kharis-mark.png" alt="" width={44} height={44} />
          <div><small>KHARIS CHURCH · ESTABLISHING BELIEVERS, STRENGTHENING CHURCHES</small><h2>{tag ? nameTagLabel(tag.branch, tag.department) : "Find your branch"}</h2></div>
          <button className="kh-x" onClick={onClose} aria-label="Close">×</button>
        </header>
        {!sc && !sg && <nav className="kh-tabs" role="tablist">{([["church", "My church"], ["serve", "Serve"], ["sermons", "Sermon games"], ["board", "Branches"]] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>}
        <div className="kh-body">
          {sc ? <Scenario s={sc} onDone={(score, grace, msg) => { onAward(`serve:${sc.id}`, grace, msg); void record("serve", sc.id, score); }} onBack={() => setScenario(null)} />
            : sg ? <SermonGame g={sg} onEmote={onEmote} onDone={(score) => { onAward(`sermon:${sg.id}`, Math.round(score / 5), `Sermon game complete · ${sg.title}`); void record("sermon", sg.id, score); }} onBack={() => setSermon(null)} />
            : tab === "church" ? <>
              <NameTag tag={tag} name={remote?.name ?? null} />
              <h3>1 · Your branch</h3>
              <div className="kh-grid">{BRANCHES.map((b) => <button key={b.id} aria-pressed={tag?.branch === b.id} onClick={() => void save({ branch: b.id, department: tag?.department ?? null })}><b>{b.name}</b><small>{b.region}</small></button>)}</div>
              <h3>2 · Your department</h3>
              <div className="kh-depts">{DEPARTMENTS.map((d) => <button key={d.id} disabled={!tag} aria-pressed={tag?.department === d.id} style={{ ["--dept" as string]: d.color }} onClick={() => tag && void save({ branch: tag.branch, department: d.id })}><b>{d.name}</b><small>{d.about}</small></button>)}</div>
              <p className="kh-sync">{signedIn === null ? "Checking your account…" : signedIn ? "Signed in: your branch, department and points sync to your Kairos account." : <>Saved on this device. <a href="/#family" target="_top">Sign in or create a Kairos account</a> to sync with your branch.</>}</p>
              <p className="kh-src">Branches and departments from <a href={KHARIS_SOURCE} target="_blank" rel="noreferrer">kharis.org</a>. To join a department for real, contact your local branch.</p>
            </>
            : tab === "serve" ? <>
              {!tag && <p className="kh-note">Choose your branch first in My church.</p>}
              {dept && <p className="kh-note" style={{ borderColor: dept.color }}><b>{dept.name}:</b> {dept.about}</p>}
              <ul className="kh-list">{[...SERVING].sort((x, y) => Number(y.dept === tag?.department) - Number(x.dept === tag?.department)).map((s) => <li key={s.id}><button onClick={() => setScenario(s.id)}><i style={{ background: departmentById(s.dept)?.color }} /><span><b>{s.title}</b><small>{departmentById(s.dept)?.name}{s.dept === tag?.department ? " · your department" : ""}</small></span><em>Serve</em></button></li>)}</ul>
            </>
            : tab === "sermons" ? <ul className="kh-list">{SERMON_GAMES.map((g) => <li key={g.id}><button onClick={() => setSermon(g.id)}><i style={{ background: "#6b3fa0" }} /><span><b>{g.title}</b><small>{g.series} · {g.speaker} · {g.ref}</small></span><em>Play</em></button></li>)}</ul>
            : <Board remote={remote} signedIn={signedIn} tag={tag} />}
        </div>
      </section>
    </div>
  );
}

function NameTag({ tag, name }: { tag: KharisTag | null; name: string | null }) {
  const d = tag?.department ? departmentById(tag.department) : null;
  return <div className="kh-tag" style={{ ["--dept" as string]: d?.color ?? "#6b3fa0" }} aria-label="Your name tag">
    <span className="kh-tag-band"><img src="/brand/kharis-mark.png" alt="" width={22} height={22} />KHARIS {tag ? branchById(tag.branch)?.name.toUpperCase() : "CHURCH"}</span>
    <b>{name ?? "You"}</b><small>{d?.name ?? "Choose a department"}</small>
  </div>;
}

function Scenario({ s, onDone, onBack }: { s: (typeof SERVING)[number]; onDone: (score: number, grace: number, message: string) => void; onBack: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const opt = pick === null ? null : s.options[pick];
  return <div className="kh-play">
    <button className="kh-back" onClick={onBack}>‹ Back</button>
    <small>{departmentById(s.dept)?.name} · on duty</small>
    <h3>{s.title}</h3><p>{s.text}</p>
    <div className="kh-opts">{s.options.map((x, i) => <button key={i} disabled={pick !== null} aria-pressed={pick === i} className={pick !== null && x.score === 3 ? "best" : ""} onClick={() => { setPick(i); const score = Math.round((x.score / 3) * 100); onDone(score, x.score === 3 ? 15 : x.score ? 5 : 0, x.score === 3 ? `Served well · ${s.title}` : `Served · ${s.title}`); }}>{x.label}</button>)}</div>
    {opt && <p className={opt.score === 3 ? "kh-result good" : "kh-result"}>{opt.result}{opt.ref ? ` (${opt.ref})` : ""}</p>}
  </div>;
}

function SermonGame({ g, onEmote, onDone, onBack }: { g: (typeof SERMON_GAMES)[number]; onEmote: (anim: string) => void; onDone: (score: number) => void; onBack: () => void }) {
  const [i, setI] = useState(-1); // -1: study the verse first
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const round = g.rounds[i];
  const done = i >= g.rounds.length;
  const score = Math.round((right / g.rounds.length) * 100);
  useEffect(() => { if (done) onDone(score); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="kh-play kh-sermon">
    <button className="kh-back" onClick={onBack}>‹ Sermon games</button>
    {i < 0 ? <>
      <small>{g.series} · {g.speaker}</small><h3>{g.title}</h3>
      <blockquote>“{g.verse}” <cite>{g.ref} (KJV)</cite></blockquote>
      <p>{g.summary}</p>
      <button className="kh-go" onClick={() => { onEmote("read"); setI(0); }}>Study it, then live it →</button>
    </> : done ? <>
      <h3>{score >= 67 ? "You lived the message!" : "Keep practising the message"}</h3>
      <p className="kh-big">{right} / {g.rounds.length}</p>
      <blockquote>“{g.verse}” <cite>{g.ref}</cite></blockquote>
      <button className="kh-go" onClick={() => { setI(-1); setRight(0); setPicked(null); }}>Play again</button>
    </> : <>
      <small>Round {i + 1} of {g.rounds.length} · watch your character</small>
      <h3>{round.prompt}</h3>
      <div className="kh-opts">{round.actions.map((x, k) => <button key={k} disabled={picked !== null} className={picked !== null && x.ok ? "best" : ""} onClick={() => { setPicked(k); onEmote(x.anim); if (x.ok) setRight((n) => n + 1); }}>{x.label}</button>)}</div>
      {picked !== null && <><p className={round.actions[picked].ok ? "kh-result good" : "kh-result"}>{round.actions[picked].ok ? "Yes! " : "Not quite. "}{round.why}</p><button className="kh-go" onClick={() => { setPicked(null); setI(i + 1); }}>{i + 1 < g.rounds.length ? "Next round →" : "Finish"}</button></>}
    </>}
  </div>;
}

function Board({ remote, signedIn, tag }: { remote: Remote | null; signedIn: boolean | null; tag: KharisTag | null }) {
  if (!signedIn) return <p className="kh-note">Branch rankings come from everyone's serving and sermon games. <a href="/#family" target="_top">Sign in</a> to add your points to {tag ? `Kharis ${branchById(tag.branch)?.name}` : "your branch"}.</p>;
  const rows = remote?.board ?? [];
  const max = Math.max(1, ...rows.map((r) => r.points));
  return <>
    <p className="kh-note">Last 30 days · serving scenarios and sermon games</p>
    {rows.length ? <ol className="kh-board">{rows.map((r, n) => <li key={r.branch} className={r.branch === tag?.branch ? "mine" : ""}><b>{n + 1}</b><span>Kharis {branchById(r.branch)?.name ?? r.branch}</span><i style={{ width: `${(r.points / max) * 100}%` }} /><em>{r.points} pts · {r.members}</em></li>)}</ol> : <p>No points yet this month. Be the first to serve.</p>}
    {remote?.mine?.length ? <p className="kh-sync">You: {remote.mine.map((m) => `${m.n} ${m.kind === "serve" ? "serving" : "sermon"} (${m.points} pts)`).join(" · ")}</p> : null}
  </>;
}
