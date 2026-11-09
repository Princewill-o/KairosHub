/** A crash in progress on the current map (tiles), shared by the 3D scene and the HUD. */
export interface Crash { map: string; x: number; y: number; at: number; vehicle: "car" | "bike"; car?: string | null; heading: number }
export const CRASH: { current: Crash | null } = { current: null };
/** Seconds from the crash until the ambulance pulls up, and until it leaves for hospital. */
export const AMBULANCE_ARRIVES = 4.5;
export const AMBULANCE_LEAVES = 8.5;
/** The parcel currently on its way to your house (set by the HUD, drawn in 3D). */
export interface DeliveryRun { id: string; status: "packing" | "on-the-way" | "arriving" | "delivered"; placed: number; eta: number; express: boolean }
export const DELIVERY_RUN: { current: DeliveryRun | null } = { current: null };
/**
 * Seamless swaps: the scene you're leaving hands over its last frame, which
 * stays on screen until the next scene has finished building, then dissolves.
 */
export const VEIL: { take: (() => string | null) | null } = { take: null };
export const SCENE_READY = "kairos-scene-ready";
