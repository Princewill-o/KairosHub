"use client";
import * as THREE from "three";
import { look, type Avatar } from "@/game/core/cosmetics";
import { normalizeAvatar } from "../../../../public/avatar.mjs";
import { buildCharacter, type Character3D } from "./kairos-human3d";
import type { Costume } from "@/game/core/story-cast";

/**
 * Story characters for LTBS: the same Kairos citizen rig and faces the rest
 * of the world uses, dressed in modest, ankle-length period clothing.
 * Robes, mantles, veils, head wraps, crowns and hand props are low-poly
 * pieces parented to the rig's joints, so the existing walk / idle / sit
 * animation drives them. All units are in the citizen model's own space.
 */
const flat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, flatShading: true, ...extra });

export async function buildFigure(c: Costume, height = 1.15): Promise<Character3D> {
  const avatar = {
    ...look({}),
    graceAppearance: normalizeAvatar({
      skin: c.skin,
      hair: c.hair ?? "curly",
      hairColor: c.hairColor ?? "#241a18",
      face: c.beard ? "beard" : "soft",
      outfit: "tunic",
      trousers: "chinos",
      build: c.build ?? "standard",
    }),
  } as Avatar;
  const ch = await buildCharacter(avatar, height);
  const model = ch.object.children[0];
  const owned: { dispose: () => void }[] = [];
  const mat = (color: string, extra?: Partial<THREE.MeshStandardMaterialParameters>) => { const m = flat(color, extra); owned.push(m); return m; };
  // Sleeves and legs take the robe and sandal colours.
  ch.object.traverse((n) => {
    const m = (n as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (!m || !(n as THREE.Mesh).isMesh) return;
    if (m.name === "top") m.color.set(c.robe);
    if (m.name === "bottom") m.color.set(c.robe);
    if (m.name === "shoes") m.color.set("#7a5232");
  });
  const body = model.getObjectByName("Body")!;
  const head = model.getObjectByName("Head")!;
  const hand = model.getObjectByName("ArmR")!;
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
    owned.push(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const robe = mat(c.robe), trim = mat(c.trim ?? c.sash ?? "#d8b45a");
  // Ankle-length robe over the body (legs swing beneath, sandals show).
  add(body, new THREE.CylinderGeometry(0.32, 0.46, 1.3, 8), robe, 0, -0.06, 0);
  add(body, new THREE.CylinderGeometry(0.462, 0.47, 0.06, 8), trim, 0, -0.69, 0);
  add(body, new THREE.CylinderGeometry(0.335, 0.34, 0.09, 8), mat(c.sash ?? "#8a5a3c"), 0, 0.06, 0);
  if (c.mantle) {
    add(body, new THREE.CylinderGeometry(0.37, 0.5, 1.1, 8, 1, true, Math.PI * 0.62, Math.PI * 0.76), mat(c.mantle, { side: THREE.DoubleSide }), 0, 0.05, 0);
    add(body, new THREE.CylinderGeometry(0.36, 0.37, 0.08, 8), trim, 0, 0.6, 0);
  }
  if (c.armour) {
    add(body, new THREE.CylinderGeometry(0.35, 0.37, 0.5, 8), mat("#9a8b6a", { metalness: 0.35, roughness: 0.5 }), 0, 0.35, 0);
  }
  // Head coverings.
  const hairCol = mat(c.hairColor ?? "#241a18");
  if (c.head === "veil" || c.head === "veil-crown") {
    // Covers hair and shoulders, leaves the face open.
    add(head, new THREE.CylinderGeometry(0.3, 0.44, 0.9, 10, 1, true, Math.PI * 0.28, Math.PI * 1.44), mat(c.veil ?? "#efe6d2", { side: THREE.DoubleSide }), 0, -0.2, 0);
    add(head, new THREE.SphereGeometry(0.31, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(c.veil ?? "#efe6d2"), 0, 0.12, -0.01);
  }
  if (c.head === "wrap") {
    add(head, new THREE.CylinderGeometry(0.3, 0.31, 0.16, 8), mat(c.veil ?? "#e9dcc0"), 0, 0.2, 0);
    add(head, new THREE.SphereGeometry(0.3, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(c.veil ?? "#e9dcc0"), 0, 0.25, 0);
    add(head, new THREE.BoxGeometry(0.56, 0.5, 0.06), mat(c.veil ?? "#e9dcc0"), 0, -0.02, -0.25);
    add(head, new THREE.TorusGeometry(0.3, 0.025, 4, 12), mat("#2a2420"), 0, 0.22, 0, Math.PI / 2);
  }
  if (c.head === "turban") {
    add(head, new THREE.CylinderGeometry(0.29, 0.31, 0.22, 8), mat(c.veil ?? "#f1ead8"), 0, 0.22, 0);
    add(head, new THREE.SphereGeometry(0.29, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(c.veil ?? "#f1ead8"), 0, 0.3, 0);
  }
  if (c.head === "tall-hat") add(head, new THREE.CylinderGeometry(0.2, 0.27, 0.42, 8), mat(c.veil ?? "#5a2d6b"), 0, 0.42, 0);
  if (c.head === "helmet") {
    add(head, new THREE.SphereGeometry(0.31, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), mat("#a08d5f", { metalness: 0.4, roughness: 0.45 }), 0, 0.1, 0);
    add(head, new THREE.BoxGeometry(0.06, 0.16, 0.5), mat("#7a2a24"), 0, 0.38, 0);
  }
  if (c.head === "crown" || c.head === "veil-crown") {
    const gold = mat("#e8b93c", { metalness: 0.5, roughness: 0.35, emissive: "#3a2600" });
    const y = c.head === "veil-crown" ? 0.33 : 0.27;
    add(head, new THREE.CylinderGeometry(0.24, 0.25, 0.1, 10), gold, 0, y, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      add(head, new THREE.ConeGeometry(0.045, 0.12, 4), gold, Math.sin(a) * 0.22, y + 0.1, Math.cos(a) * 0.22);
    }
    add(head, new THREE.OctahedronGeometry(0.035), mat("#c0283c", { emissive: "#40000a" }), 0, y, 0.25);
  }
  if (c.beard) add(head, new THREE.BoxGeometry(0.44, c.beard === "full" ? 0.3 : 0.18, 0.16), hairCol, 0, c.beard === "full" ? -0.27 : -0.22, 0.17);
  // Something in the right hand.
  if (c.prop === "staff" || c.prop === "spear") {
    add(hand, new THREE.CylinderGeometry(0.025, 0.03, 1.9, 6), mat(c.prop === "staff" ? "#6d4a2c" : "#5a4632"), 0, -0.45, 0.12);
    if (c.prop === "staff") add(hand, new THREE.TorusGeometry(0.1, 0.025, 4, 8, Math.PI), mat("#6d4a2c"), 0.1, 0.5, 0.12, 0, 0, -Math.PI / 2);
    if (c.prop === "spear") add(hand, new THREE.ConeGeometry(0.05, 0.18, 4), mat("#b9b3a5", { metalness: 0.5 }), 0, 0.59, 0.12);
  }
  if (c.prop === "scroll") {
    add(hand, new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), mat("#efe2bf"), 0, -0.6, 0.12, 0, 0, Math.PI / 2);
  }
  if (c.prop === "jar") add(hand, new THREE.CylinderGeometry(0.09, 0.12, 0.26, 7), mat("#b06a3e"), 0, -0.62, 0.12);
  if (c.prop === "sheaf") {
    add(hand, new THREE.ConeGeometry(0.13, 0.42, 6), mat("#d8b45a"), 0, -0.55, 0.14, Math.PI);
  }
  if (c.prop === "sling") add(hand, new THREE.TorusGeometry(0.08, 0.015, 4, 8), mat("#7a5232"), 0, -0.6, 0.1);
  if (c.prop === "basket") add(hand, new THREE.CylinderGeometry(0.16, 0.12, 0.16, 8), mat("#a97c46"), 0, -0.6, 0.15);
  return {
    ...ch,
    dispose() {
      owned.forEach((o) => o.dispose());
      ch.dispose();
    },
  };
}

/** Animals for the story scenes: sheep in the pasture, lions in the den. */
export function buildAnimal(kind: "sheep" | "lamb" | "lion"): { object: THREE.Group; update: (t: number) => void; dispose: () => void } {
  const g = new THREE.Group();
  const owned: { dispose: () => void }[] = [];
  const part = (geo: THREE.BufferGeometry, color: string, x: number, y: number, z: number, parent: THREE.Object3D = g) => {
    const m = flat(color);
    owned.push(geo, m);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  let headPart: THREE.Object3D;
  let chest: THREE.Object3D;
  if (kind === "lion") {
    chest = part(new THREE.BoxGeometry(0.55, 0.42, 1.05), "#c8964f", 0, 0.35, 0);
    headPart = new THREE.Group();
    headPart.position.set(0, 0.55, 0.62);
    g.add(headPart);
    part(new THREE.CylinderGeometry(0.36, 0.4, 0.28, 7), "#8a4e22", 0, 0, -0.02, headPart).rotation.x = Math.PI / 2;
    part(new THREE.BoxGeometry(0.34, 0.32, 0.32), "#d8a55c", 0, 0, 0.12, headPart);
    part(new THREE.BoxGeometry(0.14, 0.1, 0.1), "#3b2a20", 0, -0.06, 0.3, headPart);
    for (const [x, z] of [[-0.2, 0.38], [0.2, 0.38], [-0.2, -0.38], [0.2, -0.38]]) part(new THREE.BoxGeometry(0.13, 0.3, 0.13), "#c08d48", x, 0.12, z);
    part(new THREE.BoxGeometry(0.05, 0.05, 0.6), "#c08d48", 0, 0.42, -0.8).rotation.x = -0.6;
  } else {
    const s = kind === "lamb" ? 0.7 : 1;
    chest = part(new THREE.DodecahedronGeometry(0.32 * s), "#f3efe6", 0, 0.38 * s, 0);
    chest.scale.set(1, 0.85, 1.35);
    headPart = part(new THREE.BoxGeometry(0.17 * s, 0.2 * s, 0.24 * s), "#2b2522", 0, 0.48 * s, 0.42 * s);
    for (const [x, z] of [[-0.13, 0.2], [0.13, 0.2], [-0.13, -0.2], [0.13, -0.2]]) part(new THREE.BoxGeometry(0.06 * s, 0.26 * s, 0.06 * s), "#2b2522", x * s, 0.13 * s, z * s);
  }
  const phase = Math.random() * 6;
  return {
    object: g,
    update(t) {
      if (kind === "lion") { chest.scale.y = 1 + Math.sin(t * 1.4 + phase) * 0.03; headPart.rotation.y = Math.sin(t * 0.3 + phase) * 0.25; }
      else headPart.position.y = (kind === "lamb" ? 0.34 : 0.48) + (Math.sin(t * 0.8 + phase) > 0.6 ? -0.18 : 0);
    },
    dispose() { owned.forEach((o) => o.dispose()); g.removeFromParent(); },
  };
}
