"use client";
/**
 * Short 3D cutscenes for Kairos Life: letterboxed, your own character at their
 * current age, a caption typed out, then back to the game. Sets reuse the world's
 * Blender models where they exist (airliner, ferry, Spurgeon's College).
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { type Avatar } from "@/game/core/cosmetics";
import { buildCharacter, npcLook } from "../char3d";
import type { Prop, Script } from "./cutscene-scripts";

export type CutSet = "hospital" | "church" | "home" | "office" | "school" | "street" | "park" | "temptation" | "birth" | "church-arrival" | "takeoff" | "landing" | "ferry" | "cafe";
export type Cutscene = { set: CutSet; eyebrow: string; caption: string; ms?: number; withYou?: string[]; lead?: Avatar; leadAt?: [number, number, number]; pose?: string; solo?: boolean; script?: Script };

/** Small held props for staged scenes. */
function propMesh(kind: Prop): THREE.Object3D {
  const g = new THREE.Group();
  const add = (c: string, w: number, h: number, d: number, x = 0, y = 0, z = 0, e?: string) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, emissive: e ?? "#000", flatShading: true })); m.position.set(x, y, z); g.add(m); };
  if (kind === "bag") add("#2a2730", 0.32, 0.26, 0.14);
  else if (kind === "phone") add("#111", 0.08, 0.15, 0.015, 0, 0, 0, "#3b6bff");
  else if (kind === "bottle") { add("#2f7a4f", 0.07, 0.22, 0.07); add("#2f7a4f", 0.03, 0.08, 0.03, 0, 0.15, 0); }
  else if (kind === "stick") add("#6b4424", 0.05, 0.9, 0.05, 0, 0.3, 0);
  else if (kind === "ring") add("#f5c518", 0.06, 0.06, 0.06, 0, 0, 0, "#7a5c00");
  else if (kind === "bible") add("#3a1f12", 0.2, 0.26, 0.05);
  else if (kind === "pills") add("#ffffff", 0.08, 0.04, 0.05, 0, 0, 0, "#444");
  else if (kind === "letter") add("#f2efe6", 0.22, 0.3, 0.01);
  else if (kind === "mic") { add("#222", 0.04, 0.2, 0.04); add("#555", 0.07, 0.07, 0.07, 0, 0.12, 0); }
  else if (kind === "cards") add("#ffffff", 0.18, 0.02, 0.12, 0, 0, 0, "#552222");
  else if (kind === "trophy") { add("#f5c518", 0.16, 0.22, 0.16, 0, 0, 0, "#6b4f00"); add("#6b4424", 0.2, 0.06, 0.2, 0, -0.14, 0); }
  else if (kind === "baby") { add("#f2efe6", 0.28, 0.2, 0.42); add("#c08b62", 0.14, 0.14, 0.14, 0, 0.1, 0.18); }
  else if (kind === "camera") { add("#1d1d22", 0.3, 0.22, 0.4); add("#333", 0.12, 0.12, 0.14, 0, 0, 0.26); }
  return g;
}

/** Which set a yearly decision plays out in. */
export function setFor(category: string, age: number): CutSet {
  if (category === "temptation") return "temptation";
  if (category === "health") return "hospital";
  if (category === "spiritual") return "church";
  if (category === "work") return age < 18 ? "school" : "office";
  if (category === "mind") return "park";
  if (category === "money") return age < 16 ? "home" : "street";
  if (category === "relationships") return age < 13 ? "park" : age < 60 ? "cafe" : "home";
  return "home";
}

const loader = new GLTFLoader();
/** Blender-built sets (art-sources/scripts/create_cutscene_kit.py), ink-outlined low poly. */
const KIT: Partial<Record<CutSet, string>> = { hospital: "hospital", home: "home", school: "classroom", office: "office", park: "park", temptation: "alley", cafe: "cafe", church: "church", birth: "nursery" };
const flat = (c: string, emissive = "#000") => new THREE.MeshStandardMaterial({ color: c, emissive, flatShading: true, roughness: 0.85 });
const box = (g: THREE.Object3D, c: string, w: number, h: number, d: number, x: number, y: number, z: number, e?: string) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(c, e)); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
};

function buildSet(set: CutSet, scene: THREE.Scene, g: THREE.Group, movers: ((t: number) => void)[]) {
  const sky: Record<CutSet, string> = { cafe: "#efe1cb", hospital: "#e9f1f6", church: "#efe4cf", home: "#f3e7d2", office: "#e6e9ef", school: "#eef0dc", street: "#bcd7ef", park: "#bfe0f2", temptation: "#1b1020", birth: "#fff3e0", "church-arrival": "#bcd7ef", takeoff: "#9fd0f2", landing: "#f2c79f", ferry: "#bcd7ef" };
  scene.background = new THREE.Color(sky[set]);
  const ground = set === "temptation" ? "#2a1a2c" : set === "takeoff" || set === "landing" ? "#3a3a40" : set === "ferry" ? "#3d7ea6" : ["street", "church-arrival"].includes(set) ? "#9a9a9a" : set === "park" ? "#7fb069" : "#d9c9a8";
  const kit = KIT[set];
  const prim = new THREE.Group(); g.add(prim);
  box(prim, ground, 60, 0.1, 60, 0, -0.1, 0);
  if (kit) loader.loadAsync(`/world3d/cut-${kit}.glb`).then((m) => {
    m.scene.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true; } });
    g.add(m.scene); g.remove(prim);
    if (set === "church") for (const [x, ref, text] of [[-3, "JOHN 3:16", "For God so loved the world, that he gave his only begotten Son"], [3, "ROMANS 10:17", "So then faith cometh by hearing, and hearing by the word of God"]] as const) g.add(scriptureScreen(x, ref, text));
    if (set === "temptation") m.scene.traverse((o) => { const mesh = o as THREE.Mesh; const mat = mesh.material as THREE.MeshStandardMaterial | undefined; if (mesh.isMesh && mat?.emissiveIntensity && mat.emissive.getHex() !== 0) { const k = Math.random() * 6; movers.push((t) => { mat.emissiveIntensity = 0.6 + Math.sin(t * 4 + k) * 0.5; }); } });
  }).catch(() => {});
  buildPrimitives(set, prim, movers);
}

/** The church's side screens carry Scripture, EasyWorship style. */
function scriptureScreen(x: number, ref: string, text: string) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256); grad.addColorStop(0, "#1a1430"); grad.addColorStop(1, "#3b2470");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = "#f5c518"; ctx.font = "800 30px Outfit, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillText(ref, 256, 60);
  ctx.fillStyle = "#fff"; ctx.font = "600 28px 'DM Sans', system-ui, sans-serif";
  const words = text.split(" "); let line = "", y = 112;
  for (const w of words) { const next = line ? line + " " + w : w; if (ctx.measureText(next).width > 440) { ctx.fillText(line, 256, y); line = w; y += 38; } else line = next; }
  ctx.fillText(line, 256, y);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  m.position.set(x, 2.4, -2.88);
  return m;
}

function buildPrimitives(set: CutSet, g: THREE.Group, movers: ((t: number) => void)[]) {
  if (set === "hospital") { box(g, "#ffffff", 2.2, 0.6, 1, -1.6, 0, -1); box(g, "#cfe3f2", 0.8, 0.2, 0.9, -2.4, 0.6, -1); box(g, "#f5f7fa", 8, 3.5, 0.2, 0, 0, -2.6); box(g, "#d83a3a", 0.8, 0.25, 0.1, 1.8, 2.4, -2.45); box(g, "#d83a3a", 0.25, 0.8, 0.1, 1.8, 2.1, -2.45); }
  if (set === "church" || set === "birth") { for (let r = 0; r < 4; r++) for (const x of [-2.2, 2.2]) box(g, "#8a5a3c", 3, 0.5, 0.5, x, 0, r * 1.3 - 1); box(g, "#f5b83d", 0.3, 2.2, 0.15, 0, 1.2, -3.6, "#6a4a00"); box(g, "#f5b83d", 1.3, 0.3, 0.15, 0, 2.6, -3.6, "#6a4a00"); box(g, "#e9dcc3", 10, 4.5, 0.2, 0, 0, -3.8); }
  if (set === "home") { box(g, "#6b3fa0", 2.4, 0.5, 0.9, -1.5, 0, -1.5); box(g, "#6b3fa0", 2.4, 0.8, 0.25, -1.5, 0.5, -1.9); box(g, "#a0764e", 1.4, 0.45, 0.8, 1.2, 0, -0.6); box(g, "#f3e7d2", 9, 3.2, 0.2, 0, 0, -2.4); box(g, "#9ccbe8", 1.6, 1, 0.05, 1.8, 1.5, -2.25, "#2a5a80"); }
  if (set === "office" || set === "school") { for (const x of [-2, 0, 2]) { box(g, set === "school" ? "#c49a6c" : "#e2e2e2", 1.4, 0.75, 0.8, x, 0, -1); box(g, "#333", 0.6, 0.4, 0.05, x, 0.75, -1.2); } box(g, set === "school" ? "#2f5d3a" : "#dfe3ea", 6, 1.6, 0.1, 0, 1, -2.6); }
  if (set === "street" || set === "church-arrival") { box(g, "#555", 60, 0.02, 3.2, 0, 0, 1.5); for (let i = -4; i <= 4; i++) box(g, ["#b8705a", "#d6c7a1", "#7a8fa6"][(i + 9) % 3], 3.2, 3 + (i % 3), 2.5, i * 3.6, 0, -3); }
  if (set === "park") { for (let i = 0; i < 9; i++) { const x = (i % 3) * 3 - 3, z = -Math.floor(i / 3) * 2.5 - 1; box(g, "#6b4a2b", 0.25, 1, 0.25, x, 0, z); const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 6), flat("#3f7d4f")); c.position.set(x, 1.8, z); g.add(c); } box(g, "#8a5a3c", 1.8, 0.45, 0.5, 0.4, 0, 0.6); }
  if (set === "temptation") { for (let i = -3; i <= 3; i++) box(g, "#241628", 2.6, 4 + (i % 2), 2, i * 3, 0, -3.2); for (let i = 0; i < 5; i++) { const l = box(g, "#ff3a6a", 0.6, 0.2, 0.05, i * 2.4 - 4.8, 2.8, -2.15, "#ff3a6a"); movers.push((t) => { (l.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.sin(t * 4 + i) * 0.5; }); } }
  if (set === "church-arrival") {
    loader.loadAsync("/world3d/spurgeons-college.glb").then((m) => { const c = m.scene; c.scale.setScalar(0.42); c.position.set(0, 0, -9); g.add(c); }).catch(() => box(g, "#efe6d2", 12, 4, 4, 0, 0, -6));
    const car = new THREE.Group(); box(car, "#6b3fa0", 2, 0.6, 1, 0, 0.25, 0); box(car, "#3b2a5c", 1.2, 0.5, 0.9, -0.1, 0.85, 0);
    for (const [x, z] of [[-0.7, 0.5], [0.7, 0.5], [-0.7, -0.5], [0.7, -0.5]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 10), flat("#111")); w.rotation.x = Math.PI / 2; w.position.set(x, 0.25, z); car.add(w); }
    car.position.set(-12, 0, 1.5); g.add(car);
    movers.push((t) => { car.position.x = Math.min(-1.5, -12 + t * 5); });
  }
  if (set === "takeoff" || set === "landing") {
    box(g, "#f2d44b", 40, 0.03, 0.3, 0, 0, 0);
    loader.loadAsync("/world3d/airliner.glb").then((m) => {
      const p = m.scene; p.rotation.y = -Math.PI / 2; g.add(p);
      movers.push((t) => {
        if (set === "takeoff") { const roll = t * t * 1.6; p.position.set(-14 + roll, Math.max(0, (t - 2.4) * 2.4), 0); p.rotation.z = t > 2.4 ? 0.16 : 0; }
        else { const k = Math.max(0, 3 - t); p.position.set(-10 + t * 6, k * 1.6, 0); p.rotation.z = k > 0 ? -0.08 : 0; }
      });
    }).catch(() => {});
  }
  if (set === "ferry") {
    loader.loadAsync("/world3d/ferry.glb").then((m) => { const f = m.scene; f.rotation.y = -Math.PI / 2; f.position.set(-6, -0.9, 0); g.add(f); movers.push((t) => { f.position.x = -6 + t * 1.8; f.position.y = -0.9 + Math.sin(t * 2) * 0.06; }); }).catch(() => {});
    box(g, "#8c8f80", 60, 0.6, 3, 0, 0, -7);
  }
  if (set === "birth") { box(g, "#f8d9e6", 1.4, 0.5, 0.9, 0, 0, -0.7); }
}

export function LifeCutscene({ cut, avatar, onDone }: { cut: Cutscene; avatar: Avatar; onDone: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const done = useRef(onDone); done.current = onDone;
  const ms = cut.ms ?? (cut.script ? 6200 : 4200);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(el.clientWidth, el.clientHeight); renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), g = new THREE.Group(); scene.add(g);
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 200);
    const mood = cut.script?.mood;
    scene.add(new THREE.HemisphereLight(mood === "night" ? "#8fa0ff" : mood === "cold" ? "#dfe8ff" : "#ffffff", "#8a7a66", cut.set === "temptation" || mood === "night" ? 1.0 : 1.8));
    const sun = new THREE.DirectionalLight(cut.set === "temptation" ? "#ff6a8a" : "#fff2d6", cut.set === "temptation" ? 1.2 : 2.2); sun.position.set(4, 8, 6); sun.castShadow = true; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); scene.add(sun);
    const movers: ((t: number) => void)[] = [];
    buildSet(cut.set, scene, g, movers);
    const people: Awaited<ReturnType<typeof buildCharacter>>[] = [];
    let dead = false;
    // A staged scene: the people this decision is actually about, doing what it's about,
    // with a crowd around them. Camera cuts between shots with a handheld sway.
    type Walker = { o: THREE.Object3D; from: THREE.Vector3; to: THREE.Vector3; at: number; c: Awaited<ReturnType<typeof buildCharacter>>; then: string; done: boolean };
    const walkers: Walker[] = [];
    const POSE: Record<string, string> = { pray: "read" };
    const staged = async (sc: Script) => {
      const place = async (look: Avatar, size: number, x: number, z: number, face: [number, number] | undefined, pose: string, prop?: Prop) => {
        const c = await buildCharacter(look, size); if (dead) { c.dispose(); return null; }
        c.object.position.set(x, 0, z);
        if (face) c.object.rotation.y = Math.atan2(face[0] - x, face[1] - z);
        c.play(POSE[pose] ?? pose);
        if (prop) { const pm = propMesh(prop); pm.position.set(0.22, prop === "stick" ? 0.7 : 0.95, 0.22); c.object.add(pm); }
        g.add(c.object); people.push(c); return c;
      };
      for (const [i, a] of sc.actors.entries()) {
        const look = a.who === "you" ? (cut.lead ?? avatar) : npcLook(a.seed ?? 30 + i);
        const c = await place(look, a.small ? 1.05 : 1.6, a.at[0], a.at[1], a.face, a.pose ?? "idle", a.prop);
        if (c && a.walkTo) { c.play("idle"); walkers.push({ o: c.object, from: new THREE.Vector3(a.at[0], 0, a.at[1]), to: new THREE.Vector3(a.walkTo[0], 0, a.walkTo[1]), at: a.walkAt ?? 0.5, c, then: POSE[a.then ?? a.pose ?? "idle"] ?? (a.then ?? a.pose ?? "idle"), done: false }); }
      }
      const cr = sc.crowd;
      if (cr) for (let i = 0; i < cr.n; i++) {
        const r = (k: number) => { const x = Math.sin((cr.seed ?? 5) * 97 + i * 13.7 + k * 3.1) * 43758.5453; return x - Math.floor(x); };
        const x = cr.area[0] + (cr.area[2] - cr.area[0]) * r(1), z = cr.area[1] + (cr.area[3] - cr.area[1]) * r(2);
        const pose = cr.pose === "walk" ? (i % 2 ? "walk" : "idle") : (i % 3 === 0 ? "talk" : cr.pose ?? "idle");
        await place(npcLook((cr.seed ?? 5) + i * 3), i % 5 === 4 ? 1.1 : 1.45 + r(3) * 0.2, x, z, cr.face ?? [0, 0.5], pose);
      }
    };
    const cast = async () => {
      if (cut.script) { await staged(cut.script); return; }
      const big = ["takeoff", "landing", "ferry"].includes(cut.set);
      if (big) return;
      const me = await buildCharacter(cut.lead ?? avatar, 1.6); if (dead) { me.dispose(); return; }
      me.object.position.set(cut.set === "church-arrival" ? -1 : 0, cut.set === "birth" ? 0.74 : 0, cut.set === "birth" ? -0.45 : 0.6);
      if (cut.leadAt) me.object.position.set(...cut.leadAt);
      if (cut.set === "birth") me.object.rotation.x = -Math.PI / 2; // a newborn, lying in the cot
      me.play(cut.pose ?? (cut.set === "temptation" ? "think" : cut.set === "church" ? "read" : cut.set === "birth" ? "idle" : "idle")); g.add(me.object); people.push(me);
      const others = cut.solo ? 0 : cut.set === "birth" ? 2 : cut.set === "church-arrival" ? (cut.withYou?.length ?? 0) : 1;
      for (let i = 0; i < others; i++) {
        const o = await buildCharacter(npcLook(31 + i * 7), 1.6); if (dead) { o.dispose(); return; }
        o.object.position.set((i % 2 ? 1.3 : -1.3) + (cut.set === "church-arrival" ? 0.6 : 0), 0, cut.set === "birth" ? 0.1 : 0.1 - i * 0.2);
        o.object.rotation.y = i % 2 ? -0.5 : 0.5; o.play(cut.set === "temptation" ? "wave" : "idle"); g.add(o.object); people.push(o);
      }
    };
    void cast().catch(() => {});
    const far = ["takeoff", "landing", "ferry", "church-arrival"].includes(cut.set);
    const clock = new THREE.Clock(); let raf = 0, t = 0;
    const tick = () => {
      const dt = Math.min(0.05, clock.getDelta()); t += dt;
      for (const m of movers) m(t);
      for (const p of people) p.update(dt, reduced);
      for (const w of walkers) {
        if (w.done || t < w.at) continue;
        const k2 = Math.min(1, (t - w.at) / 1.2);
        w.o.position.lerpVectors(w.from, w.to, k2);
        w.o.rotation.y = Math.atan2(w.to.x - w.from.x, w.to.z - w.from.z);
        if (k2 === 1) { w.done = true; w.c.play(w.then); } else if (k2 < 0.05) w.c.play("walk");
      }
      const k = reduced ? 0.5 : Math.min(1, t / (ms / 1000));
      const shots = cut.script?.shots;
      if (shots?.length) {
        // Cut between shots; inside each shot the camera creeps in with a handheld sway.
        let si = 0; for (let i = 0; i < shots.length; i++) if (k >= shots[i].at) si = i;
        const sh = shots[si], next = shots[si + 1]?.at ?? 1, local = (k - sh.at) / Math.max(0.01, next - sh.at);
        const sway = reduced ? 0 : 1;
        camera.position.set(sh.from[0] - local * 0.25 + Math.sin(t * 1.7) * 0.03 * sway, sh.from[1] + Math.sin(t * 2.3) * 0.02 * sway, sh.from[2] - local * 0.35);
        camera.lookAt(sh.look[0] + Math.sin(t * 1.1) * 0.02 * sway, sh.look[1], sh.look[2]);
      } else {
        if (far) camera.position.set(6 - k * 4, 4.5, 14 - k * 2); else camera.position.set(2.6 - k * 1.8, 2.3 - k * 0.4, 6 - k * 1.6);
        camera.lookAt(far ? 0 : 0, far ? 1.5 : 1, far ? -2 : 0);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onResize = () => { camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(el.clientWidth, el.clientHeight); };
    addEventListener("resize", onResize);
    const end = setTimeout(() => done.current(), ms);
    return () => { dead = true; clearTimeout(end); cancelAnimationFrame(raf); removeEventListener("resize", onResize); people.forEach((p) => p.dispose()); scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose()); } }); renderer.dispose(); renderer.domElement.remove(); };
  }, [cut, avatar, ms]);
  useEffect(() => {
    let i = 0; setTyped("");
    const t = setInterval(() => { i++; setTyped(cut.caption.slice(0, i)); if (i >= cut.caption.length) clearInterval(t); }, 28);
    return () => clearInterval(t);
  }, [cut.caption]);
  return (
    <div className="kl-cut" role="dialog" aria-label={`${cut.eyebrow}: ${cut.caption}`}>
      <div ref={host} className="kl-cut-scene" aria-hidden />
      <div className="kl-bar kl-bar-top" aria-hidden />
      <div className="kl-bar kl-bar-bottom"><p className="ks-eyebrow">{cut.eyebrow}</p><p className="kl-cut-caption">{typed}</p></div>
      <button type="button" className="kl-cut-skip" onClick={() => done.current()}>Skip</button>
    </div>
  );
}
