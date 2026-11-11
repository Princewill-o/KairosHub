/**
 * Everyday life, Sims-style: hobbies that build skills, careers with
 * promotions, freelance gigs, businesses you own, property you build (from a
 * terrace up to a skyscraper) and clubs. Money comes from and goes to the
 * world wallet (which, offline, is your Kairos Life money).
 */
export type SkillId = "gardening" | "cooking" | "music" | "painting" | "writing" | "fishing" | "fitness" | "handiness" | "programming" | "photography";
export interface Sims {
  skills: Partial<Record<SkillId, number>>; // xp
  career: { id: string; level: number; performance: number } | null;
  businesses: { id: string; opened: number; collected: number; level: number }[];
  properties: { id: string; built: number; collected: number; area: string }[];
  clubs: string[];
  items: Record<string, number>; // harvest, fish, paintings, books…
  log: string[];
}
export const freshSims = (): Sims => ({ skills: {}, career: null, businesses: [], properties: [], clubs: [], items: {}, log: [] });

export const SKILLS: { id: SkillId; name: string; glyph: string; colour: string }[] = [
  { id: "gardening", name: "Gardening", glyph: "leaf", colour: "#3d8a5b" },
  { id: "cooking", name: "Cooking", glyph: "flame", colour: "#e98a1f" },
  { id: "music", name: "Music", glyph: "music", colour: "#d6457a" },
  { id: "painting", name: "Painting", glyph: "star", colour: "#7a5ce6" },
  { id: "writing", name: "Writing", glyph: "book", colour: "#5d6673" },
  { id: "fishing", name: "Fishing", glyph: "wave", colour: "#2f7de1" },
  { id: "fitness", name: "Fitness", glyph: "run", colour: "#43a2e6" },
  { id: "handiness", name: "Handiness", glyph: "gear", colour: "#8a929c" },
  { id: "programming", name: "Programming", glyph: "phone", colour: "#13203a" },
  { id: "photography", name: "Photography", glyph: "camera", colour: "#f08b2e" },
];
export const level = (xp = 0) => Math.min(10, Math.floor(Math.sqrt(xp / 12)));
export const xpFor = (lv: number) => lv * lv * 12;

/** Things you can do for each hobby. Higher skill unlocks better ones. */
export interface Activity { id: string; skill: SkillId; name: string; min: number; xp: number; cost: number; makes?: string; life: Record<string, number>; says: string[] }
export const ACTIVITIES: Activity[] = [
  { id: "plant-veg", skill: "gardening", name: "Plant vegetables", min: 0, xp: 8, cost: 5, makes: "vegetables", life: { happiness: 2 }, says: ["Neat rows of carrots and beans.", "Your tomatoes are coming on nicely."] },
  { id: "grow-flowers", skill: "gardening", name: "Grow flowers", min: 2, xp: 12, cost: 12, makes: "flowers", life: { happiness: 3 }, says: ["Sweet peas climbing the fence.", "Roses the neighbours stop to smell."] },
  { id: "graft", skill: "gardening", name: "Graft a rare plant", min: 6, xp: 25, cost: 40, makes: "rare plant", life: { smarts: 2 }, says: ["A new variety nobody has seen before!", "The graft took. Something strange and beautiful is growing."] },
  { id: "cook-breakfast", skill: "cooking", name: "Cook breakfast", min: 0, xp: 6, cost: 4, life: { health: 2 }, says: ["Eggs, toast, and a proper cup of tea.", "Pancakes. Slightly burnt. Still good."] },
  { id: "cook-dinner", skill: "cooking", name: "Cook a family dinner", min: 2, xp: 12, cost: 15, life: { health: 3, happiness: 3 }, says: ["Jollof that has everyone asking for seconds.", "A Sunday roast with all the trimmings."] },
  { id: "bake", skill: "cooking", name: "Bake for the church cake sale", min: 4, xp: 16, cost: 10, makes: "cakes", life: { fruit: 1, happiness: 2 }, says: ["Your Victoria sponge sold out first.", "Brownies. Gone in minutes."] },
  { id: "secret-recipe", skill: "cooking", name: "Learn a street-stall recipe", min: 7, xp: 28, cost: 30, life: { smarts: 2 }, says: ["The stall owner finally shows you their secret suya spice.", "You've cracked the perfect pho broth."] },
  { id: "guitar", skill: "music", name: "Practise guitar", min: 0, xp: 9, cost: 0, life: { happiness: 2 }, says: ["Your fingers hurt. The chords are getting cleaner.", "You nailed the F barre chord!"] },
  { id: "violin", skill: "music", name: "Practise violin", min: 3, xp: 14, cost: 0, life: { happiness: 2, smarts: 1 }, says: ["It no longer sounds like a cat.", "A hymn, played start to finish."] },
  { id: "worship-team", skill: "music", name: "Play on the worship team", min: 5, xp: 20, cost: 0, life: { walk: 3, fruit: 1 }, says: ["The congregation sings over your playing.", "You led a whole set on Sunday."] },
  { id: "write-song", skill: "music", name: "Write a song", min: 7, xp: 30, cost: 0, makes: "song", life: { happiness: 4 }, says: ["A melody you can't stop humming.", "The worship leader wants to use it."] },
  { id: "paint", skill: "painting", name: "Paint on the easel", min: 0, xp: 10, cost: 8, makes: "painting", life: { happiness: 2 }, says: ["A wobbly landscape. You're proud of it.", "The light on the Thames, almost right."] },
  { id: "pottery", skill: "painting", name: "Throw pottery", min: 2, xp: 12, cost: 10, makes: "pottery", life: { happiness: 2 }, says: ["A bowl. Mostly round.", "A set of mugs for the church kitchen."] },
  { id: "candles", skill: "painting", name: "Make candles", min: 3, xp: 12, cost: 8, makes: "candles", life: { happiness: 1 }, says: ["Lavender candles for the stall.", "They smell like Christmas."] },
  { id: "journal", skill: "writing", name: "Write in your journal", min: 0, xp: 7, cost: 0, life: { walk: 1, happiness: 1 }, says: ["You write down what God did this week.", "Pages of prayers and plans."] },
  { id: "article", skill: "writing", name: "Write an article", min: 3, xp: 14, cost: 0, life: { smarts: 2 }, says: ["The church newsletter prints it.", "A local blog picks it up."] },
  { id: "book", skill: "writing", name: "Write a book", min: 7, xp: 35, cost: 0, makes: "book", life: { smarts: 3, happiness: 4 }, says: ["The final chapter, done.", "A publisher wants to see the manuscript."] },
  { id: "fish-river", skill: "fishing", name: "Fish the river", min: 0, xp: 8, cost: 3, makes: "fish", life: { happiness: 2 }, says: ["A roach. Small, but yours.", "A perch! You hold it up for a photo."] },
  { id: "fish-lake", skill: "fishing", name: "Fish the lake", min: 3, xp: 13, cost: 6, makes: "fish", life: { happiness: 3 }, says: ["A fat carp after two hours.", "A pike nearly pulled you in."] },
  { id: "fish-sea", skill: "fishing", name: "Sea fishing trip", min: 6, xp: 24, cost: 60, makes: "rare fish", life: { happiness: 4 }, says: ["A sea bass off the Kent coast.", "A mackerel shoal, a full cool box."] },
  { id: "jog", skill: "fitness", name: "Go jogging", min: 0, xp: 8, cost: 0, life: { health: 3 }, says: ["5k round the park.", "You didn't stop once!"] },
  { id: "weights", skill: "fitness", name: "Lift weights", min: 2, xp: 11, cost: 4, life: { health: 3 }, says: ["New personal best on the bench.", "Your arms are jelly."] },
  { id: "yoga", skill: "fitness", name: "Stretch and pray", min: 1, xp: 9, cost: 0, life: { health: 2, walk: 1 }, says: ["Slow stretches with a psalm playing.", "Your back thanks you."] },
  { id: "swim", skill: "fitness", name: "Swim laps", min: 3, xp: 13, cost: 5, life: { health: 4 }, says: ["Forty lengths.", "You beat the lad in the next lane."] },
  { id: "fix-plumbing", skill: "handiness", name: "Fix the leaking tap", min: 0, xp: 9, cost: 6, life: { happiness: 1 }, says: ["No more drip. Victory.", "A new washer and it's sorted."] },
  { id: "upgrade", skill: "handiness", name: "Upgrade an appliance", min: 3, xp: 15, cost: 30, life: { happiness: 2 }, says: ["The washing machine now spins quieter.", "You rewired the oven light."] },
  { id: "craft-furniture", skill: "handiness", name: "Build furniture", min: 5, xp: 22, cost: 45, makes: "furniture", life: { happiness: 3 }, says: ["A solid oak table.", "A bookcase for the church library."] },
  { id: "code", skill: "programming", name: "Practise coding", min: 0, xp: 10, cost: 0, life: { smarts: 2 }, says: ["Your first working app.", "You fixed the bug at 1am."] },
  { id: "build-app", skill: "programming", name: "Build an app", min: 5, xp: 26, cost: 0, makes: "app", life: { smarts: 3 }, says: ["A prayer-request app for your church.", "Your app hits 1,000 downloads."] },
  { id: "photo-walk", skill: "photography", name: "Photo walk", min: 0, xp: 8, cost: 0, makes: "photo", life: { happiness: 2 }, says: ["Golden hour at Tower Bridge.", "Rain on Brixton market. Moody."] },
  { id: "photo-event", skill: "photography", name: "Shoot a church event", min: 4, xp: 18, cost: 0, life: { fruit: 1 }, says: ["The baptism photos made people cry.", "The youth night looks incredible."] },
];
/** What things you make sell for. */
export const PRICES: Record<string, number> = { vegetables: 8, flowers: 14, "rare plant": 220, cakes: 18, song: 300, painting: 60, pottery: 25, candles: 12, book: 1500, fish: 10, "rare fish": 120, furniture: 260, app: 900, photo: 20 };

/** Careers: ten levels each; shifts pay and build performance; promotion needs the right skill. */
export interface Career { id: string; name: string; skill: SkillId | null; titles: string[]; pay: number }
export const CAREERS: Career[] = [
  { id: "business", name: "Business", skill: "writing", titles: ["Intern", "Assistant", "Coordinator", "Analyst", "Manager", "Senior manager", "Director", "Vice president", "Managing director", "CEO"], pay: 70 },
  { id: "tech", name: "Tech", skill: "programming", titles: ["IT support", "Junior developer", "Developer", "Senior developer", "Tech lead", "Engineering manager", "Architect", "Head of engineering", "VP engineering", "CTO"], pay: 85 },
  { id: "law", name: "Law", skill: "writing", titles: ["Paralegal", "Trainee solicitor", "Solicitor", "Associate", "Senior associate", "Barrister", "Partner", "Senior partner", "QC", "Judge"], pay: 90 },
  { id: "education", name: "Education", skill: "writing", titles: ["Teaching assistant", "Trainee teacher", "Teacher", "Head of year", "Head of department", "Assistant head", "Deputy head", "Headteacher", "Executive head", "Education director"], pay: 55 },
  { id: "medicine", name: "Medicine", skill: "fitness", titles: ["Healthcare assistant", "Student nurse", "Nurse", "Junior doctor", "Registrar", "GP", "Specialist", "Consultant", "Clinical director", "Chief medical officer"], pay: 95 },
  { id: "culinary", name: "Culinary", skill: "cooking", titles: ["Kitchen porter", "Line cook", "Chef de partie", "Sous chef", "Head chef", "Executive chef", "Restaurant owner", "TV chef", "Michelin chef", "Celebrity chef"], pay: 50 },
  { id: "ministry", name: "Ministry", skill: "music", titles: ["Volunteer", "Youth worker", "Worship leader", "Associate pastor", "Pastor", "Senior pastor", "Branch overseer", "Regional overseer", "Bishop", "Apostle"], pay: 45 },
];
export const careerTitle = (c: Sims["career"]) => (c ? CAREERS.find((x) => x.id === c.id)!.titles[c.level - 1] : "Unemployed");
export const shiftPay = (c: NonNullable<Sims["career"]>) => Math.round(CAREERS.find((x) => x.id === c.id)!.pay * (1 + (c.level - 1) * 0.55) * 8);

/** Freelance gigs: pay scales with your skill. */
export const GIGS: { id: string; skill: SkillId; name: string; min: number; base: number }[] = [
  { id: "logo", skill: "painting", name: "Digital art commission", min: 2, base: 60 },
  { id: "copy", skill: "writing", name: "Write web copy", min: 2, base: 50 },
  { id: "site", skill: "programming", name: "Build a website", min: 3, base: 140 },
  { id: "wedding", skill: "photography", name: "Photograph a wedding", min: 4, base: 180 },
  { id: "session", skill: "music", name: "Session musician", min: 4, base: 120 },
  { id: "repair", skill: "handiness", name: "Handyman job", min: 2, base: 70 },
];
export const gigPay = (base: number, lv: number) => Math.round(base * (1 + lv * 0.35));

/** Businesses you can open. Earnings per game hour; better with the right skill. */
export const BUSINESSES: { id: string; name: string; cost: number; perHour: number; skill: SkillId }[] = [
  { id: "stall", name: "Market stall", cost: 2000, perHour: 6, skill: "cooking" },
  { id: "cafe", name: "Café", cost: 25000, perHour: 40, skill: "cooking" },
  { id: "clothing", name: "Clothing store", cost: 60000, perHour: 85, skill: "painting" },
  { id: "restaurant", name: "Restaurant", cost: 150000, perHour: 210, skill: "cooking" },
  { id: "artspace", name: "Community art space", cost: 40000, perHour: 45, skill: "painting" },
  { id: "studio", name: "Recording studio", cost: 90000, perHour: 120, skill: "music" },
  { id: "agency", name: "Software agency", cost: 200000, perHour: 300, skill: "programming" },
];
/** Property you can buy or build. Floors drive the skyline drawing; rent per game hour. */
export const PROPERTIES: { id: string; name: string; cost: number; perHour: number; floors: number; colour: string }[] = [
  { id: "flat", name: "Studio flat to let", cost: 180000, perHour: 25, floors: 2, colour: "#c9a27a" },
  { id: "terrace", name: "Victorian terrace", cost: 450000, perHour: 60, floors: 3, colour: "#b5523b" },
  { id: "detached", name: "Detached family home", cost: 900000, perHour: 110, floors: 3, colour: "#e8d9b5" },
  { id: "block", name: "Apartment block", cost: 4000000, perHour: 520, floors: 8, colour: "#8a929c" },
  { id: "office", name: "Office building", cost: 18000000, perHour: 2300, floors: 14, colour: "#5f86b5" },
  { id: "tower", name: "Skyscraper", cost: 120000000, perHour: 15000, floors: 30, colour: "#2f4f7a" },
];
export const AREAS = ["Kingston", "Brixton", "Peckham", "Canary Wharf", "Stratford", "Croydon", "Nine Elms", "the City"];

export const CLUBS: { id: string; name: string; perk: string; life: Record<string, number> }[] = [
  { id: "choir", name: "Gospel choir", perk: "+Music, +walk", life: { walk: 2, happiness: 3 } },
  { id: "football", name: "Sunday-league football", perk: "+Fitness, friends", life: { health: 3, happiness: 2 } },
  { id: "books", name: "Book club", perk: "+Writing, +smarts", life: { smarts: 3 } },
  { id: "chess", name: "Chess club", perk: "+smarts", life: { smarts: 3 } },
  { id: "prayer", name: "Prayer group", perk: "+walk, +fruit", life: { walk: 4, fruit: 1 } },
  { id: "running", name: "Running club", perk: "+Fitness", life: { health: 4 } },
  { id: "allotment", name: "Allotment society", perk: "+Gardening", life: { happiness: 3 } },
];

// ── actions (pure) ───────────────────────────────────────────────────────
export interface Result { sims: Sims; money: number; text: string; life: Record<string, number>; ok: boolean }
const fail = (sims: Sims, text: string): Result => ({ sims, money: 0, text, life: {}, ok: false });
const pickOf = <T,>(l: T[], r: () => number) => l[Math.floor(r() * l.length)];
const note = (s: Sims, t: string) => ({ ...s, log: [...s.log, t].slice(-30) });

export function doActivity(s: Sims, id: string, wallet: number, r = Math.random): Result {
  const a = ACTIVITIES.find((x) => x.id === id);
  if (!a) return fail(s, "Nothing to do.");
  if (level(s.skills[a.skill]) < a.min) return fail(s, `You need ${SKILLS.find((k) => k.id === a.skill)!.name} level ${a.min}.`);
  if (wallet < a.cost) return fail(s, "You can't afford the supplies.");
  const before = level(s.skills[a.skill]);
  const skills = { ...s.skills, [a.skill]: (s.skills[a.skill] ?? 0) + a.xp };
  const after = level(skills[a.skill]);
  const items = a.makes ? { ...s.items, [a.makes]: (s.items[a.makes] ?? 0) + 1 } : s.items;
  let text = pickOf(a.says, r);
  if (after > before) text += ` ${SKILLS.find((k) => k.id === a.skill)!.name} is now level ${after}!`;
  return { sims: note({ ...s, skills, items }, text), money: -a.cost, text, life: a.life, ok: true };
}
export function sell(s: Sims, item: string): Result {
  const n = s.items[item] ?? 0;
  if (!n) return fail(s, "Nothing to sell.");
  const money = n * (PRICES[item] ?? 5);
  const items = { ...s.items }; delete items[item];
  return { sims: note({ ...s, items }, `Sold ${n} × ${item}.`), money, text: `You sold ${n} × ${item} for £${money.toLocaleString("en-GB")}.`, life: {}, ok: true };
}
export function joinCareer(s: Sims, id: string): Result {
  const c = CAREERS.find((x) => x.id === id);
  if (!c) return fail(s, "No such career.");
  return { sims: note({ ...s, career: { id, level: 1, performance: 0 } }, `Joined ${c.name}.`), money: 0, text: `You start as ${c.titles[0]} in ${c.name}.`, life: { happiness: 2 }, ok: true };
}
/** Go to work: get paid; performance builds; promotion at 100 if your skill keeps up. */
export function workShift(s: Sims, effort: "hard" | "normal" | "slack", r = Math.random): Result {
  if (!s.career) return fail(s, "You don't have a job.");
  const c = CAREERS.find((x) => x.id === s.career!.id)!;
  const gain = effort === "hard" ? 22 + r() * 14 : effort === "normal" ? 12 + r() * 10 : -8;
  let car = { ...s.career, performance: Math.max(-40, s.career.performance + gain) };
  const pay = shiftPay(car);
  let text = `${c.titles[car.level - 1]} shift done. +£${pay.toLocaleString("en-GB")}.`;
  if (car.performance >= 100 && car.level < 10) {
    const need = car.level - 1;
    if (!c.skill || level(s.skills[c.skill]) >= need) { car = { ...car, level: car.level + 1, performance: 0 }; text += ` PROMOTED to ${c.titles[car.level - 1]}!`; }
    else text += ` You're ready for promotion, but need ${SKILLS.find((k) => k.id === c.skill)!.name} level ${need}.`;
  }
  if (car.performance <= -40) return { sims: note({ ...s, career: null }, "Fired."), money: pay, text: "You've been slacking for too long. You're fired.", life: { happiness: -8 }, ok: true };
  return { sims: note({ ...s, career: car }, text), money: pay, text, life: effort === "hard" ? { health: -1, smarts: 1 } : effort === "slack" ? { walk: -1 } : {}, ok: true };
}
export function freelance(s: Sims, id: string): Result {
  const g = GIGS.find((x) => x.id === id);
  if (!g) return fail(s, "No such gig.");
  const lv = level(s.skills[g.skill]);
  if (lv < g.min) return fail(s, `Clients want ${SKILLS.find((k) => k.id === g.skill)!.name} level ${g.min}+.`);
  const pay = gigPay(g.base, lv);
  const skills = { ...s.skills, [g.skill]: (s.skills[g.skill] ?? 0) + 6 };
  return { sims: note({ ...s, skills }, `${g.name}: £${pay}.`), money: pay, text: `${g.name} delivered. The client paid £${pay.toLocaleString("en-GB")}.`, life: { smarts: 1 }, ok: true };
}
export function openBusiness(s: Sims, id: string, wallet: number, now: number): Result {
  const b = BUSINESSES.find((x) => x.id === id);
  if (!b) return fail(s, "No such business.");
  if (wallet < b.cost) return fail(s, `You need £${b.cost.toLocaleString("en-GB")} to open a ${b.name.toLowerCase()}.`);
  return { sims: note({ ...s, businesses: [...s.businesses, { id, opened: now, collected: now, level: 1 }] }, `Opened ${b.name}.`), money: -b.cost, text: `Your ${b.name.toLowerCase()} is open for business!`, life: { happiness: 6 }, ok: true };
}
export function buildProperty(s: Sims, id: string, wallet: number, now: number, r = Math.random): Result {
  const p = PROPERTIES.find((x) => x.id === id);
  if (!p) return fail(s, "No such property.");
  if (wallet < p.cost) return fail(s, `You need £${p.cost.toLocaleString("en-GB")}.`);
  const area = pickOf(AREAS, r);
  return { sims: note({ ...s, properties: [...s.properties, { id, built: now, collected: now, area }] }, `Built ${p.name} in ${area}.`), money: -p.cost, text: `${p.name} ${p.floors > 6 ? "built" : "bought"} in ${area}. Tenants are moving in.`, life: { happiness: 5 }, ok: true };
}
/** Collect what your businesses and buildings earned since you last collected. */
export function collect(s: Sims, now: number, hourMs: number, skillBoost = true): Result {
  let money = 0;
  const businesses = s.businesses.map((b) => {
    const def = BUSINESSES.find((x) => x.id === b.id)!;
    const hours = Math.min(48, (now - b.collected) / hourMs);
    const boost = skillBoost ? 1 + level(s.skills[def.skill]) * 0.08 : 1;
    money += Math.floor(hours * def.perHour * boost);
    return { ...b, collected: now };
  });
  const properties = s.properties.map((p) => {
    const def = PROPERTIES.find((x) => x.id === p.id)!;
    money += Math.floor(Math.min(48, (now - p.collected) / hourMs) * def.perHour);
    return { ...p, collected: now };
  });
  if (!money) return fail(s, "Nothing to collect yet.");
  return { sims: note({ ...s, businesses, properties }, `Collected £${money}.`), money, text: `You collected £${money.toLocaleString("en-GB")} from your businesses and tenants.`, life: {}, ok: true };
}
export function toggleClub(s: Sims, id: string): Result {
  const c = CLUBS.find((x) => x.id === id);
  if (!c) return fail(s, "No such club.");
  const inIt = s.clubs.includes(id);
  return { sims: { ...s, clubs: inIt ? s.clubs.filter((x) => x !== id) : [...s.clubs, id] }, money: 0, text: inIt ? `You left the ${c.name.toLowerCase()}.` : `You joined the ${c.name.toLowerCase()}! ${c.perk}.`, life: inIt ? {} : c.life, ok: true };
}
export function readSims(store: Pick<Storage, "getItem"> | null): Sims {
  try { const v = JSON.parse(store?.getItem("kairos-sims") ?? "null"); if (v && v.skills) return { ...freshSims(), ...v }; } catch { /* fresh */ }
  return freshSims();
}
export function writeSims(store: Pick<Storage, "setItem"> | null, s: Sims) { try { store?.setItem("kairos-sims", JSON.stringify(s)); } catch { /* storage blocked */ } }
