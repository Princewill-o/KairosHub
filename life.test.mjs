import test from "node:test";
import assert from "node:assert/strict";
import * as L from "./public/life-engine.mjs";

const seeded = (seed) => L.makeRng(seed);

test("a random life starts at birth with parents and a home city", () => {
  const s = L.newLife({ random: true }, seeded(7));
  assert.equal(s.age, 0);
  assert.equal(L.stageFor(0).id, "baby");
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
  assert.equal(s.age, 1);
  assert.equal(s.family[0].age, parentAge + 1);
  assert.ok(s.log.some((e) => e.age === 1));
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
  for (const a of [3, 13, 18]) assert.ok(kinds.includes(a), `milestone at ${a}`);
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
  s = L.act(s, "preach", r);
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
