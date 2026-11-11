import test from 'node:test';
import assert from 'node:assert/strict';
import { encounter, roleFor } from './world-runtime/source/game/core/npc-encounters.ts';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const story = (o = {}) => ({ offline: true, age: 30, saved: true, stars: 0, record: 0, inPrison: false, mapKind: 'city', hour: 14, money: 100, job: null, sunday: false, ...o });
const who = (role, name = 'Sam') => ({ index: 1, name, role });

test('officers respond to your story: wanted, a record, or a clean slate', () => {
  assert.ok(encounter(who('officer'), story({ stars: 2 })).choices.some((c) => c.world === 'hand-in'));
  assert.match(encounter(who('officer'), story({ record: 1 })).line, /trouble/);
  assert.ok(!encounter(who('officer'), story()).choices.some((c) => c.world === 'hand-in'));
});
test('only believers old enough can share their faith; children get play, not dares', () => {
  assert.ok(encounter(who('seeker'), story()).choices.some((c) => c.world === 'preach'));
  assert.ok(!encounter(who('seeker'), story({ saved: false })).choices.some((c) => c.world === 'preach'));
  assert.match(encounter(who('teen'), story({ age: 9 })).line, /football/);
});
test('inside, people are inmates and guards; every encounter has choices', () => {
  assert.equal(roleFor(3, 'prison', false), 'guard');
  assert.equal(roleFor(4, 'prison', false), 'inmate');
  assert.equal(roleFor(4, 'city', true), 'officer');
  for (const role of ['officer', 'child', 'teen', 'elder', 'worker', 'need', 'seeker', 'church', 'neighbour', 'inmate', 'guard', 'tourist'])
    assert.ok(encounter(who(role), story(), 1).choices.length >= 2, role);
});
test('choices feed Kairos Life', async () => {
  const out = await build({ entryPoints: ['./world-runtime/source/game/core/kairos-life.ts'], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  const f = `/tmp/kl-enc-${process.pid}.mjs`; await fs.writeFile(f, out.outputFiles[0].text);
  const L = await import(pathToFileURL(f).href);
  const s = L.newLife({ first: 'Ada', last: 'Bell', sex: 'female', city: 'london' }, L.makeRng(4));
  const kind = encounter(who('need', 'Jo'), story()).choices[0];
  const after = L.encountered(s, { who: 'Jo', choice: kind.label, effect: kind.life });
  assert.ok(after.faith.fruit > s.faith.fruit);
  assert.ok(after.log.some((l) => l.kind === 'encounter'));
});
