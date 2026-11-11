"use client";
/** A person's 64×64 Minecraft-layout skin, without three.js: used by the 3D body and the HUD portrait. */
import { type Avatar, look } from "@/game/core/cosmetics";
import { outfitColours } from "@/game/core/outfits";
import { normalizeAvatar } from "../../../../public/avatar.mjs";
import { paintSkin, upgradeLegacySkin } from "../../../../public/kairos-skins.mjs";

const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => { const n = parseInt(h.replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const x = p(a), y = p(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

export type SkinLook = ReturnType<typeof normalizeAvatar> & { skin64?: string };

/** The avatar choices that paint a skin, for any avatar shape the game passes. */
export function skinLook(input: Avatar): SkinLook {
  const a = look(input);
  const raw = (a as Avatar & { graceAppearance?: unknown }).graceAppearance as Record<string, unknown> | undefined;
  // Prison issue: an orange jumpsuit over whoever you are.
  const prison = (input as { topColor?: string; bottomColor?: string }).topColor === "topcol-orange" && (input as { bottomColor?: string }).bottomColor === "botcol-orange";
  if (prison) {
    const who = raw ? normalizeAvatar(raw) : normalizeAvatar({});
    return { ...who, outfit: "jumpsuit", top: "#e98a1f", legs: "#e98a1f", shoe: "#d8d5cb", hat: "none", scarf: false, backpack: false, glasses: who.glasses, print: "none" } as SkinLook;
  }
  if (raw) return { ...normalizeAvatar(raw), skin64: typeof raw.skin64 === "string" ? raw.skin64 : undefined } as SkinLook;
  const c = outfitColours(a);
  const hair = ({ "hair-short": "swoop", "hair-curly": "curly", "hair-bob": "bob", "hair-braids": "braids", "hair-buns": "puffs", "hair-afro": "afro", "hair-buzz": "crop", "hair-bald": "bald", "hair-long": "long" } as Record<string, string>)[a.hair] ?? "swoop";
  const outfit = a.top === "top-hoodie" ? "hoodie" : a.top === "top-stripes" ? "stripes" : a.top === "top-tracksuit" ? "tracksuit" : a.top === "top-polo" ? "polo" : /suit/.test(a.top) ? "suit" : /denim/.test(a.top) ? "jacket" : "tshirt";
  return { ...normalizeAvatar({ hair, outfit, hat: a.hat === "hat-cap" ? "cap" : a.hat === "hat-beanie" ? "beanie" : "none", scarf: false }), skin: c.skin, hairColor: c.hair, top: c.top, legs: c.bottom, shoe: c.shoes } as SkinLook;
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });

/** Paint (or load) the 64×64 skin onto a fresh canvas for one person. */
export async function skinCanvas(s: SkinLook, grey: number) {
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
  const hairColor = grey > 0 ? mix(s.hairColor, "#d8d6d0", grey) : s.hairColor;
  paintSkin(ctx, { ...s, hairColor }, { seed: s.skin.length + s.top.length });
  return c;
}

