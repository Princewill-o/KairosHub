/**
 * Walk-in lobbies: buildings that used to pop a menu open are now real rooms.
 * Walk in through the door, wander past the reception and the machines, and
 * press E at a cabinet or kiosk to open that game or story.
 * Lobby ids are `lobby-<spec>@<island>`, so the exit always leads back out
 * the same door you came in.
 */
import { graceGames } from "../../../../public/grace-catalog.mjs";
import { TILE, type Portal, type PortalTarget, type WorldMap } from "./world";

export interface Cabinet { label: string; to: PortalTarget; colour: string }
export interface LobbySpec { name: string; accent: string; style: "arcade" | "lounge" | "theatre" | "library" | "mall"; cabinets: Cabinet[] }

const GAME_COLOURS = ["#8c68b6", "#c19148", "#598e78", "#638ba6"];
export const LOBBY_SPECS: Record<string, LobbySpec> = {
  "grace-hall": { name: "Grace Game Hall", accent: "#6b3fa0", style: "arcade",
    cabinets: graceGames.map((g, i) => ({ label: g.name, to: { kind: "grace", route: g.route }, colour: GAME_COLOURS[i % 4] })) },
  ltbs: { name: "LTBS · Learn Through Bible Stories", accent: "#e1bd63", style: "library", cabinets: [
    { label: "David · A Courageous Heart", to: { kind: "story-enter", story: "david" }, colour: "#88a760" },
    { label: "Ruth · Fields of Faithfulness", to: { kind: "story-enter", story: "ruth" }, colour: "#d2b06b" },
    { label: "Esther · For Such a Time", to: { kind: "story-enter", story: "esther" }, colour: "#b397d0" },
    { label: "Daniel · An Undivided Heart", to: { kind: "story-enter", story: "daniel" }, colour: "#88b4bd" },
    { label: "All Scripture games", to: { kind: "games" }, colour: "#6b3fa0" },
  ] },
  social: { name: "Social House", accent: "#b189c9", style: "lounge", cabinets: [
    { label: "Friends & messages", to: { kind: "grace", route: "social" }, colour: "#b189c9" },
    { label: "Game night together", to: { kind: "games" }, colour: "#367c73" },
    { label: "Fellowship board", to: { kind: "grace", route: "social" }, colour: "#d89e34" },
  ] },
  playmessages: { name: "PlayMessages Theatre", accent: "#a44760", style: "theatre", cabinets: [
    { label: "Enter a story", to: { kind: "grace", route: "messages" }, colour: "#a44760" },
    { label: "Sermon cutscenes", to: { kind: "grace", route: "messages" }, colour: "#6b3fa0" },
  ] },
  ...Object.fromEntries(graceGames.map((g, i) => [`game-${g.id}`, { name: g.name, accent: GAME_COLOURS[i % 4], style: "arcade" as const, cabinets: [
    { label: `Play ${g.name}`, to: { kind: "grace" as const, route: g.route }, colour: GAME_COLOURS[i % 4] },
    { label: "All Bible games", to: { kind: "grace" as const, route: "bible" }, colour: "#6b3fa0" },
  ] }])),
};

const cell = (x: number, y: number, w = 1, h = 1) => ({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });

/** Builds the room: cabinets along the back and side walls, reception by the door. */
export function lobbyMap(id: string): WorldMap | null {
  const m = /^lobby-(.+)@(.+)$/.exec(id);
  if (!m) return null;
  const spec = LOBBY_SPECS[m[1]];
  if (!spec) return null;
  const island = m[2];
  const n = spec.cabinets.length;
  const back = Math.min(n, 10);
  const cols = Math.max(18, back * 3 + 4);
  const sideCount = Math.max(0, n - back);
  const rows = Math.max(14, 6 + Math.ceil(sideCount / 2) * 3);
  const g = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => (y === 0 ? "W" : x === 0 || x === cols - 1 || y === rows - 1 ? "#" : ".")));
  const portals: Portal[] = [];
  const cabinets: { x: number; y: number; face: "s" | "e" | "w"; c: Cabinet }[] = [];
  const startX = Math.floor((cols - back * 3) / 2) + 1;
  spec.cabinets.forEach((c, i) => {
    if (i < back) {
      const x = startX + i * 3;
      g[1][x] = "|"; g[1][x + 1] = "|";
      cabinets.push({ x, y: 1, face: "s", c });
      portals.push({ id: `cab-${i}`, rect: cell(x, 2, 2, 1), label: c.label, to: c.to });
    } else {
      const k = i - back, left = k % 2 === 0, y = 4 + Math.floor(k / 2) * 3;
      const x = left ? 1 : cols - 2;
      g[y][x] = "|"; g[y + 1][x] = "|";
      cabinets.push({ x, y, face: left ? "e" : "w", c });
      portals.push({ id: `cab-${i}`, rect: cell(left ? 2 : cols - 3, y, 1, 2), label: c.label, to: c.to });
    }
  });
  // Reception desk near the door.
  const mid = Math.floor(cols / 2);
  for (let x = mid + 2; x < mid + 6 && x < cols - 1; x++) g[rows - 4][x] = "|";
  g[rows - 1][mid - 1] = "."; g[rows - 1][mid] = ".";
  portals.push({ id: "lobby-exit", rect: cell(mid - 1, rows - 1, 2, 1), label: `Back outside`, to: { kind: "map", mapId: island, label: island } });
  return {
    id,
    kind: "office",
    name: spec.name,
    cols, rows, width: cols * TILE, height: rows * TILE,
    tiles: g.map((r) => r.join("")),
    structures: [],
    rooms: [],
    portals,
    spawn: { x: mid * TILE, y: (rows - 2) * TILE },
    accent: spec.accent,
    lobby: { spec: m[1], style: spec.style, cabinets: cabinets.map(({ x, y, face, c }) => ({ x, y, face, label: c.label, colour: c.colour })) },
  };
}

/* ── Kairos Mall ────────────────────────────────────────────────────────── */
export const MALL_SHOPS = [
  { dept: "Kharis Wear", x: 3, colour: "#f5c518" },
  { dept: "Clothes", x: 11, colour: "#a44760" },
  { dept: "Furniture", x: 19, colour: "#a97c46" },
  { dept: "Home & Decor", x: 27, colour: "#367c73" },
  { dept: "Tech", x: 35, colour: "#2b5fd9" },
] as const;
/** Two floors' worth of shops along a bright atrium with a fountain. */
export function mallMap(island = "city"): WorldMap {
  const cols = 44, rows = 18;
  const g = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => (y === 0 ? "W" : x === 0 || x === cols - 1 || y === rows - 1 ? "#" : ".")));
  const portals: Portal[] = [];
  for (const s of MALL_SHOPS) {
    // Shopfront walls with an open doorway; the counter sits inside.
    for (let x = s.x - 1; x < s.x + 7; x++) if (x !== s.x + 2 && x !== s.x + 3) g[5][x] = "|";
    for (let x = s.x; x < s.x + 3; x++) g[2][x] = "|";
    portals.push({ id: `shop-${s.dept}`, rect: cell(s.x + 2, 3, 2, 1), label: `${s.dept} · browse and buy`, to: { kind: "mall", dept: s.dept } });
  }
  for (let y = 9; y < 12; y++) for (let x = 20; x < 24; x++) g[y][x] = "|";
  const mid = 21;
  g[rows - 1][mid] = "."; g[rows - 1][mid + 1] = ".";
  portals.push({ id: "mall-exit", rect: cell(mid, rows - 1, 2, 1), label: "Back outside", to: { kind: "map", mapId: island, label: "London Square" } });
  return {
    id: "mall", kind: "office", name: "Kairos Mall",
    cols, rows, width: cols * TILE, height: rows * TILE, tiles: g.map((r) => r.join("")),
    structures: [], rooms: [], portals, spawn: { x: (mid + 1) * TILE, y: (rows - 2) * TILE }, accent: "#2b5fd9",
    lobby: { spec: "mall", style: "mall", cabinets: [] },
  };
}
