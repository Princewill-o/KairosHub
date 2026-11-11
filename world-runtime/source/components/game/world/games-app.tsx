/**
 * Phone Games app: every online Kairos game playable inside the phone itself. The hub's
 * solo games run in an embedded frame (the phone turns landscape for them), Scripture
 * challenges play natively, and the live games (Game Show, LTBS story map) launch from here.
 */
import { useEffect, useState } from "react";
import { SCRIPTURE_CHALLENGES } from "@/game/core/ltbs-challenges";
import { readStorySave } from "@/game/core/ltbs-stories";
import { Challenge } from "./ltbs-hub";

/** The Bible game library (public/bible), played inside the phone. */
export const ONLINE_GAMES = [
  { id: "trivia", title: "Bible Trivia", tag: "Knowledge", goal: "How much do you remember? Type each answer yourself.", color: "#dccbfa" },
  { id: "quiz", title: "Bible Quiz", tag: "Knowledge", goal: "Start with stories you know, then take on harder questions.", color: "#ffe3a3" },
  { id: "word-search", title: "Bible Word Search", tag: "Puzzles", goal: "Drag across the letters, or tap the first and last letter.", color: "#c6ebd3" },
  { id: "crossword", title: "Bible Crossword", tag: "Puzzles", goal: "Six Bible names that cross over each other.", color: "#c9e4fa" },
  { id: "charades", title: "Bible Charades", tag: "Together", goal: "One person acts a Bible story without words. Everyone else guesses.", color: "#ffd7b5" },
  { id: "memory", title: "Bible Memory Game", tag: "Puzzles", goal: "Flip two cards at a time and match the Bible names.", color: "#dccbfa" },
  { id: "verse", title: "Bible Verse Guessing", tag: "Knowledge", goal: "Read a verse and choose where it comes from.", color: "#c9e4fa" },
  { id: "jeopardy", title: "Bible Jeopardy", tag: "Knowledge", goal: "Three topics, nine clues. Harder clues win more points.", color: "#ffe3a3" },
  { id: "pictionary", title: "Bible Pictionary", tag: "Together", goal: "Draw a secret Bible story while your team guesses.", color: "#c6ebd3" },
  { id: "hangman", title: "Bible Hangman", tag: "Puzzles", goal: "Guess the letters of a Bible name before your six hearts run out.", color: "#ffd7b5" },
  { id: "bingo", title: "Bible Bingo", tag: "Puzzles", goal: "Read each clue and find its answer on your board.", color: "#c9e4fa" },
  { id: "scavenger", title: "Bible Scavenger Hunt", tag: "Explore", goal: "Look up five verses to find the hidden answers.", color: "#ffe3a3" },
  { id: "character", title: "Bible Character Guessing", tag: "Knowledge", goal: "Read the clues one by one. Guess early for more points.", color: "#dccbfa" },
  { id: "ordering", title: "Bible Story Ordering", tag: "Explore", goal: "Move the events into the right order, from beginning to end.", color: "#c6ebd3" },
  { id: "map", title: "Bible Map Games", tag: "Explore", goal: "Find famous Bible places on a map of the Bible world.", color: "#c9e4fa" },
  { id: "escape", title: "Bible Escape Room", tag: "Explore", goal: "Solve four Bible puzzles to escape a make-believe library.", color: "#ffd7b5" }
] as const;

type Tab = "online" | "scripture" | "live";

export function GamesApp({ onWide }: { onWide?: (wide: boolean) => void }) {
  const [tab, setTab] = useState<Tab>("online");
  const [playing, setPlaying] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [done, setDone] = useState(() => readStorySave().completed);
  useEffect(() => { onWide?.(!!playing); return () => onWide?.(false); }, [playing, onWide]);

  if (playing) {
    const g = ONLINE_GAMES.find((x) => x.id === playing)!;
    return (
      <div className="gm-play">
        <header><button onClick={() => setPlaying(null)}>‹ Games</button><b>{g.title}</b><span>{g.tag}</span></header>
        <iframe title={g.title} src={`/?grace=1#bible/${g.id}`} allow="autoplay; fullscreen" />
      </div>
    );
  }
  const c = SCRIPTURE_CHALLENGES.find((x) => x.id === challenge);
  if (c) return (
    <div className="gm-native">
      <Challenge key={c.id} game={c} onExit={() => { setChallenge(null); setDone(readStorySave().completed); }} onAward={(id, amount) => window.dispatchEvent(new CustomEvent("kairos-challenge-award", { detail: { id, amount } }))} />
    </div>
  );

  return (
    <div className="gm-app">
      <h2>Games</h2>
      <p className="gm-sub">Play right here on your phone. Grace you earn goes to your wallet.</p>
      <nav className="gm-tabs" role="tablist">
        {([["online", "Online"], ["scripture", "Scripture"], ["live", "Live"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>
      {tab === "online" && <ul className="gm-list">{ONLINE_GAMES.map((g, i) => (
        <li key={g.id}><button onClick={() => setPlaying(g.id)}>
          <i style={{ background: g.color }}>{String(i + 1).padStart(2, "0")}</i>
          <span><b>{g.title}</b><small>{g.goal}</small></span><em>{g.tag}</em>
        </button></li>))}</ul>}
      {tab === "scripture" && <ul className="gm-list">{SCRIPTURE_CHALLENGES.map((g) => {
        const won = !!done[`challenge:${g.id}`];
        return <li key={g.id}><button onClick={() => setChallenge(g.id)}>
          <i style={{ background: won ? "#3d8a5b" : "#6b3fa0" }}>{won ? "OK" : g.type === "quiz" ? "Q" : g.type === "order" ? "1-2" : "A=B"}</i>
          <span><b>{g.title}</b><small>{g.description} · {g.reference}</small></span><em>{won ? "Done" : "+20"}</em>
        </button></li>; })}</ul>}
      {tab === "live" && <ul className="gm-list">
        <li><button onClick={() => window.dispatchEvent(new CustomEvent("kairos-open-gameshow"))}><i style={{ background: "#1d2340" }}>$</i><span><b>Who Wants to Be a Kairos Millionaire</b><small>Fifteen Bible questions, three lifelines.</small></span><em>Live</em></button></li>
        <li><button onClick={() => window.dispatchEvent(new CustomEvent("kairos-open-grace", { detail: "adventures" }))}><i style={{ background: "#c26a2f" }}>LT</i><span><b>LTBS story campaigns</b><small>Walk into the Bible story in the world.</small></span><em>World</em></button></li>
      </ul>}
    </div>
  );
}
