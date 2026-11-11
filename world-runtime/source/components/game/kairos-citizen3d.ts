"use client";
import { bodyForAge } from "@/game/core/kairos-life";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type Avatar, look } from "@/game/core/cosmetics";
import { outfitColours } from "@/game/core/outfits";
import { normalizeAvatar } from "../../../../public/avatar.mjs";
export const avatarColours = outfitColours;
export interface Character3D {
  object: THREE.Group;
  /** A short full-body reaction layered over whatever the body is doing. */
  react?: (kind: "bump" | "land" | "nod") => void;
  mixer: THREE.AnimationMixer;
  play: (clip: string) => void;
  update: (dt: number, reducedMotion?: boolean) => void;
  dispose: () => void;
}
let asset: ReturnType<GLTFLoader["loadAsync"]> | null = null;
const load = () =>
  asset ??
  (asset = new GLTFLoader()
    .loadAsync("/world3d/kairos-citizen-v4.glb")
    .catch((error) => {
      asset = null;
      throw error;
    }));
/** Kairos citizen v2 (art-sources/scripts/create_kairos_citizen_v2.py): a fully modelled
 * person whose clothing is lofted from the body itself, so every outfit fits; hair hugs the skull. */
export async function buildCharacter(
  input: Avatar,
  height = 1.15,
  _logo: string | null = null,
  _style: "avatar" | "felt" = "avatar",
): Promise<Character3D> {
  const source = await load(),
    a = look(input),
    raw = (a as Avatar & { graceAppearance?: unknown }).graceAppearance;
  const custom = raw ? normalizeAvatar(raw) : null,
    c = outfitColours(a);
  const colours: Record<string, string> = {
    skin: custom?.skin ?? c.skin,
    hair: custom?.hairColor ?? c.hair,
    top: custom?.top ?? c.top,
    bottom: custom?.legs ?? c.bottom,
    shoes: custom?.shoe ?? c.shoes,
  };
  // Scrubs are a matching set; a hijab takes a soft shade of the top.
  if ((custom as { outfit?: string } | null)?.outfit === "scrubs") colours.bottom = colours.top;
  colours.veil = "#" + new THREE.Color(colours.top).lerp(new THREE.Color("#1e1d22"), 0.35).getHexString();
  // Kairos Life: the same rig at every age, from baby to elder.
  const lifeAge = (input as Avatar & { lifeAge?: number }).lifeAge;
  const ageBody = bodyForAge(typeof lifeAge === "number" ? lifeAge : null);
  if (ageBody.grey > 0) colours.hair = "#" + new THREE.Color(colours.hair).lerp(new THREE.Color("#d8d6d0"), ageBody.grey).getHexString();
  const model = source.scene.clone(true),
    holder = new THREE.Group();
  holder.name = "Kairos explorer";
  holder.userData.characterModel = "kairos-citizen";
  holder.add(model);
  const materials = new Map<string, THREE.Material>();
  const hair =
    custom?.hair ??
    {
      "hair-short": "swoop",
      "hair-curly": "curly",
      "hair-bob": "bob",
      "hair-braids": "braids",
      "hair-buns": "puffs",
      "hair-afro": "afro",
      "hair-buzz": "crop",
      "hair-bald": "bald",
      "hair-long": "long",
    }[a.hair] ??
    "swoop";
  const selectedHair =
    ({ crop: "buzz", swoop: "short", puffs: "buns" } as Record<string, string>)[
      hair
    ] ?? hair;
  const outfit =
    custom?.outfit ??
    (a.top === "top-hoodie"
      ? "hoodie"
      : a.top === "top-stripes"
        ? "stripes"
        : a.top === "top-tracksuit"
          ? "tracksuit"
          : a.top === "top-polo"
            ? "polo"
            : /suit|denim/.test(a.top)
              ? "jacket"
              : "tshirt");
  // Masculine or feminine frame: each has its own body, head and fitted clothing.
  const frame = (custom as { frame?: string } | null)?.frame === "fem" ? "fem" : "masc";
  const coveredHair = custom?.hat === "hijab" || custom?.hat === "scrubcap";
  const longHem = ["dress", "skirt", "abaya"].includes(String((custom as { outfit?: string } | null)?.outfit));
  model.traverse((node) => {
    const base = node.name.replace(/\.?\d{3}$/, "");
    if (node.name.startsWith("frame_")) node.visible = node.name.startsWith("frame_" + frame);
    if (node.name.startsWith("hair_"))
      node.visible = node.name === "hair_" + selectedHair && !coveredHair;
    // Dresses, long skirts and abayas replace the trousers: show the legs/robe instead.
    if (longHem && /^(trouser_|waist|belt_line|sewn_crease)/.test(node.name) && !node.name.startsWith("trouser_cargo")) node.visible = false;
    // Long sleeves live under each arm as outfit_<name>001 / 002.
    if (node.name.startsWith("outfit_"))
      node.visible = base === "outfit_" + outfit;
    if (node.name.startsWith("trouser_cargo"))
      node.visible =
        custom?.trousers === "cargo" || a.bottom === "bottom-cargo";
    if (base === "extras_glasses")
      node.visible = custom?.glasses ?? a.face !== "face-none";
    if (base === "extras_scarf") node.visible = custom?.scarf ?? false;
    if (base === "extras_backpack")
      node.visible = custom?.backpack ?? false;
    if (base === "extras_cap")
      node.visible = custom?.hat === "cap" || a.hat === "hat-cap";
    if (base === "extras_beanie")
      node.visible = custom?.hat === "beanie" || a.hat === "hat-beanie";
    for (const h of ["hijab", "hardhat", "scrubcap", "police"]) if (base === "extras_" + h) node.visible = custom?.hat === h;
    if (base === "extras_freckles")
      node.visible = custom?.face === "freckles";
    if (base === "extras_beard") node.visible = custom?.face === "beard";
    const mesh = node as THREE.Mesh;
    if (mesh.isMesh) {
      const src = mesh.material as THREE.MeshStandardMaterial;
      let material = materials.get(src.name);
      if (!material) {
        const m = src.clone();
        m.roughness = 0.83;
        // Coats, skirts and robes are open shells: show their inside too.
        if (src.name !== "ink") m.side = THREE.DoubleSide;
        m.metalness = 0;
        if (colours[src.name]) m.color.set(colours[src.name]);
        if (src.name === "lips") m.color.set(colours.skin).lerp(new THREE.Color(frame === "fem" ? "#9a3448" : "#4a2626"), frame === "fem" ? 0.45 : 0.3);
        materials.set(src.name, m);
        material = m;
      }
      mesh.material = material;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (custom?.trousers === "shorts" && /^trouser_[LR]$/.test(mesh.name)) {
        // Modest cut: shorts finish just above the knee.
        mesh.scale.y = 0.8; // trousers hang from the hip joint
        mesh.position.y = 0;
      }
      if (custom?.trousers === "shorts" && /^(sewn_crease|trouser_lower)/.test(mesh.name))
        mesh.visible = false;
      if (custom?.face === "angular" && mesh.name.startsWith("sculpted_head"))
        mesh.scale.x = 0.94;
      if (custom?.eyes === "smile" && mesh.name.startsWith("eye_"))
        mesh.scale.y = 0.4;
      if (
        mesh.name.startsWith("eye_white") ||
        mesh.name.startsWith("eye_iris")
      ) {
        if (custom?.eyes === "relaxed") mesh.scale.y *= 0.7;
        if (custom?.eyes === "wide") mesh.scale.set(1.12, 1.15, 1);
        if (custom?.eyes === "almond") mesh.scale.set(1.15, 0.8, 1);
      }
    }
  });
  if (custom?.build === "slim") model.scale.x = 0.88;
  if (custom?.build === "broad") model.scale.x = 1.12;
  const headNode = model.getObjectByName("Head");
  if (headNode && ageBody.head !== 1) headNode.scale.multiplyScalar(ageBody.head);
  if (ageBody.stoop) model.rotation.x = ageBody.stoop;
  const bounds = new THREE.Box3().setFromObject(model),
    scale = (height * ageBody.height) / Math.max(0.01, bounds.max.y - bounds.min.y);
  holder.scale.setScalar(scale);
  model.position.y -= bounds.min.y;
  const body = model.getObjectByName("Body")!,
    head = model.getObjectByName("Head")!,
    arms = [model.getObjectByName("ArmL")!, model.getObjectByName("ArmR")!],
    legs = [model.getObjectByName("LegL")!, model.getObjectByName("LegR")!],
    elbows = [model.getObjectByName("ElbowL"), model.getObjectByName("ElbowR")],
    knees = [model.getObjectByName("KneeL"), model.getObjectByName("KneeR")];
  if (frame === "fem") arms.forEach((a) => (a.position.x *= 0.9));
  // Face pieces stay separate meshes so they can blink, talk and react.
  const isFace = (n: string) => /^(eye_|brow|mouth|lash)/.test(n);
  const face = { eyes: [] as THREE.Object3D[], brows: [] as THREE.Object3D[], mouth: null as THREE.Object3D | null };
  model.traverseVisible((n) => {
    if (!(n as THREE.Mesh).isMesh || !isFace(n.name)) return;
    n.userData.rest = { s: n.scale.clone(), p: n.position.clone() };
    if (n.name.startsWith("eye_") || n.name.startsWith("lash")) face.eyes.push(n);
    else if (n.name.startsWith("brow")) face.brows.push(n);
    else face.mouth = n;
  });
  // Bake small buttons, seams and facial pieces together per material and joint.
  // The shoulders, hips and head remain independently animated. Cached source geometry stays untouched.
  model.updateMatrixWorld(true);
  const joints = new Set<THREE.Object3D>([body, head, ...arms, ...legs, ...elbows.filter((x): x is THREE.Object3D => !!x), ...knees.filter((x): x is THREE.Object3D => !!x)]);
  const batches = new Map<
    THREE.Object3D,
    Map<
      THREE.Material,
      { parts: THREE.BufferGeometry[]; sources: THREE.Mesh[] }
    >
  >();
  model.traverseVisible((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material) || isFace(mesh.name)) return;
    let joint = mesh.parent;
    while (joint && !joints.has(joint)) joint = joint.parent;
    if (!joint) return;
    const rows = batches.get(joint) ?? new Map();
    batches.set(joint, rows);
    const row = rows.get(mesh.material) ?? { parts: [], sources: [] };
    rows.set(mesh.material, row);
    const part = mesh.geometry.index
      ? mesh.geometry.toNonIndexed()
      : mesh.geometry.clone();
    for (const key of Object.keys(part.attributes))
      if (!["position", "normal"].includes(key)) part.deleteAttribute(key);
    part.applyMatrix4(
      new THREE.Matrix4()
        .copy(joint.matrixWorld)
        .invert()
        .multiply(mesh.matrixWorld),
    );
    row.parts.push(part);
    row.sources.push(mesh);
  });
  const generated = new Set<THREE.BufferGeometry>();
  for (const [joint, rows] of batches)
    for (const [material, row] of rows) {
      const geometry = mergeGeometries(row.parts, false);
      row.parts.forEach((g) => g.dispose());
      if (!geometry) continue;
      generated.add(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "citizen_surface_" + material.name;
      mesh.castShadow = mesh.receiveShadow = true;
      joint.add(mesh);
      row.sources.forEach((o) => o.removeFromParent());
    }
  // Printed hoodies from the Kairos Mall: black lettering across the chest.
  const print = (custom as { print?: string } | null)?.print;
  if (print && print !== "none" && /hoodie|tshirt|jacket/.test(outfit)) {
    const text = ({ "kharis-church": ["KHARIS", "CHURCH"], "kharis-phase-2": ["KHARIS", "PHASE 2"], "kharis-on-campus": ["KHARIS", "ON CAMPUS"] } as Record<string, string[]>)[print];
    const torso = model.getObjectByName("Body");
    if (text && torso) {
      const canvas = document.createElement("canvas");
      canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#111014";
      ctx.textAlign = "center";
      ctx.font = "900 54px system-ui, sans-serif";
      ctx.fillText(text[0], 128, 56);
      ctx.font = `900 ${text[1].length > 7 ? 34 : 42}px system-ui, sans-serif`;
      ctx.fillText(text[1], 128, 104);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.105), new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }));
      decal.name = "hoodie_print";
      materials.set("hoodie_print", decal.material);
      generated.add(decal.geometry);
      decal.position.set(0, frame === "fem" ? 0.38 : 0.36, frame === "fem" ? 0.118 : 0.122);
      torso.add(decal);
    }
  }
  const restY = body.position.y,
    mixer = new THREE.AnimationMixer(model);
  let mode = "idle",
    time = 0,
    dead = false,
    reaction = { kind: "", at: -10 },
    airborne = 0,
    nextBlink = 1.5 + Math.random() * 3;
  const seed = Math.random() * 10;
  const approach = (o: THREE.Object3D | null | undefined, axis: "x" | "y" | "z", value: number, k: number) => {
    if (o) o.rotation[axis] = THREE.MathUtils.lerp(o.rotation[axis], value, k);
  };
  return {
    object: holder,
    mixer,
    play(clip) {
      if (mode !== "jump" && clip === "jump") airborne = 0;
      if (mode === "jump" && clip !== "jump" && airborne > 0.25) reaction = { kind: "land", at: time };
      mode = clip;
    },
    react(kind) {
      if (time - reaction.at < 0.35 && reaction.kind === kind) return;
      reaction = { kind, at: time };
    },
    update(dt, reduced = false) {
      if (dead) return;
      dt = Math.min(0.1, Math.max(0, dt));
      time += dt;
      const k = 1 - Math.exp(-dt * 15),
        run = /run|sprint/.test(mode),
        walk = /walk|run|sprint|cycle/.test(mode),
        jump = mode === "jump",
        wave = /wave|emote|cheer|celebrate/.test(mode),
        talk = /emote-yes|talk|greet/.test(mode),
        sit = /sit|drive/.test(mode),
        stride = Math.sin(time * (run ? 12 : 7.5)),
        lift = Math.cos(time * (run ? 12 : 7.5));
      if (jump) airborne += dt;
      // Reaction envelope: quick attack, smooth release.
      const since = time - reaction.at, dur = reaction.kind === "bump" ? 0.75 : reaction.kind === "land" ? 0.35 : 0.6;
      const env = reduced || since > dur ? 0 : Math.sin(Math.min(1, since / dur) * Math.PI) ** 0.7;
      const bump = reaction.kind === "bump" ? env : 0, land = reaction.kind === "land" ? env : 0, nod = reaction.kind === "nod" ? env : 0;
      arms.forEach((o, i) => {
        const side = i ? -1 : 1;
        approach(o, "x",
          (walk ? stride * (i ? -0.5 : 0.5) * (run ? 1.4 : 1) : jump ? -0.9 : mode === "read" ? -0.75 : mode === "think" && i === 1 ? -1.2 : 0) - bump * 0.5, k);
        approach(o, "z",
          (wave && i === 1 ? -2.4 + Math.sin(time * 7) * 0.18 : jump ? side * 0.35 : 0) + side * (bump * 0.75 + land * 0.25), k);
      });
      elbows.forEach((o, i) =>
        approach(o, "x",
          walk ? -0.25 - Math.max(0, stride * (i ? 1 : -1)) * (run ? 0.9 : 0.45) : jump ? -0.6 : mode === "read" ? -1.0 : mode === "think" && i === 1 ? -1.9 : wave && i === 1 ? -0.5 : bump ? -0.6 * bump : -0.08, k));
      legs.forEach((o, i) =>
        approach(o, "x",
          sit ? -1.4 : jump ? (i ? 0.35 : -0.45) : walk ? stride * (i ? 0.6 : -0.6) * (run ? 1.25 : 1) : -land * 0.35, k));
      knees.forEach((o, i) =>
        approach(o, "x",
          sit ? 1.45 : jump ? (i ? 0.9 : 0.5) : walk ? Math.max(0, (i ? -lift : lift)) * (run ? 1.3 : 0.75) + 0.05 : land * 0.7, k));
      const breathe = reduced ? 0 : Math.sin(time * 1.6 + seed) * 0.006;
      body.position.y = restY + (reduced ? 0 : walk ? Math.abs(stride) * (run ? 0.04 : 0.025) : breathe) - land * 0.08;
      approach(body, "x", (run ? -0.12 : walk ? -0.04 : 0) + bump * 0.32 - land * 0.12, k); // lean into a run, rock back on a bump
      approach(body, "z", walk && !reduced ? stride * 0.025 : 0, k);
      approach(head, "y", wave && !reduced ? Math.sin(time * 3) * 0.08 : !walk && !reduced ? Math.sin(time * 0.35 + seed) * 0.18 : 0, k * 0.5);
      approach(head, "x", -bump * 0.25 + nod * 0.3 * Math.sin(since * 14) + (talk ? Math.sin(time * 5) * 0.05 : 0), k);
      // Face: blinks, talking, smiles and surprise.
      if (time > nextBlink) nextBlink = time + 2.2 + Math.random() * 3.5;
      const blinking = !reduced && nextBlink - time < 0.12; // the last 120 ms before each scheduled blink
      for (const e of face.eyes) {
        const r = e.userData.rest;
        e.scale.y = r.s.y * (blinking ? 0.12 : bump ? 1.25 : wave ? 0.8 : 1);
      }
      for (const b of face.brows) {
        const r = b.userData.rest;
        b.position.y = r.p.y + (bump ? 0.008 : wave ? 0.004 : mode === "think" ? -0.004 : 0);
      }
      if (face.mouth) {
        const r = face.mouth.userData.rest;
        const open = bump ? 2.6 : talk && !reduced ? 1 + Math.abs(Math.sin(time * 13)) * 1.8 : 1;
        face.mouth.scale.set(r.s.x * (wave || talk ? 1.25 : 1), r.s.y * open, r.s.z);
      }
    },
    dispose() {
      if (dead) return;
      dead = true;
      mixer.uncacheRoot(model);
      materials.forEach((m) => m.dispose());
      generated.forEach((g) => g.dispose());
      holder.removeFromParent();
      holder.clear();
    },
  };
}
/** Residents use original Kairos meshes, never the reference project's cast. */
export function npcLook(i: number): Avatar {
  const n = Math.abs(i),
    skins = ["#d9a778", "#6e4630", "#8a5a3c", "#f2c7a5", "#482e25", "#a6734d"],
    // Even residents are feminine frames, odd masculine; hair drawn from a mixed set.
    hair = ["curly", "braids", "swoop", "long", "afro", "bob", "crop", "puffs"],
    tops = ["#6b3fa0", "#367c73", "#e0ab3c", "#d97554", "#334963", "#a44760"],
    outfits = ["hoodie", "jacket", "tshirt", "overalls", "tunic"];
  return {
    ...look({}),
    graceAppearance: normalizeAvatar({
      skin: skins[n % skins.length],
      hair: hair[n % hair.length],
      hairColor: n % 7 === 0 ? "#d8d5cb" : "#241a18",
      top: tops[n % tops.length],
      outfit: outfits[n % outfits.length],
      trousers: n % 3 === 0 ? "cargo" : "jeans",
      glasses: n % 5 === 0,
      backpack: n % 4 === 0,
      build: n % 4 === 0 ? "broad" : n % 5 === 1 ? "slim" : "standard",
      frame: n % 2 ? "fem" : "masc",
      face: n % 2 === 0 && n % 3 === 0 ? "beard" : n % 11 === 5 ? "freckles" : "soft",
      eyes: ["round", "almond", "relaxed"][n % 3],
    }),
    // A city of every age: children, teenagers, adults and grey-haired elders.
    lifeAge: n % 9 === 4 ? 6 + (n % 5) : n % 9 === 7 ? 14 + (n % 3) : n % 7 === 0 ? 68 + (n % 15) : 22 + (n % 35),
  } as Avatar;
}
