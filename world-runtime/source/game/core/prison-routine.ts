/**
 * HMP Thames daily routine, in the spirit of The Escapists: every prison day runs on a
 * timetable. Turn up where you should be and your behaviour record grows (enough of it
 * earns early release); skip roll call or get caught searching and the guards' heat rises.
 * Or quietly gather three items, craft an escape kit and slip out through the service door.
 * One routine day lasts PRISON_DAY_MS on the wall clock, shared by the HUD and the 3D inmates.
 */
export const PRISON_DAY_MS = 120_000;
export type Zone = { x: number; y: number; w: number; h: number };
export type PhaseId = "rollcall" | "meal" | "work" | "free" | "exercise" | "lights";
export type Phase = { id: PhaseId; label: string; from: number; to: number; where: string; zone: Zone | null; anim: string };

export const ZONES = {
  cells: { x: 1, y: 1, w: 24, h: 6 },
  hall: { x: 1, y: 8, w: 25, h: 3 },
  canteen: { x: 1, y: 12, w: 16, h: 5 },
  yard: { x: 18, y: 12, w: 8, h: 9 },
  work: { x: 1, y: 24, w: 25, h: 9 },
} as const satisfies Record<string, Zone>;

export const ROUTINE: Phase[] = [
  { id: "rollcall", label: "Roll call", from: 0, to: 0.12, where: "Line up in the hall outside the cells", zone: ZONES.hall, anim: "idle" },
  { id: "meal", label: "Meal time", from: 0.12, to: 0.27, where: "Eat in the canteen", zone: ZONES.canteen, anim: "sit" },
  { id: "work", label: "Work shift", from: 0.27, to: 0.5, where: "Work in the laundry and workshop (south)", zone: ZONES.work, anim: "read" },
  { id: "free", label: "Free time", from: 0.5, to: 0.65, where: "Free time: go anywhere inside", zone: null, anim: "talk" },
  { id: "exercise", label: "Exercise", from: 0.65, to: 0.8, where: "Work out in the yard (east of the canteen)", zone: ZONES.yard, anim: "cheer" },
  { id: "lights", label: "Lights out", from: 0.8, to: 1, where: "Back in your cell", zone: ZONES.cells, anim: "sleep" },
];

export function prisonPhase(now: number) {
  const day = Math.floor(now / PRISON_DAY_MS);
  const t = (now % PRISON_DAY_MS) / PRISON_DAY_MS;
  const index = ROUTINE.findIndex((p) => t >= p.from && t < p.to);
  const phase = ROUTINE[index < 0 ? 0 : index];
  return { day, t, index: Math.max(0, index), phase, key: `${day}:${phase.id}`, leftMs: Math.round((phase.to - t) * PRISON_DAY_MS) };
}
export const inZone = (z: Zone | null, x: number, y: number) => !z || (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h);

export type PrisonItem = "spoon" | "file" | "uniform";
export const ITEMS: Record<PrisonItem, { name: string; where: string; phase: PhaseId }> = {
  spoon: { name: "Bent spoon", where: "canteen tables", phase: "meal" },
  file: { name: "Metal file", where: "workshop bench", phase: "work" },
  uniform: { name: "Guard uniform", where: "laundry basket", phase: "work" },
};
export type PrisonState = { behaviour: number; heat: number; items: PrisonItem[]; kit: boolean; attended: string[]; missed: number; days: number; lastKey: string };
export const emptyPrison = (): PrisonState => ({ behaviour: 0, heat: 0, items: [], kit: false, attended: [], missed: 0, days: 0, lastKey: "" });
/** Behaviour points needed for release on good behaviour. */
export const PAROLE_POINTS = 8;
export const LOCKDOWN_HEAT = 100;

/**
 * One tick of the routine: call it often with your tile position. Being in the right
 * place earns a point once per phase; when a phase ends, missing a compulsory one
 * (roll call, work, lights out) costs heat. Heat cools a little every phase.
 */
export function routineTick(s: PrisonState, now: number, x: number, y: number): { state: PrisonState; say?: string } {
  const p = prisonPhase(now);
  let state = s, say: string | undefined;
  if (s.lastKey && s.lastKey !== p.key) {
    const [, prev] = s.lastKey.split(":") as [string, PhaseId];
    const compulsory = prev === "rollcall" || prev === "work" || prev === "lights";
    const went = s.attended.includes(s.lastKey);
    state = { ...state, heat: Math.max(0, state.heat - 6), days: prev === "lights" ? state.days + 1 : state.days };
    if (compulsory && !went) {
      state = { ...state, heat: state.heat + (prev === "rollcall" ? 30 : 15), missed: state.missed + 1, behaviour: Math.max(0, state.behaviour - 1) };
      say = prev === "rollcall" ? "You missed roll call. The guards are looking for you. Heat up." : `You skipped ${prev === "work" ? "your work shift" : "lights out"}. Heat up.`;
    }
  }
  state = { ...state, lastKey: p.key };
  if (p.phase.zone && inZone(p.phase.zone, x, y) && !state.attended.includes(p.key)) {
    state = { ...state, attended: [...state.attended.slice(-30), p.key], behaviour: state.behaviour + 1 };
    say = `${p.phase.label}: present. Good behaviour +1.`;
  }
  return { state, say };
}

/** Searching for an item: safe during its activity, risky any other time. */
export function search(s: PrisonState, item: PrisonItem, now: number): { state: PrisonState; say: string } {
  if (s.items.includes(item) || s.kit) return { state: s, say: `You already have the ${ITEMS[item].name.toLowerCase()}.` };
  const p = prisonPhase(now).phase;
  if (p.id !== ITEMS[item].phase && p.id !== "free") {
    return { state: { ...s, heat: s.heat + 25 }, say: `A guard spots you poking around the ${ITEMS[item].where} during ${p.label.toLowerCase()}. Heat +25.` };
  }
  return { state: { ...s, items: [...s.items, item] }, say: `You palm a ${ITEMS[item].name.toLowerCase()} and hide it in your sock.` };
}
export function craft(s: PrisonState): { state: PrisonState; say: string } {
  if (s.kit) return { state: s, say: "Your escape kit is ready. The service door is in the far south-east." };
  const missing = (Object.keys(ITEMS) as PrisonItem[]).filter((i) => !s.items.includes(i));
  if (missing.length) return { state: s, say: `To make an escape kit you still need: ${missing.map((i) => `${ITEMS[i].name} (${ITEMS[i].where})`).join(", ")}.` };
  return { state: { ...s, items: [], kit: true }, say: "You work the file and spoon into a door shim and roll up the uniform. Escape kit crafted." };
}
/** The service door: only opens with a kit, and only when the guards are busy (free time or lights out). */
export function tryEscape(s: PrisonState, now: number): { ok: boolean; say: string } {
  if (!s.kit) return { ok: false, say: "The service door is locked. Gather a spoon, a file and a uniform, then craft an escape kit in your cell." };
  const p = prisonPhase(now).phase;
  if (s.heat >= 60) return { ok: false, say: "Too much heat on you. Lie low and follow the routine until the guards relax." };
  if (p.id !== "free" && p.id !== "lights") return { ok: false, say: "Guards are watching the door. Try during free time or after lights out." };
  return { ok: true, say: "Dressed as a guard, you shim the service door and walk out into the night." };
}
export const paroleReady = (s: PrisonState) => s.behaviour >= PAROLE_POINTS && s.heat < 30;
