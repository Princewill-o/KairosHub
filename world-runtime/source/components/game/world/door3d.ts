import * as THREE from "three";

import type { Doorway } from "@/game/core/doors";

const FACING_ROT: Record<Doorway["facing"], number> = { south: 0, north: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 };
const mats = new Map<string, THREE.Material>();
const m = (key: string, make: () => THREE.Material) => {
  let v = mats.get(key);
  if (!v) { v = make(); mats.set(key, v); }
  return v;
};

/**
 * A real, normal-sized door: stone frame, panelled leaves with glazing and a
 * warm interior glow that brightens as the leaves swing inward.
 */
export function buildDoor(d: Doorway, prepare: (o: THREE.Object3D) => void) {
  const root = new THREE.Group();
  root.position.set(d.x, 0, d.z);
  root.rotation.y = FACING_ROT[d.facing];
  const W = d.width, H = d.cutaway ? 0.45 : d.height, T = 0.14;
  const frameMat = m("frame", () => new THREE.MeshLambertMaterial({ color: "#efe6d2" }));
  const woodMat = m(`wood`, () => new THREE.MeshLambertMaterial({ color: "#5a3420" }));
  const panelMat = m(`panel`, () => new THREE.MeshLambertMaterial({ color: "#6f4128" }));
  const glassMat = m("glass", () => new THREE.MeshLambertMaterial({ color: "#2c4652" }));
  const brass = m("brass", () => new THREE.MeshLambertMaterial({ color: "#d9b25a" }));
  const glowMat = new THREE.MeshBasicMaterial({ color: "#ffd99a", transparent: true, opacity: 0, depthWrite: false, toneMapped: false });

  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  // Frame: jambs, lintel and step, flush with the wall face.
  add(new THREE.BoxGeometry(0.16, H + 0.16, 0.22), frameMat, -W / 2 - 0.08, (H + 0.16) / 2, 0.02);
  add(new THREE.BoxGeometry(0.16, H + 0.16, 0.22), frameMat, W / 2 + 0.08, (H + 0.16) / 2, 0.02);
  add(new THREE.BoxGeometry(W + 0.5, 0.2, 0.26), frameMat, 0, H + 0.12, 0.03);
  add(new THREE.BoxGeometry(W + 0.5, 0.08, 0.5), frameMat, 0, 0.04, 0.2);
  const accent = new THREE.MeshLambertMaterial({ color: d.accent });
  if (!d.cutaway) add(new THREE.BoxGeometry(W * 0.7, 0.08, 0.04), accent, 0, H + 0.25, 0.17);
  // Dark doorway recess with a warm glow card that shows when open.
  add(new THREE.BoxGeometry(W, H, 0.06), m("void", () => new THREE.MeshBasicMaterial({ color: "#120c18" })), 0, H / 2, -0.12);
  const glow = add(new THREE.PlaneGeometry(W * 0.98, H * 0.98), glowMat, 0, H / 2, -0.08);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.5, 1.4), glowMat);
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, 0.03, 0.75);
  root.add(spill);

  const leaves: { pivot: THREE.Group; sign: number }[] = [];
  const leafCount = d.double ? 2 : 1;
  const lw = W / leafCount;
  for (let i = 0; i < leafCount; i++) {
    const sign = leafCount === 1 ? 1 : i === 0 ? 1 : -1;
    const pivot = new THREE.Group();
    pivot.position.set(sign > 0 ? -W / 2 : W / 2, 0, 0);
    root.add(pivot);
    const cx = sign * lw / 2;
    add(new THREE.BoxGeometry(lw - 0.02, H - 0.02, T * 0.5), woodMat, cx, H / 2, 0, pivot);
    if (!d.cutaway) {
      add(new THREE.BoxGeometry(lw * 0.62, H * 0.32, 0.03), glassMat, cx, H * 0.7, T * 0.27, pivot);
      add(new THREE.BoxGeometry(lw * 0.62, H * 0.26, 0.03), panelMat, cx, H * 0.27, T * 0.27, pivot);
      add(new THREE.SphereGeometry(0.045, 6, 4), brass, sign * (lw - 0.14), H * 0.48, T * 0.36, pivot);
    }
    leaves.push({ pivot, sign });
  }
  prepare(root);
  let open = 0;
  return {
    root,
    doorway: d,
    get open() { return open; },
    update(target: number, dt: number) {
      open += (target - open) * Math.min(1, dt * 6);
      if (Math.abs(target - open) < 0.002) open = target;
      for (const l of leaves) l.pivot.rotation.y = l.sign * open * 1.45;
      glowMat.opacity = open * 0.85;
      glow.visible = spill.visible = open > 0.01;
    },
    dispose() {
      root.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) mesh.geometry.dispose(); });
      glowMat.dispose();
      accent.dispose();
    },
  };
}
