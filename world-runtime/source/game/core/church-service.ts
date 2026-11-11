/**
 * The 2pm Sunday service in the Kharis sanctuary. The React overlay runs the
 * service; the 3D scene reads CHURCH_SCREEN every frame to draw the big
 * EasyWorship-style scripture screen and to fill the seats.
 */
export const CHURCH_SCREEN = {
  active: false,
  reference: "",
  lines: [] as string[],
  title: "",
  guests: [] as string[],
  version: 0,
};
export function setChurchScreen(next: Partial<Omit<typeof CHURCH_SCREEN, "version">>) {
  Object.assign(CHURCH_SCREEN, next);
  CHURCH_SCREEN.version++;
}

/**
 * Online quick play keeps the real week: Sunday, doors 1:30pm, service until 4pm.
 * In offline Kairos Life the church holds its 2pm service every game day, from
 * late morning to evening, so you never wait long to go.
 */
export function isServiceTime(date: Date, offline = false) {
  const m = date.getUTCHours() * 60 + date.getUTCMinutes();
  return offline ? m >= 10 * 60 && m < 20 * 60 : date.getUTCDay() === 0 && m >= 13 * 60 + 30 && m < 16 * 60;
}
export function nextServiceLabel(date: Date, offline = false) {
  if (isServiceTime(date, offline)) return "On now (2pm)";
  if (offline) return date.getUTCHours() >= 20 ? "Tomorrow, 2pm" : "Today, 2pm";
  const days = (7 - date.getUTCDay()) % 7 || (date.getUTCHours() >= 16 ? 7 : 0);
  return days === 0 ? "Today at 2pm" : days === 1 ? "Tomorrow, 2pm" : `Sunday 2pm (in ${days} days)`;
}

const BOOKS: Record<string, string> = { Genesis: "GEN", Psalm: "PSA", Psalms: "PSA", Mark: "MRK", Luke: "LUK", John: "JHN", Romans: "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", Ephesians: "EPH", Philippians: "PHP", Colossians: "COL", "1 Timothy": "1TI", "2 Timothy": "2TI", Hebrews: "HEB", James: "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN" };
/** Parse "Romans 10:17 · KJV" into the same-origin KJV route and a verse range. */
export function parseReading(reading: string) {
  const m = /^(.+?) (\d+):(\d+)(?:[–-](\d+))?/.exec(reading.replace(/ · KJV$/, ""));
  const code = m && BOOKS[m[1]];
  if (!m || !code) return null;
  return { code, chapter: +m[2], from: +m[3], to: +(m[4] || m[3]), url: `/api/scripture/${code}/${m[2]}?version=KJV` };
}
type Part = string | { text?: string; content?: Part[] };
const text = (p: Part): string => (typeof p === "string" ? p : p?.text ?? (p?.content || []).map(text).join(" "));
export async function kjvVerses(reading: string, signal?: AbortSignal) {
  const ref = parseReading(reading);
  if (!ref) throw Error("Unknown passage");
  const res = await fetch(ref.url, { signal });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "Passage unavailable");
  return ((data.chapter?.content || []) as { type: string; number: number; content: Part[] }[])
    .filter((v) => v.type === "verse" && v.number >= ref.from && v.number <= ref.to)
    .map((v) => `${v.number} ${text(v as unknown as Part).trim()}`);
}

/** Wrap text for the screen canvas. */
export function wrapLines(words: string, width: number, measure: (s: string) => number) {
  const out: string[] = [];
  let line = "";
  for (const w of words.split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next) > width && line) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}
