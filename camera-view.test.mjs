import test from 'node:test';
import assert from 'node:assert/strict';
import { steerInput, nextMode } from './world-runtime/source/game/core/camera-view.ts';

const near = (a, b) => Math.abs(a - b) < 1e-9;
test('classic view keeps screen-relative walking', () => {
  assert.deepEqual(steerInput('classic', 0, 1, -1, 0.1), { dx: 1, dy: -1, yaw: 0 });
});
test('first person: W walks the way you face, A/D turn', () => {
  const north = -Math.PI / 2;
  const w = steerInput('first', north, 0, -1, 0.1);
  assert.ok(near(w.dx, 0) && near(w.dy, -1) && w.yaw === north);
  const d = steerInput('behind', 0, 1, 0, 0.5);
  assert.ok(d.yaw > 0 && near(d.dx, 0) && near(d.dy, 0));
  const s = steerInput('first', 0, 0, 1, 0.1);
  assert.ok(near(s.dx, -1));
});
test('views cycle close ↔ first person (classic falls back to close)', () => {
  assert.equal(nextMode('classic'), 'behind');
  assert.equal(nextMode('behind'), 'first');
  assert.equal(nextMode('first'), 'behind');
});
