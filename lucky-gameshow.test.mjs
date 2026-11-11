import test from 'node:test';
import assert from 'node:assert/strict';
import * as LB from './world-runtime/source/game/core/lucky-blocks.ts';
import * as GS from './world-runtime/source/game/core/game-show.ts';

test('lucky blocks: 10% find chance, rarer tiers hold bigger outcomes', () => {
  assert.equal(LB.FIND_CHANCE, 0.1);
  const max = (t) => Math.max(...LB.OUTCOMES[t].map((o) => Math.abs(o.coins)));
  assert.ok(max('gold') < max('diamond') && max('diamond') < max('emerald') && max('emerald') < max('obsidian'));
  assert.ok(LB.OUTCOMES.obsidian.some((o) => o.id === 'millionaire') && LB.OUTCOMES.obsidian.some((o) => o.id === 'broke'));
  const w = Object.fromEntries(LB.TIERS.map((t) => [t.id, t.weight]));
  assert.ok(w.gold > w.diamond && w.diamond > w.emerald && w.emerald > w.obsidian);
  let n = 0; const r = () => (n = (n * 9301 + 49297) % 233280) / 233280;
  const counts = {}; for (let i = 0; i < 2000; i++) counts[LB.rollTier(r)] = (counts[LB.rollTier(r)] ?? 0) + 1;
  assert.ok((counts.gold ?? 0) > (counts.obsidian ?? 0));
});

test('game show: fifteen Bible questions, harder as you climb, safe havens and lifelines', () => {
  const g = GS.buildGame();
  assert.equal(g.length, 15);
  assert.equal(GS.LADDER[14], 1000000);
  for (let b = 0; b < 5; b++) for (const q of g.slice(b * 3, b * 3 + 3)) assert.ok(GS.BANDS[b].includes(q));
  assert.equal(GS.prizeFor(3, 'wrong'), 0);
  assert.equal(GS.prizeFor(7, 'wrong'), 1000);
  assert.equal(GS.prizeFor(12, 'wrong'), 32000);
  assert.equal(GS.prizeFor(6, 'walk'), 2000);
  const q = g[0];
  assert.ok(!GS.fiftyFifty(q).includes(q.answer));
  assert.equal(GS.askAudience(q, 0).reduce((a, b) => a + b, 0) >= 98, true);
});
