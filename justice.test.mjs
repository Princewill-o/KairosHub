import test from 'node:test';
import assert from 'node:assert/strict';
import { offerDeal, judge, acquitChance, conductOf, fullSentence } from './world-runtime/source/game/core/justice.ts';

const c = (o = {}) => ({ charge: 'Shoplifting', stars: 1, priors: 0, conduct: 0.4, ...o });
test('a first, minor offence by someone of good conduct gets a caution', () => {
  assert.equal(offerDeal(c()).kind, 'caution');
});
test('deals get worse with a record and better with good conduct', () => {
  const clean = offerDeal(c({ stars: 4, priors: 0, conduct: 0.6 })), record = offerDeal(c({ stars: 4, priors: 3, conduct: -0.5 }));
  assert.equal(clean.kind, 'reduced');
  assert.ok(record.fraction > clean.fraction);
});
test('honesty earns mercy; denying a strong case costs more', () => {
  const k = c({ stars: 4 });
  assert.equal(judge(k, 'remorse', 0.99).verdict, 'guilty');
  assert.ok(judge(k, 'remorse', 0.99).fraction < 1);
  assert.equal(judge(k, 'deny', 0.99).fraction, 1.25);
});
test('character speaks only when your life backs it up', () => {
  assert.ok(acquitChance(c({ stars: 3, conduct: 0.9 }), 'character') > acquitChance(c({ stars: 3, conduct: -0.9 }), 'character'));
  assert.equal(judge(c({ stars: 2, conduct: 0.9 }), 'character', 0).verdict, 'acquitted');
});
test('conduct comes from how a life was lived', () => {
  assert.ok(conductOf({ faith: { walk: 50, fruit: 40, drift: 0 }, churchYears: 10 }) > 0.5);
  assert.ok(conductOf({ faith: { walk: 0, fruit: 0, drift: 12 }, record: [{}, {}] }) < -0.5);
  assert.equal(conductOf(null), 0);
  assert.ok(fullSentence(c({ stars: 5, priors: 3 })) > fullSentence(c({ stars: 5 })));
});
