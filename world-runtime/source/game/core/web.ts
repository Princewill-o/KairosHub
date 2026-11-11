/**
 * The phone's web. Kairos Shop delivers anything from the mall to your door.
 * "The Basement" is the dark web: things you shouldn't buy, scams, and a real
 * chance the police come knocking. Purchases there are game abstractions.
 */
export interface DarkListing { id: string; name: string; seller: string; price: number; blurb: string; scam: number; caught: number; stars: number; charge: string; life: Record<string, number> }
export const DARK: DarkListing[] = [
  { id: "phones", name: "“Pre-owned” iPhones, no box", seller: "flip_king", price: 120, blurb: "Don't ask where from.", scam: 0.25, caught: 0.25, stars: 2, charge: "Handling stolen goods", life: { walk: -5 } },
  { id: "designer", name: "Designer trainers (1:1 copies)", seller: "rep_central", price: 80, blurb: "Nobody will know.", scam: 0.3, caught: 0.08, stars: 1, charge: "Buying counterfeit goods", life: { walk: -2 } },
  { id: "id", name: "Fake ID card", seller: "paperboy", price: 200, blurb: "Get into anywhere.", scam: 0.4, caught: 0.35, stars: 2, charge: "Possessing a false identity document", life: { walk: -4 } },
  { id: "answers", name: "Exam answers leak", seller: "gr8des", price: 150, blurb: "Guaranteed A*.", scam: 0.6, caught: 0.2, stars: 1, charge: "Fraud", life: { walk: -4, smarts: -2 } },
  { id: "followers", name: "10,000 followers", seller: "boostr", price: 60, blurb: "Look famous overnight.", scam: 0.5, caught: 0, stars: 0, charge: "", life: { happiness: -2 } },
  { id: "cards", name: "Cloned bank cards", seller: "anon_77", price: 300, blurb: "Pre-loaded. Spend fast.", scam: 0.45, caught: 0.5, stars: 3, charge: "Fraud", life: { walk: -8 } },
  { id: "parcel", name: "Courier job: carry a parcel", seller: "the_man", price: 0, blurb: "Earn £500. No questions.", scam: 0, caught: 0.45, stars: 4, charge: "Possession with intent to supply", life: { walk: -8, money: 500 } },
];
export interface DarkOutcome { text: string; paid: number; stars: number; charge: string; life: Record<string, number> }
export function buyDark(id: string, r = Math.random): DarkOutcome | null {
  const l = DARK.find((x) => x.id === id);
  if (!l) return null;
  if (r() < l.scam) return { text: `You paid ${l.seller}. Nothing ever arrived. The account vanished.`, paid: l.price, stars: 0, charge: "", life: { ...l.life, happiness: -3 } };
  const caught = r() < l.caught;
  return { text: caught ? `It arrived… and so did the police. A Met detective traced the order: ${l.charge}.` : `${l.name}: delivered in a plain brown envelope. You feel watched.`, paid: l.price, stars: caught ? l.stars : 0, charge: caught ? l.charge : "", life: l.life };
}
