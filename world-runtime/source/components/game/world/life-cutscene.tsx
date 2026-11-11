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

export type CutSet = "hospital" | "church" | "home" | "office" | "school" | "street" | "park" | "temptation" | "birth" | "church-arrival" | "takeoff" | "landing" | "ferry";
export type Cutscene = { set: CutSet; eyebrow: string; caption: string; ms?: number; withYou?: string[] };

/** Which set a yearly decision plays out in. */
export function setFor(category: string, age: number): CutSet {
  if (category === "temptation") return "temptation";
  if (category === "health") return "hospital";
  if (category === "spiritual") return "church";
  if (category === "work") return age < 18 ? "school" : "office";
  if (category === "mind") return "park";
  if (category === "money") return "street";
  return "home";
}

const loader = new GLTFLoader();
const flat = (c: string, emissive = "#000") => new THREE.MeshStandardMaterial({ color: c, emissive, flatShading: true, roughness: 0.85 });
const box = (g: THREE.Object3D, c: string, w: number, h: number, d: number, x: number, y: number, z: number, e?: string) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), flat(c, e)); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
};

function buildSet(set: CutSet, scene: THREE.Scene, g: THREE.Group, movers: ((t: number) => void)[]) {
  const sky: Record<CutSet, string> = { hospital: "#e9f1f6", church: "#efe4cf", home: "#f3e7d2", office: "#e6e9ef", school: "#eef0dc", street: "#bcd7ef", park: "#bfe0f2", temptation: "#1b1020", birth: "#fff3e0", "church-arrival": "#bcd7ef", takeoff: "#9fd0f2", landing: "#f2c79f", ferry: "#bcd7ef" };
  scene.background = new THREE.Color(sky[set]);
  const ground = set === "temptation" ? "#2a1a2c" : set === "takeoff" || set === "landing" ? "#3a3a40" : set === "ferry" ? "#3d7ea6" : ["street", "church-arrival"].includes(set) ? "#9a9a9a" : set === "park" ? "#7fb069" : "#d9c9a8";
  box(g, ground, 60, 0.1, 60, 0, -0.1, 0);
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
  if (set === "birth") { box(g, "#f8d9e6", 1.4, 0.5, 0.9, 0, 0, 0.4); }
}

export function LifeCutscene({ cut, avatar, onDone }: { cut: Cutscene; avatar: Avatar; onDone: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const done = useRef(onDone); done.current = onDone;
  const ms = cut.ms ?? 4200;
  useEffect(() => {
    const el = host.current; if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(el.clientWidth, el.clientHeight); renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), g = new THREE.Group(); scene.add(g);
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 200);
    scene.add(new THREE.HemisphereLight("#ffffff", "#8a7a66", cut.set === "temptation" ? 0.6 : 1.8));
    const sun = new THREE.DirectionalLight(cut.set === "temptation" ? "#ff6a8a" : "#fff2d6", cut.set === "temptation" ? 1.2 : 2.2); sun.position.set(4, 8, 6); sun.castShadow = true; scene.add(sun);
    const movers: ((t: number) => void)[] = [];
    buildSet(cut.set, scene, g, movers);
    const people: Awaited<ReturnType<typeof buildCharacter>>[] = [];
    let dead = false;
    const cast = async () => {
      const big = ["takeoff", "landing", "ferry"].includes(cut.set);
      if (big) return;
      const me = await buildCharacter(avatar, 1.6); if (dead) { me.dispose(); return; }
      me.object.position.set(cut.set === "church-arrival" ? -1 : 0, cut.set === "birth" ? 0.62 : 0, cut.set === "birth" ? 0.75 : 0.6);
      if (cut.set === "birth") me.object.rotation.x = -Math.PI / 2; // a newborn, lying in the cot
      me.play(cut.set === "temptation" ? "think" : cut.set === "church" ? "read" : cut.set === "birth" ? "idle" : "idle"); g.add(me.object); people.push(me);
      const others = cut.set === "birth" ? 2 : cut.set === "church-arrival" ? (cut.withYou?.length ?? 0) : 1;
      for (let i = 0; i < others; i++) {
        const o = await buildCharacter(npcLook(31 + i * 7), 1.6); if (dead) { o.dispose(); return; }
        o.object.position.set((i % 2 ? 1.3 : -1.3) + (cut.set === "church-arrival" ? 0.6 : 0), 0, cut.set === "birth" ? 0.9 : 0.1 - i * 0.2);
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
      const k = reduced ? 0.5 : Math.min(1, t / (ms / 1000));
      if (far) camera.position.set(6 - k * 4, 4.5, 14 - k * 2); else camera.position.set(2.6 - k * 1.8, 2.3 - k * 0.4, 6 - k * 1.6);
      camera.lookAt(far ? 0 : 0, far ? 1.5 : 1, far ? -2 : 0);
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
