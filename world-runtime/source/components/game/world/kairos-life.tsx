"use client";
/**
 * Kairos Life inside Kairos World. Offline play ages you one year per in-game
 * day; online quick play keeps friends and the world without ageing.
 * Real world actions (prayer, the Bible, preaching, follow-up, eating, hiking,
 * medicine, church) credit your life. Each new year brings one decision.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import * as L from "@/game/core/kairos-life";
import { CHURCH_SCREEN, isServiceTime, kjvVerses, nextServiceLabel, setChurchScreen } from "@/game/core/church-service";
import { advanceStage, readMinistry, writeMinistry } from "@/game/core/ministry";
import { type Avatar } from "@/game/core/cosmetics";
import { buildCharacter } from "../char3d";
import { series } from "../../../../../public/playmessages/content.mjs";

export type PlayMode = "offline" | "online";
export type Pickup = { name: string; status: "invited" | "collecting" | "aboard" };
type Life = L.LifeState & { lastDay?: number | null; pickups?: Pickup[] };

const rng = L.makeRng(Date.now() ^ 0x1f3a);
const memory = new Map<string, string>();
const get = (k: string) => { try { return localStorage.getItem(k) ?? memory.get(k) ?? null; } catch { return memory.get(k) ?? null; } };
const put = (k: string, v: string) => { memory.set(k, v); try { localStorage.setItem(k, v); } catch { /* Memory only this session. */ } };
export const worldDay = (d: Date) => Math.floor(d.getTime() / 86_400_000);
const ACTIVITY: Record<string, keyof typeof L.CREDITS> = { eat: "eat", meal: "eat", hike: "exercise", medicine: "checkup" };

/** Saved life and play mode for this player. #life asks for offline mode. */
export function useKairosLife(playerId: string) {
  const lifeKey = `kairos-world:${playerId}:life`, modeKey = `kairos-world:${playerId}:mode`;
  const [mode, setModeState] = useState<PlayMode | null>(() => {
    const asked = new URLSearchParams(location.search).get("mode");
    if (asked === "offline" || asked === "online") { put(modeKey, asked); return asked; }
    const m = get(modeKey);
    return m === "offline" || m === "online" ? m : null;
  });
  const [life, setLife] = useState<Life | null>(() => L.restore(get(lifeKey) ?? "") as Life | null);
  const ref = useRef(life); ref.current = life;
  const update = useCallback((f: (l: Life) => Life | null) => {
    const cur = ref.current;
    const next = cur ? f(cur) : null;
    ref.current = next;
    if (next) put(lifeKey, L.serialise(next)); else put(lifeKey, "");
    setLife(next);
  }, [lifeKey]);
  const begin = useCallback((next: Life) => { ref.current = next; put(lifeKey, L.serialise(next)); setLife(next); }, [lifeKey]);
  const setMode = useCallback((m: PlayMode) => { put(modeKey, m); setModeState(m); }, [modeKey]);
  const credit = useCallback((kind: string) => {
    if (mode !== "offline") return;
    update((l) => L.credit(l, kind, rng) as Life);
  }, [mode, update]);
  // Real actions in the world feed the life.
  useEffect(() => {
    if (mode !== "offline") return;
    const onNeed = (e: Event) => { const k = ACTIVITY[String((e as CustomEvent).detail)]; if (k) credit(k); };
    let prayedAt = readMinistry(localStorage).prayer.at;
    const onMinistry = () => { const m = readMinistry(localStorage); if (m.prayer.at !== prayedAt) { prayedAt = m.prayer.at; credit("pray"); } };
    window.addEventListener("illuminated:needs", onNeed);
    window.addEventListener("kairos-ministry-updated", onMinistry);
    return () => { window.removeEventListener("illuminated:needs", onNeed); window.removeEventListener("kairos-ministry-updated", onMinistry); };
  }, [mode, credit]);
  return { mode, setMode, life, update, begin, credit };
}

/** Advance a year for each in-game day that has passed, one decision at a time. */
export function useLifeClock(mode: PlayMode | null, life: Life | null, gameDate: Date, update: (f: (l: Life) => Life | null) => void, hasCar: boolean) {
  const today = worldDay(gameDate);
  useEffect(() => {
    if (mode !== "offline" || !life || !life.alive) return;
    if (life.lastDay == null) { update((l) => ({ ...l, lastDay: today })); return; }
    if (!!life.car !== hasCar) update((l) => ({ ...l, car: hasCar ? { name: "Your car" } : null }));
    if (L.yearsDue(life.lastDay, today) > 0 && !life.pending) update((l) => ({ ...(L.ageUp(l, rng) as Life), lastDay: (l.lastDay ?? today) + 1 }));
  }, [mode, life, today, update, hasCar]);
}

/** Invited ministry contacts become people you can collect for church. */
export function invitedContacts() {
  try {
    return readMinistry(localStorage).contacts.filter((c) => c.steps.invite && !c.notes.some((n) => n.startsWith("Came to Sunday service"))).map((c) => c.name);
  } catch { return []; }
}
export function markAttended(names: string[]) {
  if (!names.length) return;
  const save = readMinistry(localStorage);
  save.contacts = save.contacts.map((c) => names.includes(c.name) ? { ...c, stage: advanceStage(c.stage, true), lastContact: Date.now(), notes: [...c.notes, "Came to Sunday service with you"] } : c);
  writeMinistry(localStorage, save);
  window.dispatchEvent(new Event("kairos-ministry-updated"));
}

const STAT = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
  <div className="kl-stat" data-tone={tone}><span>{label}</span><b>{value}</b><i style={{ ["--v" as string]: `${Math.max(0, Math.min(100, value))}%` }} /></div>
);

/** First entry: offline life or online quick play. */
export function PlayModePicker({ onPick }: { onPick: (m: PlayMode) => void }) {
  return (
    <section role="dialog" aria-labelledby="kl-mode" className="ks-card kl-center kl-mode">
      <p className="ks-eyebrow">Kairos World</p>
      <h2 id="kl-mode">How do you want to play?</h2>
      <div className="kl-modes">
        <button type="button" onClick={() => onPick("offline")}><b>Offline · Kairos Life</b><span>Be born, grow up and grow old in this world. One in-game day is one year. Health, faith, family, temptations, ministry. Then eternity.</span></button>
        <button type="button" onClick={() => onPick("online")}><b>Online · Quick play</b><span>The whole world with friends, chat and calls. No ageing. Jump in and out.</span></button>
      </div>
    </section>
  );
}

/** Start a new life: custom or random details. */
export function NewLife({ onBorn, onOnline }: { onBorn: (l: Life) => void; onOnline: () => void }) {
  const [d, setD] = useState(() => L.randomDetails(rng));
  const [err, setErr] = useState("");
  return (
    <form className="ks-card kl-center kl-new" aria-labelledby="kl-new" onSubmit={(e) => {
      e.preventDefault();
      if (!d.first.trim() || !d.last.trim()) return setErr("Enter a first name and surname.");
      onBorn({ ...(L.newLife({ ...d, first: d.first.trim(), last: d.last.trim(), city: "london" }, rng) as Life), lastDay: null, pickups: [] });
    }}>
      <p className="ks-eyebrow">Offline · Kairos Life</p>
      <h2 id="kl-new">A new life begins in London</h2>
      <div className="kl-grid">
        <label>First name<input value={d.first} maxLength={20} onChange={(e) => { setErr(""); setD({ ...d, first: e.target.value }); }} /></label>
        <label>Surname<input value={d.last} maxLength={20} onChange={(e) => { setErr(""); setD({ ...d, last: e.target.value }); }} /></label>
        <label>Sex<select value={d.sex} onChange={(e) => setD({ ...d, sex: e.target.value as "male" | "female" })}><option value="male">Male</option><option value="female">Female</option></select></label>
        <label className="kl-check"><input type="checkbox" checked={d.christianHome} onChange={(e) => setD({ ...d, christianHome: e.target.checked })} /> Christian home</label>
      </div>
      {err && <p role="alert" className="kl-err">{err}</p>}
      <div className="kl-row"><button type="button" className="kl-ghost" onClick={() => setD(L.randomDetails(rng))}>Random details</button><button className="kl-go">Be born</button></div>
      <button type="button" className="kl-link" onClick={onOnline}>Play online quick play instead</button>
    </form>
  );
}

/** Top-left chip: who you are, how old, the year passing. */
export function LifeChip({ life, gameDate, onOpen }: { life: Life; gameDate: Date; onOpen: () => void }) {
  const st = L.stageFor(life.age);
  const p = (gameDate.getUTCHours() * 60 + gameDate.getUTCMinutes()) / 1440;
  const r = 15, c = 2 * Math.PI * r;
  return (
    <button type="button" data-hud="kairos-life" className="kl-chip" onClick={onOpen} aria-label={`Kairos Life: ${life.name.first}, age ${life.age}. Open life`}>
      <svg viewBox="0 0 40 40" aria-hidden><circle cx="20" cy="20" r={r} className="kl-ring-bg" /><circle cx="20" cy="20" r={r} className="kl-ring" strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 20 20)" /><text x="20" y="25" textAnchor="middle">{life.age}</text></svg>
      <span><b>{life.name.first}</b><small>{st.label} · Health {life.health} · Walk {life.faith.walk}</small></span>
      {life.faith.drift >= 3 && <em>Drifting</em>}
    </button>
  );
}

/** This year's decision, in the world. */
export function LifeDecision({ life, onChoose }: { life: Life; onChoose: (i: number) => void }) {
  const p = life.pending!;
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), [p.id]);
  return (
    <section role="dialog" aria-labelledby="kl-dq" className={`ks-card ks-bottom kl-decision${p.category === "temptation" ? " kl-tempt" : ""}`}>
      <p className="ks-eyebrow">{p.category === "temptation" ? "Temptation" : p.category} · age {life.age}</p>
      <h2 id="kl-dq">{p.title}</h2>
      <p>{p.text}</p>
      <div className="kl-choices">{p.options.map((o, i) => <button key={i} ref={i === 0 ? first : undefined} type="button" onClick={() => onChoose(i)}>{o.label}</button>)}</div>
    </section>
  );
}

const WORLD_ACTIONS: Record<string, string> = {
  pray: "Phone → Prayer", "read-bible": "Bible button", church: "Kharis Church, 2pm service", preach: "Walk up to someone and press F",
  exercise: "Hike, cycle or walk the city", "eat-well": "Eat at home, Tescow or a café", checkup: "Bootz Pharmacy or the hospital", "buy-car": "Car dealership",
};

/** The Life panel: who you are, your family, this year and Sunday pick-ups. */
export function LifePanel({ life, gameDate, hasCar, onAct, onAgeUp, onPickup, onOnline, onClose }: {
  life: Life; gameDate: Date; hasCar: boolean; onAct: (id: string) => void; onAgeUp: () => void; onPickup: (name: string) => void; onOnline: () => void; onClose: () => void;
}) {
  const f = life.faith, st = L.stageFor(life.age);
  const acts = L.availableActions(life);
  const invited = useMemo(() => invitedContacts(), [life.log.length]);
  const pickups = life.pickups ?? [];
  return (
    <section role="dialog" aria-labelledby="kl-panel" className="ks-card kl-panel">
      <header><div><p className="ks-eyebrow">{st.label} · London{life.job ? ` · ${life.job.title}` : ""}</p><h2 id="kl-panel">{life.name.first} {life.name.last}, {life.age}</h2>
        <p className="ks-muted">{life.saved ? `Following Jesus since ${life.savedAge}` : "Not yet trusting Christ"}{life.partner ? ` · ${life.partner.married ? "Married to" : "Seeing"} ${life.partner.name}` : ""}{life.branch ? ` · Planted ${L.cityName(life.branch.city)} (${life.branch.members})` : ""}</p></div>
        <button type="button" className="ks-leave" onClick={onClose} aria-label="Close">×</button></header>
      {life.notice && <p role="status" className="kl-note">{life.notice}</p>}
      {f.drift >= 3 && <p className="kl-warn">You've drifted from God for {f.drift} years. It's never too late to come home.</p>}
      <div className="kl-stats"><STAT label="Health" value={life.health} tone={life.health < 40 ? "low" : ""} /><STAT label="Happiness" value={life.happiness} /><STAT label="Smarts" value={life.smarts} /><STAT label="Walk with God" value={f.walk} tone="faith" /><STAT label="Witness" value={f.witness} tone="faith" /><STAT label="Fruit" value={f.fruit} tone="faith" /><div className="kl-stat"><span>Savings</span><b>£{Math.round(life.money).toLocaleString("en-GB")}</b></div></div>
      <div className="kl-cols">
        <div>
          <h3>This year <small>{4 - life.year.acts} choices left · real actions don't count</small></h3>
          <div className="kl-acts">{acts.filter((a) => !WORLD_ACTIONS[a.id]).map((a) => <button key={a.id} type="button" disabled={a.disabled} title={a.reason} onClick={() => onAct(a.id)}>{a.label}</button>)}</div>
          <h3>Do these in the world</h3>
          <ul className="kl-hints">{acts.filter((a) => WORLD_ACTIONS[a.id]).map((a) => <li key={a.id}><b>{a.label}</b> {WORLD_ACTIONS[a.id]}</li>)}</ul>
          <button type="button" className="kl-go kl-wide" disabled={!!life.pending} onClick={onAgeUp}>Age up now · +1 year</button>
          <p className="ks-muted">Otherwise a year passes every in-game day.</p>
        </div>
        <div>
          <h3>2pm service · {nextServiceLabel(gameDate, true)}</h3>
          {invited.length || pickups.length ? <ul className="kl-pick">{[...new Set([...pickups.map((p) => p.name), ...invited])].map((n) => {
            const p = pickups.find((x) => x.name === n);
            return <li key={n}><b>{n}</b>{p?.status === "aboard" ? <span>In your car</span> : p?.status === "collecting" ? <span>Waiting for you (see map)</span> : <button type="button" disabled={!hasCar} title={hasCar ? "" : "You need a car"} onClick={() => onPickup(n)}>{hasCar ? "Pick up in my car" : "Needs a car"}</button>}</li>;
          })}</ul> : <p className="ks-muted">Invite people through Phone → Follow-ups. Once they say yes, collect them in your car and bring them to the 2pm service.</p>}
          <h3>Family</h3>
          <ul className="kl-family">{life.family.filter((p) => p.alive).map((p) => <li key={p.id}>{p.name} <small>{p.relation}, {p.age}</small></li>)}</ul>
          <h3>Your story</h3>
          <ol className="kl-log">{life.log.slice(-8).reverse().map((e, i) => <li key={i} data-kind={e.kind}><b>{e.age}</b> {e.text}</li>)}</ol>
        </div>
      </div>
      <button type="button" className="kl-link" onClick={onOnline}>Switch to online quick play (your life is saved)</button>
    </section>
  );
}

/** The 2pm service: a one-minute David Antwi excerpt and the KJV passage on the big screen. */
export function ChurchService({ guests, onDone, onLeave }: { guests: string[]; onDone: () => void; onLeave: () => void }) {
  const svc = useMemo(() => {
    const s = series[Math.floor(Math.random() * series.length)], ep = s.episodes[Math.floor(Math.random() * s.episodes.length)];
    return { video: s.video, title: s.message, start: ep.clip.start, end: ep.clip.start + 60, reading: ep.reading as string, attendance: 220 + Math.floor(Math.random() * 200) + guests.length };
  }, [guests.length]);
  const [left, setLeft] = useState(60);
  const [stage, setStage] = useState<"welcome" | "word" | "done">("welcome");
  useEffect(() => {
    const ctl = new AbortController();
    setChurchScreen({ active: true, reference: svc.reading.replace(/ · KJV$/, ""), lines: [], title: svc.title, guests });
    kjvVerses(svc.reading, ctl.signal).then((lines) => setChurchScreen({ lines })).catch(() => setChurchScreen({ lines: ["Open your Bible to this passage."] }));
    return () => { ctl.abort(); setChurchScreen({ active: false, reference: "", lines: [], guests: [] }); };
  }, [svc, guests]);
  useEffect(() => {
    if (stage !== "word") return;
    const t = setInterval(() => setLeft((s) => { if (s <= 1) { clearInterval(t); setStage("done"); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [stage]);
  const src = `https://www.youtube-nocookie.com/embed/${svc.video}?start=${svc.start}&end=${svc.end}&autoplay=1&rel=0&playsinline=1&modestbranding=1`;
  return (
    <section role="dialog" aria-labelledby="kl-svc" className="ks-card kl-service">
      <p className="ks-eyebrow">Sunday · 2:00pm · Kharis Church · {svc.attendance} people</p>
      <h2 id="kl-svc">{stage === "welcome" ? (guests.length ? `${guests.join(" and ")} ${guests.length > 1 ? "are" : "is"} sitting with you` : "Welcome home") : stage === "word" ? svc.title : "The service has ended"}</h2>
      {stage === "welcome" && <><p>The hall is packed. Worship ends, announcements are read, and the passage goes up on the big screen: <b>{svc.reading}</b>.</p><div className="kl-row"><button type="button" className="kl-go" onClick={() => setStage("word")}>Hear the word (1 minute)</button><button type="button" className="kl-ghost" onClick={onLeave}>Leave</button></div></>}
      {stage === "word" && <><div className="kl-video"><iframe title={`${svc.title}, David Antwi`} src={src} allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" /></div><p className="ks-muted">David Antwi · {left}s left · <a href={`https://www.youtube.com/watch?v=${svc.video}&t=${svc.start}s`} target="_blank" rel="noopener noreferrer">Full sermon</a></p><button type="button" className="kl-ghost" onClick={() => setStage("done")}>Skip to the end</button></>}
      {stage === "done" && <><p>{guests.length ? "Your guests stay behind to ask questions over refreshments." : "You chat with people over refreshments before heading home."}</p><button type="button" className="kl-go" onClick={onDone}>Finish</button></>}
    </section>
  );
}
export { isServiceTime, CHURCH_SCREEN };

/** Eternity: a 3D scene of heaven or the outer darkness, then the verdict. */
export function LifeEnding({ life, avatar, onAgain }: { life: Life; avatar: Avatar; onAgain: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const e = life.ending!;
  const heaven = e.destination === "heaven";
  useEffect(() => {
    const el = host.current; if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(heaven ? "#fff6dc" : "#120a10");
    scene.fog = new THREE.Fog(heaven ? "#fff6dc" : "#120a10", 12, heaven ? 60 : 30);
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.set(0, 3.2, 11);
    scene.add(new THREE.HemisphereLight(heaven ? "#fffbe8" : "#5a2030", heaven ? "#e8d29a" : "#0a0306", heaven ? 2.2 : 0.7));
    const sun = new THREE.DirectionalLight(heaven ? "#fff1c4" : "#ff5a2a", heaven ? 2.4 : 1.2);
    sun.position.set(4, 10, 6); scene.add(sun);
    const flat = (c: string, emissive = "#000") => new THREE.MeshStandardMaterial({ color: c, emissive, flatShading: true, roughness: 0.8 });
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 0.4, 9), flat(heaven ? "#f3e2a8" : "#2a1418"));
    ground.position.y = -0.2; scene.add(ground);
    const spin: THREE.Object3D[] = [];
    if (heaven) {
      const gold = flat("#e9b83a", "#5a3d00"), pearl = flat("#fbf7ee");
      for (const x of [-2.6, 2.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6, 1.2), pearl); p.position.set(x, 3, -4); scene.add(p); }
      const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.45, 6, 12, Math.PI), gold); arch.position.set(0, 6, -4); scene.add(arch);
      for (let i = 0; i < 26; i++) { const h = 3 + (i * 7) % 9, b = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.6), i % 3 ? pearl : gold); const a = (i / 26) * Math.PI + Math.PI; b.position.set(Math.cos(a) * (14 + (i % 4) * 3), h / 2, Math.sin(a) * (8 + (i % 4) * 3) - 10); scene.add(b); }
      for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), flat("#fff3b0", "#c9a400")); m.position.set((i * 37 % 30) - 15, 2 + (i * 13 % 9), -(i * 17 % 20)); scene.add(m); spin.push(m); }
      const river = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 40), flat("#9fd9ef", "#2a6d88")); river.position.set(0, 0.02, -22); scene.add(river);
    } else {
      const rock = flat("#3a1d22");
      for (let i = 0; i < 30; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.8 + (i % 4) * 0.5, 2 + (i * 7) % 6, 5), rock); const a = (i / 30) * Math.PI * 2; r.position.set(Math.cos(a) * (9 + (i % 5) * 2), 1, Math.sin(a) * (9 + (i % 5) * 2) - 4); scene.add(r); }
      for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.08), flat("#ff6a2a", "#ff3a00")); m.position.set((i * 37 % 24) - 12, (i * 13 % 8), -(i * 17 % 16)); scene.add(m); spin.push(m); }
    }
    let me: Awaited<ReturnType<typeof buildCharacter>> | null = null, dead = false;
    void buildCharacter({ ...avatar, lifeAge: Math.min(life.age, 40) } as Avatar, 1.6).then((c) => { if (dead) { c.dispose(); return; } me = c; c.object.position.set(0, 0, 6); c.object.rotation.y = Math.PI; scene.add(c.object); c.play(heaven ? "walk" : "idle"); }).catch(() => {});
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const dt = Math.min(0.05, clock.getDelta());
      if (!reduced) { for (const m of spin) { m.rotation.y += dt; m.position.y += heaven ? dt * 0.3 : dt * 0.8; if (m.position.y > 10) m.position.y = 0.5; } }
      if (me) { me.update(dt, reduced); if (heaven && me.object.position.z > -2) me.object.position.z -= dt * 1.1; if (!heaven && me.object.position.z < 8) me.object.position.z += dt * 0.25; }
      camera.lookAt(0, 2, -2);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onResize = () => { camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight); };
    addEventListener("resize", onResize);
    return () => { dead = true; cancelAnimationFrame(raf); removeEventListener("resize", onResize); me?.dispose(); scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } }); renderer.dispose(); renderer.domElement.remove(); };
  }, [heaven, avatar, life.age]);
  return (
    <div className={`kl-ending ${heaven ? "heaven" : "hell"}`}>
      <div ref={host} className="kl-ending-scene" aria-hidden />
      <section role="dialog" aria-labelledby="kl-end" className="kl-ending-card">
        <p className="ks-eyebrow">{life.name.first} {life.name.last} · {life.age} years · {life.cause}</p>
        <h2 id="kl-end">{e.title}</h2>
        <p>{e.text}</p>
        <ul>{e.verses.map((v) => <li key={v}>{v}</li>)}</ul>
        {e.rewards && <p className="ks-muted">Witness {e.rewards.witness} · Fruit {e.rewards.fruit} · People who came to faith {e.rewards.people}{e.rewards.branch ? ` · Branch in ${e.rewards.branch}` : ""}</p>}
        {e.reflection && <p className="kl-reflect">{e.reflection}</p>}
        <button type="button" className="kl-go" onClick={onAgain}>Live another life</button>
      </section>
    </div>
  );
}
