/**
 * Lucky blocks: rare easter eggs you spot while out in the world (10% chance
 * per search window). Rarer tiers hold bigger outcomes, for better or worse.
 */
export type Tier = "gold" | "diamond" | "emerald" | "obsidian";
export interface Outcome { id: string; title: string; text: string; good: boolean; life: Record<string, unknown>; coins: number }
export const TIERS: { id: Tier; name: string; colour: string; edge: string; weight: number }[] = [
  { id: "gold", name: "Gold Lucky Block", colour: "#f2c84b", edge: "#a87b12", weight: 70 },
  { id: "diamond", name: "Diamond Lucky Block", colour: "#5fd3e6", edge: "#1d7f90", weight: 20 },
  { id: "emerald", name: "Emerald Lucky Block", colour: "#3fcf7a", edge: "#167a3f", weight: 8 },
  { id: "obsidian", name: "Obsidian Lucky Block", colour: "#4a2f6b", edge: "#1a0f2a", weight: 2 },
];
const O = (id: string, title: string, text: string, good: boolean, life: Record<string, unknown>, coins: number): Outcome => ({ id, title, text, good, life, coins });
export const OUTCOMES: Record<Tier, Outcome[]> = {
  gold: [
    O("tenner", "£50 in an old coat", "You found £50 folded in a coat pocket.", true, { money: 50, happiness: 3 }, 50),
    O("voucher", "Free meal voucher", "Dinner's on the house this week.", true, { happiness: 4, health: 1 }, 25),
    O("fine", "Parking fine", "A £100 penalty notice. Ouch.", false, { money: -100, happiness: -3 }, -40),
    O("phone", "Cracked phone", "You dropped it digging the block out. £120 repair.", false, { money: -120 }, -30),
    O("bible", "A family Bible", "An old Bible with your grandparent's notes in the margins.", true, { walk: 4, happiness: 3 }, 20),
  ],
  diamond: [
    O("bonus", "Surprise bonus", "Your work pays a £5,000 bonus.", true, { money: 5000, happiness: 6 }, 500),
    O("career-chef", "Head chef", "A restaurant owner tasted your cooking. You're their new head chef.", true, { career: "Head chef", money: 2000 }, 300),
    O("car", "Won a car", "A raffle ticket you forgot about wins you a car.", true, { car: true, happiness: 6 }, 400),
    O("scammed", "Scammed", "A 'prize' email cost you £4,000.", false, { money: -4000, happiness: -8 }, -300),
    O("laid-off", "Laid off", "Your job's gone, effective today.", false, { job: "lose", happiness: -8 }, -200),
  ],
  emerald: [
    O("career-surgeon", "Medical scholarship", "A full scholarship. You're training to be a surgeon.", true, { career: "Surgeon", smarts: 15, money: 8000 }, 1200),
    O("career-pastor", "The call", "Your church asks you to train as a pastor.", true, { career: "Assistant pastor", walk: 15, fruit: 0 }, 800),
    O("inherit", "Inheritance", "A distant aunt leaves you £60,000.", true, { money: 60000, happiness: 10 }, 2500),
    O("crash", "Investment crash", "Your savings vanished in a market crash.", false, { money: -20000, happiness: -12 }, -1500),
    O("career-footballer", "Signed", "A scout signs you to a league club.", true, { career: "Footballer", health: 8, money: 15000 }, 2000),
  ],
  obsidian: [
    O("millionaire", "Millionaire", "The block holds a winning ticket: £1,000,000. What will you do with it?", true, { money: 1000000, happiness: 20 }, 10000),
    O("broke", "Flat broke", "A business deal collapses and takes everything you own.", false, { money: -999999999, happiness: -25 }, -5000),
    O("career-ceo", "CEO", "A tech company makes you its CEO overnight.", true, { career: "CEO", money: 250000, smarts: 10 }, 6000),
    O("career-pm", "Prime Minister's adviser", "You're appointed a senior adviser in Parliament.", true, { career: "Government adviser", money: 90000, smarts: 8 }, 4000),
  ],
};

/** 10% chance a block turns up in each search window. */
export const FIND_CHANCE = 0.1;
export function rollTier(r = Math.random): Tier {
  let x = r() * TIERS.reduce((t, k) => t + k.weight, 0);
  for (const t of TIERS) { if ((x -= t.weight) < 0) return t.id; }
  return "gold";
}
export function open(tier: Tier, r = Math.random): Outcome {
  const list = OUTCOMES[tier];
  return list[Math.floor(r() * list.length)];
}
