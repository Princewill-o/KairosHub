"use client";
import { useEffect, useState } from "react";
import { PLAYER, TRACKS, trackSeconds, type PlayerState } from "../playlist";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export function usePlayer() {
  const [s, set] = useState<PlayerState>(PLAYER.s);
  const [, tick] = useState(0);
  useEffect(() => PLAYER.on(set), []);
  useEffect(() => { if (!s.playing) return; const t = setInterval(() => tick((n) => n + 1), 500); return () => clearInterval(t); }, [s.playing]);
  return s;
}

/** The phone's Music app: a rotating playlist with shuffle and repeat. */
export function MusicApp() {
  const s = usePlayer();
  const cur = TRACKS[s.order[s.index]];
  const len = trackSeconds(cur);
  const el = s.playing ? Math.min(len, (Date.now() - s.started) / 1000) : 0;
  return (
    <div className="mu-app">
      <div className="mu-now" style={{ ["--mu" as string]: cur.colour }}>
        <div className={`mu-cover${s.playing ? " mu-spin" : ""}`} aria-hidden><span /></div>
        <b>{cur.title}</b><small>{cur.artist}</small>
        <span className="mu-bar"><i style={{ width: `${(el / len) * 100}%` }} /></span>
        <span className="mu-times"><small>{mmss(el)}</small><small>{mmss(len)}</small></span>
        <div className="mu-controls">
          <button aria-pressed={s.shuffle} onClick={() => PLAYER.setShuffle(!s.shuffle)} aria-label="Shuffle">Shuffle</button>
          <button onClick={() => PLAYER.prev()} aria-label="Previous">Prev</button>
          <button className="mu-play" onClick={() => PLAYER.toggle()} aria-label={s.playing ? "Pause" : "Play"}>{s.playing ? "Pause" : "Play"}</button>
          <button onClick={() => PLAYER.next()} aria-label="Next">Next</button>
          <button aria-pressed={s.repeat} onClick={() => PLAYER.setRepeat(!s.repeat)} aria-label="Repeat">Repeat</button>
        </div>
      </div>
      <ol className="mu-list">
        {s.order.map((ti, i) => { const t = TRACKS[ti]; return (
          <li key={t.id}><button aria-current={i === s.index} onClick={() => PLAYER.pick(ti)} style={{ ["--mu" as string]: t.colour }}>
            <span className="mu-dot" /> <span><b>{t.title}</b><small>{t.artist}</small></span><small>{mmss(trackSeconds(t))}</small>
          </button></li>
        ); })}
      </ol>
    </div>
  );
}

/** A small now-playing pill in the HUD while music plays. */
export function NowPlaying() {
  const s = usePlayer();
  if (!s.playing) return null;
  const cur = TRACKS[s.order[s.index]];
  return (
    <div className="mu-pill" data-hud="now-playing" style={{ ["--mu" as string]: cur.colour }}>
      <span className="mu-eq" aria-hidden><i /><i /><i /></span>
      <span className="mu-pill-title">{cur.title}</span>
      <button onClick={() => PLAYER.next()} aria-label="Next song">Next</button>
      <button onClick={() => PLAYER.pause()} aria-label="Pause music">Pause</button>
    </div>
  );
}
