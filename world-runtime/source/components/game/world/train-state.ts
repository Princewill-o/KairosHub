import type { Ride } from "@/game/core/ride";

/** Shared start time for the visible Underground train and station trips. */
export const TRAIN_CALL = { at: -1 };
/** The ride you're on, if you're aboard a carriage. */
export const RIDE: { current: Ride | null } = { current: null };
/** Passengers you can sit beside and talk with (map pixels), filled in by the 3D scene. */
export const PASSENGERS: { x: number; y: number }[] = [];
