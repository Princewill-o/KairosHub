/**
 * Lasting consequences of a crash (or a fight): a wheelchair after serious
 * injuries, crutches and a limp after moderate ones. Shared across bundles.
 */
export type InjuryKind = "wheelchair" | "crutches";
export type Injury = { kind: InjuryKind; until: number; cause: string } | null;
const KEY = "kairos-injury";
export const INJURY: { current: Injury } = ((globalThis as { __kairosInjury?: { current: Injury } }).__kairosInjury ??= { current: (() => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); return v && v.until > Date.now() ? v : null; } catch { return null; } })() });
export function injure(kind: InjuryKind, ms: number, cause: string) {
  INJURY.current = { kind, until: Date.now() + ms, cause };
  try { localStorage.setItem(KEY, JSON.stringify(INJURY.current)); } catch { /* storage blocked */ }
}
export function healed() {
  INJURY.current = null;
  try { localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
export function activeInjury(now = Date.now()): Injury {
  if (INJURY.current && now > INJURY.current.until) healed();
  return INJURY.current;
}
/** How fast you can move while hurt. */
export const injurySpeed = (i: Injury) => (!i ? 1 : i.kind === "wheelchair" ? 0.5 : 0.62);
