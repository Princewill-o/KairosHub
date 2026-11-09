"use client";
/**
 * Cinematic gospel conversation: letterboxed cutscene, the person's portrait,
 * typed dialogue, three replies per beat and Scripture for the wise answers.
 * Prayer readiness shapes how open the person becomes.
 */
import { useEffect, useMemo, useState } from "react";

import { LowPolyPortrait } from "./lowpoly-icons";
import {
  SCENARIOS, STAGES, conversationOutcome, currentReadiness, readMinistry, readinessLabel, recordConversation, writeMinistry,
  type Persona,
} from "@/game/core/ministry";

function useTyped(text: string, speed = 18) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(text); return; }
    setShown("");
    let i = 0;
    const t = setInterval(() => { i += 2; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return [shown, shown.length >= text.length, () => setShown(text)] as const;
}

const MOOD: Record<string, string> = { curious: "curious", guarded: "guarded", hurt: "hurting", warm: "warm", challenging: "questioning" };

export function MinistryDialog({ persona, onClose, onDone }: { persona: Persona; onClose: () => void; onDone: (message: string) => void }) {
  const scenario = SCENARIOS[persona.background];
  const save = useMemo(() => readMinistry(localStorage), []);
  const readiness = currentReadiness(save.prayer);
  const prayedForThem = save.prayer.named.includes(persona.name);
  const holySpiritMoment = readiness >= 70 || (readiness >= 45 && prayedForThem);
  const [phase, setPhase] = useState<"intro" | "beat" | "reply" | "spirit" | "end">("intro");
  const [beat, setBeat] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<{ reply: string; scripture?: string; score: number } | null>(null);
  const max = scenario.beats.length * 2;
  const outcome = conversationOutcome(score, max, readiness, prayedForThem);

  const line =
    phase === "intro" ? scenario.opener
      : phase === "beat" ? scenario.beats[beat].says
        : phase === "reply" ? picked?.reply ?? ""
          : phase === "spirit" ? scenario.openHeart
            : outcome.stage === "believer" ? `${persona.name}: "I want to follow Jesus. Will you pray with me?"` : `${persona.name}: "Thanks for talking with me. Can we stay in touch?"`;
  const [typed, complete, skip] = useTyped(line);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);

  const next = () => {
    if (!complete) return skip();
    if (phase === "intro") return setPhase("beat");
    if (phase === "reply") {
      if (beat + 1 < scenario.beats.length) { setBeat(beat + 1); setPhase("beat"); return; }
      return setPhase(holySpiritMoment ? "spirit" : "end");
    }
    if (phase === "spirit") return setPhase("end");
  };
  const finish = (stay: boolean) => {
    const latest = readMinistry(localStorage);
    const stage = stay ? outcome.stage : "heard";
    writeMinistry(localStorage, stay ? recordConversation(latest, persona, stage) : { ...latest, conversations: latest.conversations + 1 });
    const label = STAGES.find((s) => s.id === stage)?.label;
    onDone(stay ? `${persona.name} · ${label}. Check your phone to follow up.` : `You had a conversation with ${persona.name}.`);
    onClose();
  };

  return (
    <div className="km-cutscene" role="dialog" aria-modal="true" aria-label={`Conversation with ${persona.name}`}>
      <div className="km-bar top" />
      <div className="km-stage">
        <aside className="km-hud">
          <span className={`km-pill ${readiness < 20 ? "low" : readiness >= 70 ? "high" : ""}`}>Prayer · {readinessLabel(readiness)} ({readiness})</span>
          {prayedForThem && <span className="km-pill high">You prayed for {persona.name} by name</span>}
          <button className="km-skip" onClick={onClose}>Leave <img src="/world-ui/cartoon/Cross.png" alt="" /></button>
        </aside>
        <div className="km-portrait" aria-hidden="true">
          <div className="km-face"><LowPolyPortrait name={persona.name} mood={phase === "beat" ? scenario.beats[beat].mood : phase === "spirit" || phase === "end" ? "warm" : "curious"} /><i>{MOOD[phase === "beat" ? scenario.beats[beat].mood : phase === "spirit" ? "warm" : "curious"]}</i></div>
        </div>
        <div className="km-box" onClick={next}>
          <small className="km-who">{persona.name} · {scenario.label} · {persona.detail}</small>
          <p className="km-line">{typed}<span className="km-caret" aria-hidden="true" /></p>
          {phase === "reply" && picked?.scripture && complete && <p className="km-scripture">Scripture · {picked.scripture}</p>}
          {phase === "spirit" && complete && <p className="km-scripture">Prayer opened a door. “The Spirit itself beareth witness…” (Romans 8:16)</p>}
          {(phase === "intro" || phase === "reply" || phase === "spirit") && <button className="km-next" onClick={(e) => { e.stopPropagation(); next(); }}>{complete ? "Continue ▸" : "Skip ▸▸"}</button>}
        </div>
        {phase === "beat" && complete && (
          <div className="km-choices">
            {scenario.beats[beat].answers.map((a, i) => (
              <button key={i} onClick={() => { setScore(score + a.score); setPicked(a); setPhase("reply"); }}>
                <i>{i + 1}</i>{a.text}
              </button>
            ))}
          </div>
        )}
        {phase === "end" && complete && (
          <div className="km-end">
            <div className="km-meter"><span>Openness</span><i style={{ width: `${Math.round(outcome.openness * 100)}%` }} /></div>
            <p>{outcome.note}</p>
            <div className="km-choices row">
              <button onClick={() => finish(true)}>Swap numbers & follow up</button>
              <button onClick={() => finish(false)}>Thank them and part ways</button>
            </div>
          </div>
        )}
      </div>
      <div className="km-bar bottom" />
    </div>
  );
}
