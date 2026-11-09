import * as THREE from "three";
import {
  buildCharacter,
  type Character3D,
} from "./source/components/game/char3d";
import { DEFAULT_AVATAR } from "./source/game/core/cosmetics";
import { worldAppearance } from "../public/grace-avatar.mjs";
const host = document.getElementById("preview")!;
try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(30, 1, 0.05, 30);
  camera.position.set(0, 1.05, 3.0);
  camera.lookAt(0, 0.64, 0);
  scene.add(new THREE.HemisphereLight("#fff6e7", "#b5a8c3", 2));
  const key = new THREE.DirectionalLight("#fff0ce", 2.3);
  key.position.set(2, 4, 3);
  scene.add(key);
  const turntable = new THREE.Group();
  scene.add(turntable);
  let character: Character3D | null = null,
    request = 0,
    rotation = 0.23,
    pose = "wave";
  async function update(raw: unknown) {
    const ticket = ++request;
    try {
      const next = await buildCharacter(
        { ...DEFAULT_AVATAR, ...worldAppearance(raw) },
        1.28,
      );
      if (ticket !== request) {
        next.dispose();
        return;
      }
      character?.dispose();
      character = next;
      turntable.add(next.object);
      host.querySelector("p")?.remove();
    } catch {
      host.querySelector("p")!.textContent =
        "3D preview unavailable. Your appearance is still saved.";
    }
  }
  const receive = (event: MessageEvent) => {
    if (
      event.origin !== location.origin ||
      event.source !== parent ||
      event.data?.type !== "kairos-character:preview"
    )
      return;
    pose = String(event.data.pose || "idle");
    if (event.data.appearance) void update(event.data.appearance);
  };
  window.addEventListener("message", receive);
  const size = () => {
    renderer.setSize(host.clientWidth, host.clientHeight);
    camera.aspect = host.clientWidth / Math.max(1, host.clientHeight);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(host);
  size();
  let pointer: number | null = null;
  host.onpointerdown = (e) => {
    pointer = e.clientX;
    host.setPointerCapture(e.pointerId);
  };
  host.onpointermove = (e) => {
    if (pointer !== null) {
      rotation += (e.clientX - pointer) * 0.015;
      pointer = e.clientX;
    }
  };
  host.onpointerup = () => (pointer = null);
  host.onpointercancel = () => (pointer = null);
  host.onkeydown = (e) => {
    if (e.key === "ArrowLeft") rotation -= 0.3;
    if (e.key === "ArrowRight") rotation += 0.3;
  };
  let last = performance.now();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function render(now: number) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    character?.play(pose);
    character?.update(dt, reduced);
    turntable.rotation.y = rotation;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  parent.postMessage({ type: "kairos-character:ready" }, location.origin);
} catch {
  host.innerHTML =
    "<p>The 3D preview needs WebGL. Your appearance choices still work.</p>";
}
