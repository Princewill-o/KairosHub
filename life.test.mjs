import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
const out = await build({ entryPoints: ["./world-runtime/source/game/core/kairos-life.ts"], bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent" });
const file = `/tmp/kairos-life-${process.pid}.mjs`;
await fs.writeFile(file, out.outputFiles[0].text);
const L = await import(pathToFileURL(file).href);

const seeded = (seed) => L.makeRng(seed);

test("a random life starts at age 7 with parents and a home city", () => {
  const s = L.newLife({ random: true }, seeded(7));
  assert.equal(s.age, 7);
  assert.equal(L.START_AGE, 7);
  assert.equal(L.stageFor(0).id, "baby");
  assert.ok(s.family.filter((p) => p.relation === "parent").every((p) => p.age >= 29));
  assert.ok(s.name.first && s.name.last);
  assert.ok(s.family.filter((p) => p.relation === "parent").length >= 1);
  assert.ok(L.CITIES.some((c) => c.id === s.city));
  assert.equal(s.alive, true);
});

test("custom details are respected", () => {
  const s = L.newLife({ first: "Ama", last: "Mensah", sex: "female", city: "manchester", christianHome: true }, seeded(1));
  assert.equal(s.name.first, "Ama");
  assert.equal(s.city, "manchester");
  assert.ok(s.family.some((p) => p.relation === "parent" && p.faith === "christian"));
});

test("random detail rolls give believable values", () => {
  const r = seeded(3);
  for (let i = 0; i < 30; i++) {
    const d = L.randomDetails(r);
    assert.ok(d.first && d.last && L.CITIES.some((c) => c.id === d.city));
  }
});

test("life stages cover every age from baby to elder", () => {
  const ids = [0, 4, 14, 22, 40, 70].map((a) => L.stageFor(a).id);
  assert.deepEqual(ids, ["baby", "child", "teen", "young-adult", "adult", "elder"]);
});

test("ageing one year moves age, family ages and produces events", () => {
  const r = seeded(11);
  let s = L.newLife({ random: true }, r);
  const parentAge = s.family[0].age;
  s = L.ageUp(s, r);
  assert.equal(s.age, 8);
  assert.equal(s.family[0].age, parentAge + 1);
  assert.ok(s.log.some((e) => e.age === 8));
});

test("every event and temptation has options that resolve", () => {
  for (const ev of [...L.EVENTS, ...L.TEMPTATIONS]) {
    assert.ok(ev.options.length >= 2, ev.id);
    for (const o of ev.options) assert.ok(o.label && o.effect, `${ev.id}/${o.label}`);
  }
});

test("temptations only appear at fitting life stages", () => {
  for (const t of L.TEMPTATIONS) {
    assert.ok(t.stages.every((id) => L.STAGES.some((s) => s.id === id)), t.id);
    assert.ok(!t.stages.includes("baby"), t.id);
  }
});

test("pending choices block ageing until answered", () => {
  const r = seeded(5);
  let s = L.newLife({ random: true }, r);
  for (let i = 0; i < 20 && !s.pending; i++) s = L.ageUp(s, r);
  assert.ok(s.pending, "a choice should arrive within 20 years");
  const age = s.age;
  assert.equal(L.ageUp(s, r).age, age);
  s = L.choose(s, 0, r);
  assert.equal(s.pending, null);
});

test("activities are gated by age", () => {
  const baby = L.newLife({ random: true }, seeded(2));
  assert.equal(L.availableActions(baby).some((a) => a.id === "preach"), false);
  const adult = { ...baby, age: 25 };
  assert.ok(L.availableActions(adult).some((a) => a.id === "preach"));
  assert.ok(L.availableActions(adult).some((a) => a.id === "plant-branch"));
});

test("drifting lowers the walk and repentance restores it", () => {
  const r = seeded(9);
  let s = { ...L.newLife({ random: true }, r), age: 20, saved: true, faith: { walk: 70, witness: 10, fruit: 20, drift: 0 } };
  for (let i = 0; i < 6; i++) s = L.ageUp({ ...s, pending: null }, r, { skipEvents: true });
  assert.ok(s.faith.walk < 70, "neglect should cool the walk");
  const before = s.faith.walk;
  s = L.act(s, "repent", r);
  assert.ok(s.faith.walk > before);
  assert.equal(s.faith.drift, 0);
});

test("judgement rests on trusting Christ, shown by the life lived", () => {
  const base = L.newLife({ random: true }, seeded(4));
  const faithful = L.judge({ ...base, saved: true, faith: { walk: 80, witness: 40, fruit: 60, drift: 0 } });
  assert.equal(faithful.destination, "heaven");
  const never = L.judge({ ...base, saved: false, faith: { walk: 5, witness: 0, fruit: 5, drift: 0 } });
  assert.equal(never.destination, "hell");
  const lateRepentance = L.judge({ ...base, saved: true, savedAge: 80, age: 81, faith: { walk: 30, witness: 0, fruit: 5, drift: 0 } });
  assert.equal(lateRepentance.destination, "heaven", "the thief on the cross: late, real faith still saves");
  const outward = L.judge({ ...base, saved: false, faith: { walk: 10, witness: 0, fruit: 60, drift: 0 }, churchYears: 50 });
  assert.equal(outward.destination, "hell", "religious activity without faith in Christ does not save");
  assert.ok(faithful.verses.length && never.verses.length);
});

test("a life always ends and gives a judgement", () => {
  const r = seeded(21);
  let s = L.newLife({ random: true }, r);
  for (let i = 0; i < 140 && s.alive; i++) s = L.ageUp(s.pending ? L.choose(s, i % 2, r) : s, r);
  assert.equal(s.alive, false);
  assert.ok(["heaven", "hell"].includes(s.ending.destination));
});

test("saves round-trip and corrupt saves are rejected", () => {
  const s = L.newLife({ random: true }, seeded(8));
  assert.deepEqual(L.restore(L.serialise(s)), s);
  assert.equal(L.restore("{bad"), null);
  assert.equal(L.restore(JSON.stringify({ v: 999 })), null);
});

test("each year's decision covers a broad mix of life areas", () => {
  const cats = new Set(L.EVENTS.map((e) => e.category));
  for (const c of ["health", "spiritual", "relationships", "money", "work", "mind"]) assert.ok(cats.has(c), c);
  for (const st of L.STAGES.filter((s) => s.id !== "baby")) {
    assert.ok(L.EVENTS.filter((e) => e.stages.includes(st.id)).length >= 6, st.id);
  }
});

test("growing up is marked at each new life stage", () => {
  const r = seeded(13);
  let s = L.newLife({ random: true }, r);
  for (let i = 0; i < 19 && s.alive; i++) s = L.ageUp(s.pending ? L.choose(s, 0, r) : s, r);
  const kinds = s.log.filter((e) => e.kind === "milestone").map((e) => e.age);
  for (const a of [13, 18]) assert.ok(kinds.includes(a), `milestone at ${a}`);
});

function lifespan(seed, careful) {
  const r = seeded(seed);
  let s = L.newLife({ random: true }, r);
  for (let i = 0; i < 130 && s.alive; i++) {
    if (s.pending) {
      const opts = s.pending.options.map((o, idx) => ({ idx, h: o.effect.health || 0 }));
      opts.sort((a, b) => (careful ? b.h - a.h : a.h - b.h));
      s = L.choose(s, opts[0].idx, r);
    }
    if (careful) for (const id of ["exercise", "checkup", "eat-well"]) if (L.availableActions(s).some((a) => a.id === id && !a.disabled)) s = L.act(s, id, r);
    s = L.ageUp(s, r);
  }
  return s.age;
}

test("health precautions make old age far more reachable", () => {
  let careful = 0, careless = 0, carefulOld = 0, carelessOld = 0;
  for (let i = 1; i <= 150; i++) {
    const a = lifespan(i, true), b = lifespan(i + 1000, false);
    careful += a; careless += b; if (a >= 85) carefulOld++; if (b >= 85) carelessOld++;
  }
  assert.ok(careful / 150 > careless / 150 + 10, `careful ${careful / 150} vs careless ${careless / 150}`);
  assert.ok(carefulOld > carelessOld * 2, `85+: careful ${carefulOld}, careless ${carelessOld}`);
});

test("follow-up walks a contact from first meeting to church", () => {
  const r = seeded(31);
  let s = { ...L.newLife({ random: true }, r), age: 24, saved: true, faith: { walk: 70, witness: 0, fruit: 10, drift: 0 } };
  s = L.credit(s, "preach", r, { name: "Jo Banks" }); // a real person in the world
  assert.equal(s.contacts.length, 1);
  const id = s.contacts[0].id;
  assert.equal(L.FOLLOW_UP[0].id, "met");
  s = L.followUp(s, id, r); // message
  s = L.followUp(s, id, r); // call
  s = L.followUp(s, id, r); // invite
  const stuck = L.followUp(s, id, r);
  assert.equal(stuck.contacts[0].stage, s.contacts[0].stage, "pick-up needs a car");
  assert.match(stuck.notice, /car/i);
  s = L.act({ ...s, money: 20000 }, "buy-car", r);
  assert.ok(s.car);
  s = L.followUp(s, id, r);
  assert.equal(s.contacts[0].stage, "pickup");
});

test("sunday service is at 2pm with a one-minute Kharis sermon and guests you brought", async () => {
  const { series } = await import("./public/playmessages/content.mjs");
  const r = seeded(32);
  let s = { ...L.newLife({ random: true }, r), age: 30, saved: true, car: { name: "Hatchback" } };
  s.contacts = [{ id: "c1", name: "Tunde", stage: "pickup", warmth: 60 }];
  const svc = L.sundayService(s, series, r);
  assert.equal(svc.time, "14:00");
  assert.equal(svc.clip.end - svc.clip.start, 60);
  assert.ok(series.some((x) => x.video === svc.clip.video));
  assert.ok(svc.reading);
  assert.ok(svc.attendance >= 150, "a packed service");
  assert.deepEqual(svc.guests, ["Tunde"]);
  const after = L.attendService(s, svc, r);
  assert.equal(after.contacts[0].stage, "attended");
  assert.ok(after.churchYears >= 1 || after.servicesThisYear === 1);
});

test("real world actions credit the life without using yearly choices", () => {
  const r = seeded(40);
  let s = { ...L.newLife({ random: true }, r), age: 20, saved: true };
  s = L.credit(s, "pray", r); s = L.credit(s, "preach", r); s = L.credit(s, "eat", r); s = L.credit(s, "exercise", r);
  assert.equal(s.year.acts, 0);
  assert.equal(s.year.diet, 1); assert.equal(s.year.exercise, 1);
  // Pressing a button with nobody there doesn't build witness...
  assert.equal(s.faith.witness, 0);
  // ...sharing Jesus with a real person does, and they become someone to follow up.
  s = L.credit(s, "preach", r, { name: "Sam Okafor" });
  assert.ok(s.faith.witness >= 3);
  assert.ok(s.contacts.some((c) => c.name === "Sam Okafor"));
  s = L.credit(s, "church", r);
  assert.equal(s.servicesThisYear, 1);
});

test("one world day is one year, capped so a long absence doesn't skip a life", () => {
  assert.equal(L.yearsDue(null, 50), 0);
  assert.equal(L.yearsDue(50, 51), 1);
  assert.equal(L.yearsDue(50, 90), 3);
});

test("bodies grow from baby to elder", () => {
  const h = [0, 5, 15, 30, 85].map((a) => L.bodyForAge(a).height);
  assert.ok(h[0] < h[1] && h[1] < h[2] && h[2] <= h[3] && h[4] < h[3]);
  assert.ok(L.bodyForAge(1).head > L.bodyForAge(30).head);
  assert.ok(L.bodyForAge(85).grey > 0.9 && L.bodyForAge(85).stoop > 0);
});

test("each press of the age circle brings exactly one challenge, and issues appear among them, even for babies", () => {
  const r = seeded(50);
  let s = L.newLife({ random: true }, r);
  s = L.ageUp(s, r, { issue: true });
  assert.ok(s.pending, "babies face issues too");
  const ids = [];
  s = L.choose(s, 0, r);
  for (let i = 0; i < 30 && s.alive; i++) {
    s = L.ageUp(s, r, { issue: true });
    assert.ok(s.pending, `age ${s.age}: one challenge`);
    ids.push(s.pending.id);
    s = L.choose(s, 0, r);
    assert.equal(s.pending, null, `age ${s.age}: nothing back to back`);
  }
  assert.ok(ids.some((id) => id.startsWith("i-")), "issues appear");
  assert.ok(ids.some((id) => !id.startsWith("i-")), "ordinary decisions appear");
  assert.ok(new Set(ids).size > 12, "challenges vary");
  for (const iss of L.ISSUES) { assert.ok(iss.options.length >= 2, iss.id); assert.ok(iss.stages.length, iss.id); }
});

test("branches are planted only in UK cities Kharis hasn't reached", () => {
  for (const c of L.KHARIS_BRANCHES) assert.ok(!L.UNREACHED_CITIES.includes(c));
  const r = seeded(51);
  let s = { ...L.newLife({ random: true }, r), age: 35, saved: true, money: 9000, faith: { walk: 80, witness: 30, fruit: 40, drift: 0 } };
  s = L.act(s, "plant-branch", r);
  assert.ok(s.branch && L.UNREACHED_CITIES.includes(s.branch.city));
});

test("what you do in the world during a year is counted and reviewed when you grow older", () => {
  const r = seeded(60);
  let s = { ...L.newLife({ random: true }, r), age: 20, saved: true };
  s = L.credit(s, "pray", r); s = L.credit(s, "pray", r); s = L.credit(s, "church", r); s = L.credit(s, "exercise", r);
  assert.equal(s.year.did.pray, 2); assert.equal(s.year.did.church, 1); assert.equal(s.year.did.exercise, 1);
  s = L.ageUp(s, r, { issue: true });
  assert.equal(s.lastYear.pray, 2);
  assert.ok(s.log.some((e) => e.kind === "review" && /prayed 2/.test(e.text)), "year in review in your story");
  assert.deepEqual(s.year.did, {}, "a new year starts a new record");
});

test("neglect shapes what comes up: a prayerless year brings spiritual trials, a sedentary year brings health trouble", () => {
  const count = (setup) => {
    let hits = { spiritual: 0, health: 0 };
    for (let seed = 1; seed <= 120; seed++) {
      const r = seeded(seed);
      let s = { ...L.newLife({ random: true }, r), age: 30, saved: true, job: { id: "care", title: "Care worker", salary: 22000 } };
      s = setup(s, r);
      s = L.ageUp(s, r, { issue: true });
      if (!s.pending) continue;
      if (["spiritual", "temptation"].includes(s.pending.category)) hits.spiritual++;
      if (s.pending.category === "health") hits.health++;
    }
    return hits;
  };
  const faithful = count((s, r) => ["pray", "bible", "church", "pray"].reduce((x, k) => L.credit(x, k, r), s));
  const neglected = count((s, r) => ["exercise", "eat", "exercise"].reduce((x, k) => L.credit(x, k, r), s));
  assert.ok(neglected.spiritual > faithful.spiritual + 15, `spiritual: neglected ${neglected.spiritual} vs faithful ${faithful.spiritual}`);
  assert.ok(faithful.health > neglected.health + 10, `health: lazy ${faithful.health} vs active ${neglected.health}`);
});

test("preparation changes how a choice turns out, and the card explains it", () => {
  const r = seeded(61);
  const pending = { id: "t-porn", title: "Alone online", text: "…", category: "temptation", options: [{ label: "Close it", effect: { walk: 5 } }, { label: "Click", effect: { walk: -8, drift: 2 } }] };
  const base = { ...L.newLife({ random: true }, r), age: 25, saved: true, faith: { walk: 50, witness: 0, fruit: 0, drift: 0 } };
  const ready = L.withContext({ ...base, lastYear: { pray: 4, bible: 2 }, pending: { ...pending } });
  const unready = L.withContext({ ...base, lastYear: {}, pending: { ...pending } });
  assert.ok(ready.pending.context.some((t) => /pray/i.test(t)));
  assert.ok(unready.pending.context.length > 0);
  const goodReady = L.choose(ready, 0, r), goodUnready = L.choose(unready, 0, r);
  assert.ok(goodReady.faith.walk > goodUnready.faith.walk, "resisting is stronger when you've been praying");
  const badReady = L.choose(ready, 1, r), badUnready = L.choose(unready, 1, r);
  assert.ok(badUnready.faith.drift > badReady.faith.drift, "falling costs more when you've been prayerless");
  assert.ok(goodReady.notice && goodReady.notice.length > 0, "the outcome says why");
});

test("little children aren't judged on their prayer life, and Christian homes take them to church", () => {
  const r = seeded(62);
  let s = { ...L.newLife({ christianHome: true, first: "A", last: "B" }, r), age: 5 };
  s = L.ageUp(s, r, { issue: true });
  assert.ok((s.lastYear.church || 0) >= 1, "parents took you to church");
  const kid = L.withContext({ ...s, saved: false, age: 5, pending: { id: "x", title: "x", text: "x", category: "temptation", options: [{ label: "a", effect: { walk: 1 } }, { label: "b", effect: { walk: -1 } }] } });
  assert.deepEqual(kid.pending.context, []);
});

test("life crimes can be caught: the case follows you, a sentence puts you inside", () => {
  let s = L.newLife({ first: "Ada", last: "Bell", sex: "female", city: "london" }, L.makeRng(3));
  s.age = 25; s.pending = { id: "t-fight", title: "Outside the chip shop", options: [{ label: "Walk away", effect: {} }, { label: "Throw the first punch", effect: { crime: { charge: "Assault", stars: 3, caught: 1 } } }] };
  s = L.choose(s, 1, () => 0);
  assert.equal(s.case.charge, "Assault");
  s = L.sentenced(s, { charge: "Assault", verdict: "guilty", months: 24 });
  assert.equal(s.case, null);
  assert.equal(s.record.length, 1);
  assert.ok(L.inPrison(s));
  const inside = L.ageUp(s, L.makeRng(1), { issue: true });
  assert.ok(inside.pending && inside.pending.id.startsWith("p-"), "a year inside brings a prison choice");
  const freed = L.sentenced(L.newLife({ first: "Bo", last: "Day", sex: "male", city: "london" }, L.makeRng(2)), { charge: "Theft", verdict: "acquitted", months: 0 });
  assert.equal((freed.record || []).length, 0);
});

test("the closer the walk, the more the temptation", () => {
  assert.ok(L.temptPressure({ faith: { walk: 90 } }) > L.temptPressure({ faith: { walk: 10 } }));
  let hi = 0, lo = 0;
  for (let i = 0; i < 300; i++) {
    const r = seeded(500 + i);
    const base = { ...L.newLife({ random: true }, r), age: 24, saved: true };
    const a = L.ageUp({ ...base, faith: { ...base.faith, walk: 95 } }, r, { issue: true });
    const b = L.ageUp({ ...base, faith: { ...base.faith, walk: 5 } }, seeded(500 + i), { issue: true });
    if (a.pending?.category === "temptation") hi++;
    if (b.pending?.category === "temptation") lo++;
  }
  assert.ok(hi > lo, `${hi} vs ${lo}`);
});

test("witness and fruit can't outgrow the real people in your life", () => {
  const r = seeded(9);
  let s = { ...L.newLife({ random: true }, r), age: 30, saved: true, contacts: [] };
  s = L.encountered(s, { who: "Nobody", choice: "x", effect: { witness: 40 } });
  // the person in front of you counts, but only as one person
  assert.ok(s.faith.witness <= L.outreachCaps(s).witness);
  assert.equal(L.outreachCaps(s).reached, 1);
});

test("invited people make Sunday excuses you can answer", () => {
  let found = null;
  for (let i = 0; i < 60 && !found; i++) {
    const r = seeded(800 + i);
    const s = { ...L.newLife({ random: true }, r), age: 30, saved: true, contacts: [{ id: "c1", name: "Priya Shah", stage: "invite", warmth: 60, metAge: 29 }] };
    const n = L.ageUp(s, r, { issue: true });
    if (n.pending?.id === "excuse") found = n;
  }
  assert.ok(found, "an excuse came up");
  const after = L.choose(found, 0, seeded(1));
  assert.notEqual(after.contacts[0].stage, "invite");
});

test("rarely, standing firm under persecution costs your life, and heaven says so", () => {
  const r = seeded(3);
  const s = { ...L.newLife({ random: true }, r), age: 35, saved: true, pending: { id: "persecution", title: "x", text: "x", category: "spiritual", options: [{ label: "Stand firm", effect: { martyr: 1 } }] } };
  const d = L.choose(s, 0, r);
  assert.equal(d.alive, false);
  assert.equal(d.ending.title, "Faithful unto death");
});

test("crashes hurt your health; a serious one ends the life", () => {
  const s = { ...L.newLife({ random: true }, seeded(2)), age: 30, health: 80 };
  const hurt = L.crashed(s, { severity: 0.7, fatal: false });
  assert.ok(hurt.health < 80 && hurt.alive);
  const dead = L.crashed(s, { severity: 1, fatal: true });
  assert.equal(dead.alive, false);
  assert.match(dead.cause, /crash/);
});

test("accidents fit your age and the story you're in", () => {
  const child = L.accidentProfile(8, "bike"), elder = L.accidentProfile(78, "car");
  assert.equal(child.band, "child"); assert.match(child.serious, /bike/);
  assert.ok(child.fatal > elder.fatal && elder.heal > child.heal);
  let s = L.newLife({ random: true }, seeded(5));
  s = L.crashed(s, { severity: 0.7, fatal: false, vehicle: "car" });
  assert.match(s.log.at(-1).text, /children's ward|knocked you down/);
  assert.match(L.storyHurt("chest-pain", 50).die, /heart attack/);
  assert.match(L.storyHurt("unknown", 9).die, /playing/);
});
