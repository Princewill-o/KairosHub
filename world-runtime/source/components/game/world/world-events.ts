/** A crash in progress on the current map (tiles), shared by the 3D scene and the HUD. */
export interface Crash { map: string; x: number; y: number; at: number; vehicle: "car" | "bike"; car?: string | null; heading: number }
export const CRASH: { current: Crash | null } = { current: null };
/** Seconds from the crash until the ambulance pulls up, and until it leaves for hospital. */
export const AMBULANCE_ARRIVES = 4.5;
export const AMBULANCE_LEAVES = 8.5;
