import { TILE, blocked, safeSpot, step, type WorldMap } from "./world";
export interface Point {
  x: number;
  y: number;
}
export const SEARCH_RADIUS = TILE * 14;
export const ESCAPE_SECONDS = 6;
export interface Pursuit {
  origin: Point;
  radius: number;
  car: Point;
  route: Point[];
  officers: Point[];
  stage: "arriving" | "chasing" | "tased" | "challenge";
  outsideSince: number | null;
  escaped: boolean;
}
const ROAD = new Set(["=", ":"]);
/** Breadth-first routes use the same collision map as the player. */
export function walkRoute(
  map: WorldMap,
  from: Point,
  to: Point,
  roadOnly = false,
): Point[] {
  const sx = Math.max(0, Math.min(map.cols - 1, Math.floor(from.x / TILE)));
  const sy = Math.max(0, Math.min(map.rows - 1, Math.floor(from.y / TILE)));
  const gx = Math.max(0, Math.min(map.cols - 1, Math.floor(to.x / TILE)));
  const gy = Math.max(0, Math.min(map.rows - 1, Math.floor(to.y / TILE)));
  const start = sy * map.cols + sx,
    goal = gy * map.cols + gx;
  const queue = [start],
    parent = new Map<number, number>([[start, -1]]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const at = queue[cursor];
    if (at === goal) break;
    const x = at % map.cols,
      y = Math.floor(at / map.cols);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        key = ny * map.cols + nx;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= map.cols ||
        ny >= map.rows ||
        parent.has(key)
      )
        continue;
      if (
        roadOnly
          ? !ROAD.has(map.tiles[ny][nx])
          : blocked(map, (nx + 0.5) * TILE, (ny + 0.5) * TILE)
      )
        continue;
      parent.set(key, at);
      queue.push(key);
    }
  }
  if (!parent.has(goal)) return [];
  const route: Point[] = [];
  for (let at = goal; at !== start; at = parent.get(at)!)
    route.unshift({
      x: ((at % map.cols) + 0.5) * TILE,
      y: (Math.floor(at / map.cols) + 0.5) * TILE,
    });
  return route;
}
export function startPursuit(map: WorldMap, player: Point): Pursuit {
  const roads: Point[] = [];
  for (let y = 0; y < map.rows; y++)
    for (let x = 0; x < map.cols; x++)
      if (ROAD.has(map.tiles[y][x]))
        roads.push({ x: (x + 0.5) * TILE, y: (y + 0.5) * TILE });
  roads.sort(
    (a, b) =>
      Math.hypot(a.x - player.x, a.y - player.y) -
      Math.hypot(b.x - player.x, b.y - player.y),
  );
  const target = roads[0] ?? safeSpot(map, player.x, player.y);
  let car = target,
    route: Point[] = [];
  for (const candidate of roads
    .filter((p) => Math.hypot(p.x - target.x, p.y - target.y) >= TILE * 9)
    .slice(0, 24)) {
    const path = walkRoute(map, candidate, target, true);
    if (path.length) {
      car = candidate;
      route = path;
      break;
    }
  }
  return {
    origin: { ...player },
    radius: SEARCH_RADIUS,
    car: { ...car },
    route,
    officers: [],
    stage: "arriving",
    outsideSince: null,
    escaped: false,
  };
}
export function tickPursuit(
  state: Pursuit,
  map: WorldMap,
  player: Point,
  now: number,
  dt: number,
): Pursuit {
  if (state.stage === "tased" || state.stage === "challenge" || state.escaped) return state;
  const outside =
    Math.hypot(player.x - state.origin.x, player.y - state.origin.y) >
    state.radius;
  const outsideSince = outside ? (state.outsideSince ?? now) : null;
  if (outsideSince !== null && now - outsideSince >= ESCAPE_SECONDS * 1000)
    return { ...state, outsideSince, escaped: true };
  if (state.stage === "arriving") {
    const route = [...state.route];
    let car = { ...state.car },
      budget = Math.min(dt, 0.5) * TILE * 5;
    while (budget > 0 && route.length) {
      const next = route[0],
        distance = Math.hypot(next.x - car.x, next.y - car.y);
      if (distance <= budget) {
        car = next;
        route.shift();
        budget -= distance;
      } else {
        car = {
          x: car.x + ((next.x - car.x) * budget) / distance,
          y: car.y + ((next.y - car.y) * budget) / distance,
        };
        budget = 0;
      }
    }
    return {
      ...state,
      car,
      route,
      outsideSince,
      stage: route.length ? "arriving" : "chasing",
      officers: route.length
        ? []
        : [
            safeSpot(map, car.x + TILE, car.y),
            safeSpot(map, car.x - TILE, car.y),
          ],
    };
  }
  const officers = state.officers.map((officer) => {
    const path = walkRoute(map, officer, player),
      target = path[0] ?? player;
    // step caps frame duration; divide a tick into collision-safe slices.
    let at = officer;
    for (let t = 0; t < dt; t += 0.1)
      at = step(
        map,
        at,
        target.x - at.x,
        target.y - at.y,
        Math.min(0.1, dt - t),
        0.8,
      );
    return at;
  });
  const caught = officers.some(
    (p) => Math.hypot(p.x - player.x, p.y - player.y) < TILE * 0.8,
  );
  return {
    ...state,
    officers,
    outsideSince,
    stage: caught ? "tased" : "chasing",
  };
}
/** What the officer asks to see if you'll get off with a warning: Bible questions only. */
export const POLICE_QUESTIONS = [
  { prompt: "Who was swallowed by a great fish after running from God?", options: ["Jonah", "Elijah", "Peter", "Noah"], answer: 0, explain: "Jonah 1:17 — the LORD prepared a great fish to swallow Jonah." },
  { prompt: "Which commandment says “Thou shalt not steal”?", options: ["The fourth", "The sixth", "The eighth", "The tenth"], answer: 2, explain: "Exodus 20:15 — the eighth commandment." },
  { prompt: "Who denied Jesus three times before the rooster crowed?", options: ["Judas", "Peter", "Thomas", "John"], answer: 1, explain: "Luke 22:61 — Peter remembered the word of the Lord." },
  { prompt: "What did Zacchaeus promise to do with what he had taken by fraud?", options: ["Keep it", "Give it to the temple", "Restore it fourfold", "Pay half back"], answer: 2, explain: "Luke 19:8 — “I restore him fourfold.”" },
  { prompt: "Which criminal on the cross was promised paradise?", options: ["The one who mocked Jesus", "The one who asked Jesus to remember him", "Barabbas", "Neither"], answer: 1, explain: "Luke 23:42–43 — “To day shalt thou be with me in paradise.”" },
  { prompt: "Who was released instead of Jesus?", options: ["Barabbas", "Lazarus", "Silas", "Herod"], answer: 0, explain: "Matthew 27:26 — Pilate released Barabbas." },
  { prompt: "Romans 13 says rulers and authorities are…", options: ["Enemies of the church", "Ministers of God for good", "To be ignored", "Above God"], answer: 1, explain: "Romans 13:4 — “he is the minister of God to thee for good.”" },
  { prompt: "Which two were singing hymns in prison at midnight?", options: ["Peter and John", "Paul and Silas", "David and Jonathan", "Moses and Aaron"], answer: 1, explain: "Acts 16:25 — Paul and Silas prayed and sang praises unto God." },
  { prompt: "What did Joseph do when Potiphar’s wife tempted him?", options: ["Lied about it", "Fled", "Gave in", "Told Pharaoh"], answer: 1, explain: "Genesis 39:12 — he left his garment and fled." },
  { prompt: "“The wages of sin is death; but the gift of God is…”", options: ["Riches", "Eternal life", "Forgiveness for some", "A second chance"], answer: 1, explain: "Romans 6:23 — eternal life through Jesus Christ our Lord." },
  { prompt: "Who was thrown into the lions’ den for praying?", options: ["Daniel", "Shadrach", "Ezekiel", "Samuel"], answer: 0, explain: "Daniel 6:16 — Daniel was cast into the den of lions." },
  { prompt: "How many times did Jesus say to forgive your brother?", options: ["Seven times", "Seventy times seven", "Three times", "Once"], answer: 1, explain: "Matthew 18:22 — until seventy times seven." },
  { prompt: "Which disciple betrayed Jesus for thirty pieces of silver?", options: ["Judas Iscariot", "Thomas", "Matthew", "Andrew"], answer: 0, explain: "Matthew 26:15 — they covenanted with him for thirty pieces of silver." },
  { prompt: "Who was the persecutor who became the apostle Paul?", options: ["Saul of Tarsus", "Simon of Cyrene", "Stephen", "Silas"], answer: 0, explain: "Acts 9 — Saul met Jesus on the road to Damascus." },
  { prompt: "“Be sure your sin will…”", options: ["Be forgotten", "Find you out", "Go unpunished", "Stay hidden"], answer: 1, explain: "Numbers 32:23 — “be sure your sin will find you out.”" },
  { prompt: "In the parable, what did the prodigal son’s father do when he saw him coming?", options: ["Locked the door", "Ran and embraced him", "Sent him away", "Made him a servant"], answer: 1, explain: "Luke 15:20 — he ran, fell on his neck, and kissed him." },
] as const;

export function prisonGuardPositions(seconds: number) {
  return [28.5, 36.5].map((x, i) => {
    const t = (seconds * 0.7 + i * 17) % 44;
    return {
      x: x * TILE,
      y: (5.5 + (t < 22 ? t : 44 - t)) * TILE,
      angle: t < 22 ? 0 : Math.PI,
    };
  });
}
export function caughtByPrisonGuard(
  map: WorldMap,
  player: Point,
  seconds: number,
) {
  if (player.x < 26 * TILE) return false;
  return prisonGuardPositions(seconds).some((guard) => {
    if (Math.hypot(guard.x - player.x, guard.y - player.y) > TILE * 1.35)
      return false;
    for (let t = 0; t <= 1; t += 0.2)
      if (
        blocked(
          map,
          guard.x + (player.x - guard.x) * t,
          guard.y + (player.y - guard.y) * t,
          1,
        )
      )
        return false;
    return true;
  });
}

/** The arrest moment, shared with the 3D view: officers close in and cuff you. */
export const ARREST_SCENE = ((globalThis as unknown as { __kairosArrest?: { active: boolean } }).__kairosArrest ??= { active: false });
