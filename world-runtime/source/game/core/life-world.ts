/** What the 3D scene needs from Kairos Life: the family who appear around you. */
export type WorldFamilyMember = { name: string; relation: string; age: number; sex: string };
type LifeWorld = { family: WorldFamilyMember[]; branch: null | { city: string; name: string; members: number }; near: WorldFamilyMember | null; approach: WorldFamilyMember | null };
// One shared object across the app and 3D-scene bundles (separate module copies would hide your family).
export const LIFE_WORLD: LifeWorld = ((globalThis as { __kairosLifeWorld?: LifeWorld }).__kairosLifeWorld ??= { family: [], branch: null, near: null, approach: null });
export function setWorldBranch(branch: typeof LIFE_WORLD.branch) { LIFE_WORLD.branch = branch; }
export function setWorldFamily(family: WorldFamilyMember[]) { LIFE_WORLD.family = family; }
export const familySeed = (name: string) => { let h = 7; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 997; };

/** The flight in progress, so the cabin scene can climb through the clouds and descend again. */
export const FLIGHT: { start: number; ms: number } = ((globalThis as { __kairosFlight?: { start: number; ms: number } }).__kairosFlight ??= { start: 0, ms: 0 });
/** 0 on the ground, 1 at cruising height: climb in the first 15%, descend in the last 15%. */
export function flightAltitude(now: number) {
  if (!FLIGHT.ms) return 1;
  const p = Math.max(0, Math.min(1, (now - FLIGHT.start) / FLIGHT.ms));
  const ease = (t: number) => t * t * (3 - 2 * t);
  return p < 0.15 ? ease(p / 0.15) : p > 0.85 ? ease((1 - p) / 0.15) : 1;
}
