/**
 * Camera views for walking about: the classic overhead follow, a close
 * over-the-shoulder view, and first person (with your fists in frame).
 * In the close and first-person views W/S move along the way you face, A/D
 * strafe, and the arrow keys (or Q/E, or dragging the view) turn. Shared by movement and rendering.
 */
export type CameraMode = "classic" | "behind" | "first";
/** The main views are close (over the shoulder) and first person; classic overhead is still supported. */
export const CAMERA_MODES: CameraMode[] = ["behind", "first"];
export const CAMERA_LABEL: Record<CameraMode, string> = { classic: "Classic", behind: "Close", first: "First person" };
/** yaw: the facing direction in map space, (cos yaw, sin yaw), y pointing down/south. */
// One shared object even when the 3D renderer is bundled separately from movement.
type View = { mode: CameraMode; yaw: number; punchAt: number; pushAt?: number };
const g = globalThis as unknown as { __kairosCamera?: View };
export const CAMERA_VIEW: View = (g.__kairosCamera ??= { mode: "behind", yaw: -Math.PI / 2, punchAt: -10 });
export const TURN_SPEED = 2.6; // radians per second while the turn keys are held

export function nextMode(m: CameraMode): CameraMode {
  const i = CAMERA_MODES.indexOf(m);
  return CAMERA_MODES[i < 0 ? 0 : (i + 1) % CAMERA_MODES.length];
}

/**
 * Turn raw input (dx right, dy down, both -1..1) into a map-space walking
 * direction and the new yaw. Classic view keeps screen-relative walking.
 */
export function steerInput(mode: CameraMode, yaw: number, dx: number, dy: number, dt: number, turn = 0) {
  if (mode === "classic") return { dx, dy, yaw };
  const turned = yaw + turn * TURN_SPEED * dt;
  const forward = -dy, right = dx;
  // Facing is (cos, sin) with y pointing south; the right-hand side is (-sin, cos).
  let mx = Math.cos(turned) * forward - Math.sin(turned) * right;
  let my = Math.sin(turned) * forward + Math.cos(turned) * right;
  const len = Math.hypot(mx, my);
  if (len > 1) { mx /= len; my /= len; }
  return { dx: mx, dy: my, yaw: turned };
}

/**
 * Sitting down. The seat is in 3D world units (1 = one tile); pose is what your hands
 * do while seated: resting on your lap, folded in prayer, or raised in worship.
 */
export type SeatPose = "sit" | "pray" | "worship";
export type Seat = { x: number; z: number; yaw: number; pose: SeatPose };
const s = globalThis as unknown as { __kairosSeat?: { seat: Seat | null } };
export const SEAT: { seat: Seat | null } = (s.__kairosSeat ??= { seat: null });
export const SEAT_POSES: SeatPose[] = ["sit", "pray", "worship"];

/** Every pew place in Kharis Church (and branch churches), front to back. */
export function churchSeats() {
  const seats: { x: number; z: number }[] = [];
  for (let z = 7.7; z < 18.6; z += 1.2) for (const x0 of [3.5, 15.5]) for (let x = x0; x < x0 + 6.5; x += 1.05) seats.push({ x, z });
  return seats;
}
/** Seats the congregation leaves for you (one in ten along every pew). */
export const isOpenSeat = (i: number) => (i * 7) % 10 >= 9;

/** The nearest open pew place within reach of (x, z), or null. */
export function nearestOpenSeat(x: number, z: number, reach = 2.6) {
  let best: { x: number; z: number } | null = null, d = reach * reach;
  churchSeats().forEach((seat, i) => {
    if (!isOpenSeat(i)) return;
    const e = (seat.x - x) ** 2 + (seat.z - z) ** 2;
    if (e < d) { d = e; best = seat; }
  });
  return best as { x: number; z: number } | null;
}
