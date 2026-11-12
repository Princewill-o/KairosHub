/**
 * The UK map: every Kharis branch city as a place you can visit, joined by trains,
 * coaches and Kairos Air. London is the existing city; KP2 London is Kharis Forest
 * (Spurgeon's College); every other branch gets its own town with a high street,
 * a station, a coach stop and its Kharis branch church you can walk into.
 */
import { BRANCHES } from "../../../../public/kharis-data.mjs";
import { churchMap, type Portal, type Structure, type WorldMap } from "./world";

const TILE = 32;
export type TravelMode = "train" | "coach" | "flight";
export type UkCity = { id: string; name: string; x: number; y: number; airport?: boolean; intl?: boolean; region: string; colour: string; shops: string[] };

// x, y on a 300 × 480 map of Great Britain (longitude/latitude projected), plus the
// two international branches drawn in an inset.
export const UK_CITIES: UkCity[] = [
  { id: "london", name: "London", x: 220, y: 397, airport: true, region: "Greater London", colour: "#bba8df", shops: [] },
  { id: "kp2", name: "KP2 London", x: 212, y: 404, region: "South London", colour: "#83ad72", shops: [] },
  { id: "birmingham", name: "Birmingham", x: 154, y: 343, airport: true, region: "West Midlands", colour: "#c98a5a", shops: ["Bullring Market", "Balti House", "Canal Café"] },
  { id: "brighton", name: "Brighton", x: 220, y: 436, region: "East Sussex", colour: "#7cc3d6", shops: ["Pier Arcade", "Fish & Chips", "Lanes Books"] },
  { id: "bristol", name: "Bristol", x: 128, y: 400, airport: true, region: "South West", colour: "#d1795a", shops: ["Harbourside Deli", "Clifton Café", "Record Shop"] },
  { id: "chatham", name: "Chatham", x: 246, y: 405, region: "Kent", colour: "#8fa6c2", shops: ["Dockyard Café", "High Street Bakery", "Pharmacy"] },
  { id: "chelmsford", name: "Chelmsford", x: 244, y: 384, region: "Essex", colour: "#a6c27a", shops: ["Market Hall", "Coffee House", "Barber"] },
  { id: "coventry", name: "Coventry", x: 168, y: 347, region: "West Midlands", colour: "#b98fc9", shops: ["Cathedral Café", "Motor Museum Shop", "Bakery"] },
  { id: "croydon", name: "Croydon", x: 221, y: 411, region: "South London", colour: "#e0a34a", shops: ["Boxpark", "Caribbean Kitchen", "Phone Repairs"] },
  { id: "luton", name: "Luton", x: 208, y: 376, airport: true, region: "Bedfordshire", colour: "#d65f5f", shops: ["Hat Shop", "Mall Food Court", "Grocer"] },
  { id: "manchester", name: "Manchester", x: 141, y: 288, airport: true, region: "North West", colour: "#e05a5a", shops: ["Northern Quarter Café", "Curry Mile", "Vinyl Store"] },
  { id: "northampton", name: "Northampton", x: 190, y: 356, region: "Northamptonshire", colour: "#7a9bd6", shops: ["Shoe Maker", "Market Square Café", "Library"] },
  { id: "nottingham", name: "Nottingham", x: 182, y: 317, region: "East Midlands", colour: "#6fb08a", shops: ["Lace Market Café", "Castle Gifts", "Bookshop"] },
  { id: "orpington", name: "Orpington", x: 231, y: 412, region: "South East London", colour: "#c2b06f", shops: ["Walnuts Café", "Newsagent", "Florist"] },
  { id: "reading", name: "Reading", x: 189, y: 400, region: "Berkshire", colour: "#5f9fb8", shops: ["Oracle Café", "Riverside Deli", "Music Shop"] },
  { id: "accra", name: "Accra", x: 200, y: 512, airport: true, intl: true, region: "Ghana", colour: "#e8b23a", shops: ["Makola Market", "Jollof Kitchen", "Kente Weavers"] },
  { id: "freetown", name: "Freetown", x: 120, y: 512, airport: true, intl: true, region: "Sierra Leone", colour: "#3aa86b", shops: ["Big Market", "Cotton Tree Café", "Fabric Stall"] },
];
// Keep the city list in step with the Kharis branches.
if (UK_CITIES.length !== BRANCHES.length) console.warn("UK map and Kharis branches differ");

export const cityById = (id: string) => UK_CITIES.find((c) => c.id === id) ?? null;
/** The world map for a city. */
export const mapForCity = (id: string) => (id === "london" ? "city" : id === "kp2" ? "woodland" : `uk-${id}`);
/** Which city a map belongs to (for "you are here"). */
export function cityForMap(mapId: string): string {
  if (mapId.startsWith("uk-")) return mapId.slice(3);
  if (mapId.startsWith("branch-")) return mapId.slice(7);
  if (mapId === "woodland" || mapId === "church") return "kp2";
  return "london";
}
/** Rough real-world miles between two pins (the map is ~2.9 miles per unit). */
export function distanceMiles(a: UkCity, b: UkCity) {
  if (a.intl || b.intl) return a.id === b.id ? 0 : a.intl && b.intl ? 300 : 3200;
  return Math.max(4, Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 2.9));
}
/** Which ways you can go, with fare (Grace / £) and journey time in minutes. */
export function travelOptions(from: string, to: string) {
  const a = cityById(from), b = cityById(to);
  if (!a || !b || a.id === b.id) return [];
  const miles = distanceMiles(a, b);
  const out: { mode: TravelMode; label: string; fare: number; minutes: number }[] = [];
  if (!a.intl && !b.intl) {
    out.push({ mode: "train", label: "Train", fare: Math.round(8 + miles * 0.22), minutes: Math.round(15 + miles * 0.75) });
    out.push({ mode: "coach", label: "Coach", fare: Math.round(4 + miles * 0.08), minutes: Math.round(20 + miles * 1.5) });
  }
  if ((a.airport || a.intl) && (b.airport || b.intl) && (a.intl || b.intl || miles > 90))
    out.push({ mode: "flight", label: "Kairos Air", fare: Math.round(a.intl || b.intl ? 420 : 60 + miles * 0.2), minutes: Math.round(a.intl || b.intl ? 390 : 55) });
  return out;
}

const blank = (cols: number, rows: number, ch: string) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => ch));
const rect = (x: number, y: number, w = 1, h = 1) => ({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });
const seeded = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); };

/** A branch town: high street, station, coach stop, park, homes and the Kharis branch church. */
export function ukCityMap(id: string): WorldMap | null {
  const c = cityById(id.replace(/^uk-/, ""));
  if (!c || c.id === "london" || c.id === "kp2") return null;
  const cols = 46, rows = 36, r = seeded(c.id);
  const t = blank(cols, rows, "g");
  const fill = (x: number, y: number, w: number, h: number, ch: string) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (t[j]?.[i] !== undefined) t[j][i] = ch; };
  // Tree belt round the edge, then the streets.
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (x < 2 || y < 2 || x >= cols - 2 || y >= rows - 2) t[y][x] = (x + y) % 2 ? "T" : "g";
  fill(2, 16, cols - 4, 2, "="); fill(2, 15, cols - 4, 1, "-"); fill(2, 18, cols - 4, 1, "-");
  fill(21, 2, 3, 13, "-"); fill(21, 19, 3, 15, "-");
  const structures: Structure[] = [];
  const portals: Portal[] = [];
  const build = (s: Structure) => { fill(s.x, s.y, s.w, s.h, "X"); structures.push(s); };
  // The Kharis branch church, north-east, with its own forecourt.
  build({ x: 27, y: 3, w: 13, h: 9, label: `Kharis ${c.name}`, accent: "#6b3fa0", door: "bottom" });
  fill(30, 12, 7, 3, "-"); fill(32, 12, 3, 3, "_");
  portals.push({ id: `branch-door-${c.id}`, rect: rect(32, 12, 3), label: `Kharis ${c.name} · go inside`, to: { kind: "map", mapId: `branch-${c.id}`, label: `Kharis ${c.name}` } });
  // High street shops, north-west.
  c.shops.forEach((name, i) => build({ x: 3 + i * 6, y: 8, w: 5, h: 6, label: name, accent: ["#c96b3a", "#3a8fc9", "#6b9e3a"][i % 3], door: "bottom" }));
  // Station (or airport terminal for the international branches), south-west.
  const hub = c.intl ? `${c.name} International Airport` : `${c.name} Station`;
  build({ x: 3, y: 21, w: 12, h: 6, label: hub, accent: c.intl ? "#2b5fd9" : "#13203a", door: "top" });
  fill(5, 19, 8, 2, "-");
  portals.push({ id: `travel-${c.id}`, rect: rect(7, 19, 3, 1), label: c.intl ? "Kairos Air · fly to the UK" : `${c.name} Station · trains across the UK`, to: { kind: "uk", from: c.id, mode: c.intl ? "flight" : "train" } });
  if (!c.intl) {
    t[19][17] = "B"; t[19][18] = "L";
    portals.push({ id: `coach-${c.id}`, rect: rect(15, 19, 2, 1), label: "Coach stop · National Express-style coaches", to: { kind: "uk", from: c.id, mode: "coach" } });
  }
  // Homes, south-east, in two short terraces.
  for (const [x, y] of [[26, 21], [35, 21], [26, 28], [35, 28]] as const) build({ x, y, w: 7, h: 4, label: "Homes", accent: c.colour, door: "top" });
  fill(25, 26, 18, 1, "-");
  // A park with flowers, benches and lamps, south.
  fill(3, 29, 16, 5, "g");
  for (let i = 0; i < 18; i++) { const x = 3 + Math.floor(r() * 16), y = 29 + Math.floor(r() * 5); t[y][x] = r() < 0.5 ? "f" : "T"; }
  for (const x of [5, 10, 15]) t[28][x] = "B";
  for (const x of [8, 13]) t[28][x] = "L";
  // Street lamps along the high street.
  for (let x = 4; x < cols - 4; x += 6) if (t[15][x] === "-") t[15][x] = "L";
  return {
    id: `uk-${c.id}`, kind: "woodland", name: c.intl ? `${c.name}, ${c.region}` : `${c.name} · ${c.region}`, accent: c.colour,
    cols, rows, width: cols * TILE, height: rows * TILE, tiles: t.map((row) => row.join("")),
    structures, portals, rooms: [], spawn: { x: 8.5 * TILE, y: 18.5 * TILE },
    sign: { x: 22, y: 17, text: `WELCOME TO ${c.name.toUpperCase()} · KHARIS ${c.name.toUpperCase()}` },
  };
}

/** Inside a branch church: the same sanctuary, with its own name and a way back out. */
export function branchChurchMap(id: string): WorldMap | null {
  const c = cityById(id.replace(/^branch-/, ""));
  if (!c || c.id === "london" || c.id === "kp2") return null;
  const m = churchMap();
  return { ...m, id: `branch-${c.id}`, name: `Kharis ${c.name}`, portals: [{ id: "branch-exit", rect: rect(12, 21, 2, 1), label: `Back out to ${c.name}`, to: { kind: "map", mapId: `uk-${c.id}`, label: c.name } }] };
}
/** Any church sanctuary map (main church, life branch, or a UK branch). */
export const isChurchMap = (id: string) => id === "church" || id === "branch" || id.startsWith("branch-");
