import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from './world-runtime/source/game/core/prison-routine.ts';

const at = (id) => { const p = P.ROUTINE.find((x) => x.id === id); return Math.round((p.from + p.to) / 2 * P.PRISON_DAY_MS); };

test('the timetable covers the whole day in order', () => {
  assert.equal(P.ROUTINE[0].from, 0); assert.equal(P.ROUTINE.at(-1).to, 1);
  for (let i = 1; i < P.ROUTINE.length; i++) assert.equal(P.ROUTINE[i].from, P.ROUTINE[i - 1].to);
  assert.equal(P.prisonPhase(at('meal')).phase.id, 'meal');
});
test('turning up earns behaviour once; missing roll call raises heat', () => {
  let s = P.emptyPrison();
  s = P.routineTick(s, at('rollcall'), 5, 9).state;
  s = P.routineTick(s, at('rollcall') + 100, 5, 9).state;
  assert.equal(s.behaviour, 1);
  // Next day: stay in your cell through roll call, then the meal begins.
  let t = P.PRISON_DAY_MS + at('rollcall');
  s = P.routineTick(s, t, 3, 3).state;
  const r = P.routineTick(s, P.PRISON_DAY_MS + at('meal'), 3, 3);
  assert.ok(r.state.heat >= 30 && /roll call/.test(r.say));
});
test('escape needs all three items, a kit, low heat and the right time', () => {
  let s = P.emptyPrison();
  assert.equal(P.tryEscape(s, at('free')).ok, false);
  const caught = P.search(s, 'file', at('meal'));
  assert.equal(caught.state.heat, 25);
  s = P.search(s, 'spoon', at('meal')).state;
  s = P.search(s, 'file', at('work')).state;
  assert.match(P.craft(s).say, /Guard uniform/);
  s = P.search(s, 'uniform', at('work')).state;
  s = P.craft(s).state;
  assert.ok(s.kit);
  assert.equal(P.tryEscape(s, at('work')).ok, false);
  assert.equal(P.tryEscape(s, at('lights')).ok, true);
});
test('good behaviour earns parole', () => {
  assert.equal(P.paroleReady({ ...P.emptyPrison(), behaviour: P.PAROLE_POINTS }), true);
  assert.equal(P.paroleReady({ ...P.emptyPrison(), behaviour: P.PAROLE_POINTS, heat: 50 }), false);
});
