"use client";
/**
 * Hope, the training guide: a motion-graphics intro, then one step at a time with
 * animated keys. Each step completes when you actually do it (walk, turn, jump, talk,
 * sit, open the phone…), with a stamp and confetti. The screen tour spotlights each
 * button. Skip any time; replay from Settings → How to play.
 */
import { useEffect, useRef, useState } from "react";
import { CAMERA_VIEW, SEAT } from "@/game/core/camera-view";
import { HUD_TOUR, TRAINING_SPOTS, TRAINING_STEPS, type StepId } from "@/game/core/training";
import { SkinBust } from "../skin-bust";
import type { Avatar } from "@/game/core/cosmetics";

const GUIDE = { skinUrl: "/skins/youth-worker.png" } as unknown as Avatar;
type P = { x: number; y: number };

export function TrainingCoach({ player, phoneOpen, onFinish, onSkip }: { player: P; phoneOpen: boolean; onFinish: () => void; onSkip: () => void }) {
  const [intro, setIntro] = useState(true);
  const [i, setI] = useState(0);
  const [stamp, setStamp] = useState<string | null>(null);
  const [tour, setTour] = useState(0);
  const [spot, setSpot] = useState<DOMRect | null>(null);
  const step = TRAINING_STEPS[i];
  const base = useRef({ x: player.x, y: player.y, yaw: CAMERA_VIEW.yaw, mode: CAMERA_VIEW.mode, run: 0 });
  const done = useRef<Set<StepId>>(new Set());

  const complete = (id: StepId) => {
    if (done.current.has(id) || TRAINING_STEPS[i]?.id !== id) return;
    done.current.add(id);
    setStamp(["Nice!", "Great!", "You got it!", "Brilliant!", "Yes!"][done.current.size % 5]);
    setTimeout(() => { setStamp(null); setI((n) => n + 1); base.current = { x: player.x, y: player.y, yaw: CAMERA_VIEW.yaw, mode: CAMERA_VIEW.mode, run: 0 }; }, 1100);
  };

  // Watch what the player does.
  useEffect(() => {
    if (intro || !step) return;
    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase(); keys.add(k);
      if (step.id === "jump" && k === " ") complete("jump");
      if (step.id === "view" && k === "v") setTimeout(() => complete("view"), 400);
      if (step.id === "phone" && k === "p") setTimeout(() => complete("phone"), 600);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const seat = (e: Event) => { if ((e as CustomEvent<string>).detail === "sit") complete("sit"); };
    const train = (e: Event) => { const d = (e as CustomEvent<string>).detail; if (d === "talk") complete("talk"); if (d === "finish" && step.id === "door") onFinish(); };
    const tick = setInterval(() => {
      const b = base.current, moved = Math.hypot(player.x - b.x, player.y - b.y) / 32;
      if (step.id === "move" && moved > 1.5) complete("move");
      if (step.id === "turn" && Math.abs(CAMERA_VIEW.yaw - b.yaw) > 0.7) complete("turn");
      if (step.id === "view" && CAMERA_VIEW.mode !== b.mode) complete("view");
      if (step.id === "run") { if (keys.has("shift") && moved > 0.2) b.run += 0.2; if (b.run > 1) complete("run"); b.x = player.x; b.y = player.y; }
      if (step.id === "pad") { const t = TRAINING_SPOTS.target; if (Math.abs(player.x / 32 - (t.x + 0.5)) < 1.6 && Math.abs(player.y / 32 - (t.y + 0.5)) < 1.6) complete("pad"); }
      if (step.id === "sit" && SEAT.seat) complete("sit");
      if (step.id === "phone" && phoneOpen) complete("phone");
    }, 200);
    addEventListener("keydown", down); addEventListener("keyup", up); addEventListener("kairos-seat", seat); addEventListener("kairos-training", train);
    return () => { clearInterval(tick); removeEventListener("keydown", down); removeEventListener("keyup", up); removeEventListener("kairos-seat", seat); removeEventListener("kairos-training", train); };
  }, [intro, i, phoneOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Screen tour: spotlight the button being explained.
  useEffect(() => {
    if (step?.id !== "hud") { setSpot(null); return; }
    const find = () => {
      for (let k = tour; k < HUD_TOUR.length; k++) {
        const el = document.querySelector(`[data-hud="${HUD_TOUR[k].hud}"]`);
        if (el && el.getBoundingClientRect().width > 0) { if (k !== tour) setTour(k); setSpot(el.getBoundingClientRect()); return; }
      }
      setSpot(null);
    };
    find(); const t = setInterval(find, 400); return () => clearInterval(t);
  }, [step?.id, tour]);

  if (intro) return (
    <div className="tr-intro" role="dialog" aria-modal="true" aria-label="Welcome to Kairos World">
      <div className="tr-rays" aria-hidden />
      <div className="tr-title" aria-hidden>{"KAIROS".split("").map((c, k) => <span key={k} style={{ animationDelay: `${0.15 + k * 0.08}s` }}>{c}</span>)}</div>
      <p className="tr-sub">TRAINING ROOM</p>
      <div className="tr-guide-intro"><SkinBust avatar={GUIDE} size={92} /><div className="tr-bubble"><b>Hi, I'm Hope!</b> Welcome to Kairos World. Before you head out, let's learn how everything works. It takes about two minutes.</div></div>
      <div className="tr-intro-actions"><button className="tr-go" onClick={() => { setIntro(false); base.current = { x: player.x, y: player.y, yaw: CAMERA_VIEW.yaw, mode: CAMERA_VIEW.mode, run: 0 }; }}>Let's go!</button><button className="tr-skip" aria-label="Skip the tutorial" onClick={onSkip}>Skip training</button></div>
    </div>
  );
  if (!step) return null;
  const t = step.id === "hud" ? HUD_TOUR[tour] : null;
  return (
    <>
      {spot && t && <div className="tr-spot" style={{ left: spot.left - 8, top: spot.top - 8, width: spot.width + 16, height: spot.height + 16 }} aria-hidden />}
      {spot && t && <div className="tr-tip" style={{ left: Math.min(window.innerWidth - 290, Math.max(10, spot.left + spot.width / 2 - 140)), top: spot.top > window.innerHeight / 2 ? spot.top - 150 : spot.bottom + 18 }} role="status">
        <b>{t.title}</b><p>{t.text}</p>
        <button onClick={() => (tour < HUD_TOUR.length - 1 ? setTour(tour + 1) : complete("hud"))}>{tour < HUD_TOUR.length - 1 ? "Next ›" : "Got it!"}</button>
      </div>}
      <section key={step.id} className="tr-coach" role="status" aria-live="polite">
        <SkinBust avatar={GUIDE} size={58} className="tr-face" />
        <div className="tr-body">
          <small>HOPE · STEP {i + 1} OF {TRAINING_STEPS.length}</small>
          <h3>{step.title}</h3>
          <p>{step.id === "hud" ? "Follow the spotlight. Tap Next to move on." : step.text}</p>
          {step.keys && <div className="tr-keys" aria-hidden>{step.keys.map((k, n) => <kbd key={k} style={{ animationDelay: `${n * 0.18}s` }} className={k.length > 2 ? "wide" : ""}>{k}</kbd>)}{step.alt && <em>{step.alt}</em>}</div>}
          <div className="tr-progress"><i style={{ width: `${(i / TRAINING_STEPS.length) * 100}%` }} /></div>
        </div>
        <button className="tr-skip-sm" onClick={onSkip}>Skip</button>
      </section>
      {stamp && <div className="tr-stamp" aria-hidden><b>{stamp}</b>{Array.from({ length: 14 }, (_, k) => <i key={k} style={{ ["--a" as string]: `${k * 26}deg`, ["--c" as string]: ["#f2c84b", "#6b3fa0", "#2fa48a", "#e0483e"][k % 4] }} />)}</div>}
    </>
  );
}
