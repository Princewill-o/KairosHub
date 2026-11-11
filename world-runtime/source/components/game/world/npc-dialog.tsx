"use client";
/** A conversation with a resident: their line types out, you choose, they answer. */
import { useEffect, useState } from "react";
import type { Choice, Encounter } from "@/game/core/npc-encounters";

const ROLE: Record<string, string> = { family: "Family", officer: "Police officer", child: "Local kid", teen: "Teenager", elder: "Neighbour", worker: "Local worker", need: "Someone in need", seeker: "Passer-by", church: "From Kharis Church", neighbour: "Neighbour", inmate: "Inmate", guard: "Prison officer", tourist: "Visitor" };

export function NpcDialog({ e, onChoose, onClose }: { e: Encounter; onChoose: (c: Choice) => void; onClose: () => void }) {
  const [shown, setShown] = useState(0);
  const [picked, setPicked] = useState<Choice | null>(null);
  const text = picked ? picked.reply : e.line;
  useEffect(() => { setShown(0); }, [text]);
  useEffect(() => {
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + 2)), 28);
    return () => clearTimeout(t);
  }, [shown, text]);
  const done = shown >= text.length;
  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
      const n = Number(ev.key);
      if (!picked && done && n >= 1 && n <= e.choices.length) { const c = e.choices[n - 1]; setPicked(c); onChoose(c); }
      else if (!done && (ev.key === " " || ev.key === "Enter")) setShown(text.length);
    };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [onClose, onChoose, picked, done, e.choices, text.length]);
  return (
    <section role="dialog" aria-label={`Talking with ${e.who.name}`} className="kn-dialog" onPointerDown={(ev) => ev.stopPropagation()}>
      <header><b>{e.who.name}</b><span>{ROLE[e.who.role] ?? "Resident"}</span><button type="button" aria-label="End conversation" onClick={onClose}>×</button></header>
      <p className="kn-line" aria-live="polite">{text.slice(0, shown)}{!done && <i className="kn-caret" aria-hidden>▌</i>}</p>
      {!picked && done && <div className="kn-choices">{e.choices.map((c, i) => <button key={c.label} type="button" onClick={() => { setPicked(c); onChoose(c); }}><kbd>{i + 1}</kbd>{c.label}</button>)}</div>}
      {picked && done && <button type="button" className="kn-done" onClick={onClose}>Carry on</button>}
    </section>
  );
}
