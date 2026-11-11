import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from './world-runtime/source/game/core/sims.ts';

test('hobbies build skills, make things you can sell, and unlock harder activities', () => {
  let s = S.freshSims();
  assert.equal(S.doActivity(s, 'graft', 1000).ok, false);
  for (let i = 0; i < 40; i++) s = S.doActivity(s, 'plant-veg', 1000).sims;
  assert.ok(S.level(s.skills.gardening) >= 3);
  assert.ok(s.items.vegetables === 40);
  const sold = S.sell(s, 'vegetables');
  assert.equal(sold.money, 40 * S.PRICES.vegetables);
  assert.equal(S.doActivity(s, 'paint', 2).ok, false, 'needs money for supplies');
});

test('careers pay per shift, promote with performance and skill, fire slackers', () => {
  let s = S.joinCareer(S.freshSims(), 'culinary').sims;
  const r = () => 0.99;
  let paid = 0;
  for (let i = 0; i < 4; i++) { const x = S.workShift(s, 'hard', r); s = x.sims; paid += x.money; }
  assert.ok(paid > 0);
  assert.equal(s.career.level, 2, 'first promotion needs no skill');
  for (let i = 0; i < 4; i++) s = S.workShift(s, 'hard', r).sims;
  assert.equal(s.career.level, 2, 'blocked until cooking improves');
  let lazy = S.joinCareer(S.freshSims(), 'tech').sims;
  for (let i = 0; i < 5; i++) lazy = S.workShift(lazy, 'slack', r).sims;
  assert.equal(lazy.career, null, 'fired');
});

test('businesses and property earn over game time; skyscrapers cost a fortune', () => {
  let s = S.freshSims();
  assert.equal(S.buildProperty(s, 'tower', 1000, 0).ok, false);
  const b = S.openBusiness(s, 'cafe', 30000, 0); assert.equal(b.money, -25000); s = b.sims;
  const p = S.buildProperty(s, 'flat', 200000, 0); s = p.sims;
  const c = S.collect(s, 10 * 30000, 30000, false);
  assert.equal(c.money, 10 * 40 + 10 * 25);
  assert.equal(S.collect(c.sims, 10 * 30000, 30000).ok, false);
  assert.ok(S.PROPERTIES.at(-1).cost >= 100000000 && S.PROPERTIES.at(-1).floors >= 30);
});

test('politics: join a party, campaign, win elections up to Prime Minister', () => {
  let s = S.joinParty(S.freshSims(), S.PARTIES[0]).sims;
  assert.equal(S.standForElection(s, () => 0).ok, false, 'not enough support');
  const hi = () => 0.999, lo = () => 0;
  for (let office = 1; office <= 5; office++) {
    while (s.politics.support < S.NEEDED[office] + 10) s = S.campaign(s, 'spin', 0, hi).sims;
    s = S.standForElection(s, lo).sims;
    assert.equal(s.politics.office, office);
  }
  assert.equal(S.OFFICES[s.politics.office], 'Prime Minister');
  assert.ok(S.decide(s, 1, 0).ok);
  assert.ok(S.sitting(s).money > 0);
});
