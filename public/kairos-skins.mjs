// Kairos skins: every person wears a 64×64 skin in the standard Minecraft
// layout (classic 4-pixel arms), so any Minecraft skin PNG works on the Kairos
// human, and our own looks are painted into the same layout from avatar
// choices. Pure drawing: give it any CanvasRenderingContext2D of 64×64.

/** Box-UV origins (x, y) and sizes (w, h, d) for each part, base and overlay. */
export const SKIN_PARTS = {
  head: { at: [0, 0], over: [32, 0], size: [8, 8, 8] },
  body: { at: [16, 16], over: [16, 32], size: [8, 12, 4] },
  rightArm: { at: [40, 16], over: [40, 32], size: [4, 12, 4] },
  leftArm: { at: [32, 48], over: [48, 48], size: [4, 12, 4] },
  rightLeg: { at: [0, 16], over: [0, 32], size: [4, 12, 4] },
  leftLeg: { at: [16, 48], over: [0, 48], size: [4, 12, 4] },
};

/** The six faces of a part's box in the skin, in pixel rects [x, y, w, h]. */
export function faces([u, v], [w, h, d]) {
  return {
    top: [u + d, v, w, d], bottom: [u + d + w, v, w, d],
    right: [u, v + d, d, h], front: [u + d, v + d, w, h],
    left: [u + d + w, v + d, d, h], back: [u + d + w + d, v + d, w, h],
  };
}

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (r, g, b) => "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
export const shade = (c, k) => { const [r, g, b] = hex(c); return k >= 0 ? toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : toHex(r * (1 + k), g * (1 + k), b * (1 + k)); };

/** Deterministic per-pixel grain so painted skins read as pixel art, not flat plastic. */
function grain(x, y, seed) { const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 3.17) * 43758.5453; return s - Math.floor(s); }

export function paintSkin(ctx, a, { seed = 1 } = {}) {
  ctx.clearRect(0, 0, 64, 64);
  const px = (x, y, c, k = 0.05) => { ctx.fillStyle = shade(c, (grain(x, y, seed) - 0.5) * k * 2); ctx.fillRect(x, y, 1, 1); };
  const rect = (r, c, k) => { for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) px(x, y, c, k); };
  const rows = (r, from, to, c, k) => rect([r[0], r[1] + from, r[2], Math.max(0, Math.min(r[3], to) - from)], c, k);
  const box = (part, colour, over = false, k = 0.05) => {
    const f = faces(over ? SKIN_PARTS[part].over : SKIN_PARTS[part].at, SKIN_PARTS[part].size);
    for (const [name, r] of Object.entries(f)) rect(r, name === "right" || name === "left" ? shade(colour, -0.08) : name === "back" ? shade(colour, -0.04) : name === "top" ? shade(colour, 0.05) : colour, k);
    return f;
  };
  const skin = a.skin, hair = a.hairColor, top = a.top, legs = a.legs, shoe = a.shoe;
  const outfit = a.outfit, hat = a.hat;

  // ---- head and face ----
  const H = box("head", skin, false, 0.03);
  const fx = H.front[0], fy = H.front[1];
  const eyeY = fy + 4;
  const iris = { round: "#2b1d16", almond: "#3a2a20", relaxed: "#2b1d16", wide: "#22303f", smile: "#2b1d16" }[a.eyes] ?? "#2b1d16";
  if (a.eyes === "smile") { for (const x of [fx + 1, fx + 2, fx + 5, fx + 6]) px(x, eyeY, "#2b1d16", 0); }
  else for (const ex of [fx + 1, fx + 5]) { px(ex, eyeY, "#f4f1ea", 0); px(ex + 1, eyeY, iris, 0); if (a.eyes === "wide") { px(ex, eyeY - 1, "#f4f1ea", 0); px(ex + 1, eyeY - 1, iris, 0); } }
  for (const bx of [fx + 1, fx + 2, fx + 5, fx + 6]) px(bx, eyeY - (a.eyes === "wide" ? 2 : 1), shade(hair, -0.1), 0);
  px(fx + 3, eyeY + 1, shade(skin, -0.12), 0); px(fx + 4, eyeY + 1, shade(skin, -0.18), 0); // nose
  const lip = a.frame === "fem" ? shade(skin, -0.35) : shade(skin, -0.22);
  for (const mx of [fx + 3, fx + 4]) px(mx, eyeY + 3, lip, 0);
  if (a.frame === "fem") { px(fx + 2, eyeY + 3, shade(lip, 0.15), 0); px(fx + 5, eyeY + 3, shade(lip, 0.15), 0); }
  if (a.face === "freckles") for (const [x, y] of [[1, 5], [2, 6], [5, 6], [6, 5]]) px(fx + x, fy + y, shade(skin, -0.2), 0);
  if (a.face === "beard") { for (let x = 0; x < 8; x++) for (let y = 5; y < 8; y++) if (!(y === 5 && x > 1 && x < 6)) px(fx + x, fy + y, hair, 0.06); for (const r of [H.right, H.left]) rows(r, 5, 8, hair, 0.06); rows(H.bottom, 0, 8, hair, 0.06); for (const mx of [fx + 3, fx + 4]) px(mx, eyeY + 3, shade(hair, -0.2), 0); }

  // Hair on the head itself: crown, back, sides and a fringe.
  const style = a.hair;
  if (style !== "bald") {
    const len = { crop: 1, swoop: 2, curly: 2, afro: 2, braids: 2, bob: 2, puffs: 2, long: 2 }[style] ?? 2;
    rect(H.top, hair, 0.1);
    rows(H.back, 0, style === "crop" ? 3 : style === "bob" || style === "long" || style === "braids" ? 8 : 5, hair, 0.1);
    for (const r of [H.right, H.left]) rows(r, 0, style === "crop" ? 2 : style === "bob" || style === "long" ? 7 : 4, hair, 0.1);
    rows(H.front, 0, len, hair, 0.1);
    if (style === "swoop") { for (let x = 0; x < 6; x++) px(fx + x, fy + 2, hair, 0.1); }
    if (style === "long" || style === "bob") for (const x of [fx, fx + 7]) for (let y = fy + 2; y < fy + (style === "long" ? 8 : 6); y++) px(x, y, hair, 0.1);
  }
  // Hat layer: volume hair and headwear float half a pixel off the head.
  const HO = faces(SKIN_PARTS.head.over, SKIN_PARTS.head.size);
  const overHair = (from, to, sides = true) => { rect(HO.top, hair, 0.12); rows(HO.back, from, to, hair, 0.12); if (sides) for (const r of [HO.right, HO.left]) rows(r, from, Math.min(to, 6), hair, 0.12); };
  if (style === "afro" || style === "curly") { overHair(0, style === "afro" ? 6 : 4); rows(HO.front, 0, 1, hair, 0.12); if (style === "curly") for (let i = 0; i < 18; i++) { const x = HO.top[0] + ((i * 5) % 8), y = HO.top[1] + ((i * 3) % 8); px(x, y, shade(hair, 0.15), 0); } }
  if (style === "long") { rows(HO.back, 0, 8, hair, 0.12); for (const r of [HO.right, HO.left]) rows(r, 1, 8, hair, 0.12); }
  if (style === "bob") { rows(HO.back, 0, 7, hair, 0.12); for (const r of [HO.right, HO.left]) rows(r, 1, 6, hair, 0.12); }
  if (style === "puffs") { for (const [x, y] of [[0, 0], [1, 0], [6, 0], [7, 0], [0, 1], [7, 1]]) px(HO.top[0] + x, HO.top[1] + y, hair, 0.12); rows(HO.back, 0, 2, hair, 0.12); }
  if (style === "braids") for (let i = 0; i < 4; i++) for (let y = 0; y < 8; y++) px(HO.back[0] + 1 + i * 2, HO.back[1] + y, y % 2 ? hair : shade(hair, 0.2), 0);
  const hatColour = { cap: top, beanie: top, scrubcap: top, hardhat: "#f2b51d", police: "#1d2638", hijab: shade(top, -0.3) }[hat];
  if (hatColour) {
    rect(HO.top, hatColour, 0.06);
    const depth = hat === "hijab" ? 8 : hat === "beanie" ? 3 : 2;
    for (const r of [HO.right, HO.left, HO.back]) rows(r, 0, depth, hatColour, 0.06);
    rows(HO.front, 0, hat === "hijab" ? 1 : 2, hatColour, 0.06);
    if (hat === "hijab") { for (const x of [0, 7]) for (let y = 1; y < 8; y++) px(HO.front[0] + x, HO.front[1] + y, hatColour, 0.06); rows(HO.bottom, 0, 8, hatColour, 0.06); }
    if (hat === "police") { rows(HO.front, 2, 3, "#111111", 0); px(HO.front[0] + 3, HO.front[1], "#e0b25a", 0); px(HO.front[0] + 4, HO.front[1], "#e0b25a", 0); }
    if (hat === "hardhat") rows(HO.front, 2, 3, shade(hatColour, -0.2), 0);
  }
  if (a.glasses) { const gy = HO.front[1] + 4; for (let x = 0; x < 8; x++) px(HO.front[0] + x, gy - 1, "#1d1a22", 0); for (const x of [0, 3, 4, 7]) px(HO.front[0] + x, gy, "#1d1a22", 0); }

  // ---- body: the outfit ----
  const longHem = ["dress", "skirt", "abaya"].includes(outfit);
  const B = box("body", top);
  const bx = B.front[0], by = B.front[1];
  // Neckline.
  if (outfit === "scrubs" || outfit === "tshirt") { px(bx + 3, by, skin, 0); px(bx + 4, by, skin, 0); if (outfit === "scrubs") { px(bx + 3, by + 1, skin, 0); px(bx + 4, by + 1, skin, 0); px(bx + 6, by + 3, shade(top, -0.2), 0); } }
  if (outfit === "hoodie") { for (const x of [2, 5]) for (let y = 0; y < 4; y++) px(bx + x, by + y, "#ecdfc0", 0); rows([bx + 1, by, 6, 12], 7, 10, shade(top, -0.12), 0.04); rows(B.back, 0, 2, shade(top, -0.15), 0.04); }
  if (outfit === "jacket" || outfit === "suit" || outfit === "labcoat") {
    const coat = outfit === "labcoat" ? "#f4f4f1" : top;
    rect(B.front, coat); rect([bx + 3, by, 2, 12], outfit === "suit" ? "#f4f4f1" : outfit === "labcoat" ? shade(top, 0) : "#e7d9bd", 0.02);
    if (outfit === "suit") for (let y = 1; y < 9; y++) px(bx + (y < 8 ? 3 + (y % 2) : 3), by + y, "#3a3550", 0);
    for (const r of [B.right, B.left, B.back]) rect(r, shade(coat, -0.06));
    px(bx + 2, by + 1, shade(coat, -0.25), 0); px(bx + 5, by + 1, shade(coat, -0.25), 0);
  }
  if (outfit === "polo") { px(bx + 2, by, "#f6f0e4", 0); px(bx + 5, by, "#f6f0e4", 0); for (let y = 0; y < 3; y++) px(bx + 3 + (y % 2), by + y, shade(top, -0.2), 0); }
  if (outfit === "stripes") for (const y of [2, 5, 8, 11]) for (const r of [B.front, B.back, B.right, B.left]) rows(r, y, y + 1, "#f4f1ea", 0.02);
  if (outfit === "tracksuit") { for (let y = 0; y < 12; y++) px(bx + 3, by + y, "#f4f1ea", 0); for (const r of [B.right, B.left]) rows([r[0] + 1, r[1], 1, 12], 0, 12, "#f4f1ea", 0); }
  if (outfit === "overalls") { rect([bx + 1, by + 4, 6, 8], legs); for (const x of [1, 6]) for (let y = 0; y < 4; y++) px(bx + x, by + y, legs, 0); rect([B.back[0] + 1, B.back[1] + 6, 6, 6], legs); }
  if (outfit === "hivis") { const vest = "#d7e51f"; rect([bx + 1, by + 1, 6, 10], vest, 0.03); for (const r of [B.back, B.right, B.left]) rows(r, 1, 11, vest, 0.03); for (const y of [4, 8]) for (const r of [B.front, B.back, B.right, B.left]) rows(r, y, y + 1, "#c9cdd4", 0); }
  if (outfit === "uniform") { px(bx + 1, by + 3, "#e0b25a", 0); px(bx + 2, by + 3, "#e0b25a", 0); for (let y = 1; y < 10; y++) px(bx + 4, by + y, shade(top, -0.25), 0); for (const r of [B.front, B.back, B.right, B.left]) rows(r, 10, 11, "#1d2638", 0); px(bx + 4, by + 10, "#e0b25a", 0); }
  if (outfit === "tunic" || longHem) for (const r of [B.front, B.back, B.right, B.left]) rows(r, 9, 10, outfit === "abaya" ? "#e0b25a" : shade(top, -0.2), 0);
  if (a.print === "kharis-church" || a.print === "kharis-phase-2" || a.print === "kharis-on-campus") { for (let x = 1; x < 7; x++) px(bx + x, by + 4, "#111111", 0); for (const x of [1, 3, 5]) px(bx + x, by + 5, "#111111", 0); }
  if (a.backpack) { rect(B.back, shade(legs, -0.2)); for (const x of [1, 6]) for (let y = 0; y < 6; y++) px(bx + x, by + y, shade(legs, -0.3), 0); }
  if (a.scarf) { rows(B.front, 0, 2, "#e3b64f", 0.04); rows(B.back, 0, 2, "#e3b64f", 0.04); for (let y = 2; y < 6; y++) px(bx + 5, by + y, "#c99a2e", 0); }

  // ---- arms: sleeves, then skin, hands ----
  const sleeve = ["hoodie", "jacket", "tracksuit", "suit", "uniform", "labcoat", "abaya", "skirt"].includes(outfit) ? 11 : ["tshirt", "polo", "stripes", "scrubs", "dress"].includes(outfit) ? 4 : outfit === "hivis" || outfit === "overalls" || outfit === "tunic" ? 5 : 4;
  const sleeveColour = outfit === "labcoat" ? "#f4f4f1" : top;
  for (const arm of ["rightArm", "leftArm"]) {
    const A = box(arm, skin, false, 0.03);
    for (const k of ["front", "back", "right", "left"]) rows(A[k], 0, sleeve, k === "front" ? sleeveColour : shade(sleeveColour, -0.06));
    rect(A.top, sleeveColour);
    if (outfit === "tracksuit") for (const k of ["right", "left"]) rows([A[k][0] + 1, A[k][1], 1, 12], 0, sleeve, "#f4f1ea", 0);
    if (sleeve > 4) for (const k of ["front", "back", "right", "left"]) rows(A[k], sleeve - 1, sleeve, outfit === "abaya" ? "#e0b25a" : shade(sleeveColour, -0.15), 0.02);
    for (const k of ["front", "back", "right", "left"]) rows(A[k], 10, 12, shade(skin, -0.03), 0.03);
  }

  // ---- legs: trousers, shorts, skirts, shoes ----
  for (const leg of ["rightLeg", "leftLeg"]) {
    const L = box(leg, legs);
    if (a.trousers === "shorts") for (const k of ["front", "back", "right", "left"]) rows(L[k], 6, 10, skin, 0.03);
    if (a.trousers === "jeans") for (const k of ["front"]) for (let y = 1; y < 10; y += 3) px(L[k][0] + 1, L[k][1] + y, shade(legs, 0.18), 0);
    if (a.trousers === "cargo") for (const k of ["right", "left"]) rect([L[k][0] + 1, L[k][1] + 3, 2, 3], shade(legs, 0.12), 0.02);
    if (outfit === "scrubs") for (const k of Object.keys(L)) rect(L[k], k === "front" ? top : shade(top, -0.06));
    if (longHem) {
      const hemTo = outfit === "dress" ? 6 : 12, cloth = outfit === "skirt" ? legs : top;
      for (const k of ["front", "back", "right", "left"]) { rows(L[k], 0, 12, skin, 0.03); rows(L[k], 0, hemTo, k === "front" ? cloth : shade(cloth, -0.06)); }
    }
    for (const k of ["front", "back", "right", "left"]) rows(L[k], 10, 12, k === "front" ? shoe : shade(shoe, -0.1), 0.02);
    rect(L.bottom, shade(shoe, -0.3));
    for (const k of ["front", "back", "right", "left"]) rows(L[k], 11, 12, shade(shoe, -0.35), 0);
  }
}

/** A 64×32 legacy Minecraft skin, mirrored into the 64×64 layout (left limbs copy the right). */
export function upgradeLegacySkin(ctx, img) {
  ctx.clearRect(0, 0, 64, 64);
  ctx.drawImage(img, 0, 0);
  const copyMirrored = (sx, sy, dx, dy) => {
    const [w, h, d] = [4, 12, 4], src = faces([sx, sy], [w, h, d]), dst = faces([dx, dy], [w, h, d]);
    const swap = { right: "left", left: "right", front: "front", back: "back", top: "top", bottom: "bottom" };
    for (const [k, r] of Object.entries(src)) {
      const t = dst[swap[k]];
      ctx.save(); ctx.translate(t[0] + t[2], t[1]); ctx.scale(-1, 1);
      ctx.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); ctx.restore();
    }
  };
  copyMirrored(0, 16, 16, 48); // leg
  copyMirrored(40, 16, 32, 48); // arm
}
