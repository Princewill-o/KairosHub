import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const out = await build({ stdin: { contents: "export * from './world-runtime/source/game/core/uk.ts'; export { islandStations, GRACE_LINE } from './world-runtime/source/game/core/islands.ts';", resolveDir: '.', loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', alias: { '@': './world-runtime/source' }, logLevel: 'silent' });
const U = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
import { BRANCHES } from './public/kharis-data.mjs';

test('every Kharis branch is a place on the UK map with its own town and church', () => {
  assert.deepEqual(U.UK_CITIES.map((c) => c.id), BRANCHES.map((b) => b.id));
  for (const c of U.UK_CITIES) {
    const id = U.mapForCity(c.id);
    if (c.id === 'london' || c.id === 'kp2') continue;
    const m = U.ukCityMap(id);
    assert.ok(m, c.id); assert.equal(m.tiles.length, m.rows);
    assert.ok(m.portals.some((p) => p.to.kind === 'map' && p.to.mapId === `branch-${c.id}`));
    assert.ok(m.portals.some((p) => p.to.kind === 'uk'));
    const church = U.branchChurchMap(`branch-${c.id}`);
    assert.equal(church.portals[0].to.mapId, id);
    assert.equal(U.cityForMap(church.id), c.id);
  }
});
test('trains and coaches run between UK branches; international branches fly', () => {
  const opts = U.travelOptions('manchester', 'bristol').map((o) => o.mode);
  assert.deepEqual(opts.sort(), ['coach', 'flight', 'train']);
  assert.deepEqual(U.travelOptions('croydon', 'accra').map((o) => o.mode), []);
  assert.deepEqual(U.travelOptions('london', 'accra').map((o) => o.mode), ['flight']);
  const [train, coach] = U.travelOptions('reading', 'birmingham');
  assert.ok(coach.fare < train.fare && coach.minutes > train.minutes);
});
test('LTBS is its own world: the Grace Line skips it', () => {
  assert.ok(!U.GRACE_LINE.some((i) => i.id === 'scripture-island'));
  assert.ok(!U.islandStations().some((s) => s.id === 'scripture-gardens'));
});
