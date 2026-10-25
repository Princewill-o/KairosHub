import type { WorldMap, Portal, Structure } from "./world";
import { SCRIPTURE_CHALLENGES } from "./ltbs-challenges";

export const ISLANDS = [
  { id: "city", station: "london-square", name: "London Square", subtitle: "Streets, buses, neighbours & outreach", colour: "#bba8df", x: 112, y: 150 },
  { id: "woodland", station: "kharis-church", name: "Kharis Forest", subtitle: "Forest trail → manor church", colour: "#83ad72", x: 440, y: 118 },
  { id: "scripture-island", station: "scripture-gardens", name: "LTBS", subtitle: "Bible RPGs · Scripture games · story worlds", colour: "#e1bd63", x: 278, y: 315 },
  { id: "fellowship-island", station: "fellowship-quay", name: "Fellowship Quay", subtitle: "Community lodge & meeting rooms", colour: "#8cb7c8", x: 605, y: 305 },
  { id: "orchard-island", station: "orchard-retreat", name: "Orchard Retreat", subtitle: "Prayer walks & gathering circles", colour: "#bfcb77", x: 643, y: 115 },
] as const;

export const islandForStation = (id: string) => ISLANDS.find(island => island.station === id);
export const islandStations = () => ISLANDS.map(island => ({ id: island.station as string, name: island.name, lines: ["grace"], exit: { x: 24, y: 37 }, exitPx: { x: 24.5 * 32, y: 37.5 * 32 } }));

/** A bounded, independent map; only the active island is constructed by the renderer. */
export function islandMap(id: string): WorldMap | null {
  const island = ISLANDS.find(item => item.id === id);
  if (!island) return null;
  const cols = 52, rows = 46;
  const tiles: string[][] = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => x < 2 || y < 2 || x >= cols - 2 || y >= rows - 2 ? "w" : "g"));
  const fill = (x: number, y: number, w: number, h: number, ch: string) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) tiles[j][i] = ch;
  };
  const rect = (x: number, y: number, w = 2, h = 1) => ({ x: x * 32, y: y * 32, w: w * 32, h: h * 32 });
  const structures: Structure[] = [];
  const portals: Portal[] = [];
  // Station is at the shore. Its path leads into the island rather than straight to the church.
  fill(20, 34, 9, 3, "X");
  structures.push({ x: 20, y: 34, w: 9, h: 3, label: `${island.name} Station`, accent: "#6b4598", door: "bottom" });
  portals.push({ id: `tube-${island.station}`, rect: rect(23, 37, 3), label: `${island.name} station · trains to other islands`, to: { kind: "map", mapId: `station-${island.station}`, label: `${island.name} Station` } });
  fill(22, 30, 6, 4, "-"); fill(22, 37, 6, 5, "-");
  if (id === "woodland") {
    // Dense tree belt, winding south-to-north approach and a lawn revealed at the end.
    for (let y = 3; y < 43; y += 2) for (let x = 3; x < 49; x += 2) if ((x * 7 + y * 13) % 11 !== 0) tiles[y][x] = "T";
    fill(18, 31, 10, 3, "-"); fill(17, 23, 4, 10, "-"); fill(17, 22, 15, 4, "-"); fill(28, 15, 4, 10, "-"); fill(9, 3, 34, 17, "g");
    fill(13, 5, 26, 11, "X");
    structures.push({ x: 13, y: 5, w: 26, h: 11, label: "Kharis Church", accent: "#d3c6a9", door: "bottom" });
    fill(23, 16, 6, 6, "-");
    portals.push({ id: "kharis-church", rect: rect(25, 16), label: "Kharis Church · enter the blank hall", to: { kind: "map", mapId: "church", label: "Kharis Church" } });
    for (const x of [12, 17, 34, 39]) tiles[20][x] = "B";
    fill(7, 26, 8, 6, "g"); fill(36, 26, 9, 6, "g");
    for (const x of [8, 12, 37, 42]) tiles[29][x] = "B";
    // Restore the station clearing after planting the forest.
    fill(19, 33, 11, 9, "-"); fill(20, 34, 9, 3, "X");
  } else if (id === "city") {
    fill(4, 25, 44, 8, "="); fill(4, 9, 8, 24, "="); fill(40, 9, 8, 24, "="); fill(4, 9, 44, 8, "=");
    fill(16, 8, 9, 1, "-"); fill(12, 17, 28, 1, "-"); fill(12, 24, 28, 1, "-"); fill(4, 33, 44, 1, "-"); fill(23, 18, 4, 7, "-");
    structures.push({ x: 16, y: 4, w: 9, h: 4, label: "London Welcome", accent: "#6b4598", door: "bottom" }, { x: 29, y: 18, w: 9, h: 5, label: "Kharis Events", accent: "#a78b35", door: "bottom" });
    for (const st of structures.slice(1)) fill(st.x, st.y, st.w, st.h, "X");
    portals.push({ id: "arcade", rect: rect(31, 23), label: "LTBS · choose a story journey", to: { kind: "games" } }, { id: "garage", rect: rect(12, 33), label: "London garage", to: { kind: "dealer" } });
  } else {
    fill(23, 12, 4, 22, "-"); fill(9, 20, 35, 3, "-"); fill(10, 9, 31, 8, "g");
    if (id === "fellowship-island") {
      fill(17, 8, 16, 7, "X"); structures.push({ x: 17, y: 8, w: 16, h: 7, label: "Kharis Fellowship Lodge", accent: "#7755aa", door: "bottom" });
      portals.push({ id: "lodge", rect: rect(24, 15), label: "Fellowship and team meeting rooms", to: { kind: "map", mapId: "kharis-hub", label: "Fellowship Lodge" } });
    } else if (id === "scripture-island") {
      fill(17, 6, 18, 6, "X");
      structures.push({ x:17,y:6,w:18,h:6,label:"LTBS · Bible Story Worlds",accent:"#a78a47",door:"bottom" });
      fill(23, 12, 4, 8, "-");
      portals.push({ id: "scripture-games", rect: rect(23, 14, 4, 2), label: "LTBS · enter stories and Scripture games", to: { kind: "games" } }, { id: "bible-garden", rect: rect(11, 22), label: "Read Scripture in the garden", to: { kind: "act", activity: "study" } });
      for (const [index,x] of [8,18,31,41].entries()) portals.push({id:`story-${index}`,rect:rect(x,23,2,2),label:["Enter David’s story","Enter Ruth’s story","Enter Esther’s story","Enter Daniel’s story"][index],to:{kind:"story-enter",story:(["david","ruth","esther","daniel"] as const)[index]}});
      SCRIPTURE_CHALLENGES.forEach((game,index) => {
        const x=[6,12,18,32,38,44][index%6],y=index<6?17:28;
        portals.push({id:`challenge-${game.id}`,rect:rect(x,y,2,1),label:game.title,to:{kind:"scripture-challenge",challenge:game.id}});
      });
    }
    for (const [x, y] of [[12, 18], [16, 25], [32, 18], [37, 25], [12, 30], [37, 30]]) tiles[y][x] = "B";
    for (let y = 4; y < 41; y += 4) for (let x = 4; x < 48; x += 4) if (tiles[y][x] === "g" && !(x > 9 && x < 42 && y > 8 && y < 31)) tiles[y][x] = "T";
  }
  for (const portal of portals) fill(portal.rect.x / 32, portal.rect.y / 32, portal.rect.w / 32, portal.rect.h / 32, "-");
  return { id, island: true, kind: "woodland", name: island.name, cols, rows, width: cols * 32, height: rows * 32, tiles: tiles.map(row => row.join("")), structures, portals, rooms: [], spawn: { x: 24.5 * 32, y: 39.5 * 32 }, accent: island.colour, sign: { x: 25, y: 31, text: island.subtitle } };
}
