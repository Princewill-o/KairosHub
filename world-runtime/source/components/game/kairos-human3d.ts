"use client";
/**
 * The Kairos human: every person in Kairos World.
 *
 * The supplied blocky Blockbench humanoid, kept as designed with its idle /
 * walk / run / jump / punch / hit / death clips (art-sources/scripts/
 * create_kairos_human.py re-UVs it). Each person wears a 64×64 skin in the
 * standard Minecraft layout: either painted from their avatar choices
 * (public/kairos-skins.mjs) or an uploaded Minecraft skin.
 */
import { bodyForAge } from "@/game/core/kairos-life";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { type Avatar, look } from "@/game/core/cosmetics";
import { outfitColours } from "@/game/core/outfits";
import { normalizeAvatar } from "../../../../public/avatar.mjs";
import { paintSkin, upgradeLegacySkin, SKIN_PARTS, faces } from "../../../../public/kairos-skins.mjs";

export interface Character3D {
  object: THREE.Group;
  /** A short full-body reaction layered over whatever the body is doing. */
  react?: (kind: "bump" | "land" | "nod") => void;
  mixer: THREE.AnimationMixer;
  play: (clip: string) => void;
  update: (dt: number, reducedMotion?: boolean) => void;
  dispose: () => void;
}

let asset: Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }> | null = null;
const load = () =>
  asset ??
  (asset = new GLTFLoader()
    .loadAsync("/world3d/kairos-human.glb?v=blocky-1")
    .catch((error) => {
      asset = null;
      throw error;
    }));

const HUMAN_HEIGHT = 2.094; // model units, crown to sole

type SkinLook = ReturnType<typeof normalizeAvatar> & { skin64?: string };

/** The avatar choices that paint a skin, for any avatar shape the game passes. */
export function skinLook(input: Avatar): SkinLook {
  const a = look(input);
  const raw = (a as Avatar & { graceAppearance?: unknown }).graceAppearance as Record<string, unknown> | undefined;
  if (raw) return { ...normalizeAvatar(raw), skin64: typeof raw.skin64 === "string" ? raw.skin64 : undefined } as SkinLook;
  const c = outfitColours(a);
  const hair = ({ "hair-short": "swoop", "hair-curly": "curly", "hair-bob": "bob", "hair-braids": "braids", "hair-buns": "puffs", "hair-afro": "afro", "hair-buzz": "crop", "hair-bald": "bald", "hair-long": "long" } as Record<string, string>)[a.hair] ?? "swoop";
  const outfit = a.top === "top-hoodie" ? "hoodie" : a.top === "top-stripes" ? "stripes" : a.top === "top-tracksuit" ? "tracksuit" : a.top === "top-polo" ? "polo" : /suit/.test(a.top) ? "suit" : /denim/.test(a.top) ? "jacket" : "tshirt";
  return { ...normalizeAvatar({ hair, outfit, hat: a.hat === "hat-cap" ? "cap" : a.hat === "hat-beanie" ? "beanie" : "none", scarf: false }), skin: c.skin, hairColor: c.hair, top: c.top, legs: c.bottom, shoe: c.shoes } as SkinLook;
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

/** Paint (or load) the 64×64 skin onto a fresh canvas for one person. */
async function skinCanvas(s: SkinLook, grey: number) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  if (s.skin64) {
    try {
      const img = await loadImage(s.skin64);
      if (img.width === 64 && img.height === 32) upgradeLegacySkin(ctx, img);
      else ctx.drawImage(img, 0, 0, 64, 64);
      return c;
    } catch { /* fall back to a painted skin */ }
  }
  const hairColor = grey > 0 ? "#" + new THREE.Color(s.hairColor).lerp(new THREE.Color("#d8d6d0"), grey).getHexString() : s.hairColor;
  paintSkin(ctx, { ...s, hairColor }, { seed: s.skin.length + s.top.length });
  return c;
}

/** Which overlay parts actually carry pixels (skip invisible shells: fewer draw calls). */
function overlayParts(ctx: CanvasRenderingContext2D) {
  const used = new Set<string>();
  for (const [name, p] of Object.entries(SKIN_PARTS)) {
    const f = faces(p.over, p.size);
    const xs = Object.values(f).map((r) => r as number[]);
    const x0 = Math.min(...xs.map((r) => r[0])), y0 = Math.min(...xs.map((r) => r[1]));
    const x1 = Math.max(...xs.map((r) => r[0] + r[2])), y1 = Math.max(...xs.map((r) => r[1] + r[3]));
    const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 20) { used.add(name); break; }
  }
  return used;
}
const PART_OF: [RegExp, string][] = [[/^(head|neck)_/, "head"], [/^(chest|waist|pelvis)_/, "body"], [/^right_(arm|hand)/, "rightArm"], [/^left_(arm|hand)/, "leftArm"], [/^right_(leg|foot)/, "rightLeg"], [/^left_(leg|foot)/, "leftLeg"]];

const CLIP: Record<string, string> = { idle: "idle", walk: "walk", run: "run", sprint: "run", cycle: "walk", jump: "jump", punch: "punch_basic", hit: "hit_take", death: "death", dead: "death" };

export async function buildCharacter(input: Avatar, height = 1.15, _logo: string | null = null, _style: "avatar" | "felt" = "avatar"): Promise<Character3D> {
  const source = await load();
  const s = skinLook(input);
  const lifeAge = (input as Avatar & { lifeAge?: number }).lifeAge;
  const ageBody = bodyForAge(typeof lifeAge === "number" ? lifeAge : null);
  const canvas = await skinCanvas(s, ageBody.grey);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace; texture.flipY = false;
  const base = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0 });
  const over = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide });
  const used = overlayParts(ctx);

  const model = source.scene.clone(true);
  model.traverse((n) => {
    const m = n as THREE.Mesh;
    if (!m.isMesh) return;
    const overlay = /overlay/.test(m.name);
    const part = PART_OF.find(([re]) => re.test(m.name))?.[1];
    if (overlay && part && !used.has(part)) { m.visible = false; return; }
    m.material = overlay ? over : base;
    m.castShadow = !overlay; m.receiveShadow = true;
  });

  // The rig faces -Z; the game faces +Z. Scale to the requested height and age.
  const holder = new THREE.Group();
  holder.name = "Kairos human"; holder.userData.characterModel = "kairos-human";
  const pivot = new THREE.Group(); pivot.rotation.y = Math.PI; pivot.add(model); holder.add(pivot);
  const build = s.build === "broad" ? 1.08 : s.build === "slim" ? 0.93 : 1;
  const k = (height / HUMAN_HEIGHT) * ageBody.height;
  model.scale.set(k * build * (s.frame === "fem" ? 0.95 : 1), k * (s.frame === "fem" ? 0.97 : 1), k * build);
  const node = (n: string) => model.getObjectByName(n) ?? null;
  const head = node("head"), chest = node("chest"), neck = node("neck");
  if (head && ageBody.head !== 1) head.scale.setScalar(ageBody.head);
  if (chest && ageBody.stoop) chest.rotation.x += ageBody.stoop;

  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map(source.animations.map((c) => [c.name, mixer.clipAction(c)]));
  for (const a of ["punch_basic", "hit_take", "death", "jump"]) { const act = actions.get(a); if (act) { act.setLoop(a === "death" ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); act.clampWhenFinished = a === "death"; } }
  let mode = "idle", current: THREE.AnimationAction | null = null, time = 0, dead = false;
  let reaction = { kind: "", at: -10 };
  const fade = (name: string, d = 0.22) => {
    const next = actions.get(name) ?? actions.get("idle")!;
    if (next === current) return;
    next.reset().setEffectiveWeight(1).fadeIn(d).play();
    current?.fadeOut(d);
    current = next;
  };
  fade("idle", 0);

  // Procedural poses layered on the clips for things the rig has no clip for.
  const arm = { r: node("right_arm_upper"), l: node("left_arm_upper"), rl: node("right_arm_lower"), ll: node("left_arm_lower") };
  const leg = { r: node("right_leg_upper"), l: node("left_leg_upper"), rl: node("right_leg_lower"), ll: node("left_leg_lower") };
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  const turn = (o: THREE.Object3D | null, x: number, y = 0, z = 0) => { if (!o) return; q.setFromEuler(e.set(x, y, z)); o.quaternion.multiply(q); };

  // Blinks: the eye pixels on the face are painted over for 120 ms.
  const eyeRow = faces(SKIN_PARTS.head.at, SKIN_PARTS.head.size).front;
  const eyes = ctx.getImageData(eyeRow[0], eyeRow[1] + 3, 8, 2);
  const lid = (() => { const d = ctx.getImageData(eyeRow[0], eyeRow[1] + 6, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; })();
  let nextBlink = 1 + Math.random() * 3, blinking = false;

  return {
    object: holder,
    mixer,
    play(name) {
      if (name === mode) return;
      if (mode === "jump" && name !== "jump") reaction = { kind: "land", at: time };
      mode = name;
      fade(CLIP[name] ?? "idle");
    },
    react(kind) {
      if (time - reaction.at < 0.4 && reaction.kind === kind) return;
      reaction = { kind, at: time };
      if (kind === "bump") { const hit = actions.get("hit_take"); if (hit) { hit.reset().setLoop(THREE.LoopOnce, 1).setEffectiveWeight(1).fadeIn(0.08).play(); setTimeout(() => hit.fadeOut(0.25), 450); } }
    },
    update(dt, reduced = false) {
      if (dead) return;
      dt = Math.min(0.1, Math.max(0, dt));
      time += dt;
      mixer.update(reduced ? 0 : dt);
      // Layer the poses the clips don't cover.
      if (/wave|cheer|celebrate/.test(mode)) { turn(arm.r, 0, 0, -2.5 + Math.sin(time * 7) * 0.18); turn(arm.rl, -0.4); if (mode !== "wave") turn(arm.l, 0, 0, 2.5); }
      else if (/emote-yes|talk|greet/.test(mode)) { turn(arm.r, -0.5 + Math.sin(time * 4) * 0.2); turn(arm.rl, -0.8); if (head) turn(head, Math.sin(time * 5) * 0.08); }
      else if (mode === "think") { turn(arm.r, -1.1); turn(arm.rl, -1.9); }
      else if (mode === "read") { turn(arm.r, -0.8); turn(arm.l, -0.8); turn(arm.rl, -1.0); turn(arm.ll, -1.0); }
      else if (/sit|drive/.test(mode)) { turn(leg.r, -1.45); turn(leg.l, -1.45); turn(leg.rl, 1.5); turn(leg.ll, 1.5); turn(arm.r, -0.6); turn(arm.l, -0.6); }
      else if (mode === "sleep") { turn(arm.r, 0, 0, -0.1); }
      if (reaction.kind === "nod" && time - reaction.at < 0.6 && head) turn(head, Math.sin((time - reaction.at) * 14) * 0.25);
      if (neck && !/sit|drive|sleep/.test(mode) && !reduced) turn(neck, 0, Math.sin(time * 0.35) * 0.12);
      // Blink.
      if (!reduced) {
        if (!blinking && time > nextBlink) { blinking = true; ctx.fillStyle = lid; ctx.fillRect(eyeRow[0], eyeRow[1] + 3, 8, 2); texture.needsUpdate = true; }
        if (blinking && time > nextBlink + 0.12) { blinking = false; ctx.putImageData(eyes, eyeRow[0], eyeRow[1] + 3); texture.needsUpdate = true; nextBlink = time + 2.4 + Math.random() * 3.5; }
      }
    },
    dispose() {
      dead = true;
      mixer.stopAllAction();
      holder.removeFromParent();
      texture.dispose(); base.dispose(); over.dispose();
    },
  };
}

/** Residents: a mixed city of every age, frame and job. */
export function npcLook(i: number): Avatar {
  const n = Math.abs(i),
    skins = ["#d9a778", "#6e4630", "#8a5a3c", "#f2c7a5", "#482e25", "#a6734d", "#e9c09a", "#c08b62"],
    hair = ["curly", "braids", "swoop", "long", "afro", "bob", "crop", "puffs", "bald"],
    tops = ["#6b3fa0", "#367c73", "#e0ab3c", "#d97554", "#334963", "#a44760", "#6fa8c8", "#9fd3a5", "#c0504d", "#4f6236"],
    legs = ["#22263a", "#38495e", "#3b3b44", "#5a4632", "#2b4a6b", "#1d1d22"],
    outfits = ["hoodie", "tshirt", "jacket", "polo", "tshirt", "suit", "stripes", "overalls", "tunic", "scrubs", "hivis", "labcoat", "dress", "skirt", "tracksuit"];
  const outfit = outfits[(n * 7) % outfits.length];
  const fem = n % 2 === 1;
  return {
    ...look({}),
    graceAppearance: normalizeAvatar({
      skin: skins[n % skins.length],
      hair: fem ? ["long", "bob", "braids", "puffs", "curly"][n % 5] : ["crop", "swoop", "curly", "afro", "bald", "crop"][n % 6],
      hairColor: n % 7 === 0 ? "#d8d5cb" : ["#241a18", "#4e3025", "#8c512e", "#241a18", "#d7b771"][n % 5],
      top: tops[n % tops.length],
      legs: legs[n % legs.length],
      outfit: !fem && ["dress", "skirt"].includes(outfit) ? "tshirt" : outfit,
      hat: outfit === "hivis" && n % 2 === 0 ? "hardhat" : outfit === "scrubs" && n % 3 === 0 ? "scrubcap" : n % 13 === 3 ? "cap" : n % 17 === 5 && fem ? "hijab" : "none",
      trousers: n % 3 === 0 ? "cargo" : n % 5 === 2 ? "chinos" : "jeans",
      glasses: n % 5 === 0,
      backpack: n % 6 === 0,
      scarf: n % 9 === 0,
      build: n % 4 === 0 ? "broad" : n % 5 === 1 ? "slim" : "standard",
      frame: fem ? "fem" : "masc",
      face: !fem && n % 3 === 0 ? "beard" : n % 11 === 5 ? "freckles" : "soft",
      eyes: ["round", "almond", "relaxed"][n % 3],
    }),
    lifeAge: n % 9 === 4 ? 6 + (n % 5) : n % 9 === 7 ? 14 + (n % 3) : n % 7 === 0 ? 68 + (n % 15) : 22 + (n % 35),
  } as Avatar;
}
export { outfitColours as avatarColours };
