/**
 * Kairos justice: what happens between an arrest and a sentence.
 *
 * Before any hearing the prosecution offers a deal, shaped by how serious the
 * case is (the wanted stars at arrest), your record, and your conduct (in
 * Kairos Life: how you've actually lived). Turn it down and you stand before
 * the judge and plead your case: tell the truth, call on your character, or
 * deny it. The judge weighs the evidence, your record and your honesty.
 * Fictional game rules, written to reward honesty and a changed life.
 */
export type Argument = "remorse" | "character" | "deny";
export interface Case {
  charge: string;
  stars: number;        // 1–5: how strong the evidence and how serious the offence
  priors: number;       // earlier convictions
  conduct: number;      // -1 (a bad record of living) … +1 (a life that speaks for you)
}
export interface Deal { kind: "caution" | "community" | "reduced"; fraction: number; text: string }

/** Full sentence, in "units": the online world turns units into seconds, Kairos Life into months. */
export const fullSentence = (c: Case) => Math.max(1, Math.min(5, c.stars)) * (1 + Math.min(3, c.priors) * 0.25);

export function offerDeal(c: Case): Deal {
  if (c.stars <= 1 && c.priors === 0 && c.conduct > 0.1)
    return { kind: "caution", fraction: 0, text: "Admit it and walk away with a formal caution. No time served." };
  if (c.stars <= 2 && c.conduct > -0.2)
    return { kind: "community", fraction: 0.25, text: "Plead guilty now for community service, a quarter of the full sentence." };
  const fraction = Math.max(0.3, Math.min(0.8, 0.5 + c.priors * 0.1 - c.conduct * 0.15));
  return { kind: "reduced", fraction, text: `Plead guilty now and serve ${Math.round(fraction * 100)}% of the full sentence.` };
}

export interface Verdict { verdict: "acquitted" | "guilty"; fraction: number; judge: string }

/** Chance the judge acquits, given how you plead your case. */
export function acquitChance(c: Case, argument: Argument) {
  const base = Math.max(0.08, 0.6 - c.stars * 0.11 - c.priors * 0.06);
  if (argument === "remorse") return 0; // an honest admission: guilty, but met with mercy
  if (argument === "character") return Math.max(0.03, Math.min(0.85, base + c.conduct * 0.25));
  return Math.max(0.03, Math.min(0.75, base - 0.05));
}

export function judge(c: Case, argument: Argument, roll: number): Verdict {
  if (argument === "remorse")
    return { verdict: "guilty", fraction: Math.max(0.35, 0.7 - c.conduct * 0.2), judge: "You told the truth and owned what you did. The court shows mercy." };
  if (roll < acquitChance(c, argument))
    return { verdict: "acquitted", fraction: 0, judge: argument === "character" ? "The people who know you spoke for you. Not guilty." : "The evidence isn't strong enough. Not guilty." };
  if (argument === "character")
    return { verdict: "guilty", fraction: c.conduct > 0.2 ? 0.85 : 1, judge: c.conduct > 0.2 ? "Your character is real, but so is the evidence. Guilty, with some credit for your record." : "Your record doesn't match the picture you painted. Guilty." };
  return { verdict: "guilty", fraction: 1.25, judge: "You denied what the evidence plainly shows. Guilty, and the sentence reflects it." };
}

/** Conduct from a Kairos Life: faithfulness, fruit and church on one side, convictions and drift on the other. */
export function conductOf(life: { faith?: { walk?: number; fruit?: number; drift?: number }; churchYears?: number; record?: unknown[] } | null | undefined) {
  if (!life) return 0;
  const f = life.faith ?? {};
  const good = (f.walk ?? 0) / 60 + (f.fruit ?? 0) / 80 + Math.min(10, life.churchYears ?? 0) / 20;
  const bad = (f.drift ?? 0) / 15 + (life.record?.length ?? 0) * 0.25;
  return Math.max(-1, Math.min(1, good - bad));
}
