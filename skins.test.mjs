import test from 'node:test';
import assert from 'node:assert/strict';
import { SKIN_PARTS, faces, paintSkin } from './public/kairos-skins.mjs';
import { normalizeAvatar, avatarDefaults } from './public/avatar.mjs';

test('skin parts follow the standard 64x64 Minecraft layout', () => {
  assert.deepEqual(faces(SKIN_PARTS.head.at, SKIN_PARTS.head.size).front, [8, 8, 8, 8]);
  assert.deepEqual(faces(SKIN_PARTS.body.at, SKIN_PARTS.body.size).front, [20, 20, 8, 12]);
  assert.deepEqual(faces(SKIN_PARTS.rightArm.at, SKIN_PARTS.rightArm.size).front, [44, 20, 4, 12]);
  assert.deepEqual(faces(SKIN_PARTS.leftLeg.at, SKIN_PARTS.leftLeg.size).front, [20, 52, 4, 12]);
  assert.deepEqual(SKIN_PARTS.head.over, [32, 0]);
});

test('painting fills every base face and stays inside 64x64', () => {
  const calls = [];
  const ctx = { clearRect() {}, fillRect(x, y, w, h) { calls.push([x, y, w, h]); }, set fillStyle(v) { assert.match(v, /^#[0-9a-f]{6}$/); } };
  paintSkin(ctx, { ...avatarDefaults, outfit: 'suit', hat: 'police', glasses: true });
  assert.ok(calls.length > 1500);
  for (const [x, y] of calls) assert.ok(x >= 0 && x < 64 && y >= 0 && y < 64);
});

test('uploaded Minecraft skins are kept only as small PNG data URLs', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal(normalizeAvatar({ skin64: png }).skin64, png);
  assert.equal(normalizeAvatar({ skin64: 'javascript:alert(1)' }).skin64, undefined);
  assert.equal(normalizeAvatar({ skin64: 'data:image/png;base64,' + 'A'.repeat(50000) }).skin64, undefined);
});
