"use client";
/**
 * The in-game phone: an iOS-style home screen (widgets, 4-column app grid, dock)
 * in the low-poly ink style. Apps cover ministry (calls, messages, follow-ups,
 * prayer), fellowship, Kharis TV, the Bible, maps, games and settings.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ACTS_STEPS, FELLOWSHIP, FOLLOW_STEPS, FRIEND_ACTIVITIES, SCENARIOS, STAGES,
  completeStep, contactWarmth, currentReadiness, nextStep, prayed, readMinistry, readinessLabel, writeMinistry,
  type Contact, type FollowStep, type MinistrySave,
} from "@/game/core/ministry";
import { PLAUSIBLE_FOLLOW_UP, guide, maybeStruggle, seeded, shuffle, struggleById, type GrowingContact } from "@/game/core/discipleship";
import { ANNOUNCEMENTS, KHARIS_CHANNEL, SERMONS, SEASONS, embedUrl, latestEmbedUrl, seasonFor, thumbnailUrl } from "@/game/core/kharis-media";
import { readVisualQuality, type VisualQuality } from "@/game/core/visual-quality";
import { LowPolyIcon, LowPolyWallpaper } from "./lowpoly-icons";
import { FriendsChatApp } from "./friends-app";
import { LIFE_WORLD } from "@/game/core/life-world";

type AppId =
  | "phone" | "messages" | "prayer" | "bible" | "tv" | "maps" | "friends" | "grace"
  | "games" | "stories" | "wardrobe" | "season" | "camera" | "settings" | "followups" | "messagesPlay" | "chat";

/** Low Poly Icon Sampler art where a matching icon exists; drawn glyphs elsewhere. */
const ICON = (n: string) => `/world-ui/icons/${n}.png`;
const APPS: { id: AppId; name: string; glyph: string; color: string; image?: string }[] = [
  { id: "followups", name: "Follow-ups", glyph: "heart", color: "#e2556b", image: ICON("heart") },
  { id: "prayer", name: "Prayer", glyph: "pray", color: "#8a5bd6", image: ICON("fire") },
  { id: "tv", name: "Kharis TV", glyph: "tv", color: "#e0483e" },
  { id: "bible", name: "Bible", glyph: "bible", color: "#b98a3e" },
  { id: "chat", name: "Friends", glyph: "chat", color: "#2f7de1" },
  { id: "friends", name: "Fellowship", glyph: "friends", color: "#2fa48a" },
  { id: "maps", name: "Maps", glyph: "map", color: "#43a2e6" },
  { id: "games", name: "Games", glyph: "games", color: "#f08b2e", image: ICON("gold_chest") },
  { id: "stories", name: "Stories", glyph: "scroll", color: "#c26a2f" },
  { id: "messagesPlay", name: "PlayMessages", glyph: "chatworld", color: "#5a4fd0" },
  { id: "season", name: "Season", glyph: "calendar", color: "#f2c84b", image: ICON("star") },
  { id: "wardrobe", name: "Wardrobe", glyph: "shirt", color: "#d26aa8", image: ICON("gift_box") },
  { id: "camera", name: "Camera", glyph: "camera", color: "#5d6673" },
  { id: "settings", name: "Settings", glyph: "gear", color: "#8a929c", image: ICON("gear") },
];
const DOCK: { id: AppId; name: string; glyph: string; color: string; image?: string }[] = [
  { id: "phone", name: "Phone", glyph: "phone", color: "#3fbf5a" },
  { id: "grace", name: "Grace", glyph: "compass", color: "#2f7de1" },
  { id: "messages", name: "Messages", glyph: "chat", color: "#45c25b" },
  { id: "bible", name: "Bible", glyph: "cross", color: "#6b3fa0" },
];

export type PhoneActions = {
  onClose: () => void;
  onMap: () => void;
  onBible: () => void;
  onGrace: (route?: string) => void;
  onWardrobe: () => void;
  onPhoto: () => void;
  gameTime: string;
  playerName: string;
};

function useMinistry() {
  const [save, setSave] = useState<MinistrySave>(() => readMinistry(typeof localStorage === "undefined" ? null : localStorage));
  useEffect(() => {
    const refresh = () => setSave(readMinistry(localStorage));
    window.addEventListener("kairos-ministry-updated", refresh);
    return () => window.removeEventListener("kairos-ministry-updated", refresh);
  }, []);
  const update = useCallback((next: MinistrySave) => { setSave(next); writeMinistry(localStorage, next); }, []);
  return [save, update] as const;
}

function Ring({ value, label, accent }: { value: number; label: string; accent: string }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 84 84" className="kp-ring" role="img" aria-label={`${label}: ${value}%`}>
      <circle cx="42" cy="42" r={r} stroke="#ffffff33" strokeWidth="9" fill="none" />
      <circle cx="42" cy="42" r={r} stroke={accent} strokeWidth="9" fill="none" strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 42 42)" />
      <text x="42" y="47" textAnchor="middle" className="kp-ring-text">{value}</text>
    </svg>
  );
}

export function KairosPhone(props: PhoneActions) {
  const [app, setApp] = useState<AppId | null>(null);
  const [save, update] = useMinistry();
  const season = useMemo(() => seasonFor(), []);
  const readiness = currentReadiness(save.prayer);
  const due = save.contacts.map((c) => ({ c, n: nextStep(c) })).filter((x) => x.n?.ready);
  const badge: Partial<Record<AppId, number>> = { followups: due.length, messages: due.filter((d) => d.n?.step.channel === "message").length, phone: due.filter((d) => d.n?.step.channel === "call").length };

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); if (app) setApp(null); else props.onClose(); } };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [app, props]);

  const open = (id: AppId) => {
    if (id === "bible") return props.onBible();
    if (id === "maps") return props.onMap();
    if (id === "grace") return props.onGrace("home");
    if (id === "games") return props.onGrace("bible");
    if (id === "stories") return props.onGrace("adventures");
    if (id === "messagesPlay") return props.onGrace("messages");
    if (id === "wardrobe") return props.onWardrobe();
    if (id === "camera") return props.onPhoto();
    setApp(id);
  };

  return (
    <div className="kp-backdrop" onClick={props.onClose}>
      <section className="kp-phone" role="dialog" aria-modal="true" aria-label="Kairos phone" onClick={(e) => e.stopPropagation()} style={{ ["--kp-accent" as string]: season.accent }}>
        <LowPolyWallpaper accent={app ? "#1d1830" : "#5b3f99"} />
        <div className="kp-island" aria-hidden="true" />
        <header className="kp-status">
          <b>{props.gameTime}</b>
          <span aria-hidden="true" className="kp-status-icons"><i className="kp-bars" /><i className="kp-wifi" /><i className="kp-battery" /></span>
        </header>
        {!app ? (
          <div className="kp-home">
            <div className="kp-widgets">
              <button className="kp-widget kp-widget-prayer" onClick={() => setApp("prayer")}>
                <Ring value={readiness} label="Prayer readiness" accent={season.accent} />
                <span><b>{readinessLabel(readiness)}</b><small>Prayer streak · {save.prayer.streak} day{save.prayer.streak === 1 ? "" : "s"}</small></span>
                <em>Widget · Prayer</em>
              </button>
              <button className="kp-widget kp-widget-season" onClick={() => setApp("season")}>
                <small>{season.name}</small>
                <b>“{season.verse}”</b>
                <span>{season.reference}</span>
                <em>Widget · Kharis season</em>
              </button>
            </div>
            <div className="kp-grid">
              {APPS.filter((a) => !((globalThis as { __kairosOffline?: boolean }).__kairosOffline && a.id === "chat")).map((a) => (
                <button key={a.id} className="kp-app" onClick={() => open(a.id)} aria-label={a.name + (badge[a.id] ? `, ${badge[a.id]} waiting` : "")}>
                  <LowPolyIcon name={a.name} glyph={a.glyph} color={a.color} image={a.image} />
                  {badge[a.id] ? <i className="kp-badge">{badge[a.id]}</i> : null}
                  <span>{a.name}</span>
                </button>
              ))}
            </div>
            <div className="kp-search" aria-hidden="true">⌕ Search</div>
            <nav className="kp-dock" aria-label="Dock">
              {DOCK.map((a) => (
                <button key={a.id} className="kp-app" onClick={() => open(a.id)} aria-label={a.name + (badge[a.id] ? `, ${badge[a.id]} waiting` : "")}>
                  <LowPolyIcon name={a.name} glyph={a.glyph} color={a.color} image={a.image} />
                  {badge[a.id] ? <i className="kp-badge">{badge[a.id]}</i> : null}
                </button>
              ))}
            </nav>
          </div>
        ) : (
          <div className="kp-appview">
            <header className="kp-apphead">
              <button onClick={() => setApp(null)} aria-label="Back to home screen" className="kp-back"><img src="/world-ui/cartoon/Arrow_Left.png" alt="" /> Home</button>
              <h2>{[...APPS, ...DOCK].find((a) => a.id === app)?.name}</h2>
              <span />
            </header>
            <div className="kp-appbody">
              {app === "prayer" && <PrayerApp save={save} update={update} accent={season.accent} />}
              {app === "phone" && <FamilyCalls />}
              {(app === "followups" || app === "phone" || app === "messages") && <FollowUpsApp save={save} update={update} mode={app} />}
              {app === "tv" && <KharisTV />}
              {app === "friends" && <FellowshipApp save={save} update={update} />}
              {app === "chat" && <FriendsChatApp />}
              {app === "season" && <SeasonApp />}
              {app === "settings" && <SettingsApp />}
            </div>
          </div>
        )}
        <button className="kp-homebar" aria-label={app ? "Go to home screen" : "Close phone"} onClick={() => (app ? setApp(null) : props.onClose())} />
      </section>
    </div>
  );
}

/* ── Prayer ─────────────────────────────────────────────────────────────── */
function PrayerApp({ save, update, accent }: { save: MinistrySave; update: (s: MinistrySave) => void; accent: string }) {
  const [step, setStep] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [stepTime, setStepTime] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const started = useRef(0);
  const readiness = currentReadiness(save.prayer);
  useEffect(() => {
    if (step < 0 || step >= ACTS_STEPS.length) return;
    const t = setInterval(() => { setElapsed((e) => e + 1); setStepTime((e) => e + 1); }, 1000);
    return () => clearInterval(t);
  }, [step]);
  const finish = () => {
    update({ ...save, prayer: prayed(save.prayer, elapsed, names) });
    setStep(ACTS_STEPS.length);
  };
  if (step === -1)
    return (
      <div className="kp-stack">
        <div className="kp-card kp-center">
          <svg viewBox="0 0 84 84" className="kp-ring kp-ring-big"><circle cx="42" cy="42" r="34" stroke="#120c1822" strokeWidth="9" fill="none" /><circle cx="42" cy="42" r="34" stroke={accent} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={`${(213.6 * readiness) / 100} 213.6`} transform="rotate(-90 42 42)" /><text x="42" y="47" textAnchor="middle" className="kp-ring-text">{readiness}</text></svg>
          <b>{readinessLabel(readiness)}</b>
          <p>Readiness fades over time. Conversations without prayer stay on the surface. Long, sincere prayer for people by name prepares hearts — God gives the increase.</p>
          <small>“Continue in prayer, and watch in the same with thanksgiving.” — Colossians 4:2</small>
        </div>
        <button className="kp-primary" onClick={() => { started.current = Date.now(); setStep(0); setElapsed(0); setStepTime(0); }}>Begin guided prayer (ACTS)</button>
        <p className="kp-muted">About 2–5 minutes. Each step needs real time before you can move on — there are no shortcuts.</p>
      </div>
    );
  if (step >= ACTS_STEPS.length)
    return (
      <div className="kp-stack kp-center">
        <div className="kp-card kp-center"><b>Amen.</b><p>You prayed for {Math.max(1, Math.round(elapsed / 60))} minute{elapsed >= 120 ? "s" : ""}{names.length ? ` and lifted up ${names.join(", ")}` : ""}.</p><p>Readiness is now {currentReadiness(save.prayer)}.</p></div>
        <button className="kp-primary" onClick={() => setStep(-1)}>Done</button>
      </div>
    );
  const s = ACTS_STEPS[step];
  const left = Math.max(0, s.minSeconds - stepTime);
  return (
    <div className="kp-stack">
      <div className="kp-steps">{ACTS_STEPS.map((x, i) => <i key={x.id} className={i <= step ? "on" : ""} />)}</div>
      <div className="kp-card">
        <small className="kp-eyebrow">{s.title}</small>
        <h3>{s.prompt}</h3>
        <p className="kp-verse">{s.verse}</p>
        <p className="kp-muted">Pray in your own words. Close your eyes if you like — the phone waits for you.</p>
      </div>
      {s.id === "supplication" && (
        <div className="kp-card">
          <small className="kp-eyebrow">Pray for people by name</small>
          <div className="kp-chips">
            {[...save.contacts.map((c) => c.name), ...FELLOWSHIP.map((f) => f.name), "My family", "Kharis Church", "London"].map((n) => (
              <button key={n} className={names.includes(n) ? "on" : ""} aria-pressed={names.includes(n)} onClick={() => setNames((v) => (v.includes(n) ? v.filter((x) => x !== n) : [...v, n]))}>{n}</button>
            ))}
          </div>
        </div>
      )}
      <button className="kp-primary" disabled={left > 0} onClick={() => { if (step === ACTS_STEPS.length - 1) finish(); else { setStep(step + 1); setStepTime(0); } }}>
        {left > 0 ? `Keep praying… ${left}s` : step === ACTS_STEPS.length - 1 ? "Amen" : "Continue"}
      </button>
      <p className="kp-muted kp-center">Total time {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</p>
    </div>
  );
}

/* ── Phone / Messages / Follow-ups ─────────────────────────────────────── */
function FollowUpsApp({ save, update, mode }: { save: MinistrySave; update: (s: MinistrySave) => void; mode: "followups" | "phone" | "messages" }) {
  const [active, setActive] = useState<{ contact: Contact; step: FollowStep } | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [helping, setHelping] = useState<GrowingContact | null>(null);
  const [outcome, setOutcome] = useState<{ reply: string; result: string } | null>(null);
  const now = Date.now();
  // People who have come to faith sometimes fall back into sin and need you.
  useEffect(() => {
    const next = save.contacts.map((c) => maybeStruggle(c as GrowingContact, now));
    if (next.some((c, i) => c !== save.contacts[i])) update({ ...save, contacts: next });
  }, [save, update, now]);
  if (helping?.struggle) {
    const struggle = struggleById(helping.struggle.id)!;
    const options = shuffle(struggle.options, seeded(`${helping.name}:${struggle.id}:${helping.struggle.tries}`));
    return (
      <div className="kp-stack">
        <div className="kp-thread">
          <p className="kp-sys">On a call with {helping.name} · {struggle.title}</p>
          <p className="kp-bubble them">{struggle.confess(helping.name)}</p>
          {outcome && <p className="kp-bubble them">{outcome.reply}</p>}
          {outcome && <p className="kp-sys">{outcome.result} · {struggle.verse}</p>}
        </div>
        {!outcome ? options.map((o) => (
          <button key={o.text} className="kp-option" onClick={() => {
            const { contact, result } = guide(helping, o.quality);
            update({ ...save, contacts: save.contacts.map((c) => (c.name === helping.name ? contact : c)) });
            setOutcome({ reply: o.reply, result });
          }}>{o.text}</button>
        )) : <button className="kp-primary" onClick={() => { setHelping(null); setOutcome(null); }}>Done</button>}
      </div>
    );
  }
  if (active) {
    const isCall = active.step.channel === "call";
    if (isCall && calling)
      return (
        <div className="kp-call">
          <div className="kp-avatar">{active.contact.name[0]}</div>
          <h3>{active.contact.name}</h3>
          <p>calling…</p>
          <button className="kp-primary" onClick={() => setCalling(false)}>Connected</button>
        </div>
      );
    return (
      <div className="kp-stack">
        <div className="kp-thread">
          <p className="kp-sys">{isCall ? `On a call with ${active.contact.name}` : active.step.channel === "meet" ? `Meeting ${active.contact.name}` : `Messages · ${active.contact.name}`}</p>
          <p className="kp-sys">{active.step.prompt(active.contact.name)}</p>
          {reply && <p className="kp-bubble them">{reply}</p>}
        </div>
        {!reply ? (
          shuffle([...active.step.options, PLAUSIBLE_FOLLOW_UP[active.step.id]].filter(Boolean), seeded(`${active.contact.name}:${active.step.id}`)).map((o, i) => (
            <button key={i} className="kp-option" onClick={() => {
              setReply(o.reply);
              const next = save.contacts.map((c) => (c.name === active.contact.name ? completeStep(c, active.step.id, o.good) : c));
              update({ ...save, contacts: next });
            }}>{o.text}</button>
          ))
        ) : (
          <button className="kp-primary" onClick={() => { setActive(null); setReply(null); }}>Done</button>
        )}
      </div>
    );
  }
  if (!save.contacts.length)
    return (
      <div className="kp-stack kp-center">
        <div className="kp-card kp-center"><b>No contacts yet</b><p>Pray first, then talk with people around London (press F near someone). People who want to stay in touch appear here, with the next step of their follow-up journey.</p><small>“Let us go again and visit our brethren… and see how they do.” — Acts 15:36</small></div>
      </div>
    );
  const list = save.contacts;
  return (
    <div className="kp-stack">
      {mode === "messages" && (
        <div className="kp-card">
          <small className="kp-eyebrow">Kharis Church · Announcements</small>
          {ANNOUNCEMENTS.slice(0, 3).map((a) => <p key={a.title}><b>{a.title}.</b> {a.detail}</p>)}
        </div>
      )}
      {list.map((c) => {
        const n = nextStep(c, now);
        const warmth = contactWarmth(c, now);
        const stage = STAGES.find((s) => s.id === c.stage)?.label;
        const waitMin = n && !n.ready ? Math.ceil((n.due - now) / 60_000) : 0;
        return (
          <article key={c.name} className="kp-contact">
            <div className="kp-avatar small">{c.name[0]}</div>
            <div>
              <b>{c.name}</b>
              <small>{SCENARIOS[c.background]?.label} · {stage} · <span className={`kp-warm ${warmth}`}>{warmth}</span></small>
              <div className="kp-progress">{FOLLOW_STEPS.map((s) => <i key={s.id} className={c.steps[s.id] ? "on" : ""} title={s.title} />)}</div>
              {(c as GrowingContact).struggle && <small className="kp-warm drifting">Needs you: {struggleById((c as GrowingContact).struggle!.id)?.title}</small>}
              {n ? <small>{n.ready ? `Next: ${n.step.title}` : `Next: ${n.step.title} in ${waitMin} min`}</small> : <small>Follow-up journey complete · keep walking with them</small>}
            </div>
            {(c as GrowingContact).struggle && <button className="kp-action" onClick={() => setHelping(c as GrowingContact)}>Help</button>}
            {!(c as GrowingContact).struggle && n?.ready && (
              <button className="kp-action" onClick={() => { setActive({ contact: c, step: n.step }); setCalling(n.step.channel === "call"); }}>
                {n.step.channel === "call" ? "Call" : n.step.channel === "meet" ? "Meet" : "Text"}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

/* ── Kharis TV ──────────────────────────────────────────────────────────── */
function KharisTV() {
  const [playing, setPlaying] = useState<string | null>(null);
  return (
    <div className="kp-stack">
      <div className="kp-video">
        <iframe title="Kharis Church messages" src={playing ? embedUrl(playing) : latestEmbedUrl()} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      </div>
      <p className="kp-muted">{playing ? SERMONS.find((s) => s.id === playing)?.title : "Latest from Kharis Church"} · <a href={KHARIS_CHANNEL.url} target="_blank" rel="noopener noreferrer">YouTube ↗</a></p>
      <button className="kp-option" onClick={() => setPlaying(null)}>▶ Latest uploads</button>
      {SERMONS.map((s) => (
        <button key={s.id} className="kp-sermon" onClick={() => setPlaying(s.id)}>
          <img src={thumbnailUrl(s.id)} alt="" loading="lazy" />
          <span><b>{s.title}</b><small>David Antwi · {s.minutes} min</small></span>
        </button>
      ))}
    </div>
  );
}

/* ── Fellowship ─────────────────────────────────────────────────────────── */
function FellowshipApp({ save, update }: { save: MinistrySave; update: (s: MinistrySave) => void }) {
  const [said, setSaid] = useState<string | null>(null);
  return (
    <div className="kp-stack">
      <p className="kp-muted">“Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.” — Proverbs 27:17. Godly friends keep you praying and going.</p>
      {said && <div className="kp-card">{said}</div>}
      {FELLOWSHIP.map((f) => {
        const level = save.friends[f.name] ?? 0;
        return (
          <article key={f.name} className="kp-contact">
            <div className="kp-avatar small">{f.name[0]}</div>
            <div>
              <b>{f.name}</b>
              <small>{f.role} · {f.strength}</small>
              <div className="kp-progress">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={level > i * 2 ? "on" : ""} />)}</div>
              <div className="kp-chips">
                {FRIEND_ACTIVITIES.map((a) => (
                  <button key={a.id} onClick={() => {
                    const prayer = { ...save.prayer, readiness: Math.min(100, currentReadiness(save.prayer) + a.readiness), at: Date.now() };
                    update({ ...save, prayer, friends: { ...save.friends, [f.name]: level + 1 } });
                    setSaid(`${a.label} with ${f.name} (${a.verse}). Readiness +${a.readiness}.`);
                  }}>{a.label}</button>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ── Season ─────────────────────────────────────────────────────────────── */
function SeasonApp() {
  const current = seasonFor();
  return (
    <div className="kp-stack">
      <div className="kp-card" style={{ borderColor: current.accent }}>
        <small className="kp-eyebrow">Now · {current.name}</small>
        <h3>{current.theme}</h3>
        <p className="kp-verse">“{current.verse}” — {current.reference}</p>
        <p><b>Season quest:</b> {current.quest}</p>
      </div>
      {SEASONS.map((s) => (
        <div key={s.id} className={`kp-season ${s.id === current.id ? "on" : ""}`}>
          <i style={{ background: s.accent }} />
          <span><b>{s.name}</b><small>{s.from[1]}/{s.from[0]} – {s.to[1]}/{s.to[0]} · {s.theme}</small></span>
        </div>
      ))}
    </div>
  );
}

/* ── Settings ───────────────────────────────────────────────────────────── */
function SettingsApp() {
  const [quality, setQuality] = useState<VisualQuality>(() => { try { return readVisualQuality(localStorage.getItem("world-graphics")); } catch { return "auto"; } });
  const set = (q: VisualQuality) => {
    setQuality(q);
    try { localStorage.setItem("world-graphics", q); } catch { /* Optional. */ }
    window.dispatchEvent(new CustomEvent("kairos-graphics", { detail: q }));
  };
  return (
    <div className="kp-stack">
      <div className="kp-card">
        <small className="kp-eyebrow">Graphics</small>
        {([["low", "Performance", "Fastest. Lower resolution, no shadows."], ["auto", "Balanced", "Outlines and shadows, adapts to your device."], ["cinematic", "Cinematic", "Soft shadows, glow and lighting. Needs a strong GPU."]] as const).map(([id, label, note]) => (
          <button key={id} className={`kp-setting ${quality === id ? "on" : ""}`} aria-pressed={quality === id} onClick={() => set(id)}>
            <b>{label}</b><small>{note}</small>
          </button>
        ))}
        <p className="kp-muted">Resolution also adjusts automatically when frames drop.</p>
      </div>
    </div>
  );
}

/** Kairos Life: your family is in your call list. Calling them strengthens the relationship. */
const FAMILY_LINES = [
  { text: "\"Just ringing to see how you are.\"", kind: "care", reply: (n: string) => `${n}: "That's so kind. I'm doing alright, love."` },
  { text: "\"Can we pray together for a minute?\"", kind: "pray", reply: (n: string) => `${n}: "Yes, please. I needed that."` },
  { text: "\"I've got some news to share…\"", kind: "news", reply: (n: string) => `${n}: "Tell me everything!"` },
];
function FamilyCalls() {
  const family = LIFE_WORLD.family;
  const [on, setOn] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  if (!family.length) return null;
  if (on) return (
    <div className="kp-stack">
      <div className="kp-thread"><p className="kp-sys">On a call with {on}</p>{reply && <p className="kp-bubble them">{reply}</p>}</div>
      {!reply ? FAMILY_LINES.map((l) => <button key={l.kind} className="kp-option" onClick={() => {
        setReply(l.reply(on.split(" ")[0]));
        window.dispatchEvent(new CustomEvent("kairos-life:family-call", { detail: { name: on, kind: l.kind } }));
      }}>{l.text}</button>) : <button className="kp-primary" onClick={() => { setOn(null); setReply(null); }}>Hang up</button>}
    </div>
  );
  return (
    <div className="kp-stack">
      <p className="kp-sys">Family</p>
      {family.map((m) => <button key={m.name} className="kp-option" onClick={() => setOn(m.name)}>Call {m.name} · {m.relation}, {m.age}</button>)}
    </div>
  );
}
