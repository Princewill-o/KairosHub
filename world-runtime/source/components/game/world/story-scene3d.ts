import * as THREE from "three";
import type { StoryChapter, StoryProp, PropKind } from "@/game/core/ltbs-stories";
import { spotsFor } from "@/game/core/ltbs-stories";
import { CHARACTERS } from "@/game/core/story-cast";
import { buildAnimal } from "../biblical-figure3d";

/**
 * Builds one LTBS chapter: its set (tents, fields, palace columns, the den),
 * its cast in period dress, its animals, and gold markers over the three
 * things to discover. Units are tiles. The base terrain comes from the
 * story's Blender GLB; this adds what makes each chapter its own place.
 */
type Box = (g: THREE.Group, c: string, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => THREE.Mesh;
type Cyl = (g: THREE.Group, c: string, x: number, z: number, y0: number, y1: number, r: number, seg?: number, r2?: number) => THREE.Mesh;
export interface StoryPerson { root: THREE.Group; play: (mode: string) => void }
export interface StorySceneKit {
  box: Box;
  cyl: Cyl;
  person: (id: string, x: number, z: number, facing: number) => StoryPerson;
  colour: string;
}
export interface StoryScene {
  update: (t: number, player: { x: number; z: number }, found: ReadonlySet<number>) => void;
  dispose: () => void;
}

export function buildStoryScene(world: THREE.Group, scene: StoryChapter, kit: StorySceneKit): StoryScene {
  const { box, cyl } = kit;
  const g = new THREE.Group();
  world.add(g);
  const animals: ReturnType<typeof buildAnimal>[] = [];
  const owned: { dispose: () => void }[] = [];
  const geo = <T extends THREE.BufferGeometry>(x: T) => { owned.push(x); return x; };
  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (c: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const key = c + JSON.stringify(extra);
    let m = matCache.get(key);
    if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, ...extra }); matCache.set(key, m); owned.push(m); }
    return m;
  };
  const mesh = (gg: THREE.BufferGeometry, c: string, x: number, y: number, z: number, parent: THREE.Object3D = g, extra?: Partial<THREE.MeshStandardMaterialParameters>) => {
    const m = new THREE.Mesh(geo(gg), mat(c, extra));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const rock = (x: number, z: number, s: number, c = "#9b9284", parent: THREE.Object3D = g) => { const r = mesh(new THREE.DodecahedronGeometry(s, 0), c, x, s * 0.55, z, parent); r.rotation.set(x, z, 0); r.scale.y = 0.7; return r; };

  const place = (kind: PropKind, x: number, z: number, rot = 0) => {
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    p.rotation.y = rot;
    g.add(p);
    switch (kind) {
      case "tent": {
        const t = mesh(new THREE.ConeGeometry(1.7, 2.2, 4), "#d9c8a2", 0, 1.1, 0, p); t.rotation.y = Math.PI / 4;
        mesh(new THREE.BoxGeometry(0.6, 1.1, 0.05), "#4a3a2a", 0, 0.55, 1.2, p);
        box(p, "#6d4a2c", -0.04, 0, -0.04, 0.04, 2.5, 0.04);
        break;
      }
      case "sheep": case "lamb": case "lion": {
        const a = buildAnimal(kind);
        a.object.position.set(x, 0, z);
        a.object.rotation.y = rot || (x * 1.7 + z) % 6;
        g.add(a.object);
        animals.push(a);
        p.removeFromParent();
        return;
      }
      case "fold": for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; if (i === 4) continue; rock(Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0.35, "#a39a8a", p); } break;
      case "rocks": rock(0, 0, 0.8, "#9b9284", p); rock(0.9, 0.5, 0.5, "#8d8577", p); rock(-0.7, 0.6, 0.45, "#a8a090", p); break;
      case "brook": {
        mesh(new THREE.BoxGeometry(7, 0.05, 1.3), "#4f93b8", 0, 0.04, 0, p, { roughness: 0.2, metalness: 0.1 });
        for (const dx of [-2.4, -0.6, 1.4, 2.8]) mesh(new THREE.BoxGeometry(0.7, 0.06, 0.12), "#a9d6ea", dx, 0.08, (dx % 2) * 0.2, p);
        for (const dx of [-3.2, 3.3]) rock(dx, 0.7, 0.3, "#9b9284", p);
        break;
      }
      case "palm": {
        for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.12 - i * 0.01, 0.14 - i * 0.01, 0.8, 6), "#8a6a45", Math.sin(i * 0.4) * 0.1, 0.4 + i * 0.75, 0, p);
        for (let i = 0; i < 6; i++) { const l = mesh(new THREE.BoxGeometry(1.8, 0.06, 0.38), "#4f8a3c", 0, 3.8, 0, p); l.rotation.set(0, (i / 6) * Math.PI * 2, -0.45); l.geometry.translate(0.9, 0, 0); }
        break;
      }
      case "olive": {
        mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.4, 6), "#6b5236", 0, 0.7, 0, p);
        mesh(new THREE.DodecahedronGeometry(1.1, 0), "#7d8f5c", 0, 1.9, 0, p);
        mesh(new THREE.DodecahedronGeometry(0.8, 0), "#91a26c", 0.6, 2.4, 0.2, p);
        break;
      }
      case "house": {
        box(p, "#d2b48a", -1.5, 0, -1.4, 1.5, 2.4, 1.4);
        box(p, "#c4a57c", -1.6, 2.4, -1.5, 1.6, 2.6, 1.5);
        box(p, "#5a3f2a", -0.35, 0, 1.39, 0.35, 1.5, 1.42);
        box(p, "#3a2f28", 0.7, 1.4, 1.39, 1.1, 1.8, 1.42);
        box(p, "#8a6a45", -1.6, 2.6, -1.5, -1.5, 2.9, 1.5);
        break;
      }
      case "wall": {
        box(p, "#c9a86a", -3.5, 0, -0.5, 3.5, 3.4, 0.5);
        for (let i = -3; i <= 3; i += 1) box(p, "#c9a86a", i - 0.3, 3.4, -0.5, i + 0.2, 3.9, 0.5);
        box(p, kit.colour, -2, 2.2, 0.5, 2, 2.6, 0.55);
        break;
      }
      case "gate": {
        for (const dx of [-3.6, 3.6]) { box(p, "#c9a86a", dx - 0.7, 0, -0.7, dx + 0.7, 4.4, 0.7); box(p, "#b8975a", dx - 0.8, 4.4, -0.8, dx + 0.8, 4.8, 0.8); }
        box(p, "#c9a86a", -3, 3.4, -0.5, 3, 4.2, 0.5);
        box(p, kit.colour, -1.4, 3.6, 0.5, 1.4, 4.0, 0.55);
        break;
      }
      case "column": {
        mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.3, 8), "#e8dcc4", 0, 0.15, 0, p);
        mesh(new THREE.CylinderGeometry(0.3, 0.34, 3.8, 8), "#efe6d2", 0, 2.2, 0, p);
        box(p, "#d8b45a", -0.55, 4.1, -0.55, 0.55, 4.4, 0.55);
        break;
      }
      case "throne": {
        box(p, "#7a2a34", -2, 0, -1.2, 2, 0.35, 1.2);
        box(p, "#a8323c", -1.6, 0.35, -0.9, 1.6, 0.6, 0.9);
        box(p, "#d8b45a", -0.6, 0.6, -0.5, 0.6, 1.15, 0.4);
        box(p, "#d8b45a", -0.7, 1.15, -0.6, 0.7, 2.4, -0.4);
        mesh(new THREE.OctahedronGeometry(0.16), "#c0283c", 0, 2.55, -0.5, p, { emissive: "#40000a" });
        break;
      }
      case "table": {
        box(p, "#6d4a2c", -2, 0.35, -0.6, 2, 0.5, 0.6);
        for (const [dx, dz] of [[-1.8, -0.5], [1.8, -0.5], [-1.8, 0.5], [1.8, 0.5]]) box(p, "#5a3a22", dx - 0.06, 0, dz - 0.06, dx + 0.06, 0.35, dz + 0.06);
        for (let i = -1.5; i <= 1.5; i += 0.75) { mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 8), "#d8b45a", i, 0.55, 0, p); mesh(new THREE.SphereGeometry(0.09, 6, 4), i % 1.5 ? "#a44760" : "#8a9b68", i, 0.65, 0, p); }
        for (const dz of [-1, 1]) box(p, "#a16bd0", -1.8, 0, dz - 0.25, 1.8, 0.22, dz + 0.25);
        break;
      }
      case "sheaves": for (const [dx, dz] of [[0, 0], [0.55, 0.3], [-0.45, 0.4]]) { mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.95, 7), "#d8b45a", dx, 0.48, dz, p); mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 7), "#8a6a45", dx, 0.42, dz, p); mesh(new THREE.ConeGeometry(0.32, 0.25, 7), "#e3c46a", dx, 1.07, dz, p); } break;
      case "barley": for (let i = 0; i < 20; i++) { const dx = (i % 5) - 2 + ((i * 7) % 3) * 0.15, dz = Math.floor(i / 5) - 1.5; mesh(new THREE.ConeGeometry(0.22, 0.9, 5), i % 3 ? "#d8b45a" : "#c9a34a", dx, 0.45, dz, p); } break;
      case "well": {
        mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.8, 10), "#a39a8a", 0, 0.4, 0, p);
        mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 10), "#2a4a5a", 0, 0.78, 0, p);
        for (const dx of [-0.75, 0.75]) box(p, "#6d4a2c", dx - 0.06, 0.8, -0.06, dx + 0.06, 2, 0.06);
        box(p, "#6d4a2c", -0.85, 1.95, -0.08, 0.85, 2.05, 0.08);
        break;
      }
      case "fire": {
        for (const r of [0, 1.1, 2.2]) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 5), "#5a3a22", 0, 0.08, 0, p); l.rotation.set(Math.PI / 2, r, 0); }
        mesh(new THREE.ConeGeometry(0.28, 0.6, 5), "#ff9a2e", 0, 0.35, 0, p, { emissive: "#ff6a00", emissiveIntensity: 1.2 });
        for (let i = 0; i < 8; i++) rock(Math.cos(i) * 0.55, Math.sin(i) * 0.55, 0.12, "#6d665c", p);
        const light = new THREE.PointLight("#ffae5a", 1.4, 6, 1.6); light.position.y = 0.8; p.add(light);
        break;
      }
      case "window": {
        box(p, "#d9c3a0", -1.6, 0, -0.3, 1.6, 3.4, 0.0);
        box(p, "#2a3a55", -0.7, 1.2, 0.0, 0.7, 2.6, 0.02);
        for (const dx of [-0.35, 0, 0.35]) box(p, "#8a6a45", dx - 0.03, 1.2, 0.02, dx + 0.03, 2.6, 0.05);
        box(p, "#8a6a45", -0.7, 1.88, 0.02, 0.7, 1.94, 0.05);
        box(p, "#8a6a45", -0.85, 1.1, 0.02, 0.85, 1.2, 0.25);
        break;
      }
      case "den": {
        for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; box(p, "#8d8274", Math.cos(a) * 3.2 - 0.4, 0, Math.sin(a) * 3.2 - 0.4, Math.cos(a) * 3.2 + 0.4, 1.4 + (i % 3) * 0.2, Math.sin(a) * 3.2 + 0.4); }
        mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 10), "#a39a8a", 3.6, 0.25, -2.6, p);
        break;
      }
      case "cave": {
        mesh(new THREE.DodecahedronGeometry(3.4, 0), "#8d8274", 0, 1.2, -1.2, p).scale.set(1.5, 0.95, 0.9);
        box(p, "#141016", -1, 0, 1.4, 1, 2.2, 1.6);
        rock(-2.6, 1.6, 0.9, "#9b9284", p); rock(2.5, 1.5, 0.8, "#9b9284", p);
        break;
      }
      case "banner": { cyl(p, "#5a3a22", 0, 0, 0, 3.6, 0.05, 6); box(p, kit.colour, 0.05, 2.2, -0.02, 1.0, 3.5, 0.02); break; }
      case "lamp": { cyl(p, "#8a6a2c", 0, 0, 0, 1.5, 0.05, 6); mesh(new THREE.ConeGeometry(0.16, 0.22, 6), "#ffd27a", 0, 1.65, 0, p, { emissive: "#ff9a2e", emissiveIntensity: 1.4 }); const l = new THREE.PointLight("#ffcf7a", 0.8, 5, 1.6); l.position.y = 1.8; p.add(l); break; }
      case "bench": { box(p, "#6d4a2c", -1, 0.35, -0.3, 1, 0.45, 0.3); box(p, "#a16bd0", -0.9, 0.45, -0.25, 0.9, 0.55, 0.25); for (const dx of [-0.85, 0.85]) box(p, "#5a3a22", dx - 0.06, 0, -0.25, dx + 0.06, 0.35, 0.25); break; }
      case "jar": { mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.6, 7), "#b06a3e", 0, 0.3, 0, p); mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.15, 7), "#9a5a33", 0, 0.66, 0, p); break; }
      case "scroll": case "letters": { box(p, "#6d4a2c", -0.5, 0, -0.35, 0.5, 0.7, 0.35); for (const dx of kind === "letters" ? [-0.25, 0, 0.25] : [0]) { const s = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 6), "#efe2bf", dx, 0.78, 0, p); s.rotation.x = Math.PI / 2; } break; }
      case "bread": { box(p, "#6d4a2c", -0.5, 0, -0.35, 0.5, 0.6, 0.35); for (const dx of [-0.25, 0.05, 0.3]) mesh(new THREE.SphereGeometry(0.16, 6, 4), "#c98a4a", dx, 0.7, 0, p).scale.y = 0.6; break; }
      case "basket": { mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.4, 8), "#a97c46", 0, 0.2, 0, p); mesh(new THREE.ConeGeometry(0.35, 0.3, 8), "#d8b45a", 0, 0.5, 0, p); break; }
      case "armour": { box(p, "#6d4a2c", -0.15, 0, -0.15, 0.15, 1.1, 0.15); mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.6, 8), "#a08d5f", 0, 1.0, 0, p, { metalness: 0.4, roughness: 0.45 }); mesh(new THREE.SphereGeometry(0.22, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), "#a08d5f", 0, 1.35, 0, p, { metalness: 0.4, roughness: 0.45 }); break; }
      case "stones": for (let i = 0; i < 5; i++) rock(Math.cos(i * 1.3) * 0.3, Math.sin(i * 1.3) * 0.3, 0.12, "#b8b0a2", p); break;
      case "sling": { rock(0, 0, 0.35, "#a39a8a", p); mesh(new THREE.TorusGeometry(0.18, 0.025, 4, 10), "#7a5232", 0, 0.42, 0, p).rotation.x = Math.PI / 2; break; }
      case "cloak": { rock(0, 0, 0.4, "#9b9284", p); box(p, "#6b3fa0", -0.35, 0.42, -0.25, 0.35, 0.5, 0.25); box(p, "#e0ab3c", -0.35, 0.42, 0.2, 0.35, 0.51, 0.26); break; }
      case "staff": { const s = cyl(p, "#6d4a2c", 0, 0, 0, 1.6, 0.04, 6); s.rotation.z = 0.25; rock(0.3, 0, 0.3, "#9b9284", p); break; }
    }
  };

  const SPOTS = spotsFor(scene);
  const props: StoryProp[] = [...scene.set];
  // Objects you discover stand on their spot, unless the set already has one there.
  scene.talk.forEach((t, i) => {
    if (!t.item) return;
    const [x, z] = SPOTS[i];
    if (!props.some(([k, px, pz]) => k === t.item && Math.hypot(px - x, pz - z) < 0.8)) props.push([t.item, x, z]);
  });
  for (const [kind, x, z, rot] of props) place(kind, x, z, rot);

  // People: the three you meet at the discovery spots, and everyone else in the scene.
  const talkers: { person: StoryPerson; i: number; x: number; z: number }[] = [];
  scene.talk.forEach((t, i) => {
    if (!t.who || !CHARACTERS[t.who]) return;
    const [x, z] = SPOTS[i];
    talkers.push({ person: kit.person(t.who, x, z - 0.85, 0), i, x, z: z - 0.85 });
  });
  for (const [who, x, z, facing] of scene.cast) if (CHARACTERS[who]) kit.person(who, x, z, facing ?? 0);

  // Gold markers over each discovery until you've found it.
  const markers = SPOTS.map(([x, z], i) => {
    const m = new THREE.Group();
    const who = scene.talk[i].who;
    m.position.set(x, who && (CHARACTERS[who]?.height ?? 1.15) > 1.5 ? 3.0 : 2.15, who ? z - 0.85 : z);
    mesh(new THREE.OctahedronGeometry(0.2), "#ffdd80", 0, 0, 0, m, { emissive: "#c99a2a", emissiveIntensity: 0.9 });
    const ring = new THREE.Mesh(geo(new THREE.RingGeometry(0.42, 0.56, 24)), new THREE.MeshBasicMaterial({ color: "#ffdd80", transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    owned.push(ring.material as THREE.Material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -m.position.y + 0.06;
    m.add(ring);
    g.add(m);
    return m;
  });

  return {
    update(t, player, found) {
      animals.forEach((a) => a.update(t));
      markers.forEach((m, i) => {
        m.visible = !found.has(i);
        m.children[0].rotation.y = t * 2;
        m.children[0].position.y = Math.sin(t * 2.4 + i) * 0.08;
        (m.children[1] as THREE.Mesh).scale.setScalar(1 + Math.sin(t * 3 + i) * 0.08);
      });
      // People you approach turn to face you; once you've talked, they gesture as they speak.
      for (const tk of talkers) {
        const d = Math.hypot(player.x - tk.x, player.z - tk.z);
        if (d < 3.2) {
          const want = Math.atan2(player.x - tk.x, player.z - tk.z);
          const r = tk.person.root;
          let delta = want - r.rotation.y;
          delta = Math.atan2(Math.sin(delta), Math.cos(delta));
          r.rotation.y += delta * 0.12;
        }
        tk.person.play(found.has(tk.i) && d < 2.4 ? "wave" : "idle");
      }
    },
    dispose() {
      animals.forEach((a) => a.dispose());
      owned.forEach((o) => o.dispose());
      g.removeFromParent();
    },
  };
}
