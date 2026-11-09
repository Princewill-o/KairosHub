import type { WorldMap, Portal, Structure } from "./world";
import { SCRIPTURE_CHALLENGES } from "./ltbs-challenges";
import { gameBuildings } from "../../../../public/grace-catalog.mjs";

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
  // A stairwell cut into the middle of the station: walk down the steps and you're in.
  portals.push({ id: `tube-${island.station}`, rect: rect(23, 34, 3), label: `${island.name} station · trains to other islands`, to: { kind: "map", mapId: `station-${island.station}`, label: `${island.name} Station` } });
  fill(22, 30, 6, 4, "-"); fill(22, 37, 6, 5, "-"); fill(23, 34, 3, 3, "-");
  if (id === "woodland") {
    // Dense tree belt, winding south-to-north approach and a lawn revealed at the end.
    for (let y = 3; y < 43; y += 2) for (let x = 3; x < 49; x += 2) if ((x * 7 + y * 13) % 11 !== 0) tiles[y][x] = "T";
    fill(18, 31, 10, 3, "-"); fill(17, 23, 4, 10, "-"); fill(17, 22, 15, 4, "-"); fill(28, 15, 4, 10, "-"); fill(9, 3, 34, 17, "g");
    // Spurgeon's College (public/world3d/spurgeons-college.glb) fills 34 × 15 tiles.
    // The house front sits ~3.9 tiles behind the terrace; the terrace is walkable.
    fill(9, 1, 34, 11, "X");
    structures.push({ x: 9, y: 1, w: 34, h: 15, label: "Kharis Church", accent: "#d3c6a9", door: "bottom", doorInset: 3.87 });
    fill(21, 12, 3, 4, "-"); fill(21, 16, 8, 6, "-");
    portals.push({ id: "kharis-church", rect: rect(21, 12, 2), label: "Kharis Church · Spurgeon's College", to: { kind: "map", mapId: "church", label: "Kharis Church" } });
    for (const x of [12, 17, 34, 39]) tiles[20][x] = "B";
    fill(7, 26, 8, 6, "g"); fill(36, 26, 9, 6, "g");
    for (const x of [8, 12, 37, 42]) tiles[29][x] = "B";
    // Restore the station clearing after planting the forest.
    fill(19, 33, 11, 9, "-"); fill(20, 34, 9, 3, "X"); fill(23, 34, 3, 3, "-");
  } else if (id === "city") {
    fill(4, 25, 44, 8, "="); fill(4, 9, 8, 24, "="); fill(40, 9, 8, 24, "="); fill(4, 9, 44, 8, "=");
    fill(16, 8, 9, 1, "-"); fill(12, 17, 28, 1, "-"); fill(12, 24, 28, 1, "-"); fill(4, 33, 44, 1, "-"); fill(23, 18, 4, 7, "-");
    structures.push({ x: 16, y: 4, w: 9, h: 4, label: "London Welcome", accent: "#6b4598", door: "bottom" }, { x: 29, y: 18, w: 9, h: 5, label: "Kharis Events", accent: "#a78b35", door: "bottom" });
    for (const st of structures.slice(1)) fill(st.x, st.y, st.w, st.h, "X");
    portals.push({ id: "arcade", rect: rect(31, 23), label: "LTBS · walk in to choose a story", to: { kind: "map", mapId: `lobby-ltbs@${id}`, label: "LTBS" } }, { id: "garage", rect: rect(12, 33), label: "London garage", to: { kind: "dealer" } });
  } else {
    fill(23, 12, 4, 22, "-"); fill(9, 20, 35, 3, "-"); fill(10, 9, 31, 8, "g");
    if (id === "fellowship-island") {
      fill(17, 8, 16, 7, "X"); structures.push({ x: 17, y: 8, w: 16, h: 7, label: "Kharis Fellowship Lodge", accent: "#7755aa", door: "bottom" });
      portals.push({ id: "lodge", rect: rect(24, 15), label: "Fellowship and team meeting rooms", to: { kind: "map", mapId: "kharis-hub", label: "Fellowship Lodge" } });
    } else if (id === "scripture-island") {
      fill(17, 6, 18, 6, "X");
      structures.push({ x:17,y:6,w:18,h:6,label:"LTBS · Bible Story Worlds",accent:"#a78a47",door:"bottom" });
      fill(23, 12, 4, 8, "-");
      portals.push({ id: "scripture-games", rect: rect(23, 14, 4, 2), label: "LTBS · walk in for stories and Scripture games", to: { kind: "map", mapId: `lobby-ltbs@${id}`, label: "LTBS" } }, { id: "bible-garden", rect: rect(11, 22), label: "Read Scripture in the garden", to: { kind: "act", activity: "study" } });
      for (const [index,x] of [8,18,31,41].entries()) portals.push({id:`story-${index}`,rect:rect(x,23,2,2),label:["Enter David’s story","Enter Ruth’s story","Enter Esther’s story","Enter Daniel’s story"][index],to:{kind:"story-enter",story:(["david","ruth","esther","daniel"] as const)[index]}});
      SCRIPTURE_CHALLENGES.forEach((game,index) => {
        const x=[6,12,18,32,38,44][index%6],y=index<6?17:28;
        portals.push({id:`challenge-${game.id}`,rect:rect(x,y,2,1),label:game.title,to:{kind:"scripture-challenge",challenge:game.id}});
      });
    }
    for (const [x, y] of [[12, 18], [16, 25], [32, 18], [37, 25], [12, 30], [37, 30]]) tiles[y][x] = "B";
    for (let y = 4; y < 41; y += 4) for (let x = 4; x < 48; x += 4) if (tiles[y][x] === "g" && !(x > 9 && x < 42 && y > 8 && y < 31)) tiles[y][x] = "T";
  }
  if(id === 'scripture-island') {
    // Keep the original story and challenge entrances in the open central precinct.
    portals.filter(p=>p.to.kind==='scripture-challenge').forEach((p,i)=>{p.rect=rect(18+(i%4)*4,25+Math.floor(i/4)*2,2,1);});
    for(const game of gameBuildings) {
      fill(game.x,game.y,game.w,game.h,'X');
      structures.push({x:game.x,y:game.y,w:game.w,h:game.h,label:game.name,accent:game.colour,door:'bottom',game:game.id,grace:game.route});
      const doorX=game.x+game.w/2-1,doorY=game.y+game.h;
      portals.push({id:'game-'+game.id,rect:rect(doorX,doorY,2),label:game.name+' · walk in to play',to:{kind:'map',mapId:`lobby-game-${game.id}@${id}`,label:game.name}});
      // Each entrance has its own footpath to the existing central trail.
      const lane=game.x<25?15:35;
      fill(doorX,doorY,2,2,'-');fill(Math.min(doorX,lane),doorY+1,Math.abs(doorX-lane)+2,1,'-');
    }
    fill(15,3,2,31,'-');fill(35,3,2,31,'-');fill(15,32,22,2,'-');
    const theatre=structures.find(s=>s.label==='LTBS · Bible Story Worlds');
    if(theatre){theatre.label='PlayMessages Theatre';theatre.grace='messages';}
    portals.push({id:'playmessages',rect:rect(25,12,2),label:'PlayMessages Theatre · walk in',to:{kind:'map',mapId:`lobby-playmessages@${id}`,label:'PlayMessages Theatre'}});
  }
  if(id === 'city') {
    fill(5,35,9,5,'X');structures.push({x:5,y:35,w:9,h:5,label:'Social House',accent:'#b189c9',door:'bottom',grace:'social'});
    fill(8,40,18,2,'-');portals.push({id:'social-house',rect:rect(8,40,3),label:'Social House · walk in',to:{kind:'map',mapId:`lobby-social@${id}`,label:'Social House'}});
    // High-street restaurants (Blender shopfronts: create_restaurants.py) on the north pavement.
    fill(28,3,8,3,'X');fill(38,3,8,3,'X');fill(26,6,22,3,'-');
    structures.push({x:28,y:3,w:8,h:5,label:'Pizzazz Pizza',accent:'#c8322d',door:'bottom',doorInset:1.6},{x:38,y:3,w:8,h:5,label:'Kharis Café',accent:'#3f7d4f',door:'bottom',doorInset:1.6});
    portals.push({id:'pizzazz',rect:rect(31,6,2),label:'Pizzazz Pizza · restaurant',to:{kind:'map',mapId:'workplace-pizzazz',label:'Pizzazz Pizza'}},{id:'kharis-cafe',rect:rect(41,6,2),label:'Kharis Café · grab a bite',to:{kind:'act',activity:'eat'}});
    const welcome=structures.find(s=>s.label==='London Welcome');if(welcome){welcome.label='Grace Game Hall';welcome.grace='bible';}
    portals.push({id:'grace-hall',rect:rect(19,8,3),label:'Grace Game Hall · walk in to play',to:{kind:'map',mapId:`lobby-grace-hall@${id}`,label:'Grace Game Hall'}});
    // Kairos Mall on the north-west corner, and your own house in the south-east.
    fill(3,3,12,5,'X');structures.push({x:3,y:3,w:12,h:5,label:'Kairos Mall',accent:'#2b5fd9',door:'bottom'});
    fill(8,8,3,1,'-');portals.push({id:'mall',rect:rect(8,8,3),label:'Kairos Mall · clothes, furniture, tech',to:{kind:'map',mapId:'mall',label:'Kairos Mall'}});
    // Your house (Blender: create_player_house.py): faces south like every building, path round the side.
    fill(31,34,8,5,'X');structures.push({x:31,y:34,w:8,h:5,label:'Your house',accent:'#c8322d',door:'bottom'});
    fill(30,33,1,9,'-');fill(30,41,6,1,'-');portals.push({id:'my-house',rect:rect(34,39,2),label:'Your house · go inside',to:{kind:'map',mapId:'home',label:'Home'}});
    // Slip road onto the M25: drive (or walk) east off the square.
    fill(48,19,2,4,'=');portals.push({id:'slip-m25',rect:rect(48,19,2,4),label:'M25 London Orbital · drive out of London',to:{kind:'map',mapId:'m25',label:'M25 London Orbital'}});
  }
  if(id === 'fellowship-island')portals.push({id:'grace-social',rect:rect(23,17,3),label:'Social Lodge · walk in',to:{kind:'map',mapId:`lobby-social@${id}`,label:'Social Lodge'}});
  for (const portal of portals) fill(portal.rect.x / 32, portal.rect.y / 32, portal.rect.w / 32, portal.rect.h / 32, "-");
  return { id, island: true, kind: "woodland", name: island.name, cols, rows, width: cols * 32, height: rows * 32, tiles: tiles.map(row => row.join("")), structures, portals, rooms: [], spawn: { x: 24.5 * 32, y: 39.5 * 32 }, accent: island.colour, sign: { x: 25, y: 31, text: island.subtitle } };
}
