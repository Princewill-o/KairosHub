export const JUMP_IMPULSE = 5.8;
export const JUMP_GRAVITY = 14;
/** Jumping changes elevation only. Horizontal movement keeps its normal wall and water collisions. */
export function advanceJump(height: number, velocity: number, elapsed: number) {
  const dt = Math.max(0, Math.min(.05, elapsed));
  if (height === 0 && velocity === 0) return { height: 0, velocity: 0 };
  const nextVelocity = velocity - JUMP_GRAVITY * dt;
  const nextHeight = Math.max(0, height + nextVelocity * dt);
  return { height: nextHeight, velocity: nextHeight === 0 ? 0 : nextVelocity };
}
