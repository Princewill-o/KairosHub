/**
 * Camera views for walking about: the classic overhead follow, a close
 * over-the-shoulder view, and first person (with your fists in frame).
 * In the close and first-person views W/S move along the way you face and
 * A/D turn; dragging the view turns too. Shared by movement and rendering.
 */
export type CameraMode = "classic" | "behind" | "first";
export const CAMERA_MODES: CameraMode[] = ["classic", "behind", "first"];
export const CAMERA_LABEL: Record<CameraMode, string> = { classic: "Classic", behind: "Close", first: "First person" };
/** yaw: the facing direction in map space, (cos yaw, sin yaw), y pointing down/south. */
// One shared object even when the 3D renderer is bundled separately from movement.
type View = { mode: CameraMode; yaw: number; punchAt: number };
const g = globalThis as unknown as { __kairosCamera?: View };
export const CAMERA_VIEW: View = (g.__kairosCamera ??= { mode: "classic", yaw: -Math.PI / 2, punchAt: -10 });
export const TURN_SPEED = 2.6; // radians per second while A/D are held

export function nextMode(m: CameraMode): CameraMode {
  return CAMERA_MODES[(CAMERA_MODES.indexOf(m) + 1) % CAMERA_MODES.length];
}

/**
 * Turn raw input (dx right, dy down, both -1..1) into a map-space walking
 * direction and the new yaw. Classic view keeps screen-relative walking.
 */
export function steerInput(mode: CameraMode, yaw: number, dx: number, dy: number, dt: number) {
  if (mode === "classic") return { dx, dy, yaw };
  const turned = yaw + dx * TURN_SPEED * dt;
  const forward = -dy;
  return { dx: Math.cos(turned) * forward, dy: Math.sin(turned) * forward, yaw: turned };
}
