"use client";
/**
 * Kairos World title menu: two modes as tabs (Kairos Online and Kairos Life,
 * the story mode), each a grid of tiles cut from real in-game shots. Tiles turn
 * to liquid glass under the pointer: a refracting lens follows the cursor and
 * the label floats on a glass pill.
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

type Mode = "online" | "offline";
type Tile = { id: string; img: string; title: string; tag?: string; line: string };

const TABS: Record<Mode, { label: string; sub: string; hint: string; tiles: Tile[] }> = {
  online: {
    label: "Kairos Online",
    sub: "Quick play",
    hint: "The whole world with friends, chat and calls. No ageing. Jump in and out.",
    tiles: [
      { id: "london", img: "london", title: "London Square", tag: "Live", line: "Walk out into the city with everyone online." },
      { id: "ltbs", img: "ltbs", title: "LTBS Stories", line: "Step through a portal into David, Esther, Ruth or Daniel." },
      { id: "church", img: "church", title: "Sunday at Kharis", tag: "2pm", line: "A packed hall, the Word on the big screen." },
      { id: "airport", img: "airport", title: "Kairos Air", line: "Fly to the Highlands and the Kharis branches." },
      { id: "ferry", img: "ferry", title: "Thames Clipper", line: "Down the river from London Square Pier." },
    ],
  },
  offline: {
    label: "Kairos Life",
    sub: "Story mode",
    hint: "Be born, grow up and grow old. Press +1 when you are ready. Your choices write the story, then eternity.",
    tiles: [
      { id: "preacher", img: "preacher", title: "Your story starts here", tag: "Story mode", line: "From the cot to the pulpit: one life, every choice yours." },
      { id: "birth", img: "birth", title: "Born in London", line: "A new family, a new phone, nothing linked to your online profile." },
      { id: "cafe", img: "cafe", title: "Friends & Family", line: "The people you call are the people who shape you." },
      { id: "temptation", img: "temptation", title: "Temptation", tag: "Choose", line: "Every year brings a test. Prepare, and stand." },
      { id: "park", img: "park", title: "Grow Older", line: "Live the year, then press +1 for what comes next." },
    ],
  },
};

function GlassTile({ tile, big, onPick, focus, setFocus }: { tile: Tile; big?: boolean; onPick: () => void; focus: boolean; setFocus: (id: string) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    ref.current!.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    ref.current!.style.setProperty("--tx", `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
    ref.current!.style.setProperty("--ty", `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`);
  };
  return (
    <button ref={ref} type="button" className={`km-tile${big ? " km-big" : ""}${focus ? " km-focus" : ""}`} data-tile={tile.id}
      onPointerMove={move} onPointerEnter={() => setFocus(tile.id)} onFocus={() => setFocus(tile.id)} onClick={onPick}
      style={{ "--img": `url(/menu/${tile.img}.jpg)` } as CSSProperties} aria-label={`${tile.title}. ${tile.line}`}>
      <span className="km-art" aria-hidden />
      <span className="km-lens" aria-hidden />
      <span className="km-sheen" aria-hidden />
      {tile.tag && <span className="km-tag">{tile.tag}</span>}
      <span className="km-label"><span className="km-glass-text" data-text={tile.title}>{tile.title}</span></span>
    </button>
  );
}

export function KairosMenu({ onPick, initial = "online", onResume }: { onPick: (m: Mode) => void; initial?: Mode; onResume?: () => void }) {
  const [tab, setTab] = useState<Mode>(initial);
  const [settings, setSettings] = useState(false);
  const leave = (logout: boolean, route?: string) => { try { parent.postMessage({ type: "kairos-world:leave", logout, route }, location.origin); } catch { /* not embedded */ } };
  const [focus, setFocus] = useState(TABS[initial].tiles[0].id);
  const t = TABS[tab];
  const line = t.tiles.find((x) => x.id === focus)?.line ?? t.hint;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q" || e.key === "[") setTab("online");
      if (e.key === "e" || e.key === "E" || e.key === "]") setTab("offline");
      if (e.key === "Escape" && onResume) { e.preventDefault(); onResume(); }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [onResume]);
  useEffect(() => setFocus(TABS[tab].tiles[0].id), [tab]);
  const [hero, a, b, c, d] = t.tiles;
  return (
    <section className="km-menu" role="dialog" aria-label="Kairos World menu">
      <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
        <filter id="km-liquid" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="4" result="n">
            <animate attributeName="baseFrequency" dur="9s" values="0.012 0.018;0.016 0.012;0.012 0.018" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <header className="km-head">
        <h1 className="km-title">{tab === "offline"
          ? <img className="km-life-logo" src="/brand/kairos-life-wordmark-game.svg" alt="Kairos Life" />
          : <img className="km-life-logo" src="/brand/kairos-world-wordmark-game.svg" alt="Kairos World" />}</h1>
        <nav className="km-tabs" role="tablist" aria-label="Game mode">
          <kbd>Q</kbd>
          {(["online", "offline"] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={tab === m} className={tab === m ? "km-on" : ""} onClick={() => setTab(m)}>
              {TABS[m].label}<small>{TABS[m].sub}</small>
            </button>
          ))}
          <kbd>E</kbd>
        </nav>
      </header>
      <div className={`km-grid km-${tab}`} key={tab}>
        <GlassTile tile={hero} big onPick={() => onPick(tab)} focus={focus === hero.id} setFocus={setFocus} />
        {[a, b, c, d].map((x) => <GlassTile key={x.id} tile={x} onPick={() => onPick(tab)} focus={focus === x.id} setFocus={setFocus} />)}
      </div>
      <footer className="km-foot">
        <p>{line}</p>
        <div className="km-actions">
          {onResume && <button type="button" className="km-ghost" onClick={onResume}>Resume <kbd>Esc</kbd></button>}
          <button type="button" className="km-ghost" aria-expanded={settings} onClick={() => setSettings((v) => !v)}>Settings</button>
        </div>
        {settings && (
          <div className="km-settings" role="menu" aria-label="Settings">
            <button type="button" role="menuitem" onClick={() => leave(false)}>Back to the home page</button>
            <button type="button" role="menuitem" onClick={() => { window.dispatchEvent(new CustomEvent("kairos-replay-training")); onResume?.(); }}>How to play · training room</button>
            <button type="button" role="menuitem" onClick={() => leave(false, "account")}>Account · sign in</button>
            <button type="button" role="menuitem" className="km-danger" onClick={() => leave(true)}>Log out</button>
          </div>
        )}
        <button type="button" className="km-select" onClick={() => onPick(tab)}>{tab === "offline" ? "Start a life" : "Play online"} <span aria-hidden>→</span></button>
      </footer>
    </section>
  );
}
