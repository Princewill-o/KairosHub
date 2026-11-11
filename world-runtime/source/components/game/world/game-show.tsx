"use client";
import { useMemo, useState } from "react";
import { LADDER, SAFE, askAudience, buildGame, fiftyFifty, money, prizeFor } from "@/game/core/game-show";
import { SkinBust } from "../skin-bust";
import type { Avatar } from "@/game/core/cosmetics";

const PRESENTER = { graceAppearance: { skin: "#8d5634", hair: "crop", hairColor: "#121212", outfit: "suit", top: "#1d2340", legs: "#1d2340", shoe: "#111111", hat: "none" } } as unknown as Avatar;
const LINES = {
  start: "Welcome to Who Wants to Be a Kairos Millionaire! Fifteen questions from the Word of God stand between you and a million pounds.",
  right: ["That's the right answer!", "Correct! The audience loves it.", "Absolutely right.", "Well done. You know your Bible."],
  safe: "And that's a safe haven. Whatever happens, you leave with at least that.",
  wrong: "Oh no. I'm so sorry, that's the wrong answer.",
  walk: "A wise decision. Proverbs says the prudent see danger and hide themselves.",
  won: "YOU'VE WON A MILLION POUNDS!",
};

/** The studio: presenter, audience, money ladder, lifelines and the hot seat. */
export function GameShow({ avatar, onDone }: { avatar: Avatar; onDone: (won: number) => void }) {
  const qs = useMemo(() => buildGame(), []);
  const [level, setLevel] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [say, setSay] = useState(LINES.start);
  const [hidden, setHidden] = useState<number[]>([]);
  const [votes, setVotes] = useState<number[] | null>(null);
  const [used, setUsed] = useState({ fifty: false, audience: false, phone: false });
  const [end, setEnd] = useState<{ prize: number; how: "wrong" | "walk" | "won" } | null>(null);
  const q = qs[level];
  const lockIn = () => {
    if (picked == null || locked) return;
    setLocked(true); setSay("Final answer… Let's see.");
    setTimeout(() => {
      if (picked === q.answer) {
        if (level === 14) { setEnd({ prize: LADDER[14], how: "won" }); setSay(LINES.won); return; }
        setSay(SAFE.includes(level) ? `${LINES.safe}` : LINES.right[level % LINES.right.length]);
        setTimeout(() => { setLevel(level + 1); setPicked(null); setLocked(false); setHidden([]); setVotes(null); }, 1400);
      } else { const prize = prizeFor(level, "wrong"); setEnd({ prize, how: "wrong" }); setSay(`${LINES.wrong} The answer was ${q.options[q.answer]} (${q.ref}).`); }
    }, 1600);
  };
  return (
    <div className="gs-studio" role="dialog" aria-modal="true" aria-label="Who Wants to Be a Kairos Millionaire">
      <div className="gs-lights" aria-hidden />
      <div className="gs-audience" aria-hidden>
        {Array.from({ length: 36 }, (_, i) => <span key={i} className={`gs-fan${end?.how === "won" || (locked && picked === q?.answer) ? " gs-cheer" : ""}`} style={{ ["--d" as string]: `${(i * 37) % 9 / 10}s`, ["--c" as string]: ["#e2556b", "#43a2e6", "#f2c84b", "#3fcf7a", "#d26aa8", "#f08b2e"][i % 6] }} />)}
      </div>
      <aside className="gs-ladder" aria-label="Money ladder">
        {[...LADDER].reverse().map((m, ri) => { const i = 14 - ri; return <span key={m} className={`${i === level ? "gs-now" : ""}${SAFE.includes(i) ? " gs-safe" : ""}${i < level ? " gs-done" : ""}`}>{i + 1} · {money(m)}</span>; })}
      </aside>
      <section className="gs-stage">
        <div className="gs-host">
          <div className="gs-face"><SkinBust avatar={PRESENTER} size={64} /></div>
          <p className="gs-say" aria-live="polite"><b>Presenter</b> {say}</p>
          <div className="gs-face gs-you"><SkinBust avatar={avatar} size={64} /></div>
        </div>
        {!end ? (
          <>
            <p className="gs-q"><small>Question {level + 1} for {money(LADDER[level])}</small>{q.q}</p>
            <div className="gs-answers">
              {q.options.map((o, i) => (
                <button key={i} disabled={hidden.includes(i) || locked} onClick={() => setPicked(i)} data-state={locked && i === q.answer && picked === q.answer ? "right" : locked && i === picked ? "locked" : picked === i ? "picked" : ""}>
                  <b>{"ABCD"[i]}:</b> {hidden.includes(i) ? "" : o}{votes && <em>{votes[i]}%</em>}
                </button>
              ))}
            </div>
            <div className="gs-bar">
              <button disabled={used.fifty || locked} onClick={() => { setUsed({ ...used, fifty: true }); setHidden(fiftyFifty(q)); setSay("Computer, take away two wrong answers."); }}>50:50</button>
              <button disabled={used.audience || locked} onClick={() => { setUsed({ ...used, audience: true }); setVotes(askAudience(q, level)); setSay("Audience, keypads ready. Vote now!"); }}>Ask the audience</button>
              <button disabled={used.phone || locked} onClick={() => { setUsed({ ...used, phone: true }); const sure = Math.random() < Math.max(0.35, 0.95 - level * 0.05); setSay(`Your pastor on the phone: “${sure ? `I'm pretty sure it's ${q.options[q.answer]}.` : `I think it might be ${q.options[(q.answer + 1) % 4]}… but don't hold me to it.`}”`); }}>Phone your pastor</button>
              <button disabled={locked} onClick={() => { const prize = prizeFor(level, "walk"); setEnd({ prize, how: "walk" }); setSay(LINES.walk); }}>Walk away with {money(level ? LADDER[level - 1] : 0)}</button>
              <button className="gs-final" disabled={picked == null || locked} onClick={lockIn}>Final answer</button>
            </div>
          </>
        ) : (
          <div className="gs-end" data-how={end.how}>
            <h2>{end.how === "won" ? "Kairos Millionaire!" : end.how === "walk" ? "You walked away" : "Game over"}</h2>
            <p>You leave with <b>{money(end.prize)}</b>.</p>
            <button onClick={() => onDone(end.prize)}>Leave the studio</button>
          </div>
        )}
      </section>
    </div>
  );
}
