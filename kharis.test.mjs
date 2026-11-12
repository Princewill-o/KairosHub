import test from 'node:test';
import assert from 'node:assert/strict';
import * as K from './public/kharis-data.mjs';
import * as ids from './server/kharis-ids.mjs';
import { bibleGames } from './public/bible/content.mjs';
import { bibleGames as serverGames } from './server/bible-game-ids.mjs';

test('server id lists match the shared Kharis and Bible game data', () => {
  assert.deepEqual([...ids.BRANCH_IDS], K.BRANCHES.map((x) => x.id));
  assert.deepEqual([...ids.DEPARTMENT_IDS], K.DEPARTMENTS.map((x) => x.id));
  assert.deepEqual([...ids.SERVING_IDS], K.SERVING.map((x) => x.id));
  assert.deepEqual([...ids.SERMON_IDS], K.SERMON_GAMES.map((x) => x.id));
  assert.deepEqual(serverGames.map((g) => g.id), bibleGames.map((g) => g.id));
});
test('every department has serving scenarios with one best answer; sermon games have a right action each round', () => {
  assert.equal(K.DEPARTMENTS.length, 19);
  for (const d of K.DEPARTMENTS) assert.ok(K.SERVING.some((s) => s.dept === d.id), d.id);
  for (const s of K.SERVING) { assert.ok(K.departmentById(s.dept)); assert.equal(s.options.filter((o) => o.score === 3).length, 1, s.id); }
  for (const g of K.SERMON_GAMES) for (const r of g.rounds) assert.equal(r.actions.filter((a) => a.ok).length, 1, g.id);
  assert.equal(K.nameTagLabel('croydon', 'ushers'), 'Kharis Croydon · Ushers');
});
test('server name check matches the browser accounts rule', async () => {
  const a = await import('./public/accounts.mjs'); const s = await import('./server/check-name.mjs');
  for (const n of ['', 'Kofi', 'Ama-Rose', 'x'.repeat(21), '123', "O'Neil", ' Zoë ']) assert.deepEqual(s.checkName(n), a.checkName(n));
});
