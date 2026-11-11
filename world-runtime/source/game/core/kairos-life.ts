import { TROUBLE_EVENTS, appById, lifeEffect } from "./app-store";
import { SUNDAY_EXCUSES } from "./npc-encounters";
export { SUNDAY_EXCUSES };
// Kairos Life — the offline life mode of Kairos World. Pure rules, no DOM.
// The world drives it: one in-game day is one year, and real world actions (preaching,
// prayer, eating, hiking, church) credit the life through credit().
/* State is plain JSON so it can be saved per player; functions are deliberately loosely typed. */
// All events, jobs and dialogue are original to Kairos. Judgement is a game representation:
// salvation rests on trusting Christ; the life lived is the evidence (Eph 2:8-10, James 2:17, Matt 7:16-21).

export function makeRng(seed = Date.now()) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));
const between = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

/** Old enough to share the gospel on your own: from 13. */
export const PREACH_AGE = 13;

export const STAGES = [
  { id: "baby", label: "Baby", min: 0, max: 2, milestone: "You were born." },
  { id: "child", label: "Child", min: 3, max: 12, milestone: "You're a child now — nursery, then primary school." },
  { id: "teen", label: "Teenager", min: 13, max: 17, milestone: "You became a teenager. Secondary school brings new pressures." },
  { id: "young-adult", label: "Young adult", min: 18, max: 29, milestone: "You're an adult now. Your choices are your own." },
  { id: "adult", label: "Adult", min: 30, max: 64, milestone: "Your thirties begin — responsibility grows." },
  { id: "elder", label: "Elder", min: 65, max: 200, milestone: "You've reached your later years. What will you pass on?" },
];
export const stageFor = (age) => STAGES.find((s) => age >= s.min && age <= s.max) || STAGES[STAGES.length - 1];

export const CITIES = [
  ["london", "London"], ["manchester", "Manchester"], ["birmingham", "Birmingham"], ["leeds", "Leeds"],
  ["bristol", "Bristol"], ["glasgow", "Glasgow"], ["cardiff", "Cardiff"], ["brighton", "Brighton"],
  ["luton", "Luton"], ["coventry", "Coventry"], ["nottingham", "Nottingham"], ["liverpool", "Liverpool"],
  ["chatham", "Chatham"], ["chelmsford", "Chelmsford"], ["croydon", "Croydon"], ["northampton", "Northampton"],
  ["orpington", "Orpington"], ["reading", "Reading"], ["sheffield", "Sheffield"], ["edinburgh", "Edinburgh"],
  ["newcastle", "Newcastle"], ["leicester", "Leicester"], ["southampton", "Southampton"], ["cambridge", "Cambridge"],
  ["oxford", "Oxford"], ["plymouth", "Plymouth"], ["norwich", "Norwich"], ["belfast", "Belfast"],
].map(([id, name]) => ({ id, name }));
/** Kharis branches listed on kharis.org (UK). A new plant goes somewhere not yet reached. */
export const KHARIS_BRANCHES = ["london", "birmingham", "brighton", "bristol", "chatham", "chelmsford", "coventry", "croydon", "luton", "manchester", "northampton", "nottingham", "orpington", "reading"];
export const UNREACHED_CITIES = CITIES.map((c) => c.id).filter((id) => !KHARIS_BRANCHES.includes(id));
export const cityName = (id) => CITIES.find((c) => c.id === id)?.name || id;

const FIRST = {
  male: ["Daniel", "Kwame", "Joshua", "Samuel", "Tunde", "Ethan", "Isaac", "Marcus", "Kofi", "Liam", "Ayo", "Noah", "Caleb", "Reuben", "Femi", "Jamal", "Oliver", "Elijah"],
  female: ["Grace", "Ama", "Esther", "Chloe", "Abena", "Priya", "Ruth", "Hannah", "Zara", "Naomi", "Efua", "Leah", "Mia", "Joy", "Tobi", "Sophie", "Adwoa", "Lydia"],
};
const LAST = ["Mensah", "Okafor", "Smith", "Boateng", "Johnson", "Adeyemi", "Patel", "Williams", "Owusu", "Brown", "Asante", "Taylor", "Okoro", "Evans", "Antwi", "Clarke", "Nwosu", "Hughes"];

export function randomDetails(r = Math.random) {
  const sex = r() < 0.5 ? "male" : "female";
  return { first: pick(r, FIRST[sex]), last: pick(r, LAST), sex, city: pick(r, CITIES).id, christianHome: r() < 0.5 };
}

let uid = 0;
const id = (r) => `${Math.floor(r() * 1e9).toString(36)}${(uid++).toString(36)}`;
const person = (r, relation, age, sex, faith, last) => ({
  id: id(r), relation, name: `${pick(r, FIRST[sex])} ${last}`, sex, age, alive: true, faith, closeness: between(r, 50, 90),
});

export function newLife(opts = {}, r = Math.random) {
  const d = { ...randomDetails(r), ...(opts.random ? {} : Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined && v !== ""))) };
  const home = !!d.christianHome;
  const parentFaith = () => (home ? "christian" : pick(r, ["none", "none", "searching", "other faith"]));
  const family = [person(r, "parent", between(r, 22, 40), "female", parentFaith(), d.last)];
  if (r() > 0.2) family.push(person(r, "parent", between(r, 24, 44), "male", parentFaith(), d.last));
  for (let i = between(r, 0, 2); i > 0; i--) family.push(person(r, "sibling", between(r, 1, 9), r() < 0.5 ? "male" : "female", home ? "christian" : "none", d.last));
  return {
    v: 1, id: id(r), name: { first: d.first, last: d.last }, sex: d.sex, city: CITIES.some((c) => c.id === d.city) ? d.city : "london",
    christianHome: home, age: 0, alive: true,
    health: between(r, 72, 96), happiness: between(r, 70, 90), smarts: between(r, 30, 80), money: 0,
    habits: { exercise: 1, diet: 1, checkups: 1, smoking: 0, drinking: 0 },
    faith: { walk: home ? 15 : 0, witness: 0, fruit: 0, drift: 0 },
    saved: false, savedAge: null, churchYears: 0, servicesThisYear: 0,
    family, partner: null, job: null, education: "none", car: null, contacts: [], branch: null, illness: null,
    log: [{ age: 0, kind: "birth", text: `You were born in ${cityName(d.city)}${home ? " into a Christian home" : ""}.` }],
    recent: [], queue: [], pending: null, ending: null, notice: null, cause: null,
    year: { acts: 0, faith: 0, exercise: 0, diet: 0, checkup: 0, did: {} },
  };
}

// ---------- yearly decisions ----------
const o = (label, effect) => ({ label, effect });
const ev = (id, category, stages, title, text, options, when) => ({ id, category, stages, title, text, options, ...(when ? { when } : {}) });
const KIDS = ["child"], TEEN = ["teen"], YA = ["young-adult"], AD = ["adult"], OLD = ["elder"];
const GROWN = ["young-adult", "adult"], ALLUP = ["child", "teen", "young-adult", "adult", "elder"];

export const EVENTS = [
  // health
  ev("veg", "health", KIDS, "Dinner battle", "There are greens on your plate again.", [o("Eat them", { health: 3, habit: { diet: 1 } }), o("Hide them in a napkin", { health: -2, happiness: 2 })]),
  ev("outdoor", "health", KIDS, "Outside or screens?", "Your friends are playing football in the park.", [o("Go and play", { health: 4, happiness: 3, habit: { exercise: 1 } }), o("Stay on the tablet", { health: -3, smarts: -1 })]),
  ev("sport-team", "health", TEEN, "Trials", "The school team is holding trials.", [o("Try out", { health: 5, happiness: 3, habit: { exercise: 1 } }), o("Not for me", { health: -2 })]),
  ev("sleep", "health", ["teen", "young-adult"], "3am again", "You keep scrolling late into the night.", [o("Phone out of the bedroom", { health: 4, smarts: 2 }), o("One more video", { health: -4, happiness: -2 })]),
  ev("gym", "health", GROWN, "New year, new habits", "A gym near your work offers a cheap membership.", [o("Sign up and go", { health: 6, money: -300, habit: { exercise: 1 } }), o("Maybe next year", { health: -3 })]),
  ev("diet-adult", "health", GROWN, "Takeaway week", "Work has been long. The takeaway app is calling.", [o("Cook something simple", { health: 3, money: 100, habit: { diet: 1 } }), o("Order in every night", { health: -5, money: -400, habit: { diet: -1 } })]),
  ev("screening", "health", ["adult", "elder"], "NHS health check", "A letter invites you for a free health check.", [o("Book it", { health: 4, habit: { checkups: 1 }, illness: "screen" }), o("Ignore the letter", { health: -2, habit: { checkups: -1 } })]),
  ev("chest-pain", "health", ["adult", "elder"], "Tight chest", "You feel a tightness in your chest climbing the stairs.", [o("See a doctor today", { health: 5, illness: "treat" }), o("It'll pass", { health: -10, risk: 0.04 })]),
  ev("fall", "health", OLD, "A wobble", "You nearly fell in the kitchen.", [o("Get a home check and start balance classes", { health: 5, habit: { exercise: 1 } }), o("Carry on as normal", { health: -6, risk: 0.03 })]),
  ev("vaccine", "health", ["baby", "child", "elder"], "Jab day", "Your GP surgery offers this year's vaccinations.", [o("Have them", { health: 4 }), o("Skip", { health: -4, risk: 0.01 })]),
  ev("cycle", "health", ["teen", "young-adult", "adult"], "Cycling to work", "You can cycle the route, but traffic is heavy.", [o("Helmet, lights and the quiet route", { health: 4, habit: { exercise: 1 } }), o("Fast route, no helmet", { health: 1, risk: 0.02 })]),
  // spiritual
  ev("kids-church", "spiritual", KIDS, "Sunday school", "Your Sunday school teacher asks who wants to memorise a verse this week.", [o("Learn John 3:16", { walk: 5, smarts: 1 }), o("Mess about at the back", { walk: -2, happiness: 1 })]),
  ev("child-prayer", "spiritual", KIDS, "Bedtime", "A family member asks if you'd like to pray before bed.", [o("Pray together", { walk: 4, happiness: 2 }), o("Too tired", { walk: -1 })]),
  ev("gospel-teen", "spiritual", ["teen", "young-adult", "adult", "elder"], "The question", "At a youth event, someone explains that Jesus died for your sins and rose again. They ask if you'll trust Him.", [o("Yes — I trust Jesus", { save: true, walk: 20 }), o("I need to think", { walk: 2 }), o("Not interested", { walk: -3 })], (s) => !s.saved),
  ev("child-gospel", "spiritual", KIDS, "Do you believe?", "After a lesson about the cross, your leader asks if you want to follow Jesus.", [o("I want to follow Jesus", { save: true, walk: 15 }), o("Not yet", { walk: 1 })], (s) => !s.saved && s.age >= 6),
  ev("doubt", "spiritual", ["teen", "young-adult"], "Big questions", "A lecturer says faith is for people who don't think.", [o("Read up and talk to your pastor", { walk: 6, smarts: 4 }), o("Quietly stop going to church", { walk: -8, drift: 2 })], (s) => s.saved),
  ev("baptism", "spiritual", ["teen", "young-adult", "adult"], "Baptism Sunday", "The church is holding baptisms next month.", [o("Get baptised", { walk: 10, witness: 3, happiness: 4 }), o("Not this time", { walk: -1 })], (s) => s.saved && !s.baptised),
  ev("small-group", "spiritual", GROWN, "Midweek group", "A friend invites you to a midweek Bible study.", [o("Commit to it", { walk: 6, fruit: 3 }), o("Too busy", { walk: -3 })]),
  ev("serve-team", "spiritual", GROWN, "Serving", "The welcome team needs volunteers on Sundays.", [o("Join the team", { fruit: 6, walk: 3 }), o("Let others do it", { fruit: -1 })]),
  ev("mentor", "spiritual", ["adult", "elder"], "Pass it on", "A new believer asks you to mentor them.", [o("Meet weekly", { fruit: 8, witness: 4 }), o("Point them elsewhere", { fruit: -2 })], (s) => s.saved),
  ev("legacy", "spiritual", OLD, "Your grandchildren", "Your grandchildren ask what you believe and why.", [o("Tell them your story with Jesus", { witness: 8, fruit: 4 }), o("Change the subject", { witness: -2 })]),
  // relationships
  ev("bully", "relationships", ["child", "teen"], "In the playground", "A smaller kid is being picked on.", [o("Stand up for them", { fruit: 4, happiness: -1 }), o("Walk away", { fruit: -2 }), o("Join in", { fruit: -5, walk: -3 })]),
  ev("parents-row", "relationships", ["child", "teen"], "Raised voices", "Your parents are arguing again.", [o("Pray and talk to someone you trust", { walk: 3, happiness: 1 }), o("Bottle it up", { happiness: -6 })]),
  ev("friend-group", "relationships", TEEN, "The group chat", "Your friends are mocking someone in the group chat.", [o("Say it's not okay", { fruit: 4, witness: 2 }), o("Leave the chat", { fruit: 1 }), o("Send a laughing emoji", { fruit: -4 })]),
  ev("meet-someone", "relationships", YA, "Someone special", "You meet someone kind at a friend's wedding.", [o("Get to know them", { partner: "new", happiness: 6 }), o("Focus on yourself for now", { happiness: 1 })], (s) => !s.partner),
  ev("proposal", "relationships", GROWN, "The ring", "You've been together a while. Do you propose?", [o("Pray, seek counsel, then propose", { partner: "marry", happiness: 10 }), o("Not ready", { happiness: -2 })], (s) => s.partner && !s.partner.married),
  ev("baby-news", "relationships", GROWN, "Baby news", "You and your spouse talk about starting a family.", [o("Start a family", { child: true, happiness: 8, money: -2000 }), o("Wait a few years", {})], (s) => s.partner?.married),
  ev("marriage-strain", "relationships", ["adult"], "Distance", "You and your spouse have drifted apart.", [o("Book marriage counselling and pray together", { happiness: 5, walk: 3 }), o("Throw yourself into work", { happiness: -8, money: 1000 })], (s) => s.partner?.married),
  ev("parent-care", "relationships", ["adult"], "Your parent needs help", "An elderly parent is struggling at home.", [o("Visit every week and help out", { fruit: 6, happiness: -1, money: -500 }), o("Leave it to your siblings", { fruit: -4 })]),
  ev("lonely", "relationships", OLD, "Quiet house", "The days feel long and quiet.", [o("Join the church lunch club", { happiness: 8, health: 2 }), o("Stay in", { happiness: -6, health: -3 })]),
  // money
  ev("pocket-money", "money", KIDS, "Pocket money", "You get £5 from a relative.", [o("Save some, give some", { money: 3, fruit: 2 }), o("Sweets!", { health: -1, happiness: 2 })]),
  ev("first-job", "money", TEEN, "Saturday job", "The corner shop needs weekend help.", [o("Take it", { money: 800, smarts: 1 }), o("Not now", {})]),
  ev("student-loan", "money", YA, "Uni or work?", "You can go to university or start an apprenticeship.", [o("University", { smarts: 12, money: -3000, education: "degree" }), o("Apprenticeship", { smarts: 6, money: 4000, education: "apprenticeship" }), o("Straight into work", { money: 2000 })], (s) => s.age === 18),
  ev("tithe", "money", GROWN, "Giving", "Payday. You think about giving to your church.", [o("Give generously", { money: -1500, fruit: 5, walk: 3 }), o("Keep it all", { money: 500, walk: -2 })], (s) => s.saved),
  ev("debt", "money", GROWN, "Buy now, pay later", "A phone you can't afford, on 0% finance.", [o("Wait and save", { money: 200, happiness: -1 }), o("Get it now", { money: -1200, happiness: 3 })]),
  ev("pension", "money", ["adult"], "Retirement savings", "HR asks whether to raise your pension contributions.", [o("Raise them", { money: -800, happiness: 1, pension: 1 }), o("Spend now", { money: 800 })]),
  ev("scam", "money", OLD, "Urgent call", "Someone claiming to be your bank asks for your PIN.", [o("Hang up and ring the bank", { money: 0, smarts: 2 }), o("Give the details", { money: -5000, happiness: -8 })]),
  // work
  ev("homework", "work", KIDS, "Homework", "It's sunny and you have maths homework.", [o("Do it first", { smarts: 4 }), o("Copy a friend's tomorrow", { smarts: -2, fruit: -1 })]),
  ev("exams", "work", TEEN, "GCSEs", "Exams are coming.", [o("Revise properly", { smarts: 8, happiness: -2 }), o("Wing it", { smarts: -3, happiness: 2 })]),
  ev("job-offer", "work", GROWN, "A job offer", "You're offered a job.", [o("Accept", { job: "find" }), o("Hold out for better", { happiness: -1 })], (s) => !s.job),
  ev("promotion", "work", GROWN, "Promotion", "Your manager hints at a promotion — if you work Sundays.", [o("Ask to keep Sundays for church", { walk: 4, money: 500 }), o("Take it, Sundays and all", { money: 4000, walk: -6, drift: 1 })], (s) => s.job),
  ev("faith-at-work", "work", GROWN, "At lunch", "A colleague asks why you seem so calm lately.", [o("Tell them about Jesus", { witness: 5, contact: true }), o("Say 'just a good week'", { witness: -1 })], (s) => s.saved && s.job),
  ev("redundancy", "work", ["adult"], "Redundancy", "Your company is cutting jobs, and yours is one of them.", [o("Pray, update your CV, keep going", { job: "find", walk: 4, happiness: -3 }), o("Despair", { happiness: -12, health: -4, job: "lose" })], (s) => s.job),
  ev("retire", "work", OLD, "Retirement", "Do you retire now?", [o("Retire and serve more", { job: "lose", fruit: 5, happiness: 5 }), o("Keep working", { money: 6000, health: -2 })], (s) => s.job),
  // mind
  ev("imaginary", "mind", KIDS, "Afraid of the dark", "You're scared to sleep alone.", [o("Pray and leave a nightlight on", { happiness: 3, walk: 2 }), o("Hide under the duvet", { happiness: -2 })]),
  ev("anxiety", "mind", ["teen", "young-adult", "adult"], "Racing thoughts", "You feel anxious most days.", [o("Talk to a GP and a trusted Christian", { health: 4, happiness: 6, walk: 2 }), o("Keep it hidden", { happiness: -8, health: -3 })]),
  ev("comparison", "mind", ["teen", "young-adult"], "Everyone else's life", "Social media makes you feel behind everyone.", [o("Take a month off socials", { happiness: 6, walk: 2 }), o("Keep scrolling", { happiness: -5 })]),
  ev("burnout", "mind", ["adult"], "Running on empty", "You're exhausted from work and responsibilities.", [o("Take a real Sabbath rest", { health: 5, happiness: 6, walk: 3 }), o("Push through", { health: -6, happiness: -4 })]),
  ev("grief", "mind", ["adult", "elder"], "Grief", "Someone close to you has died.", [o("Grieve with hope, lean on church", { happiness: 2, walk: 4 }), o("Shut everyone out", { happiness: -10, walk: -3 })]),
  ev("memory", "mind", OLD, "Forgetful", "You keep losing your keys.", [o("Puzzles, walks and a memory check", { smarts: 3, health: 2 }), o("Ignore it", { smarts: -3 })]),
  ev("learn", "mind", ["adult", "elder"], "Something new", "An evening class in your area has spaces.", [o("Sign up", { smarts: 5, happiness: 3 }), o("Not for me", {})]),
];

export const TEMPTATIONS = [
  ev("t-shoplift", "temptation", GROWN, "Self-checkout", "The scanner missed a few things. You could just walk out.", [o("Go back and pay", { fruit: 3, walk: 2 }), o("Walk out", { money: 40, walk: -5, drift: 1, crime: { charge: "Theft from a shop", stars: 2, caught: 0.45 } })]),
  ev("t-joyride", "temptation", ["teen", "young-adult"], "Keys in the ignition", "Your friends dare you to take a parked car for a spin.", [o("Walk away", { walk: 3, fruit: 2 }), o("Get in and drive", { happiness: 3, walk: -6, drift: 1, risk: 0.01, crime: { charge: "Taking a car without consent", stars: 3, caught: 0.55 } })]),
  ev("t-fight", "temptation", ["teen", "young-adult", "adult"], "Outside the chip shop", "Someone shoves you and squares up.", [o("Walk away", { walk: 4, fruit: 3 }), o("Throw the first punch", { health: -4, walk: -5, drift: 1, crime: { charge: "Assault", stars: 3, caught: 0.6 } })]),
  ev("t-lie", "temptation", KIDS, "Broken vase", "You broke something. Nobody saw.", [o("Own up", { walk: 3, fruit: 3 }), o("Blame your sibling", { walk: -4, fruit: -3, drift: 1 })]),
  ev("t-steal", "temptation", ["child", "teen"], "Pick 'n' mix", "Your friends dare you to take sweets without paying.", [o("Refuse", { fruit: 3, walk: 2 }), o("Do it", { walk: -5, drift: 1, crime: { charge: "Shoplifting", stars: 1, caught: 0.35 } })]),
  ev("t-vape", "temptation", TEEN, "Behind the bike sheds", "Someone offers you a vape.", [o("No thanks", { health: 2, walk: 1 }), o("Try it", { health: -6, habit: { smoking: 1 }, drift: 1 })]),
  ev("t-cheat", "temptation", ["teen", "young-adult"], "Exam answers", "Someone is selling the exam answers.", [o("Report it", { fruit: 4, walk: 3 }), o("Buy them", { smarts: -2, walk: -6, drift: 1 })]),
  ev("t-party", "temptation", ["teen", "young-adult"], "The party", "There's a party with heavy drinking on Saturday.", [o("Skip it, see friends another way", { health: 2, walk: 2 }), o("Go and drink with everyone", { health: -6, habit: { drinking: 1 }, walk: -4, drift: 1, risk: 0.01 })]),
  ev("t-porn", "temptation", ["teen", "young-adult", "adult"], "Alone online", "Something you know is wrong is one click away.", [o("Close it, tell an accountability partner", { walk: 5, happiness: 2 }), o("Click", { walk: -8, happiness: -4, drift: 2 })]),
  ev("t-relationship", "temptation", ["young-adult"], "Moving too fast", "Your relationship is crossing lines you'd set before God.", [o("Set boundaries together", { walk: 5 }), o("It's fine, everyone does it", { walk: -8, drift: 2 })], (s) => s.partner),
  ev("t-unequal", "temptation", ["young-adult", "adult"], "Charming but cold", "Someone attractive pursues you but mocks your faith.", [o("Walk away kindly", { walk: 5 }), o("Date them anyway", { walk: -6, drift: 2, partner: "new" })], (s) => s.saved && !s.partner),
  ev("t-greed", "temptation", GROWN, "Fiddle the books", "You could quietly round up your expenses claims.", [o("Be honest", { fruit: 4, walk: 3 }), o("Nobody will notice", { money: 2000, walk: -7, drift: 1, crime: { charge: "Expenses fraud", stars: 3, caught: 0.4 } })]),
  ev("t-affair", "temptation", ["adult"], "A work friendship", "A colleague's attention feels flattering. Your marriage is hard right now.", [o("Keep distance, invest in your marriage", { walk: 6, happiness: 2 }), o("Keep texting late at night", { walk: -10, drift: 3, happiness: -6 })], (s) => s.partner?.married),
  ev("t-gossip", "temptation", ALLUP.filter((x) => x !== "child"), "Have you heard?", "Someone at church wants to share juicy news about another member.", [o("Change the subject", { fruit: 3 }), o("Lean in", { fruit: -4, walk: -3 })]),
  ev("t-bitterness", "temptation", ["adult", "elder"], "An old wound", "Someone who hurt you badly asks for forgiveness.", [o("Forgive, as Christ forgave you", { walk: 8, happiness: 6 }), o("Never", { walk: -6, happiness: -4, drift: 1 })]),
  ev("t-gamble", "temptation", GROWN, "Free bet", "An app offers a free £20 bet.", [o("Delete the app", { money: 0, walk: 1 }), o("Place it, then another", { money: -1500, happiness: -3, drift: 1 })]),
  ev("t-pride", "temptation", ["adult", "elder"], "Praised", "Your ministry is growing and people praise you.", [o("Give God the glory", { walk: 5, fruit: 3 }), o("Start believing your own hype", { walk: -6, drift: 1 })], (s) => s.saved && s.faith.witness > 10),
  ev("t-drink-adult", "temptation", GROWN, "One more", "A glass in the evening has become a bottle.", [o("Cut down, ask for help", { health: 5, habit: { drinking: -1 } }), o("You've earned it", { health: -6, habit: { drinking: 1 }, drift: 1 })], (s) => s.habits.drinking > 0),
  ev("t-smoke-adult", "temptation", GROWN, "Stressful week", "You think about smoking again.", [o("Go for a run instead", { health: 3, habit: { exercise: 1 } }), o("Buy a pack", { health: -8, habit: { smoking: 1 } })]),
];


/** Prison years: the choices you face inside (only while serving a sentence). */
const INSIDE = (s) => (s.prisonUntil || 0) > s.age;
export const PRISON_EVENTS = [
  ev("p-chapel", "spiritual", ["teen", "young-adult", "adult", "elder"], "The prison chapel", "The chaplain runs a Bible study on Thursday nights.", [o("Go every week", { walk: 8, fruit: 3, happiness: 3 }), o("Stay in your cell", { happiness: -3 })], INSIDE),
  ev("p-education", "work", ["teen", "young-adult", "adult"], "Education wing", "You can sit qualifications while you're inside.", [o("Enrol and study", { smarts: 6, happiness: 2 }), o("Not interested", { smarts: -2 })], INSIDE),
  ev("p-gang", "temptation", ["teen", "young-adult", "adult"], "Protection", "A wing gang offers you protection, for a price.", [o("Keep your head down, stay with the chapel lads", { walk: 4, health: -2 }), o("Join them", { walk: -6, drift: 2, health: -4, crime: { charge: "Violence in custody", stars: 2, caught: 0.5 } })], INSIDE),
  ev("p-release", "family", ["young-adult", "adult", "elder"], "Letters home", "Your family write asking how you are.", [o("Write back honestly", { happiness: 5, fruit: 2 }), o("Don't reply", { happiness: -5 })], INSIDE),
];

/** Life issues: when you add a year yourself, one of these lands on top of the year's decision. */
const BABY = ["baby"];
export const ISSUES = [
  ev("i-fever", "health", BABY, "A fever in the night", "You're burning hot and won't settle. Your parents have to decide what to do.", [o("Ring 111 and get you seen", { health: 6 }), o("Wait until morning", { health: -6, risk: 0.01 })]),
  ev("i-jabs", "health", BABY, "Baby jabs", "The surgery sends a reminder for your vaccinations.", [o("Your parents book them", { health: 5 }), o("They let it slide", { health: -5, risk: 0.01 })]),
  ev("i-dedication", "spiritual", BABY, "Baby dedication", "The church offers to pray over you and your parents.", [o("Your parents dedicate you to God", { walk: 6, happiness: 3 }), o("They decide not to", {})]),
  ev("i-sleepless", "relationships", BABY, "Sleepless parents", "Nobody in the house has slept properly for weeks.", [o("Church families bring meals and help", { happiness: 5 }), o("They struggle on alone", { happiness: -4 })]),
  ev("i-broken-arm", "health", ["child", "teen"], "A bad fall", "You fall off a climbing frame and your arm looks wrong.", [o("A&E straight away", { health: 4, happiness: -2 }), o("Hide it from your parents", { health: -10, risk: 0.01 })]),
  ev("i-parents-split", "relationships", ["child", "teen"], "Your parents separate", "Your parents tell you they're separating.", [o("Pray and talk to a youth leader", { walk: 4, happiness: -4 }), o("Blame God and stop praying", { walk: -8, drift: 2, happiness: -8 })]),
  ev("i-mocked", "spiritual", ["child", "teen"], "Laughed at for Jesus", "Your class laughs when they find out you go to church.", [o("Stay kind and keep your faith", { witness: 4, walk: 4, happiness: -2 }), o("Say you don't really believe", { walk: -8, drift: 1 })]),
  ev("i-grades", "work", ["child", "teen"], "Falling behind", "Your report says you're falling behind.", [o("Ask for help and make a plan", { smarts: 6 }), o("Pretend it's fine", { smarts: -5 })]),
  ev("i-new-school", "relationships", KIDS, "A new school", "Your family moves and you start a school where you know nobody.", [o("Say hello to someone sitting alone", { happiness: 4, fruit: 3 }), o("Keep your head down", { happiness: -3 })]),
  ev("i-asthma", "health", KIDS, "Wheezing", "You get breathless running around the playground.", [o("Doctor's check and an inhaler", { health: 6, habit: { checkups: 1 } }), o("Just stop running", { health: -4, habit: { exercise: -1 } })]),
  ev("i-screen", "mind", KIDS, "A phone of your own", "Everyone in your class has a phone with no limits.", [o("Agree family screen rules", { smarts: 3, health: 2 }), o("Secretly stay up on it", { health: -4, smarts: -3 })]),
  ev("i-stranger", "relationships", KIDS, "A stranger online", "Someone you don't know asks you to keep your chat secret.", [o("Tell a parent straight away", { happiness: 2, health: 2 }), o("Keep chatting", { happiness: -6, risk: 0.005 })]),
  ev("i-sibling", "relationships", KIDS, "Sibling war", "You and your sibling haven't spoken for a week.", [o("Say sorry first", { fruit: 4, happiness: 3 }), o("Make it worse", { fruit: -3, happiness: -3 })], (s) => s.family.some((p) => p.relation === "sibling")),
  ev("i-lonely-teen", "mind", TEEN, "No one to sit with", "Your friendship group has quietly moved on without you.", [o("Join the church youth group", { happiness: 6, walk: 3 }), o("Spend every night online", { happiness: -6, health: -2 })]),
  ev("i-rent", "money", GROWN, "Rent goes up", "Your landlord raises the rent by £150 a month.", [o("Budget, pray and move somewhere cheaper", { money: 500, happiness: -2 }), o("Put it on a credit card", { money: -2400, happiness: -3 })]),
  ev("i-sacked", "work", GROWN, "Called into HR", "You're told your job is at risk.", [o("Work with integrity and trust God", { walk: 4, job: "find" }), o("Lie to cover yourself", { walk: -6, drift: 1 })], (s) => s.job),
  ev("i-illness-scare", "health", GROWN.concat(OLD), "A lump", "You notice a lump that wasn't there before.", [o("See the GP this week", { health: 6, illness: "treat", habit: { checkups: 1 } }), o("Ignore it", { health: -8, risk: 0.03 })]),
  ev("i-burnout", "mind", GROWN, "Panic at work", "Your heart races in a meeting and you can't breathe.", [o("Rest, get help and tell your church family", { health: 5, happiness: 6, walk: 2 }), o("Push through alone", { health: -6, happiness: -6 })]),
  ev("i-persecuted", "spiritual", GROWN, "Your faith costs you", "A manager tells you to stop talking about Jesus at work.", [o("Stay faithful and respectful", { walk: 6, witness: 3, happiness: -2 }), o("Hide your faith completely", { walk: -6, witness: -3, drift: 1 })], (s) => s.saved),
  ev("i-prodigal", "relationships", ["adult", "elder"], "A child walks away", "One of your children says they don't believe any more.", [o("Love them, pray daily, keep the door open", { walk: 5, fruit: 4 }), o("Shout at them", { happiness: -8, fruit: -3 })], (s) => s.family.some((p) => p.relation === "child")),
  ev("i-loss", "relationships", ["adult", "elder"], "A funeral", "A close friend dies suddenly.", [o("Grieve with hope in the resurrection", { walk: 4, happiness: -3 }), o("Turn away from God in anger", { walk: -8, drift: 2, happiness: -6 })]),
  ev("i-retire-money", "money", OLD, "Pension shortfall", "Your pension is smaller than you hoped.", [o("Live simply and keep giving", { fruit: 3, happiness: 1 }), o("Gamble to make it back", { money: -3000, drift: 1 })]),
  ev("i-hospital", "health", OLD, "A stay in hospital", "A chest infection puts you in hospital.", [o("Follow the doctors and let church visit", { health: 6, happiness: 4 }), o("Discharge yourself early", { health: -10, risk: 0.04 })]),
  ev("i-dementia-fear", "mind", OLD, "Forgetting names", "You forget your grandchild's name.", [o("Memory clinic and daily Scripture", { smarts: 3, walk: 3 }), o("Hide it from everyone", { smarts: -4, happiness: -4 })]),
  ev("i-doubt-old", "spiritual", ["adult", "elder"], "The long silence", "Prayer has felt silent for months.", [o("Keep praying through the Psalms", { walk: 8 }), o("Quietly give up", { walk: -10, drift: 3 })], (s) => s.saved),
];

// ---------- follow-up & ministry ----------
// ---------- more of life: decisions, temptations and issues ----------
EVENTS.push(
  ev("e-volunteer", "relationships", GROWN, "Food bank", "The food bank is short of drivers on Saturdays.", [o("Sign up for a monthly shift", { fruit: 4, happiness: 3, served: true }), o("Donate a few tins instead", { fruit: 1 }), o("Not my problem", { fruit: -2 })]),
  ev("e-neighbour", "relationships", ALLUP, "New neighbours", "A family has just moved in next door. They look overwhelmed.", [o("Take round something you baked", { fruit: 3, happiness: 2, contact: true }), o("Wave from the window", {}), o("Complain about their van", { fruit: -3 })]),
  ev("e-housing", "money", GROWN, "Rent rise", "Your landlord puts the rent up by a lot.", [o("Budget carefully and pray", { money: -800, walk: 2 }), o("Move somewhere cheaper further out", { money: 400, happiness: -2 }), o("Put it on a credit card", { money: 0, happiness: -4, debt: 2000 })]),
  ev("e-side-hustle", "work", GROWN, "Side hustle", "A friend says you could earn extra on weekends.", [o("Start a small business, keep Sundays free", { money: 2500, smarts: 2 }), o("Work every weekend, church included", { money: 4000, walk: -5, drift: 1 })]),
  ev("e-uni", "school", ["teen", "young-adult"], "After school", "Results day. What next?", [o("University", { smarts: 8, money: -3000, education: "degree" }), o("An apprenticeship", { smarts: 4, money: 1500, job: "find" }), o("Take a gap year serving with a mission", { walk: 8, fruit: 4, witness: 2 })], (s) => s.age >= 17 && s.age <= 19 && s.education !== "degree"),
  ev("e-wedding", "relationships", GROWN, "The question", "You've been together a long time. Is it time?", [o("Propose (and do premarital counselling)", { partner: "marry", happiness: 10, walk: 3 }), o("Move in together without marrying", { walk: -6, drift: 1, happiness: 2 }), o("Wait and pray", { walk: 2 })], (s) => s.partner && !s.partner.married),
  ev("e-baby", "family", ["young-adult", "adult"], "A family?", "You and your spouse talk about children.", [o("Start a family", { child: true, happiness: 8, money: -2000 }), o("Not yet", {})], (s) => s.partner?.married),
  ev("e-friend-crisis", "relationships", ALLUP.filter((x) => x !== "child"), "3am call", "A friend rings you in tears at 3am.", [o("Go round, listen and pray with them", { fruit: 5, health: -1, contact: true }), o("Text 'you'll be fine'", { fruit: -1 })]),
  ev("e-promotion-lie", "work", GROWN, "Credit", "Your manager credits you for a colleague's idea.", [o("Tell them it wasn't yours", { fruit: 4, walk: 3 }), o("Take the credit", { money: 1500, walk: -5, drift: 1 })], (s) => s.job),
  ev("e-hobby", "mind", ALLUP, "Something new", "There's a beginners' class starting at the community centre.", [o("Learn the guitar", { happiness: 5, smarts: 2 }), o("Take up running", { health: 5, habit: { exercise: 1 } }), o("Not for me", {})]),
  ev("e-loan", "money", GROWN, "Lend me some?", "A relative asks to borrow £1,000.", [o("Give it as a gift, no strings", { money: -1000, fruit: 5 }), o("Lend it with a plan", { money: -1000, happiness: -1 }), o("Say no kindly", {})]),
  ev("e-moving", "relationships", GROWN, "A job in another city", "You're offered a job far from your church family.", [o("Move, and find a Kharis church there first", { money: 3000, walk: 1 }), o("Stay where you're planted", { happiness: 2, fruit: 2 })], (s) => s.job),
  ev("e-elder-church", "spiritual", OLD, "Still useful?", "You wonder if you're too old to serve.", [o("Start a prayer group for the young people", { walk: 6, fruit: 5 }), o("Sit at the back and let others do it", { fruit: -2 })]),
  ev("e-school-preach", "spiritual", TEEN, "RE lesson", "Your teacher asks the class what they believe about Jesus.", [o("Say honestly that you follow Him", { walk: 4, contact: true }), o("Say 'I don't know'", { walk: -2 })], (s) => s.saved),
  ev("e-online-fame", "mind", ["teen", "young-adult"], "Going viral", "One of your videos blows up overnight.", [o("Use it to post about your faith", { contact: true, happiness: 3, walk: 2 }), o("Chase more likes, whatever it takes", { happiness: -3, walk: -4, drift: 1 })]),
  ev("e-sabbath", "spiritual", GROWN, "Always busy", "You haven't had a day off in months.", [o("Keep the Lord's day properly", { health: 4, walk: 4, happiness: 3 }), o("Rest is for the weak", { health: -4, happiness: -3 })]),
);
TEMPTATIONS.push(
  ev("t-revenge", "temptation", ["teen", "young-adult", "adult"], "Payback", "Someone spread lies about you. You know a secret that would ruin them.", [o("Leave it with God", { walk: 6, fruit: 3 }), o("Post it", { walk: -6, fruit: -4, drift: 1 })]),
  ev("t-drugs", "temptation", ["teen", "young-adult"], "Just once", "At a friend's flat someone passes round pills.", [o("Leave and text a friend from church", { walk: 5, health: 2 }), o("Take one", { health: -10, walk: -7, drift: 2, risk: 0.015, crime: { charge: "Possession", stars: 1, caught: 0.15 } })]),
  ev("t-county", "temptation", ["teen", "young-adult"], "Easy money", "An older lad offers £300 to carry a bag across town. No questions.", [o("Walk away and tell a youth leader", { walk: 5, fruit: 3 }), o("Carry the bag", { money: 300, walk: -8, drift: 2, crime: { charge: "Possession with intent to supply", stars: 4, caught: 0.5 } })]),
  ev("t-envy", "temptation", GROWN, "Their new car", "Your friend got a promotion and a new car. You feel sick with envy.", [o("Thank God for what you have, congratulate them", { walk: 5, happiness: 3 }), o("Run them down behind their back", { walk: -5, fruit: -3 })]),
  ev("t-lust-media", "temptation", ["teen", "young-adult", "adult"], "The series everyone's watching", "The show everyone's talking about is full of things you know feed the wrong desires.", [o("Skip it", { walk: 4 }), o("Binge the lot", { walk: -5, drift: 1 })]),
  ev("t-skip-church", "temptation", ALLUP.filter((x) => x !== "child"), "Sunday lie-in", "It's raining and church is at 2. Your bed is warm.", [o("Get up and go", { walk: 4, happiness: 2 }), o("Watch it online in bed instead, just this once", { walk: -2, drift: 1 }), o("Skip it altogether", { walk: -5, drift: 1 })]),
  ev("t-anger", "temptation", ["teen", "young-adult", "adult"], "Road rage", "Someone cuts you up and makes a rude gesture.", [o("Breathe and pray for them", { walk: 4 }), o("Chase them and shout", { walk: -4, health: -1, risk: 0.005 })]),
  ev("t-tax", "temptation", ["adult"], "Cash in hand", "A client offers to pay cash so you can skip the tax.", [o("Declare it all", { walk: 4, fruit: 2 }), o("Keep it quiet", { money: 1800, walk: -6, drift: 1, crime: { charge: "Tax evasion", stars: 2, caught: 0.25 } })]),
  ev("t-occult", "temptation", ["teen", "young-adult", "adult"], "Your stars", "A friend wants to read your tarot cards 'just for fun'.", [o("Politely say no and explain why", { walk: 5, contact: true }), o("Go along with it", { walk: -6, drift: 1 })]),
  ev("t-laziness", "temptation", GROWN, "Coasting", "You've been doing the bare minimum at work for weeks.", [o("Work as unto the Lord", { money: 800, walk: 3, smarts: 2 }), o("Nobody notices anyway", { walk: -3, job: "lose" })], (s) => s.job),
  ev("t-lottery", "temptation", GROWN, "Rollover", "The jackpot is £100 million this week.", [o("Give the money to someone in need instead", { fruit: 3, money: -10 }), o("Buy twenty tickets", { money: -40, drift: 1 })]),
  ev("t-compromise", "temptation", ["young-adult", "adult"], "Off the record", "Your boss asks you to tell a client the product is ready when it isn't.", [o("Refuse respectfully", { walk: 6, fruit: 3, happiness: -1 }), o("Say what they want", { walk: -6, drift: 1, money: 500 })], (s) => s.job),
);
ISSUES.push(
  ev("i-debt", "money", GROWN, "Final demand", "Letters are piling up. You owe more than you earn.", [o("Get free debt advice and a budget", { happiness: 4, money: 500, debt: -1500 }), o("Hide the letters", { happiness: -8, health: -2 }), o("Borrow from a loan shark", { money: 2000, happiness: -10, debt: 5000, risk: 0.005 })]),
  ev("i-homeless-friend", "relationships", GROWN, "Nowhere to go", "A friend from church has been evicted.", [o("Let them stay on your sofa", { fruit: 6, happiness: -1 }), o("Help them find a hostel", { fruit: 3 }), o("Stay out of it", { fruit: -3 })]),
  ev("i-infertility", "family", ["young-adult", "adult"], "Waiting", "You and your spouse have been trying for a baby for years.", [o("Keep praying together and lean on church", { walk: 5, happiness: -2 }), o("Blame each other", { happiness: -8 })], (s) => s.partner?.married),
  ev("i-cancer-parent", "family", GROWN, "Bad news", "Your parent has been diagnosed with a serious illness.", [o("Be there at every appointment", { fruit: 5, happiness: -4, money: -500 }), o("Bury yourself in work", { happiness: -6, money: 1000 })]),
  ev("i-cyberbully", "mind", TEEN, "Anonymous messages", "Someone keeps sending you cruel messages online.", [o("Screenshot, block and tell an adult", { happiness: 3, walk: 2 }), o("Reply with worse", { walk: -4, happiness: -4 })]),
  ev("i-exam-fail", "school", ["teen", "young-adult"], "Results", "You failed an important exam.", [o("Resit and get a tutor", { smarts: 6, happiness: -1 }), o("Give up on it", { smarts: -3, happiness: -5 })]),
  ev("i-church-hurt", "spiritual", GROWN, "Hurt by church", "Someone at church treated you badly.", [o("Talk to them and a pastor, and forgive", { walk: 6, fruit: 3 }), o("Leave church altogether", { walk: -10, drift: 3 })], (s) => s.saved),
  ev("i-redundant-mid", "work", ["adult"], "Starting over", "At 50, you have to change careers.", [o("Retrain, trusting God", { smarts: 6, job: "find" }), o("Sink into despair", { happiness: -10, job: "lose" })], (s) => s.job && s.age >= 45 && s.age <= 58),
  ev("i-scam", "money", ["adult", "elder"], "Your bank calling", "Someone claiming to be your bank asks you to move your savings.", [o("Hang up and ring the bank yourself", { smarts: 2 }), o("Do what they say", { money: -6000, happiness: -10 })]),
  ev("i-lonely-old", "mind", OLD, "Quiet house", "Days go by without speaking to anyone.", [o("Join the church lunch club", { happiness: 8, health: 2 }), o("Keep the curtains closed", { happiness: -8, health: -3 })]),
  ev("i-addiction-friend", "relationships", GROWN, "They need help", "A friend admits their drinking is out of control.", [o("Go with them to a recovery group", { fruit: 6, contact: true }), o("Tell them to sort it out", { fruit: -2 })]),
);

/** The closer you walk with God, the harder you're pushed: temptations come more often. */
export const temptPressure = (s) => Math.min(0.75, 0.2 + Math.max(0, s.faith?.walk ?? 0) / 180);




export const FOLLOW_UP = [
  { id: "met", label: "Met", hint: "You shared Jesus with them." },
  { id: "message", label: "Messaged", hint: "Send a kind follow-up message." },
  { id: "call", label: "Called", hint: "Ring them to see how they are." },
  { id: "invite", label: "Invited", hint: "Invite them to Sunday service at 2pm." },
  { id: "pickup", label: "Pick-up booked", hint: "Offer to collect them in your car.", needsCar: true },
  { id: "attended", label: "Came to church", hint: "Bring them to a Sunday service." },
  { id: "believer", label: "Trusted Christ", hint: "Keep praying and talking." },
  { id: "discipled", label: "Being discipled", hint: "Read the Bible together weekly." },
];
const stageIndex = (sid) => FOLLOW_UP.findIndex((f) => f.id === sid);

export const JOBS = [
  { id: "retail", title: "Retail assistant", salary: 19000, smarts: 0 },
  { id: "driver", title: "Bus driver", salary: 30000, smarts: 20 },
  { id: "care", title: "Care worker", salary: 22000, smarts: 10 },
  { id: "electrician", title: "Electrician", salary: 36000, smarts: 35 },
  { id: "teacher", title: "Teacher", salary: 34000, smarts: 50, edu: "degree" },
  { id: "nurse", title: "Nurse", salary: 33000, smarts: 50, edu: "degree" },
  { id: "developer", title: "Software developer", salary: 52000, smarts: 65, edu: "degree" },
  { id: "pastor", title: "Assistant pastor", salary: 28000, smarts: 30, needs: (s) => s.saved && s.faith.walk >= 60 && s.faith.fruit >= 25 },
];
const findJob = (s, r) => {
  const fits = JOBS.filter((j) => s.smarts >= j.smarts && (!j.edu || s.education === j.edu) && (!j.needs || j.needs(s)));
  return fits.length ? { ...pick(r, fits.slice(-3)) } : { ...JOBS[0] };
};
const delete_ = (o, k) => { const c = { ...o }; delete c[k]; return c; };

const A = (id, label, category, minAge, run, extra = {}) => ({ id, label, category, minAge, run, ...extra });
const ACTIONS = [
  A("pray", "Pray", "faith", 3, (s) => { s.faith.walk += 4; s.faith.drift = Math.max(0, s.faith.drift - 1); s.year.faith++; return "You spent time in prayer."; }),
  A("read-bible", "Read the Bible", "faith", 6, (s) => { s.faith.walk += 4; s.smarts += 1; s.year.faith++; return "You read your Bible."; }),
  A("church", "Go to church", "faith", 0, null),
  A("repent", "Turn to Christ", "faith", 5, (s) => {
    if (!s.saved) { s.saved = true; s.savedAge = s.age; s.faith.walk += 25; s.faith.drift = 0; s.year.faith++; return "You turned from sin and trusted Jesus. You are forgiven."; }
    s.faith.walk += 15; s.faith.drift = 0; s.year.faith++; return "You confessed, repented and came home. His mercy is new.";
  }, { labelFor: (s) => (s.saved ? "Repent and return" : "Turn to Christ") }),
  A("fast", "Fast and pray", "faith", 13, (s) => { s.faith.walk += 6; s.health -= 1; s.year.faith++; return "You fasted and sought God."; }),
  A("preach", "Share Jesus with someone", "ministry", PREACH_AGE, (s, r) => {
    s.year.faith++;
    if (!s.saved) return "You can't give away what you haven't received. Consider Jesus for yourself first.";
    // Witness comes from real people: go and find someone in the world.
    s.year.acts--;
    return "Witness grows through real people. Go out, walk up to someone (press F) and choose “Share your faith”.";
  }),
  A("serve", "Serve someone", "ministry", 8, (s, r) => {
    const people = [...s.family.filter((p) => p.alive && p.relation !== "self"), ...s.contacts.filter((c) => c.stage !== "cooled")];
    if (!people.length) return "There's nobody in your life to serve yet. Meet people first.";
    const who = pick(r, people);
    s.served = (s.served || 0) + 1; s.faith.fruit += 4; s.happiness += 2;
    if (who.warmth != null) who.warmth += 8; else if (who.closeness != null) who.closeness = clamp(who.closeness + 5);
    return `You served ${who.name.split(" ")[0]}: ${pick(r, ["cooked them dinner", "helped them move", "fixed their bike", "babysat for them", "took them to an appointment", "cleared their garden"])}.`;
  }),
  A("plant-branch", "Plant a Kharis branch", "ministry", 21, (s, r) => {
    const f = s.faith;
    if (!s.saved || f.walk < 60 || f.witness < 20 || f.fruit < 25) return "Not yet: a branch needs a strong walk (60), witness (20) and fruit (25).";
    if (s.money < 5000) return "You need £5,000 to rent a hall and start.";
    const city = pick(r, UNREACHED_CITIES);
    s.money -= 5000; s.branch = { city, members: 12, founded: s.age };
    f.fruit += 15; f.witness += 10;
    return `You and a small team planted Kharis ${cityName(city)} — the first Kharis church there. Fly or take the train to visit it.`;
  }, { once: (s) => !!s.branch }),
  A("exercise", "Exercise", "health", 5, (s) => { s.year.exercise = 1; s.health += 2; return "You got your heart rate up."; }),
  A("eat-well", "Eat well", "health", 3, (s) => { s.year.diet = 1; s.health += 1; return "You ate properly this year."; }),
  A("checkup", "See the GP", "health", 0, (s) => {
    s.year.checkup = 1;
    if (s.illness && !s.illness.found) { s.illness.found = true; s.illness.treated = true; s.health += 5; return "Your GP caught something early. Treatment has started."; }
    return "Health check: all clear.";
  }),
  A("quit", "Quit smoking and drinking", "health", 12, (s) => { s.habits.smoking = Math.max(0, s.habits.smoking - 2); s.habits.drinking = Math.max(0, s.habits.drinking - 2); s.health += 3; return "You got help to cut down."; }, { show: (s) => s.habits.smoking > 0 || s.habits.drinking > 0 }),
  A("study", "Study hard", "work", 5, (s) => { s.smarts += 4; return "You studied hard."; }, { maxAge: 30 }),
  A("find-job", "Look for work", "work", 16, (s, r) => { s.job = findJob(s, r); return `You got a job: ${s.job.title}.`; }, { show: (s) => !s.job }),
  A("buy-car", "Buy a car (£6,000)", "money", 17, (s, r) => {
    if (s.money < 6000) return "You need £6,000 for a reliable car.";
    s.money -= 6000; s.car = { name: pick(r, ["Hatchback", "Estate", "People carrier"]) }; return `You bought a ${s.car.name.toLowerCase()} — perfect for church pick-ups.`;
  }, { show: (s) => !s.car }),
  A("family-time", "Spend time with family", "relationships", 3, (s) => { s.happiness += 4; s.family.forEach((p) => { if (p.alive) p.closeness = clamp(p.closeness + 4); }); return "You made time for family."; }),
  A("date", "Go on a date", "relationships", 16, (s, r) => { if (s.partner) { s.happiness += 3; return `A lovely evening with ${s.partner.name}.`; } applyEffect(s, { partner: "new" }, r); return `You started seeing ${s.partner.name}.`; }),
];

export function availableActions(s) {
  return ACTIONS.filter((a) => s.age >= a.minAge && (a.maxAge == null || s.age <= a.maxAge) && (!a.show || a.show(s)) && (!a.once || !a.once(s)))
    .map((a) => ({ id: a.id, label: a.labelFor ? a.labelFor(s) : a.label, category: a.category, disabled: !s.alive || !!s.pending || s.year.acts >= 4, reason: s.year.acts >= 4 ? "You've used this year's time. Age up." : s.pending ? "Answer this year's decision first." : "" }));
}

/**
 * Witness and fruit come from real people, not buttons: witness is capped by
 * how many people you've actually shared Jesus with, and fruit by the people
 * you've helped, served and brought along.
 */
export function outreachCaps(s) {
  const contacts = s.contacts || [];
  const reached = contacts.length;
  const brought = contacts.filter((c) => ["attended", "believer", "discipled"].includes(c.stage)).length;
  const saved = contacts.filter((c) => ["believer", "discipled"].includes(c.stage)).length;
  return { reached, brought, witness: reached * 6 + brought * 4, fruit: reached * 3 + brought * 6 + saved * 6 + (s.served || 0) * 3 };
}
const fix = (s) => {
  for (const k of ["health", "happiness", "smarts"]) s[k] = clamp(s[k]);
  for (const k of ["walk", "witness", "fruit"]) s.faith[k] = clamp(s.faith[k]);
  const cap = outreachCaps(s);
  for (const k of ["witness", "fruit"]) if (s.faith[k] > cap[k]) {
    s.faith[k] = cap[k];
    const hint = k === "witness" ? "Witness only grows through people you've actually shared Jesus with. Go and talk to someone." : "Fruit grows from real people: serving them, following them up, bringing them to church.";
    if (s.log && !s.log.some((x) => x.age === s.age && x.text === hint)) s.log.push({ age: s.age, kind: "hint", text: hint });
  }
  s.faith.drift = clamp(s.faith.drift, 0, 20);
  for (const k of Object.keys(s.habits)) s.habits[k] = clamp(s.habits[k], 0, 5);
  s.money = Math.round(s.money);
  return s;
};
const clone = (s) => JSON.parse(JSON.stringify(s));
const say = (s, text, kind = "event") => { s.log.push({ age: s.age, kind, text }); if (s.log.length > 400) s.log.splice(1, s.log.length - 400); };

/** What you do in a year, in the world or from the Life panel. It shapes the next year. */
const ACT_KIND = { pray: "pray", "read-bible": "bible", fast: "fast", preach: "preach", serve: "serve", exercise: "exercise", "eat-well": "eat", checkup: "checkup", "family-time": "family", study: "study", repent: "pray" };
export function tally(s, kind, n = 1) { s.year.did = { ...(s.year.did || {}), [kind]: ((s.year.did || {})[kind] || 0) + n }; return s; }

export function act(s0, actionId, r = Math.random) {
  const a = ACTIONS.find((x) => x.id === actionId);
  const avail = availableActions(s0).find((x) => x.id === actionId);
  if (!a || !avail) return { ...s0, notice: "That isn't available at your age." };
  if (avail.disabled) return { ...s0, notice: avail.reason };
  if (actionId === "church") return attendService(s0, null, r);
  const s = clone(s0);
  s.year.acts++;
  const kind = ACT_KIND[actionId];
  if (kind) tally(s, kind);
  const text = a.run(s, r);
  s.notice = text;
  say(s, text, "action");
  return fix(s);
}

function applyEffect(s, e, r) {
  for (const k of ["health", "happiness", "smarts", "money"]) if (e[k]) s[k] += e[k];
  for (const k of ["walk", "witness", "fruit", "drift"]) if (e[k]) s.faith[k] += e[k];
  for (const [k, v] of Object.entries(e.habit || {})) s.habits[k] += v;
  if (e.save && !s.saved) { s.saved = true; s.savedAge = s.age; say(s, "You put your trust in Jesus.", "milestone"); }
  if (e.education) s.education = e.education;
  if (e.pension) s.pension = (s.pension || 0) + 1;
  if (e.partner === "new") { const sex = s.sex === "male" ? "female" : "male"; s.partner = { name: `${pick(r, FIRST[sex])} ${pick(r, LAST)}`, sex, married: false, faith: r() < 0.6 ? "christian" : "none" }; }
  if (e.partner === "marry" && s.partner) { s.partner.married = true; say(s, `You married ${s.partner.name}.`, "milestone"); }
  if (e.child) { const sex = r() < 0.5 ? "male" : "female"; s.family.push(person(r, "child", 0, sex, s.saved ? "christian" : "none", s.name.last)); say(s, `Your child ${s.family.at(-1).name.split(" ")[0]} was born.`, "milestone"); }
  if (e.job === "find") { s.job = findJob(s, r); say(s, `You started work as a ${s.job.title.toLowerCase()}.`); }
  if (e.job === "lose") s.job = null;
  if (e.illness === "treat" && s.illness) { s.illness.found = true; s.illness.treated = true; }
  if (e.illness === "screen" && s.illness) { s.illness.found = true; s.illness.treated = true; say(s, "Screening caught an illness early. You're being treated."); }
  if (e.contact && s.saved) { const sex = r() < 0.5 ? "male" : "female"; s.contacts.push({ id: id(r), name: `${pick(r, FIRST[sex])} ${pick(r, LAST)}`, stage: "met", warmth: 55, metAge: s.age }); }
  if (e.crime && r() < e.crime.caught) {
    // Caught: the case follows you into the world — the police come for you.
    s.case = { charge: e.crime.charge, stars: e.crime.stars, age: s.age };
    say(s, `You were seen. The police are looking for you over ${e.crime.charge.toLowerCase()}.`, "crime");
  }
  if (e.served) s.served = (s.served || 0) + 1;
  if (e.debt) s.debt = Math.max(0, (s.debt || 0) + e.debt);
  if (e.excuse) {
    const c = s.contacts.find((x) => x.id === e.excuse);
    if (c) { c.warmth += e.warmthGain || 0; if (e.advance && c.stage === "invite") { c.stage = s.car ? "pickup" : "attended"; if (c.stage === "attended") { c.warmth += 10; say(s, `${c.name} came to church on Sunday.`, "milestone"); } } if (e.cool) { c.warmth -= 20; if (c.warmth <= 0) c.stage = "cooled"; } }
  }
  if (e.martyr != null) {
    if (r() < e.martyr) { s.martyr = true; die(s, "persecution for the name of Jesus"); }
    else { s.faith.walk += 15; s.faith.witness += 6; s.happiness -= 6; s.health -= 15; say(s, "You were beaten and thrown out, but you did not deny Him.", "milestone"); }
  }
  if (e.risk && r() < e.risk) die(s, "an accident that precautions could have prevented");
}

/** The court's outcome, written into the life: a record, and prison years if sentenced. */
export function sentenced(s0, { charge, verdict, months }) {
  const s = clone(s0);
  s.case = null;
  if (verdict === "acquitted") { say(s, `Found not guilty of ${charge.toLowerCase()}.`, "court"); return fix(s); }
  s.record = [...(s.record || []), { age: s.age, charge, months }];
  s.happiness -= Math.min(20, 4 + months);
  if (months <= 0) say(s, `Cautioned for ${charge.toLowerCase()}. It stays on your record.`, "court");
  else {
    const years = Math.max(1, Math.round(months / 12));
    s.prisonUntil = Math.max(s.prisonUntil || 0, s.age + years);
    if (s.job) { say(s, `You lost your job as a ${s.job.title.toLowerCase()}.`); s.job = null; }
    say(s, `Sentenced to ${months} months for ${charge.toLowerCase()}. You'll be inside until you're ${s.prisonUntil}.`, "court");
  }
  return fix(s);
}
export const inPrison = (s) => (s.prisonUntil || 0) > s.age;

const toPendingApp = (e, s) => ({ id: e.id, title: e.title, text: `${e.text} (It started on your phone.)`, category: e.category, options: e.options.map((x) => ({ label: x.label, effect: x.effect })) });

/** A road crash: injuries scale with how bad it was; a serious one is fatal. */
export function crashed(s0, { severity, fatal }) {
  if (!s0.alive) return s0;
  const s = clone(s0);
  if (fatal) { die(s, "injuries from a serious road crash"); return s; }
  const hurt = Math.round(5 + severity * 35);
  s.health -= hurt; s.happiness -= Math.round(severity * 10);
  if (s.car && severity > 0.6) { say(s, "Your car was written off.", "warning"); s.car = null; }
  say(s, severity > 0.6 ? `A bad crash: broken bones and a long recovery (health −${hurt}).` : `A crash left you bruised and shaken (health −${hurt}).`, "warning");
  return fix(s);
}

/** A lucky block or a game-show prize changed your life. */
export function windfall(s0, { title, life }, r = Math.random) {
  if (!s0.alive) return s0;
  const s = clone(s0);
  const e = { ...life };
  if (e.money === -999999999) { e.money = -s.money; s.debt = (s.debt || 0) + 5000; }
  const SALARY = { "Head chef": 38000, Surgeon: 95000, "Assistant pastor": 28000, Footballer: 120000, CEO: 400000, "Government adviser": 85000 };
  if (e.career) { s.job = { id: "lucky", title: e.career, salary: SALARY[e.career] || 40000 }; say(s, `New career: ${e.career}.`, "milestone"); delete e.career; }
  if (e.car) { s.car = { name: "Prize car" }; delete e.car; }
  applyEffect(s, e, r);
  say(s, title, "lucky");
  return fix(s);
}

/** You installed or deleted an app on your phone. */
export function phoneChanged(s0, { apps, id: appId, action }, r = Math.random) {
  if (!s0.alive) return s0;
  const s = clone(s0);
  s.apps = [...apps];
  const a = appById(appId);
  if (a) {
    applyEffect(s, lifeEffect(appId, action), r);
    say(s, action === "install" ? `You installed ${a.name}.` : `You deleted ${a.name}.${a.kind === "bad" || a.kind === "trouble" ? " Good riddance." : ""}`, "phone");
  }
  return fix(s);
}

/** Something that happened in the world with another person (a conversation, a kindness, a dare). */
export function encountered(s0, { who, choice, effect }, r = Math.random) {
  const s = clone(s0);
  say(s, `${who}: ${choice}.`, "encounter");
  // A real person in front of you: kindness to them counts as fruit, sharing Jesus as witness.
  if (effect && (effect.fruit || 0) > 0) s.served = (s.served || 0) + 1;
  if (effect && (effect.witness || 0) > 0 && s.saved && !s.contacts.some((c) => c.name === who)) s.contacts.push({ id: id(r), name: who, stage: "met", warmth: 50, metAge: s.age });
  if (effect) applyEffect(s, effect, r);
  return fix(s);
}

export function choose(s0, index, r = Math.random) {
  if (!s0.pending) return s0;
  const s = clone(s0);
  const opt = s.pending.options[index] || s.pending.options[0];
  const { prepared, domain } = s.pending;
  say(s, `${s.pending.title}: ${opt.label}.`, "choice");
  s.pending = null;
  // Last year's habits change how this turns out.
  const e = { ...opt.effect };
  const stat = domain === "faith" ? "walk" : domain === "body" ? "health" : domain ? "happiness" : null;
  const good = stat ? (e[stat] || 0) > 0 && !(e.drift > 0) : false, bad = stat ? (e[stat] || 0) < 0 || e.drift > 0 || !!e.risk : false;
  let why = "";
  if (stat && prepared === true && good) { e[stat] = (e[stat] || 0) + 4; why = domain === "faith" ? "Because you'd been praying, you stood firm — and grew." : domain === "body" ? "Because you'd looked after yourself, you bounced back quickly." : "The people you'd kept close carried you through."; }
  if (stat && prepared === false && bad) { e[stat] = (e[stat] || 0) - 3; if (domain === "faith") e.drift = (e.drift || 0) + 1; if (e.risk) e.risk *= 1.5; why = domain === "faith" ? "With no prayer behind you, it went deeper than you meant." : domain === "body" ? "With nothing in reserve, it hit your health hard." : "With no one close, it was harder to recover."; }
  if (stat && prepared === false && good) why = "You chose well, even though it was hard without the habits behind you.";
  applyEffect(s, e, r);
  s.notice = why || null;
  if (why) say(s, why, "consequence");
  if (s.alive && s.queue?.length) s.pending = s.queue.shift();
  return fix(s);
}

// ---------- health & death ----------
export function mortality(s) {
  const a = s.age;
  let p = a < 1 ? 0.003 : a < 15 ? 0.00015 : a < 30 ? 0.0006 : 0.0006 * Math.exp(0.093 * (a - 30));
  p *= s.health >= 80 ? 0.5 : s.health >= 60 ? 0.85 : s.health >= 40 ? 1.5 : s.health >= 20 ? 2.6 : 4.5;
  p *= 1 + 0.3 * s.habits.smoking + 0.15 * s.habits.drinking;
  if (s.habits.exercise >= 3) p *= 0.75;
  if (a >= 40) p *= s.habits.checkups >= 2 ? 0.75 : s.habits.checkups === 0 ? 1.5 : 1;
  if (s.illness) p *= s.illness.treated ? 1.3 : 3;
  return Math.min(0.95, p);
}
function die(s, cause) {
  if (!s.alive) return;
  s.alive = false; s.cause = cause; s.pending = null;
  say(s, `You died at ${s.age} from ${cause}.`, "death");
  s.ending = judge(s);
}

const n = (d, ...k) => k.reduce((t, x) => t + (d[x] || 0), 0);
const plural = (c, word) => `${word} ${c}×`;
/** A short line for your story: what you did with the year. */
export function reviewText(d, age) {
  const parts = [];
  if (d.pray) parts.push(plural(d.pray, "prayed"));
  if (d.bible) parts.push(plural(d.bible, "read the Bible"));
  if (d.church) parts.push(plural(d.church, "went to church"));
  if (d.preach) parts.push(plural(d.preach, "shared Jesus"));
  if (d.followup) parts.push(plural(d.followup, "followed up"));
  if (d.exercise) parts.push(plural(d.exercise, "exercised"));
  if (d.eat) parts.push(plural(d.eat, "ate well"));
  if (d.checkup) parts.push(plural(d.checkup, "saw the GP"));
  if (d.family) parts.push(plural(d.family, "made time for family"));
  return parts.length ? `Your year at ${age}: you ${parts.join(", ")}.` : `Your year at ${age}: you drifted through it without doing much for your faith, health or family.`;
}
/** Which areas of life you neglected last year (they're likeliest to come up next). */
export function neglected(d, s) {
  const out = [];
  if (n(d, "pray", "bible", "church", "fast") === 0 && (s.saved || s.age >= 8)) out.push("spiritual", "temptation");
  if (n(d, "exercise", "eat", "checkup") === 0 && s.age >= 5) out.push("health");
  if (n(d, "family", "followup") === 0 && s.age >= 16) out.push("relationships");
  return out;
}
const DOMAIN = { spiritual: "faith", temptation: "faith", health: "body", relationships: "people", mind: "mind" };
/** Explain how last year's choices shape this challenge, and remember whether you were ready. */
export function withContext(s) {
  if (!s.pending) return s;
  const d = s.lastYear || {}, domain = DOMAIN[s.pending.category];
  const lines = [];
  let prepared = null;
  if (domain === "faith" && s.age < 8 && !s.saved) { s.pending = { ...s.pending, context: [], prepared: null, domain: null }; return s; }
  if (domain === "faith") { prepared = n(d, "pray", "bible", "fast") >= 2 || n(d, "church") >= 1; lines.push(prepared ? `You've been praying and in the Word this year (prayed ${d.pray || 0}×, Bible ${d.bible || 0}×, church ${d.church || 0}×). You see this one coming.` : "You haven't prayed, read your Bible or been to church this year. This hits harder."); }
  if (domain === "body") { prepared = n(d, "exercise", "eat", "checkup") >= 2; lines.push(prepared ? "You've looked after your body this year. You have strength in reserve." : "You've barely exercised or eaten well this year. Your body has nothing in reserve."); }
  if (domain === "people") { prepared = n(d, "family", "followup") >= 1; lines.push(prepared ? "You've kept close to the people in your life. They're there for you." : "You've hardly been in touch with anyone this year. You face this alone."); }
  if (domain === "mind") { prepared = n(d, "pray", "family", "church", "exercise") >= 2; lines.push(prepared ? "Prayer, people and rest have kept you steady this year." : "You've been running on empty all year."); }
  s.pending = { ...s.pending, context: lines, prepared, domain: domain || null };
  return s;
}

export function ageUp(s0, r = Math.random, opts = {}) {
  if (!s0.alive || s0.pending) return s0;
  const s = clone(s0);
  const before = stageFor(s.age);
  s.age++;
  s.notice = null;
  // family grows older
  for (const p of s.family) if (p.alive) { p.age++; if (p.age > 60 && r() < 0.0004 * Math.exp(0.088 * (p.age - 30))) { p.alive = false; say(s, `Your ${p.relation} ${p.name.split(" ")[0]} died aged ${p.age}.`, "family"); s.happiness -= 12; } }
  // habits follow this year's actions
  const y = s.year;
  s.habits.exercise += y.exercise ? 1 : -1;
  s.habits.diet += y.diet ? 1 : -1;
  s.habits.checkups += y.checkup ? 1 : s.age >= 30 ? -1 : 0;
  const h = s.habits;
  const target = 86 + (h.exercise >= 2 ? 6 : h.exercise === 0 ? -8 : 0) + (h.diet >= 2 ? 4 : h.diet === 0 ? -5 : 0) - h.smoking * 7 - h.drinking * 4 - (s.age > 45 ? (s.age - 45) * 0.7 : 0);
  s.health += (target - s.health) * 0.18;
  if (s.age <= 12 && s.christianHome) y.diet = 1;
  // faith: neglect cools the walk; time with God restores it
  const accountable = s.saved || s.age >= 12;
  if (s.age <= 11 && s.christianHome) { s.churchYears++; s.faith.walk += 2; tally(s, "church"); } // your parents take you
  else if (s.servicesThisYear > 0) s.churchYears++;
  if (accountable && s.age >= 5 && y.faith === 0 && s.servicesThisYear === 0) { s.faith.drift += 1; s.faith.walk -= 3 + s.faith.drift * 1.5; }
  else s.faith.drift = Math.max(0, s.faith.drift - 1);
  if (s.saved && s.faith.drift === 4) say(s, "You've drifted. Prayer feels distant and church is a memory.", "warning");
  // money
  if (s.job) s.money += s.job.salary * 0.25;
  else if (s.age >= 18) s.money -= 1500;
  if (s.branch) { s.branch.members += Math.max(0, Math.round((s.faith.walk - 40) / 10 + r() * 6)); }
  // contacts cool if not followed up
  for (const c of s.contacts) if (!["believer", "discipled", "cooled"].includes(c.stage)) { c.warmth -= 8; if (c.warmth <= 0) { c.stage = "cooled"; say(s, `${c.name} stopped replying. Follow-up matters.`, "warning"); } }
  // illness
  if (!s.illness && s.age >= 40 && r() < (0.008 + (s.age - 40) * 0.0012) * (s.health < 50 ? 2 : 1) * (1 + s.habits.smoking * 0.5)) {
    s.illness = { found: s.habits.checkups >= 2, treated: false };
    if (s.illness.found) { s.illness.treated = true; say(s, "A routine check caught an illness early. Treatment started straight away.", "warning"); }
  }
  // The year in review: what you actually did shapes what comes next.
  s.lastYear = { ...(y.did || {}) };
  say(s, reviewText(s.lastYear, s.age - 1), "review");
  s.year = { acts: 0, faith: 0, exercise: 0, diet: 0, checkup: 0, did: {} };
  s.servicesThisYear = 0;
  fix(s);
  const now = stageFor(s.age);
  if (now.id !== before.id) say(s, now.milestone, "milestone");
  else if (s.age === 5) say(s, "You started primary school.", "milestone");
  else if (s.age === 11) say(s, "You started secondary school.", "milestone");
  else say(s, `You turned ${s.age}.`, "year");
  if (s.health <= 0 && r() < 0.35) die(s, "poor health");
  else if (s.age >= 120 || r() < mortality(s)) die(s, s.illness && !s.illness.treated ? "an illness that was never checked" : s.age >= 80 ? "old age" : "a sudden illness");
  if (!s.alive) return s;
  // Debt: interest bites, repayments come out of your money.
  if (s.debt > 0) { const pay = Math.min(s.debt, 1500); s.money -= pay; s.debt = Math.round((s.debt - pay) * 1.12); if (s.debt > 0) say(s, `You still owe £${s.debt.toLocaleString("en-GB")}.`, "warning"); }
  // Rare: persecution for the gospel. The more openly you witness, the more it can cost.
  const exposed = s.saved && s.age >= 16 && s.age <= 75 && s.faith.witness >= 12;
  if (exposed && !inPrison(s) && r() < 0.0025 + (s.branch ? 0.002 : 0) + s.faith.witness / 40000) {
    const place = pick(r, [
      ["On a mission trip", "You're preaching in a village where following Jesus is forbidden. Men with sticks surround you and demand you curse His name."],
      ["Street preaching", "A crowd turns ugly while you preach in the square. Someone shouts that they'll kill you if you don't stop."],
      ["The underground church", "Police raid the house church you've been leading abroad. An officer says you can walk free if you sign a paper denying Christ."],
      ["Visiting believers", "You're bringing Bibles to persecuted Christians when your group is stopped at a checkpoint."],
    ]);
    s.pending = { id: "persecution", title: place[0], text: place[1], category: "spiritual", options: [
      { label: "Stand firm for Jesus, whatever it costs", effect: { martyr: 0.55, walk: 10 } },
      { label: "Flee to the next town (Matthew 10:23)", effect: { walk: 3, money: -2500, happiness: -4 } },
      { label: "Deny Him to save yourself", effect: { walk: -30, drift: 5, happiness: -12 } },
    ] };
    s.recent = [...s.recent, "persecution"].slice(-10);
    return withContext(s);
  }
  // The apps you keep come back to meet you.
  const troubleIds = (s.apps || []).map((a) => TROUBLE_EVENTS[a]).filter(Boolean);
  if (troubleIds.length && r() < 0.35) {
    const all = [...EVENTS, ...TEMPTATIONS, ...ISSUES];
    const e = all.find((x) => x.id === pick(r, troubleIds) && x.stages.includes(stageFor(s.age).id));
    if (e) { s.pending = toPendingApp(e, s); s.recent = [...s.recent, e.id].slice(-10); return withContext(s); }
  }
  // Someone you invited makes an excuse about Sunday.
  const invited = s.contacts.filter((c) => c.stage === "invite");
  if (invited.length && r() < 0.45) {
    const c = pick(r, invited), x = pick(r, SUNDAY_EXCUSES);
    s.pending = { id: "excuse", title: `${c.name.split(" ")[0]} and Sunday`, text: `You invited ${c.name} to church. ${x.line}`, category: "evangelism", options: [
      { label: x.answer, effect: { excuse: c.id, warmthGain: 12, advance: true, walk: 1 } },
      { label: "Pray for them and ask again next month", effect: { excuse: c.id, warmthGain: 4, walk: 2 } },
      { label: "Give up on them", effect: { excuse: c.id, cool: true, fruit: -2 } },
    ] };
    return withContext(s);
  }
  // Growing older with the age circle brings one challenge. What you neglected last
  // year is most likely to come back to meet you.
  const toPending = (e) => ({ id: e.id, title: e.title, text: e.category === "temptation" && s.faith.walk >= 60 ? `${e.text} The closer you walk with God, the harder the pull.` : e.text, category: e.category, options: e.options.map((x) => ({ label: x.label, effect: x.effect })) });
  if (opts.issue) {
    const st = now.id;
    const okNow = (e) => e.stages.includes(st) && (!e.when || e.when(s));
    const freshFirst = (list) => { const all = list.filter(okNow), fresh = all.filter((e) => !s.recent.includes(e.id)); return fresh.length ? fresh : all; };
    const issues = freshFirst(ISSUES), events = s.age >= 3 ? freshFirst(EVENTS) : [], temptations = s.age >= 3 ? freshFirst(TEMPTATIONS) : [];
    const prefer = neglected(s.lastYear || {}, s);
    // Serving a sentence: the year happens inside.
    const inside = PRISON_EVENTS.filter(okNow);
    if (inside.length) {
      const e = pick(r, inside.filter((x) => !s.recent.includes(x.id)).length ? inside.filter((x) => !s.recent.includes(x.id)) : inside);
      s.pending = toPending(e); s.recent = [...s.recent, e.id].slice(-10);
      if (s.age + 1 >= s.prisonUntil) say(s, "Your sentence is nearly over.", "court");
      return withContext(s);
    }
    const pool = [...issues, ...events, ...temptations];
    const preferred = pool.filter((e) => prefer.includes(e.category));
    let from;
    if (preferred.length && r() < 0.75) from = preferred;
    else if (issues.length && (s.age < 3 || r() < 0.5)) from = issues;
    else from = temptations.length && r() < temptPressure(s) ? temptations : events.length ? events : issues;
    if (from !== temptations && temptations.length && s.faith.walk >= 60 && r() < (s.faith.walk - 50) / 120) from = temptations;
    if (from.length) {
      const e = pick(r, from); s.pending = toPending(e); s.recent = [...s.recent, e.id].slice(-10);
      return withContext(s);
    }
    return s;
  }
  if (!opts.skipEvents && s.age >= 3) {
    const st = now.id;
    const ok = (e) => e.stages.includes(st) && (!e.when || e.when(s)) && !s.recent.includes(e.id);
    const temptations = TEMPTATIONS.filter(ok), events = EVENTS.filter(ok);
    const pool = temptations.length && r() < temptPressure(s) ? temptations : events.length ? events : temptations;
    if (pool.length) {
      const e = pick(r, pool);
      s.pending = toPending(e);
      s.recent = [...s.recent, e.id].slice(-10);
    }
  }
  return withContext(s);
}

// ---------- follow-up & services ----------
export function followUp(s0, contactId, r = Math.random) {
  const s = clone(s0);
  const c = s.contacts.find((x) => x.id === contactId);
  if (!c || c.stage === "cooled") return { ...s0, notice: "They've gone quiet. Pray, and try someone new." };
  const i = stageIndex(c.stage), next = FOLLOW_UP[i + 1];
  if (!next) return { ...s0, notice: `${c.name} is being discipled. Keep going.` };
  if (next.needsCar && !s.car) return { ...s0, notice: `${c.name} would come if someone collected them. You need a car.` };
  if (c.stage === "pickup") return { ...s0, notice: `Pick ${c.name} up for the 2pm Sunday service.` };
  if (next.id === "believer") {
    const chance = 0.25 + s.faith.walk / 300 + c.warmth / 300;
    if (r() > chance) { c.warmth += 5; s.notice = `${c.name} is still thinking. Keep praying.`; return fix(s); }
    s.faith.fruit += 8; s.faith.witness += 4;
  }
  c.stage = next.id; c.warmth += 12; s.faith.witness += 1;
  s.notice = next.id === "believer" ? `${c.name} put their trust in Jesus!` : `${c.name}: ${next.label.toLowerCase()}.`;
  say(s, s.notice, next.id === "believer" ? "milestone" : "ministry");
  return fix(s);
}

export const ANNOUNCEMENTS = [
  "Welcome to everyone joining us for the first time — please stay for refreshments.",
  "Our midweek prayer meeting continues this week. Bring a friend.",
  "Baptisms are coming up. Speak to the welcome team if you'd like to be baptised.",
  "Volunteers needed for the children's ministry rota.",
  "Fasting and prayer this week — let's seek God together.",
];

export function sundayService(s, series, r = Math.random) {
  const sr = pick(r, series), ep = pick(r, sr.episodes);
  const guests = s.contacts.filter((c) => c.stage === "pickup").map((c) => c.name.split(" ")[0]);
  return {
    time: "14:00", day: "Sunday", announcement: pick(r, ANNOUNCEMENTS),
    clip: { video: sr.video, title: sr.message, start: ep.clip.start, end: ep.clip.start + 60 },
    reading: ep.reading, attendance: between(r, 180, 420) + guests.length, guests,
  };
}

export function attendService(s0, svc, r = Math.random) {
  const s = clone(s0);
  s.servicesThisYear++; s.year.faith++; s.year.acts++;
  tally(s, "church");
  s.faith.walk += 4; s.happiness += 2;
  const brought = [];
  for (const c of s.contacts) if (c.stage === "pickup") { c.stage = "attended"; c.warmth += 15; brought.push(c.name.split(" ")[0]); }
  s.notice = brought.length ? `You collected ${brought.join(" and ")} and brought them to church.` : "You went to the 2pm Sunday service.";
  if (svc?.clip) s.notice += ` Message: ${svc.clip.title}.`;
  say(s, s.notice, "church");
  return fix(s);
}

// ---------- judgement ----------
export function judge(s) {
  const f = s.faith;
  const fellAway = s.saved && f.drift >= 10 && f.walk < 15;
  const heaven = s.saved && !fellAway;
  const people = (s.contacts || []).filter((c) => ["believer", "discipled"].includes(c.stage)).length;
  if (s.martyr) return {
    destination: "heaven",
    title: "Faithful unto death",
    text: `You would not deny Jesus, and it cost you your life at ${s.age}. ${people ? `${people} ${people === 1 ? "person" : "people"} came to faith through you. ` : ""}You receive the crown of life.`,
    verses: ["Revelation 2:10", "Matthew 5:10–12", "Hebrews 11:36–38"],
    rewards: { witness: f.witness, fruit: f.fruit, people, branch: s.branch ? cityName(s.branch.city) : null, martyr: true },
  };
  if (heaven) {
    const faithful = f.fruit + f.witness >= 60;
    return {
      destination: "heaven",
      title: faithful ? "Well done, good and faithful servant" : "Saved by grace",
      text: faithful
        ? `You trusted Christ and lived for Him. ${people ? `${people} ${people === 1 ? "person" : "people"} came to faith through your life.` : "Your life bore fruit."} You enter the joy of your Lord.`
        : s.savedAge >= 60 ? "Late in life you turned to Jesus, and like the thief on the cross, you were welcomed into paradise." : "You trusted Christ. Your life was often weak, but His grace was enough. You are home.",
      verses: faithful ? ["Matthew 25:21", "Ephesians 2:8–10", "2 Timothy 4:7–8"] : ["Luke 23:42–43", "Ephesians 2:8–9", "Romans 8:1"],
      rewards: { witness: f.witness, fruit: f.fruit, people, branch: s.branch ? cityName(s.branch.city) : null },
    };
  }
  return {
    destination: "hell",
    title: fellAway ? "“I never knew you”" : "Separated from God",
    text: fellAway
      ? "You once professed faith, but your life turned away from Christ and never came back. The door of repentance was open every year, and you did not walk through it."
      : s.churchYears > 10 ? "You knew about church, but you never trusted Jesus Himself. Religious habits could not save you." : "You never put your trust in Jesus. The gift was offered, but it was never received.",
    verses: fellAway ? ["Matthew 7:21–23", "Hebrews 3:12–13", "1 John 2:19"] : ["John 3:18", "Romans 6:23", "John 14:6"],
    rewards: null,
    reflection: "This is a game. In real life, it's not too late: anyone who calls on the name of the Lord will be saved (Romans 10:13).",
  };
}

// ---------- persistence ----------
export const serialise = (s) => JSON.stringify(s);
export function restore(text) {
  try {
    const s = JSON.parse(text);
    return s && s.v === 1 && typeof s.age === "number" && s.name && s.faith ? s : null;
  } catch { return null; }
}

export type LifeState = ReturnType<typeof newLife>;

/** Real actions taken in Kairos World. They don't use up the four yearly choices. */
export const CREDITS = {
  pray: { walk: 4, faith: true, text: "You prayed." },
  bible: { walk: 4, faith: true, text: "You read your Bible." },
  preach: { witness: 3, walk: 1, faith: true, text: "You shared Jesus with someone." },
  followup: { witness: 1, fruit: 2, faith: true, text: "You followed someone up." },
  serve: { fruit: 3, text: "You served someone." },
  exercise: { year: "exercise", health: 1, text: "You got some exercise." },
  eat: { year: "diet", text: "You ate properly." },
  checkup: { year: "checkup", text: "You looked after your health." },
};
export function credit(s0, kind, r = Math.random, info = {}) {
  if (kind === "church") return attendService(s0, null, r);
  const c = CREDITS[kind];
  if (!c || !s0.alive) return s0;
  const s = clone(s0);
  tally(s, kind);
  // A real person in the world: they become someone you're following up.
  if (info.name && (kind === "preach" || kind === "followup") && s.saved) {
    let p = s.contacts.find((x) => x.name === info.name);
    if (!p && kind === "preach") { p = { id: id(r), name: info.name, stage: "met", warmth: info.warm ? 65 : 45, metAge: s.age }; s.contacts.push(p); }
    else if (p && kind === "followup") { const i = stageIndex(p.stage); if (i >= 0 && i < 3 && p.stage !== "cooled") p.stage = FOLLOW_UP[i + 1].id; p.warmth += 10; }
  }
  if (info.name && kind === "serve") s.served = (s.served || 0) + 1;
  if (c.walk) s.faith.walk += c.walk;
  if (c.witness) s.faith.witness += c.witness;
  if (c.fruit) s.faith.fruit += c.fruit;
  if (c.health) s.health += c.health;
  if (c.faith) { s.year.faith++; s.faith.drift = Math.max(0, s.faith.drift - 1); }
  if (c.year) s.year[c.year] = 1;
  if (kind === "checkup" && s.illness && !s.illness.found) { s.illness.found = true; s.illness.treated = true; say(s, "A check caught an illness early. Treatment started.", "warning"); }
  if (!s.log.some((e) => e.age === s.age && e.text === c.text)) say(s, c.text, "action");
  return fix(s);
}

/** World days since the epoch; one game day is one year of life in offline mode. */
export function yearsDue(lastDay, today) {
  return lastDay == null ? 0 : Math.max(0, Math.min(3, today - lastDay));
}

/** Proportions for the citizen model at each age. */
export function bodyForAge(age) {
  if (age == null) return { height: 1, head: 1, grey: 0, stoop: 0 };
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  if (age <= 2) return { height: lerp(0.42, 0.52, age / 2), head: 1.5, grey: 0, stoop: 0 };
  if (age <= 12) return { height: lerp(0.58, 0.88, (age - 3) / 9), head: lerp(1.32, 1.1, (age - 3) / 9), grey: 0, stoop: 0 };
  if (age <= 17) return { height: lerp(0.9, 0.99, (age - 13) / 4), head: lerp(1.08, 1.02, (age - 13) / 4), grey: 0, stoop: 0 };
  if (age < 50) return { height: 1, head: 1, grey: 0, stoop: 0 };
  return { height: lerp(1, 0.94, (age - 50) / 40), head: 1, grey: lerp(0, 1, (age - 48) / 25), stoop: lerp(0, 0.14, (age - 60) / 30) };
}
