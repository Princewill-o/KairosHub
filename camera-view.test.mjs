import test from 'node:test';
import assert from 'node:assert/strict';
import { steerInput, nextMode } from './world-runtime/source/game/core/camera-view.ts';

const near = (a, b) => Math.abs(a - b) < 1e-9;
test('classic view keeps screen-relative walking', () => {
  assert.deepEqual(steerInput('classic', 0, 1, -1, 0.1), { dx: 1, dy: -1, yaw: 0 });
});
test('first person: W walks the way you face, A/D strafe, arrows turn', () => {
  const north = -Math.PI / 2;
  const w = steerInput('first', north, 0, -1, 0.1);
  assert.ok(near(w.dx, 0) && near(w.dy, -1) && w.yaw === north);
  // D while facing north steps east (right), without turning.
  const d = steerInput('behind', north, 1, 0, 0.5);
  assert.ok(near(d.dx, 1) && near(d.dy, 0) && d.yaw === north);
  // Arrow keys / turn input rotate the view.
  const t = steerInput('behind', 0, 0, 0, 0.5, 1);
  assert.ok(t.yaw > 0 && near(t.dx, 0) && near(t.dy, 0));
  const s = steerInput('first', 0, 0, 1, 0.1);
  assert.ok(near(s.dx, -1));
  // Diagonals are not faster than straight lines.
  const diag = steerInput('first', north, 1, -1, 0.1);
  assert.ok(near(Math.hypot(diag.dx, diag.dy), 1));
});
test('views cycle close ↔ first person (classic falls back to close)', () => {
  assert.equal(nextMode('classic'), 'behind');
  assert.equal(nextMode('behind'), 'first');
  assert.equal(nextMode('first'), 'behind');
});
test('church: open pew places are left free and you can sit in the nearest one', async () => {
  const c = await import('./world-runtime/source/game/core/camera-view.ts');
  const seats = c.churchSeats();
  const open = seats.filter((_, i) => c.isOpenSeat(i));
  assert.ok(open.length >= 8);
  const target = open[3];
  const found = c.nearestOpenSeat(target.x + 0.3, target.z + 0.4);
  assert.deepEqual(found, target);
  assert.equal(c.nearestOpenSeat(100, 100), null);
});
