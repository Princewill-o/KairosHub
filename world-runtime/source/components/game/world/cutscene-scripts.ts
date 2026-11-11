/**
 * Kairos Life decision cutscenes, staged for what the question is actually
 * about: who is there, where they stand, what they do, what they're holding,
 * a crowd around it, and a few camera cuts (handheld, like footage of the
 * moment). The scene is chosen from the event's id, title and text.
 *
 * Set coordinates: the stage is around the origin, the camera looks from +z.
 */
import type { CutSet } from "./life-cutscene";

export type Prop = "bag" | "phone" | "bottle" | "stick" | "ring" | "bible" | "pills" | "letter" | "mic" | "cards" | "trophy" | "baby" | "camera";
export interface Actor {
  /** "you" is your character at their current age; "npc" a seeded resident. */
  who: "you" | "npc";
  seed?: number;
  at: [number, number];
  face?: [number, number];
  pose?: string;
  /** Walk here starting at `walkAt` seconds, then switch to `then`. */
  walkTo?: [number, number];
  walkAt?: number;
  then?: string;
  prop?: Prop;
  /** A child or a baby (smaller). */
  small?: boolean;
}
export interface Shot { at: number; from: [number, number, number]; look: [number, number, number] }
export interface Script {
  set: CutSet;
  actors: Actor[];
  crowd?: { n: number; area: [number, number, number, number]; pose?: string; face?: [number, number]; seed?: number };
  shots: Shot[];
  mood?: "night" | "warm" | "cold";
}

const S = (at: number, from: [number, number, number], look: [number, number, number]): Shot => ({ at, from, look });
const wide: Shot = S(0, [3.4, 2.6, 6.6], [0, 1, 0]);
const twoShot = (x = 0): Shot => S(0.45, [x + 1.2, 1.7, 3.2], [x, 1.25, 0]);
const closeOnYou: Shot = S(0.75, [0.9, 1.55, 2.2], [0, 1.35, 0.4]);

type Rule = [RegExp, () => Script];
const RULES: Rule[] = [
  [/persecut|stand firm|deny him|mission field/i, () => ({ set: "street", mood: "cold",
    actors: [{ who: "you", at: [0, 0.4], pose: "pray", prop: "bible" }, { who: "npc", seed: 61, at: [-1.4, -0.4], face: [0, 0.4], pose: "punch", prop: "stick" }, { who: "npc", seed: 62, at: [1.4, -0.3], face: [0, 0.4], pose: "talk", prop: "stick" }],
    crowd: { n: 10, area: [-3.4, -2.6, 3.4, -1.2], pose: "talk", face: [0, 0.4], seed: 63 },
    shots: [wide, S(0.4, [-2.2, 1.6, 2.8], [0, 1.2, 0.2]), closeOnYou] })],
  [/fight|punch|payback|revenge|road rage|sort him out|swing/i, () => ({ set: "street", mood: "night",
    actors: [{ who: "you", at: [0.6, 0.4], face: [-0.7, 0.2], pose: "think" }, { who: "npc", seed: 41, at: [-0.7, 0.2], face: [0.6, 0.4], pose: "punch", walkTo: [-0.2, 0.3], walkAt: 0.6, then: "punch" }],
    crowd: { n: 9, area: [-3, -2.4, 3, -0.8], pose: "cheer", face: [0, 0.3], seed: 42 },
    shots: [wide, twoShot(0.2), S(0.75, [-1.8, 1.4, 1.8], [0.4, 1.3, 0.3])] })],
  [/shoplift|nick|stealing|steal|stolen|took|corner shop/i, () => ({ set: "street",
    actors: [{ who: "you", at: [0.2, 0.6], face: [-1, 0], pose: "think" }, { who: "npc", seed: 51, at: [-1, 0.3], face: [0.2, 0.6], pose: "talk", prop: "bag" }, { who: "npc", seed: 52, at: [1.9, -1.2], face: [0, 0.4], pose: "think" }],
    crowd: { n: 6, area: [-3.4, -2.6, 3.4, -1.6], pose: "walk", seed: 53 },
    shots: [wide, S(0.4, [-2.4, 1.5, 2.4], [0, 1.2, 0.4]), closeOnYou] })],
  [/pill|drug|party|vodka|bottle|drink|pub|drunk|plug/i, () => ({ set: "temptation", mood: "night",
    actors: [{ who: "you", at: [0, 0.5], pose: "think" }, { who: "npc", seed: 71, at: [-0.9, 0.3], face: [0, 0.5], pose: "talk", prop: "pills" }, { who: "npc", seed: 72, at: [1.0, 0.2], face: [0, 0.5], pose: "cheer", prop: "bottle" }],
    crowd: { n: 12, area: [-3.4, -2.8, 3.4, -0.9], pose: "cheer", seed: 73 },
    shots: [wide, twoShot(-0.4), closeOnYou] })],
  [/carry a bag|parcel|county|courier|easy money|£300/i, () => ({ set: "temptation", mood: "night",
    actors: [{ who: "you", at: [0.3, 0.5], face: [-0.8, 0.2], pose: "think" }, { who: "npc", seed: 81, at: [-0.8, 0.2], face: [0.3, 0.5], pose: "talk", prop: "bag", walkTo: [-0.3, 0.35], walkAt: 0.8, then: "talk" }, { who: "npc", seed: 82, at: [-2.2, -1.2], face: [0, 0.4], pose: "think" }],
    shots: [wide, twoShot(), S(0.72, [1.6, 1.3, 1.6], [-0.3, 1.1, 0.3])] })],
  [/bet|gambl|jackpot|lottery|odds|loot|chests|crypto|moon/i, () => ({ set: "street", mood: "night",
    actors: [{ who: "you", at: [0, 0.5], pose: "think", prop: "phone" }, { who: "npc", seed: 91, at: [-1.1, 0.1], face: [0, 0.5], pose: "cheer", prop: "cards" }],
    crowd: { n: 5, area: [-3, -2.4, 3, -1.4], pose: "think", seed: 92 },
    shots: [wide, closeOnYou] })],
  [/tarot|stars|cards say|horoscope/i, () => ({ set: "cafe", mood: "night",
    actors: [{ who: "you", at: [0.5, 0.4], face: [-0.5, 0], pose: "sit" }, { who: "npc", seed: 101, at: [-0.6, 0], face: [0.5, 0.4], pose: "sit", prop: "cards" }],
    shots: [wide, twoShot()] })],
  [/sunday|church|invite|excuse|can't come/i, () => ({ set: "street",
    actors: [{ who: "you", at: [0.6, 0.5], face: [-0.6, 0.2], pose: "talk", prop: "bible" }, { who: "npc", seed: 111, at: [-0.6, 0.2], face: [0.6, 0.5], pose: "think" }],
    crowd: { n: 5, area: [-3.4, -2.6, 3.4, -1.6], pose: "walk", seed: 112 },
    shots: [wide, twoShot(), S(0.75, [-1.4, 1.5, 2], [0.6, 1.3, 0.4])] })],
  [/propose|marry|wedding|question|together a long time|date/i, () => ({ set: "park", mood: "warm",
    actors: [{ who: "you", at: [0.4, 0.5], face: [-0.5, 0.2], pose: "sit", prop: "ring" }, { who: "npc", seed: 131, at: [-0.5, 0.2], face: [0.4, 0.5], pose: "cheer" }],
    crowd: { n: 4, area: [-3.2, -2.4, 3.2, -1.6], pose: "walk", seed: 132 },
    shots: [wide, twoShot(), closeOnYou] })],
  [/baby|twins|family\?|children|start a family|pregnan/i, () => ({ set: "home", mood: "warm",
    actors: [{ who: "you", at: [0.4, 0.4], face: [-0.4, 0.2], pose: "cheer", prop: "baby" }, { who: "npc", seed: 141, at: [-0.5, 0.2], face: [0.4, 0.4], pose: "cheer" }, { who: "npc", seed: 142, at: [-1.6, -0.6], face: [0, 0.4], pose: "wave", small: true }],
    shots: [wide, twoShot()] })],
  [/hospital|diagnos|illness|healing|miracle|doctor|lightning|cancer|ill\b/i, () => ({ set: "hospital",
    actors: [{ who: "you", at: [0.2, 0.3], face: [-1, 0], pose: "think" }, { who: "npc", seed: 151, at: [-0.9, 0], face: [0.2, 0.3], pose: "talk", prop: "letter" }, { who: "npc", seed: 152, at: [1.4, -0.8], face: [0, 0.3], pose: "think" }],
    shots: [wide, twoShot(-0.3), closeOnYou] })],
  [/exam|results|school|teacher|class|lesson|homework|university|apprentice/i, () => ({ set: "school",
    actors: [{ who: "you", at: [0, 0.6], face: [0, -2], pose: "think", prop: "letter" }, { who: "npc", seed: 161, at: [0, -1.6], face: [0, 1], pose: "talk" }],
    crowd: { n: 10, area: [-2.8, -0.8, 2.8, 1.6], pose: "sit", face: [0, -2], seed: 162 },
    shots: [S(0, [0, 2.4, 5.2], [0, 1.1, -1]), twoShot(), closeOnYou] })],
  [/boss|manager|colleague|promotion|credit|client|work|job|shift|career|cash in hand/i, () => ({ set: "office",
    actors: [{ who: "you", at: [0.5, 0.4], face: [-0.6, 0], pose: "talk" }, { who: "npc", seed: 171, at: [-0.6, 0], face: [0.5, 0.4], pose: "talk", prop: "letter" }],
    crowd: { n: 6, area: [-3, -2.4, 3, -1.2], pose: "sit", seed: 172 },
    shots: [wide, twoShot(), closeOnYou] })],
  [/debt|rent|letters|final demand|bank|scam|loan|budget|owe/i, () => ({ set: "home", mood: "cold",
    actors: [{ who: "you", at: [0, 0.4], pose: "think", prop: "letter" }, { who: "npc", seed: 181, at: [-1.2, -0.3], face: [0, 0.4], pose: "think" }],
    shots: [wide, closeOnYou] })],
  [/friend|3am|evicted|homeless|addiction|drinking|lonely|tears|crisis/i, () => ({ set: "home", mood: "cold",
    actors: [{ who: "you", at: [0.4, 0.4], face: [-0.4, 0.1], pose: "talk" }, { who: "npc", seed: 191, at: [-0.5, 0.1], face: [0.4, 0.4], pose: "think" }],
    shots: [wide, twoShot(), S(0.75, [-1.5, 1.4, 1.8], [0.4, 1.3, 0.3])] })],
  [/revival|worship|pray|preach|sermon|testify|spirit|faith|bible|jesus|god/i, () => ({ set: "church", mood: "warm",
    actors: [{ who: "you", at: [0, 0.8], face: [0, -2], pose: "pray" }, { who: "npc", seed: 121, at: [0, -1.8], face: [0, 1], pose: "talk", prop: "mic" }],
    crowd: { n: 16, area: [-3.2, -0.6, 3.2, 1.8], pose: "cheer", face: [0, -2], seed: 122 },
    shots: [S(0, [0, 2.2, 5.6], [0, 1.2, -1]), S(0.4, [1.8, 1.6, -0.4], [0, 1.4, -1.8]), closeOnYou] })],
  [/neighbour|food bank|volunteer|serve|drivers|help/i, () => ({ set: "street", mood: "warm",
    actors: [{ who: "you", at: [0.3, 0.4], face: [-0.6, 0], pose: "wave", prop: "bag" }, { who: "npc", seed: 201, at: [-0.7, 0], face: [0.3, 0.4], pose: "cheer" }, { who: "npc", seed: 202, at: [-1.6, -0.6], face: [0.3, 0.4], pose: "wave", small: true }],
    crowd: { n: 6, area: [-3.4, -2.6, 3.4, -1.6], pose: "walk", seed: 203 },
    shots: [wide, twoShot()] })],
  [/tv|camera|viral|famous|followers|video|documentary/i, () => ({ set: "street",
    actors: [{ who: "you", at: [0, 0.5], pose: "talk" }, { who: "npc", seed: 211, at: [-1.2, 1.2], face: [0, 0.5], pose: "think", prop: "camera" }, { who: "npc", seed: 212, at: [1.1, 0.9], face: [0, 0.5], pose: "talk", prop: "mic" }],
    crowd: { n: 8, area: [-3.4, -2.6, 3.4, -1.4], pose: "cheer", face: [0, 0.5], seed: 213 },
    shots: [wide, S(0.4, [-1.2, 1.5, 2.6], [0, 1.4, 0.4]), closeOnYou] })],
  [/fire|burn/i, () => ({ set: "street", mood: "night",
    actors: [{ who: "you", at: [0, 0.6], face: [0, -2], pose: "think" }, { who: "npc", seed: 221, at: [-1, 0.5], face: [0, -2], pose: "think", small: true }],
    crowd: { n: 8, area: [-3.4, -0.2, 3.4, 1.4], pose: "think", face: [0, -2], seed: 222 },
    shots: [wide, closeOnYou] })],
  [/palace|award|honour/i, () => ({ set: "church", mood: "warm",
    actors: [{ who: "you", at: [0, 0], face: [0, -2], pose: "wave", prop: "trophy" }, { who: "npc", seed: 231, at: [0.9, -0.6], face: [0, 0], pose: "cheer" }],
    crowd: { n: 14, area: [-3.2, 0.8, 3.2, 2], pose: "cheer", face: [0, 0], seed: 232 },
    shots: [S(0, [0, 2.2, 5.2], [0, 1.2, 0]), closeOnYou] })],
  [/stolen goods|phones cheap|fake|counterfeit/i, () => ({ set: "temptation", mood: "night",
    actors: [{ who: "you", at: [0.4, 0.5], face: [-0.6, 0.1], pose: "think" }, { who: "npc", seed: 241, at: [-0.6, 0.1], face: [0.4, 0.5], pose: "talk", prop: "phone" }],
    shots: [wide, twoShot()] })],
];

/** The default for a category when nothing more specific matches. */
function fallback(set: CutSet): Script {
  return { set, actors: [{ who: "you", at: [0.4, 0.4], face: [-0.5, 0.1], pose: "think" }, { who: "npc", seed: 31, at: [-0.6, 0.1], face: [0.4, 0.4], pose: "talk" }],
    crowd: { n: 4, area: [-3.2, -2.6, 3.2, -1.6], pose: "walk", seed: 37 }, shots: [wide, twoShot(), closeOnYou] };
}

export function scriptFor(e: { id: string; title?: string; text?: string; category: string }, set: CutSet): Script {
  const hay = `${e.id} ${e.title ?? ""} ${e.text ?? ""}`;
  for (const [re, make] of RULES) if (re.test(hay)) return make();
  return fallback(set);
}
