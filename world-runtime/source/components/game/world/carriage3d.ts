import * as THREE from "three";
import { CARRIAGE_DOORS } from "@/game/core/world";
import { RIDE_DISTANCE, RIDE_TUNNEL, advanceRide, rideFrame, type Ride } from "@/game/core/ride";
import { ISLANDS } from "@/game/core/islands";

/**
 * A walk-around Grace Line carriage with the line running past outside.
 * Units: tiles (1 world unit). The carriage stands still in the map
 * (x 0..34, z 0..8, platform side north); the world outside slides by,
 * driven by the shared ride clock so it matches the train you boarded.
 */
type Box = (g: THREE.Group, c: string, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => THREE.Mesh;
type Cyl = (g: THREE.Group, c: string, x: number, z: number, y0: number, y1: number, r: number, seg?: number, r2?: number) => THREE.Mesh;
type Sign = (text: string, o: { bg: string; fg: string; w: number; h: number; font?: string; badge?: boolean }) => THREE.Mesh;
export interface Person { root: THREE.Object3D; dispose: () => void }
export interface CarriageKit {
  box: Box; cyl: Cyl; sign: Sign;
  scene: THREE.Scene; hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight;
  getRide: () => Ride | null;
  person: (i: number) => Person;
}
export interface Carriage {
  /** Seats for passengers: centre x, z, and the way they face (radians). */
  seats: { x: number; z: number; facing: number }[];
  /** Spots where commuters stand holding a pole. */
  standing: { x: number; z: number; facing: number }[];
  /** Forward acceleration (tiles/s²) so standing passengers can sway. */
  accel: () => number;
  /** Vertical judder this frame, so riders bounce with the carriage. */
  bump: () => number;
  speed: () => number;
  update: (now: number) => void;
  dispose: () => void;
}

const CENTRE = 17;
const SPAN = 17;
const day = new THREE.Color("#bcd9e8");
const dark = new THREE.Color("#0c0b11");

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCarriage(world: THREE.Group, kit: CarriageKit): Carriage {
  const { box, cyl, sign } = kit;
  const owned: { dispose: () => void }[] = [];
  const car = new THREE.Group();
  world.add(car);

  // --- The carriage ---------------------------------------------------------
  box(car, "#23262e", 0.4, -0.75, 0.55, 33.6, -0.1, 7.45);
  box(car, "#7b808b", 0.6, -0.1, 0.8, 33.4, 0, 7.2);
  // Anti-slip floor stripes and yellow door thresholds.
  for (let x = 1.5; x < 33; x += 3) box(car, "#727782", x, 0.001, 2.0, x + 1.5, 0.012, 6.0);
  const doorX = CARRIAGE_DOORS;
  for (const d of doorX) {
    box(car, "#f2c230", d, 0.001, 0.82, d + 2, 0.02, 1.05);
    box(car, "#f2c230", d, 0.001, 6.95, d + 2, 0.02, 7.18);
  }
  // Platform (north) wall: white panels, blue band, big windows between doors.
  const glass = new THREE.MeshStandardMaterial({ color: "#a9cfe0", transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0, depthWrite: false });
  owned.push(glass);
  const segments: [number, number][] = [];
  let start = 0.6;
  for (const d of doorX) { segments.push([start, d]); start = d + 2; }
  segments.push([start, 33.4]);
  for (const [a, b] of segments) {
    box(car, "#eef0f4", a, 0, 0.72, b, 1.0, 0.95);
    box(car, "#1f3fa8", a, 0.72, 0.7, b, 0.98, 0.97);
    box(car, "#eef0f4", a, 2.05, 0.72, b, 2.55, 0.95);
    for (let x = a; x <= b + 0.01; x += Math.max(1.6, (b - a) / Math.max(1, Math.round((b - a) / 2.2)))) box(car, "#d8dbe2", x - 0.05, 1.0, 0.74, x + 0.05, 2.05, 0.93);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 1.05), glass);
    pane.position.set((a + b) / 2, 1.52, 0.84);
    owned.push(pane.geometry);
    car.add(pane);
  }
  // Camera (south) side: a low wall so you can always see in.
  start = 0.6;
  for (const d of [...doorX, 33.4]) {
    box(car, "#eef0f4", start, 0, 7.05, Math.min(d, 33.4), 0.9, 7.25);
    box(car, "#1f3fa8", start, 0.62, 7.03, Math.min(d, 33.4), 0.82, 7.27);
    start = d + 2;
  }
  // Ends with gangway doors.
  for (const x of [0.6, 33.2]) {
    box(car, "#e6e8ee", x, 0, 0.8, x + 0.2, 2.55, 7.2);
    box(car, "#c9ccd4", x + (x < 1 ? 0.2 : -0.02), 0, 3.4, x + (x < 1 ? 0.24 : 0), 2.1, 4.6);
    box(car, "#a9cfe0", x + (x < 1 ? 0.24 : -0.03), 1.2, 3.6, x + (x < 1 ? 0.26 : -0.01), 1.9, 4.4);
  }
  // Sliding doors: red leaves with windows. North ones open at platforms.
  const leaves: { mesh: THREE.Group; restX: number; dir: number }[] = [];
  for (const d of doorX) {
    for (const [side, z0, z1, h] of [["north", 0.76, 0.9, 2.15], ["south", 7.1, 7.22, 0.9]] as const) {
      for (const dir of [-1, 1]) {
        const leaf = new THREE.Group();
        box(leaf, "#c8302b", 0, 0, z0, 0.98, h, z1);
        if (side === "north") box(leaf, "#a9cfe0", 0.18, 1.0, z0 - 0.01, 0.8, 1.9, z1 + 0.01);
        const restX = dir < 0 ? d + 0.01 : d + 1.01;
        leaf.position.x = restX;
        car.add(leaf);
        if (side === "north") leaves.push({ mesh: leaf, restX, dir });
      }
    }
  }
  // Seats: longitudinal benches in blue moquette with red accents.
  const seats: Carriage["seats"] = [];
  for (const [z0, z1, back0, back1, facing] of [[1.0, 1.62, 0.95, 1.12, 0], [6.38, 7.0, 6.88, 7.05, Math.PI]] as const) {
    for (const [a, b] of segments) {
      const from = a + 0.15, to = b - 0.15;
      if (to - from < 0.6) continue;
      box(car, "#3a3d48", from, 0, z0 + 0.08, to, 0.38, z1 - 0.06);
      const n = Math.floor((to - from) / 0.72);
      const w = (to - from) / n;
      for (let i = 0; i < n; i++) {
        const x = from + i * w;
        const cloth = i % 4 === 3 ? "#b8322f" : i % 2 ? "#2c4fa3" : "#27468f";
        box(car, cloth, x + 0.03, 0.38, z0, x + w - 0.03, 0.5, z1);
        box(car, cloth, x + 0.03, 0.5, back0, x + w - 0.03, 1.08, back1);
        seats.push({ x: x + w / 2, z: (z0 + z1) / 2, facing });
      }
      for (let i = 0; i <= n; i += 2) box(car, "#c2c6cf", from + i * w - 0.03, 0.5, z0 + 0.05, from + i * w + 0.03, 0.72, z1);
    }
  }
  // Yellow poles at the door bays and grab rails above the seats.
  const standing: Carriage["standing"] = [];
  for (const d of doorX) {
    for (const z of [1.85, 6.15]) for (const x of [d - 0.12, d + 2.12]) cyl(car, "#f2c230", x, z, 0, 2.45, 0.035, 8);
    cyl(car, "#f2c230", d + 1, 4, 0, 2.45, 0.04, 8);
    standing.push({ x: d + 1.32, z: 3.85, facing: Math.PI / 2 }, { x: d + 0.62, z: 4.2, facing: -Math.PI / 2 });
  }
  box(car, "#d7dbe3", 1, 2.18, 1.88, 33, 2.22, 1.92);
  // Ceiling light strips and interior lamps (they matter in the tunnel).
  const glow = new THREE.MeshBasicMaterial({ color: "#fff3d6", toneMapped: false });
  owned.push(glow);
  for (const z of [1.35]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(32.2, 0.05, 0.16), glow);
    strip.position.set(CENTRE, 2.5, z);
    owned.push(strip.geometry);
    car.add(strip);
  }
  const lamps = [8, 26].map((x) => {
    const l = new THREE.PointLight("#fff1d2", 0, 22, 1.4);
    l.position.set(x, 2.3, 4);
    car.add(l);
    return l;
  });
  // Next-station screens hanging over the aisle, and a line map above the windows.
  const screens: THREE.Mesh[] = [];
  const lineMaps: THREE.Mesh[] = [];
  let screenText = "";
  const setScreens = (text: string) => {
    if (text === screenText) return;
    screenText = text;
    for (const s of screens) { (s.material as THREE.MeshBasicMaterial).map?.dispose(); (s.material as THREE.Material).dispose(); s.geometry.dispose(); s.removeFromParent(); }
    screens.length = 0;
    for (const x of [11.5, 22.5]) {
      const s = sign(text, { bg: "#111014", fg: "#ffb43a", w: 3.6, h: 0.36, font: "bold 52px monospace" });
      s.position.set(x, 2.3, 2.3);
      car.add(s);
      screens.push(s);
    }
  };
  let mapFor = "";
  const setLineMap = (here: string) => {
    if (here === mapFor) return;
    mapFor = here;
    for (const s of lineMaps) { (s.material as THREE.MeshBasicMaterial).map?.dispose(); (s.material as THREE.Material).dispose(); s.geometry.dispose(); s.removeFromParent(); }
    lineMaps.length = 0;
    const text = ISLANDS.map((i) => (i.name === here ? `[ ${i.name} ]` : i.name)).join("  ·  ");
    for (const [a, b] of segments) {
      if (b - a < 4) continue;
      const s = sign(`Grace Line   ${text}`, { bg: "#f6f3ea", fg: "#1f3fa8", w: Math.min(5.5, b - a - 0.6), h: 0.22, font: "bold 40px sans-serif" });
      s.position.set((a + b) / 2, 2.25, 0.98);
      car.add(s);
      lineMaps.push(s);
    }
  };

  // --- The line outside ----------------------------------------------------
  const line = new THREE.Group();
  world.add(line);
  const dynamic: { dispose: () => void }[] = [];
  const from = -60, to = RIDE_DISTANCE + 60;
  const [t0, t1] = RIDE_TUNNEL;
  const inTunnel = (d: number, pad = 0) => d > t0 - pad && d < t1 + pad;
  const nearPlatform = (d: number, pad = 0) => Math.abs(d) < 18 + pad || Math.abs(d - RIDE_DISTANCE) < 18 + pad;
  // Ground beside the track, in strips so the tunnel can be dark.
  for (let d = from; d < to; d += 10) {
    const under = inTunnel(d + 5);
    box(line, under ? "#15141a" : "#6f8f5b", d, -0.9, -60, d + 10, -0.75, 0.6);
    box(line, under ? "#15141a" : "#6f8f5b", d, -0.9, 7.4, d + 10, -0.75, 40);
    if (!under) {
      box(line, "#8a8173", d, -0.76, 0.55, d + 10, -0.7, 7.45);
      box(line, "#9a917f", d, -0.76, -1.6, d + 10, -0.66, 0.0);
    }
  }
  // Sleepers and rails peek out either side of the carriage.
  for (let d = from; d < to; d += 1.2) if (!inTunnel(d)) box(line, "#5a4636", d, -0.72, 0.1, d + 0.35, -0.64, 0.5);
  // Scattered scenery: trees, houses, hedges, distant hills. Instanced so it stays cheap.
  const r = rng(77);
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const cone = new THREE.ConeGeometry(0.5, 1, 6);
  const roof = new THREE.ConeGeometry(0.72, 1, 4);
  owned.push(unit, cone, roof);
  const make = (geo: THREE.BufferGeometry, colour: string, count: number) => {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: colour, flatShading: true, roughness: 0.9 }), count);
    m.castShadow = true;
    m.receiveShadow = true;
    m.count = 0;
    owned.push({ dispose: () => { (m.material as THREE.Material).dispose(); m.dispose(); } });
    line.add(m);
    return m;
  };
  const trunks = make(unit, "#6b4a33", 900), crowns = make(cone, "#3f7a46", 900), crowns2 = make(cone, "#5c9a4c", 900);
  const walls = make(unit, "#e8dccb", 260), roofs = make(roof, "#9b4f3c", 260), hills = make(cone, "#7d9a68", 120), hedges = make(unit, "#4f7d43", 400);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const put = (m: THREE.InstancedMesh, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) => {
    if (m.count >= (m.instanceMatrix.count)) return;
    m.setMatrixAt(m.count++, m4.compose(v.set(x, y, z), q.setFromEuler(e.set(0, ry, 0)), s.set(sx, sy, sz)));
  };
  const tree = (d: number, z: number, scale: number) => {
    put(trunks, d, -0.75 + 0.35 * scale, z, 0.18 * scale, 0.7 * scale, 0.18 * scale);
    put(r() < 0.5 ? crowns : crowns2, d, -0.75 + (0.7 + 0.9) * scale, z, 1.4 * scale, 1.9 * scale, 1.4 * scale, r() * 3);
  };
  for (let d = from; d < to; d += 0.9) {
    if (inTunnel(d, 4) || nearPlatform(d)) continue;
    // North (far) side: the view out of the windows.
    if (r() < 0.55) tree(d + r() * 0.8, -2.2 - r() * 6, 0.8 + r() * 0.7);
    if (r() < 0.3) tree(d + r() * 0.8, -9 - r() * 14, 1 + r() * 0.8);
    if (r() < 0.07) {
      const w = 2 + r() * 2, h = 1.4 + r() * 1.2, z = -10 - r() * 6;
      put(walls, d, -0.75 + h / 2, z, w, h, 1.8);
      put(roofs, d, -0.75 + h + 0.45, z, w * 0.98, 0.9, 1.75, Math.PI / 4);
    }
    // South (camera) side stays low so it never hides the carriage.
    if (r() < 0.35) put(hedges, d, -0.55, 8.4 + r() * 1.5, 0.9, 0.4 + r() * 0.3, 0.7);
    if (r() < 0.06) tree(d, 13 + r() * 10, 0.6);
  }
  for (let d = from; d < to; d += 14 + r() * 10) if (!inTunnel(d, 10)) put(hills, d, -0.75 + 4, -34 - r() * 10, 18 + r() * 10, 8 + r() * 6, 12, r() * 3);
  for (const m of [trunks, crowns, crowns2, walls, roofs, hills, hedges]) m.instanceMatrix.needsUpdate = true;
  // Close to the windows: overhead-line masts, signals and cable posts. Being
  // so near the glass, they flick past fast and sell the speed.
  const masts = make(unit, "#5d6470", 400), arms = make(unit, "#5d6470", 400), posts = make(unit, "#3d3a35", 500), signals = make(unit, "#1b1a20", 60);
  for (let d = from; d < to; d += 7) {
    if (inTunnel(d, 1) || nearPlatform(d, -2)) continue;
    put(masts, d, -0.75 + 2.2, -0.9, 0.16, 4.4, 0.16);
    put(arms, d, 3.4, 0.1, 0.1, 0.1, 2.2);
  }
  for (let d = from + 3; d < to; d += 3.5) if (!inTunnel(d, 1) && !nearPlatform(d, -2)) put(posts, d, -0.45, 8.0, 0.12, 0.6, 0.12);
  for (let d = from + 20; d < to; d += 45) if (!inTunnel(d, 2) && !nearPlatform(d, 2)) put(signals, d, 0.9, -1.3, 0.3, 3.3, 0.3);
  for (const m of [masts, arms, posts, signals]) m.instanceMatrix.needsUpdate = true;
  // The tunnel: close dark walls, lamps streaking past, a hillside over each mouth.
  box(line, "#2a2730", t0, -0.9, -0.2, t1, 3.2, 0.45);
  box(line, "#2a2730", t0, -0.9, 7.55, t1, 1.0, 7.9);
  for (let d = t0 + 2; d < t1 - 1; d += 3) {
    box(line, "#ffe8a8", d, 2.1, 0.44, d + 0.9, 2.22, 0.5).material = glow;
    box(line, "#3b3640", d - 2, 1.2, 0.42, d + 1.5, 1.28, 0.5);
  }
  // Tunnel ribs every couple of tiles: the dark wall visibly races by.
  for (let d = t0 + 1; d < t1; d += 1.6) {
    box(line, "#1a1820", d, -0.9, 0.3, d + 0.25, 3.25, 0.5);
    box(line, "#1a1820", d, -0.9, 7.5, d + 0.25, 1.05, 7.7);
  }
  for (const [mouth, out] of [[t0, -1], [t1, 1]] as const) {
    box(line, "#8d8274", mouth - (out < 0 ? 1.2 : 0), -0.9, -10, mouth + (out < 0 ? 0 : 1.2), 4.4, 0.5);
    box(line, "#d9d2c3", mouth - (out < 0 ? 1.4 : 0.2), 4.2, -10, mouth + (out < 0 ? 0.2 : 1.4), 4.6, 0.6);
    box(line, "#6d8a57", mouth + (out < 0 ? 0 : -8), 1, -26, mouth + (out < 0 ? 8 : 0), 5, -10);
  }
  box(line, "#6d8a57", t0, 1.5, -40, t1, 7, -10);
  // Platforms at both ends of the run: rebuilt with the right names each leg.
  const platform = (d: number, name: string) => {
    const g = new THREE.Group();
    g.position.x = d;
    box(g, "#c9c3b6", -16, -0.75, -6, 16, -0.02, 0.62);
    box(g, "#ece6d6", -16, -0.02, -6, 16, 0, 0.62);
    box(g, "#f2c230", -16, 0.001, 0.2, 16, 0.012, 0.35);
    box(g, "#efe8d6", -16, 0, -6.4, 16, 3.4, -6);
    box(g, "#1f3fa8", -16, 2.4, -6.02, 16, 2.6, -5.98);
    for (const x of [-15.9, 14.3]) box(g, "#0b0a0f", x, -0.75, -6, x + 1.6, 3.2, 0.6);
    for (let x = -10; x <= 10; x += 10) {
      const n = sign(name, { bg: "#ffffff", fg: "#13203a", w: 4.2, h: 0.62, badge: true });
      n.position.set(x, 1.7, -5.97);
      g.add(n);
      dynamic.push({ dispose: () => { (n.material as THREE.MeshBasicMaterial).map?.dispose(); (n.material as THREE.Material).dispose(); n.geometry.dispose(); } });
    }
    for (const x of [-6, 4]) {
      box(g, "#775237", x, 0.42, -5.4, x + 2.2, 0.52, -4.9);
      box(g, "#775237", x, 0.52, -5.55, x + 2.2, 0.95, -5.45);
    }
    // A few people waiting for the next train.
    for (let i = 0; i < 4; i++) {
      const p = kit.person(i + d);
      p.root.position.set(-11 + i * 7 + (i % 2) * 1.3, 0, -2.6 - (i % 3) * 0.8);
      p.root.rotation.y = 0;
      g.add(p.root);
      dynamic.push(p);
    }
    line.add(g);
    return g;
  };
  let builtLeg = -1;
  let platforms: THREE.Group[] = [];
  const rebuild = (ride: Ride) => {
    for (const d of dynamic.splice(0)) d.dispose();
    for (const g of platforms) g.removeFromParent();
    platforms = [platform(0, ride.from.name), platform(RIDE_DISTANCE, ride.to.name)];
    setLineMap(ride.to.name);
    builtLeg = ride.leg + ride.at;
  };

  let lastSpeed = 0, lastNow = 0, accel = 0, bump = 0;
  const lit = new THREE.Color();
  return {
    seats,
    standing,
    accel: () => accel,
    bump: () => bump,
    speed: () => lastSpeed,
    update(now: number) {
      const start = kit.getRide();
      if (!start) return;
      const ride = advanceRide(start, now);
      if (builtLeg !== ride.leg + ride.at) rebuild(ride);
      const f = rideFrame(now - ride.at);
      line.position.x = CENTRE - f.distance;
      const dt = Math.max(1e-3, (now - (lastNow || now - 16)) / 1000);
      accel += ((f.speed - lastSpeed) / dt - accel) * Math.min(1, dt * 6);
      lastSpeed = f.speed; lastNow = now;
      for (const l of leaves) l.mesh.position.x = l.restX + l.dir * f.doorOpen * 0.96;
      // How much of the carriage is underground right now.
      const covered = Math.max(0, Math.min(f.distance + SPAN, t1) - Math.max(f.distance - SPAN, t0)) / (SPAN * 2);
      const under = THREE.MathUtils.clamp(covered, 0, 1);
      (kit.scene.background as THREE.Color).copy(lit.copy(day).lerp(dark, under));
      kit.hemi.intensity = 1.5 - under * 1.1;
      kit.sun.intensity = 0.95 * (1 - under);
      lamps.forEach((l) => { l.intensity = 0.4 + under * 9; });
      // Movement you can feel: a rail-joint knock every few tiles, a constant
      // fine judder and a slow side-to-side sway, all scaled by speed.
      const pace = Math.min(1, f.speed / 10);
      const joint = (f.distance % 3.2) / 3.2;
      const knock = joint < 0.06 ? Math.sin(joint / 0.06 * Math.PI) * 0.02 : 0;
      bump = (Math.sin(now / 37) * 0.006 + knock) * pace;
      car.position.y = bump;
      car.position.z = Math.sin(now / 900) * 0.025 * pace;
      car.rotation.x = Math.sin(now / 700) * 0.004 * pace;
      // Passing tunnel lamps flash through the carriage.
      if (f.tunnel) lamps.forEach((l, i) => { l.intensity += Math.max(0, Math.sin((f.distance + i * 1.5) * 2.1)) * 4; });
      setScreens(
        f.phase === "arrived" ? `${ride.to.name}  ·  Doors open` :
        f.phase === "braking" ? `Now arriving: ${ride.to.name}` :
        f.phase === "closing" ? `Doors closing  ·  To ${ride.to.name}` :
        `Next station: ${ride.to.name}`,
      );
    },
    dispose() {
      for (const d of dynamic.splice(0)) d.dispose();
      for (const s of [...screens, ...lineMaps]) { (s.material as THREE.MeshBasicMaterial).map?.dispose(); (s.material as THREE.Material).dispose(); s.geometry.dispose(); }
      owned.forEach((o) => o.dispose());
      car.removeFromParent();
      line.removeFromParent();
    },
  };
}
