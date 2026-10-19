"use client";

import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Avatar } from "@/game/core/cosmetics";
import { outfitColours } from "@/game/core/outfits";
import type { Character3D } from "./char3d";

let asset: Promise<GLTF> | undefined;

/** Original Blender-authored articulated toy shared by every character surface. */
export async function buildClothCharacter(avatar: Avatar, height: number): Promise<Character3D> {
  asset ??= new GLTFLoader().loadAsync("/world3d/chars/kairos-toy.glb?v=animated-2");
  const source = await asset;
  const model = source.scene.clone(true);
  const object = new THREE.Group();
  object.add(model);
  const colours = outfitColours(avatar);
  const dyes: Record<string, string> = { Cloth: colours.skin, Top: colours.top, Bottom: colours.bottom, Shoes: colours.shoes, Hair: colours.hair };
  const hairStyle = avatar.hair === "hair-bald" ? -1 : avatar.hair === "hair-buzz" || avatar.hair === "hair-spiky" ? 4 : avatar.hair.includes("bun") || avatar.hair.includes("pony") ? 2 : avatar.hair.includes("bob") || avatar.hair.includes("long") || avatar.hair.includes("braid") ? 1 : avatar.hair.includes("curl") ? 0 : 3;
  const faceStyle = avatar.brows === "brows-fierce" ? 7 : avatar.eyes === "eyes-focused" ? 4 : avatar.eyes === "eyes-sleepy" ? 2 : avatar.mouth === "mouth-grin" ? 1 : avatar.brows === "brows-bold" ? 5 : avatar.eyes === "eyes-sparkle" ? 3 : avatar.eyes === "eyes-wink" ? 6 : 0;
  const topStyle = avatar.top.includes("suit") ? 1 : avatar.top.includes("stripe") ? 2 : avatar.top.includes("denim") ? 3 : avatar.top.includes("track") ? 4 : avatar.top.includes("knit") || avatar.top.includes("polo") ? 5 : 0;
  const trouserStyle = avatar.bottom.includes("cargo") ? 1 : avatar.bottom.includes("jog") ? 2 : avatar.bottom.includes("smart") ? 3 : avatar.bottom.includes("skirt") || avatar.bottom.includes("short") ? 4 : 0;
  const materials = new Map<THREE.Material, THREE.Material>();
  model.traverse(node => {
    // Blender repeats trouser groups on both legs; glTF keeps the original
    // duplicate suffix in userData while sanitising the runtime node name.
    const name = String(node.userData.name ?? node.name).replace(/\.\d+$/, "");
    for (const [prefix, selected] of [["hair-style-", hairStyle], ["face-", faceStyle], ["outfit-", topStyle], ["trouser-", trouserStyle]] as const) {
      if (name.startsWith(prefix)) node.visible = name === `${prefix}${selected}`;
    }
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const tint = (original: THREE.Material) => {
      let material = materials.get(original);
      if (!material) {
        material = original.clone();
        const dye = dyes[original.name];
        if (dye && material instanceof THREE.MeshStandardMaterial) {
          material.color.set(dye);
          material.roughness = .36;
        }
        materials.set(original, material);
      }
      return material;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(tint) : tint(mesh.material);
  });
  model.scale.setScalar(height / 1.57);
  const find = (name: string) => model.getObjectByName(name) ?? model.getObjectByName(name.replaceAll("-", "_"));
  const head = find("head");
  const torso = find("torso");
  const eyes: THREE.Object3D[] = [];
  model.traverse(node => { if (node.name.startsWith("eye-left-") || node.name.startsWith("eye-right-")) eyes.push(node); });
  const leftArm = find("arm-left"), rightArm = find("arm-right");
  const leftLeg = find("leg-left"), rightLeg = find("leg-right");
  const mixer = new THREE.AnimationMixer(model);
  let clip = "idle", time = Math.random()*5, stride = 0, landing = 0;
  const baseScale = model.scale.clone();
  const play = (name: string) => { if (clip === "jump" && name !== "jump") landing = 1; clip = name; };
  const update = (dt: number, reduced = false) => {
    time += Math.max(0, dt);
    const walking = /walk|run/.test(clip);
    stride += ((walking && !reduced ? 1 : 0) - stride) * Math.min(1, dt * 14);
    landing = Math.max(0, landing - dt * 7);
    const swing = Math.sin(time * 9) * .7 * stride;
    if (leftLeg) leftLeg.rotation.x = clip === "drive" ? -1.1 : swing;
    if (rightLeg) rightLeg.rotation.x = clip === "drive" ? -1.1 : -swing;
    if (leftArm) leftArm.rotation.x = clip === "drive" ? -.65 : -swing * .7;
    if (rightArm) rightArm.rotation.x = clip === "drive" ? -.65 : swing * .7;
    const waving = /wave|emote|cheer/.test(clip) && !reduced;
    if (rightArm) rightArm.rotation.z = waving ? -1.8 + Math.sin(time * 7) * .25 : -.12;
    if (leftArm) leftArm.rotation.z = .12;
    if (clip === "jump") {
      if (leftArm) leftArm.rotation.z = .8;
      if (rightArm) rightArm.rotation.z = -.8;
      if (leftLeg) leftLeg.rotation.x = -.3;
      if (rightLeg) rightLeg.rotation.x = -.3;
    }
    if (head) {
      head.rotation.z = reduced ? 0 : Math.sin(time * 1.5) * .06 * (1-stride) + Math.sin(time*9)*.035*stride;
      head.rotation.y = reduced ? 0 : waving ? Math.sin(time * 2) * .16 : Math.sin(time*.8)*.12*(1-stride);
      head.rotation.x = clip === "jump" ? -.1 : 0;
    }
    const blinking = !reduced && time % 4.1 < .14;
    eyes.forEach(eye => { eye.scale.y = blinking ? .12 : 1; });
    if (torso) { torso.scale.y = reduced ? 1 : 1+Math.sin(time*2.2)*.018*(1-stride); torso.rotation.y = reduced ? 0 : -Math.sin(time*9)*.045*stride; }
    model.position.y = reduced ? 0 : Math.abs(Math.sin(time * 9)) * .055 * stride + Math.sin(time*2.2)*.006*(1-stride);
    model.scale.copy(baseScale);
    if (!reduced && landing > 0) { model.scale.y *= 1-landing*.13; model.scale.x *= 1+landing*.07; }
    model.rotation.z = clip === "die" ? Math.PI / 2 : reduced ? 0 : Math.sin(time*9)*.045*stride;
    model.rotation.x = clip === "jump" ? -.07 : walking ? .035 : 0;
  };
  return {
    object, mixer, play, update,
    dispose: () => { mixer.stopAllAction(); materials.forEach(material => material.dispose()); object.removeFromParent(); object.clear(); },
  };
}
