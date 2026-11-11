"use client";
/**
 * From arrest to sentence: the prosecution's deal, then (if you turn it down)
 * the judge, where you plead your case. Fictional game rules (game/core/justice).
 */
import { Gavel, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { type Argument, type Case, acquitChance, fullSentence, judge, offerDeal } from "@/game/core/justice";

export interface Outcome { verdict: "acquitted" | "guilty"; fraction: number; deal: "caution" | "community" | "reduced" | null; judge: string }

const ARGUMENTS: { id: Argument; title: string; line: string }[] = [
  { id: "remorse", title: "Tell the truth", line: "“I did it. I'm sorry, and I want to make it right.”" },
  { id: "character", title: "Let my life speak", line: "“Ask the people who know me: my church, my work, my family.”" },
  { id: "deny", title: "Deny it", line: "“It wasn't me. They've got the wrong person.”" },
];

export function JusticeDialog({ c, unit, onDone }: { c: Case; unit: (fraction: number) => string; onDone: (o: Outcome) => void }) {
  const deal = useMemo(() => offerDeal(c), [c]);
  const [stage, setStage] = useState<"deal" | "case" | "deciding" | "verdict">("deal");
  const [result, setResult] = useState<Outcome | null>(null);
  const conductWord = c.conduct > 0.4 ? "Good: people speak well of you" : c.conduct > 0 ? "Mixed, mostly decent" : c.conduct > -0.4 ? "Patchy" : "Poor: a pattern of wrongdoing";
  const plead = (a: Argument) => {
    setStage("deciding");
    setTimeout(() => {
      const v = judge(c, a, Math.random());
      setResult({ verdict: v.verdict, fraction: v.fraction, deal: null, judge: v.judge });
      setStage("verdict");
    }, 2400);
  };
  return (
    <div className="kj-backdrop">
      <section role="dialog" aria-modal="true" aria-label="Your case" className="kj-card">
        <p className="kj-eyebrow"><Scale className="size-4" aria-hidden /> Crown Court · {stage === "deal" ? "Before the hearing" : "The hearing"}</p>
        <h2 className="kj-title">{c.charge}</h2>
        <dl className="kj-facts">
          <div><dt>Evidence</dt><dd>{"★".repeat(c.stars)}{"☆".repeat(5 - c.stars)}</dd></div>
          <div><dt>Record</dt><dd>{c.priors ? `${c.priors} earlier conviction${c.priors > 1 ? "s" : ""}` : "None"}</dd></div>
          <div><dt>Conduct</dt><dd>{conductWord}</dd></div>
          <div><dt>Full sentence</dt><dd>{unit(1)}</dd></div>
        </dl>
        {stage === "deal" && (
          <div className="kj-stage">
            <p className="kj-who">The prosecutor leans over before you go in:</p>
            <blockquote className="kj-offer">{deal.text}</blockquote>
            <div className="kj-row">
              <button type="button" className="kj-primary" onClick={() => onDone({ verdict: "guilty", fraction: deal.fraction, deal: deal.kind, judge: "You took the deal." })}>Take the deal{deal.fraction ? ` · ${unit(deal.fraction)}` : " · caution"}</button>
              <button type="button" className="kj-ghost" onClick={() => setStage("case")}>Go before the judge</button>
            </div>
          </div>
        )}
        {stage === "case" && (
          <div className="kj-stage">
            <p className="kj-who">“The defendant may address the court.”</p>
            <div className="kj-args">
              {ARGUMENTS.map((a) => (
                <button key={a.id} type="button" className="kj-arg" onClick={() => plead(a.id)}>
                  <b>{a.title}</b><span>{a.line}</span>
                  <small>{a.id === "remorse" ? "Guilty, but with mercy" : `${Math.round(acquitChance(c, a.id) * 100)}% chance of walking free`}</small>
                </button>
              ))}
            </div>
          </div>
        )}
        {stage === "deciding" && <p className="kj-deciding"><Gavel className="kj-gavel size-7" aria-hidden /> The judge is considering…</p>}
        {stage === "verdict" && result && (
          <div className="kj-stage">
            <p className={result.verdict === "acquitted" ? "kj-free" : "kj-guilty"}>{result.verdict === "acquitted" ? "Not guilty" : `Guilty · ${unit(result.fraction)}`}</p>
            <p className="kj-judge">“{result.judge}”</p>
            <button type="button" className="kj-primary" onClick={() => onDone(result)}>{result.verdict === "acquitted" ? "Leave the court" : "Go down"}</button>
          </div>
        )}
        <p className="kj-note">A fictional game scenario. Honesty and a changed life count here.</p>
      </section>
    </div>
  );
}
export { fullSentence };
