// Original vector low-poly character system: every face is a deliberately shaded plane.
const choices = (rows) => rows.map(([value, label]) => ({ value, label }));
const colors = (rows) => choices(rows);
export const avatarOptions = {
  skin: colors([
    ["#f2c7a5", "Porcelain"],
    ["#e9c09a", "Warm ivory"],
    ["#d9a778", "Sand"],
    ["#c08b62", "Honey"],
    ["#a6734d", "Bronze"],
    ["#8a5a3c", "Chestnut"],
    ["#6e4630", "Umber"],
    ["#482e25", "Espresso"],
  ]),
  hair: choices([
    ["crop", "Cropped"],
    ["swoop", "Side swept"],
    ["curly", "Curls"],
    ["afro", "Afro"],
    ["braids", "Braids"],
    ["bob", "Bob"],
    ["puffs", "Twin puffs"],
    ["long", "Long layers"],
    ["bald", "Shaved"],
  ]),
  hairColor: colors([
    ["#241a18", "Ink"],
    ["#4e3025", "Walnut"],
    ["#8c512e", "Chestnut"],
    ["#bf7540", "Copper"],
    ["#d7b771", "Golden"],
    ["#d8d5cb", "Silver"],
    ["#783f84", "Plum"],
    ["#284e66", "Midnight blue"],
  ]),
  eyes: choices([
    ["round", "Bright"],
    ["almond", "Almond"],
    ["relaxed", "Relaxed"],
    ["wide", "Wide"],
    ["smile", "Smiling"],
  ]),
  face: choices([
    ["soft", "Soft"],
    ["angular", "Angular"],
    ["freckles", "Freckles"],
    ["beard", "Short beard"],
  ]),
  build: choices([
    ["standard", "Classic"],
    ["slim", "Slim"],
    ["broad", "Broad"],
  ]),
  outfit: choices([
    ["hoodie", "Hoodie"],
    ["jacket", "Field jacket"],
    ["tunic", "Long tunic"],
    ["tshirt", "T-shirt"],
    ["overalls", "Overalls"],
  ]),
  top: colors([
    ["#6b3fa0", "Kairos purple"],
    ["#a16bd0", "Lilac"],
    ["#e0ab3c", "Golden yellow"],
    ["#e9dfc7", "Oat"],
    ["#d97554", "Terracotta"],
    ["#a44760", "Berry"],
    ["#367c73", "Forest"],
    ["#3d8bd9", "Sky"],
    ["#334963", "Navy"],
    ["#292c34", "Charcoal"],
    ["#d58b9e", "Rose"],
    ["#8a9b68", "Sage"],
  ]),
  trousers: choices([
    ["jeans", "Straight jeans"],
    ["cargo", "Cargo trousers"],
    ["chinos", "Chinos"],
    ["shorts", "Shorts"],
  ]),
  legs: colors([
    ["#38495e", "Denim"],
    ["#222730", "Black"],
    ["#e1cba0", "Khaki"],
    ["#6b3fa0", "Violet"],
    ["#566c4d", "Olive"],
    ["#a16854", "Clay"],
    ["#a1acb4", "Stone"],
    ["#6a506f", "Mauve"],
  ]),
  shoe: colors([
    ["#ece7dc", "Cloud"],
    ["#33313a", "Graphite"],
    ["#ad6844", "Leather"],
    ["#6b3fa0", "Purple"],
    ["#d89e34", "Gold"],
    ["#417c76", "Teal"],
  ]),
  hat: choices([
    ["none", "No hat"],
    ["cap", "Cap"],
    ["beanie", "Beanie"],
  ]),
};
export const avatarDefaults = {
  skin: "#8a5a3c",
  hair: "curly",
  hairColor: "#241a18",
  eyes: "round",
  face: "soft",
  build: "standard",
  outfit: "hoodie",
  top: "#6b3fa0",
  trousers: "jeans",
  legs: "#38495e",
  shoe: "#ece7dc",
  hat: "none",
  glasses: false,
  scarf: true,
  backpack: false,
};
export function normalizeAvatar(raw = {}) {
  const a = { ...avatarDefaults };
  for (const key of Object.keys(avatarOptions))
    if (avatarOptions[key].some((o) => o.value === raw?.[key]))
      a[key] = raw[key];
  for (const k of ["glasses", "scarf", "backpack"])
    if (typeof raw?.[k] === "boolean") a[k] = raw[k];
  return a;
}
const memory = new Map();
export function createAvatarStore(
  playerId = "guest",
  storage,
  fallback = avatarDefaults,
) {
  if (storage === undefined)
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  const key = `kairos-avatar-v1:${playerId}`;
  let value = memory.get(key) || normalizeAvatar(fallback),
    saved = false;
  try {
    const raw = JSON.parse(storage?.getItem(key) || "null");
    if (raw) value = normalizeAvatar(raw);
  } catch {}
  return {
    get: () => ({ ...value }),
    get saved() {
      return saved;
    },
    set(raw) {
      value = normalizeAvatar(raw);
      memory.set(key, value);
      try {
        storage.setItem(key, JSON.stringify(value));
        saved = true;
      } catch {
        saved = false;
      }
      return { ...value };
    },
  };
}
const shade = (hex, n) =>
  "#" +
  [1, 3, 5]
    .map((i) =>
      Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) + n))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
const poly = (pts, color, cls = "") =>
  `<polygon ${cls ? `class="${cls}"` : ""} points="${pts}" fill="${color}"/>`;
const path = (d, c, w = 2) =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
function limb(ax, ay, bx, by, cx, cy, skin, cloth) {
  const segment = (x1, y1, x2, y2, width, c) => {
    const dx = x2 - x1,
      dy = y2 - y1,
      len = Math.hypot(dx, dy) || 1,
      nx = (-dy / len) * width,
      ny = (dx / len) * width;
    return (
      poly(
        `${x1 + nx},${y1 + ny} ${x2 + nx * 0.8},${y2 + ny * 0.8} ${x2 - nx * 0.8},${y2 - ny * 0.8} ${x1 - nx},${y1 - ny}`,
        c,
      ) +
      poly(
        `${x1},${y1} ${x2},${y2} ${x2 - nx * 0.8},${y2 - ny * 0.8} ${x1 - nx},${y1 - ny}`,
        shade(c, -24),
      )
    );
  };
  return (
    segment(ax, ay, bx, by, 12, cloth) +
    segment(bx, by, cx, cy, 9, cloth) +
    poly(
      `${cx - 8},${cy - 5} ${cx + 6},${cy - 8} ${cx + 10},${cy + 3} ${cx + 2},${cy + 13} ${cx - 9},${cy + 7}`,
      skin,
    ) +
    poly(
      `${cx + 2},${cy - 6} ${cx + 10},${cy + 3} ${cx + 2},${cy + 13} ${cx - 1},${cy + 1}`,
      shade(skin, -20),
    )
  );
}
export function avatarSvg(
  raw,
  pose = "wave",
  { bust = false, cls = "", label = "" } = {},
) {
  const a = normalizeAvatar(raw),
    skin = a.skin,
    skinDark = shade(skin, -30),
    skinLight = shade(skin, 20),
    hair = a.hairColor,
    hairLight = shade(hair, 24),
    top = a.top,
    dark = shade(top, -28),
    light = shade(top, 22),
    leg = a.legs;
  const w = a.build === "broad" ? 1.13 : a.build === "slim" ? 0.9 : 1;
  const legs =
    poly("77,194 102,195 100,264 72,264", leg) +
    poly("106,195 132,194 139,264 110,264", shade(leg, -8)) +
    poly("94,195 102,195 100,264 90,264", shade(leg, -26)) +
    poly("122,195 132,194 139,264 128,264", shade(leg, -30));
  const shorts =
    a.trousers === "shorts"
      ? poly("75,232 100,232 99,264 73,264", skin) +
        poly("109,232 135,232 139,264 111,264", skinDark)
      : "";
  const cargo =
    a.trousers === "cargo"
      ? poly("74,219 89,219 88,238 72,238", shade(leg, 16)) +
        poly("120,219 135,218 138,238 122,239", shade(leg, 12))
      : "";
  const shoes =
    poly("72,258 100,258 104,276 68,276 64,268", a.shoe) +
    poly("110,258 139,258 148,270 144,276 109,276", a.shoe) +
    poly("68,271 104,271 104,278 68,278", shade(a.shoe, -45)) +
    poly("109,271 146,271 144,278 109,278", shade(a.shoe, -45));
  const y = a.outfit === "tunic" ? 218 : 199;
  let body =
    poly(`74,125 131,125 144,${y} 65,${y}`, top) +
    poly(`74,125 91,136 83,${y} 65,${y}`, dark) +
    poly(`91,136 131,125 144,${y} 119,${y}`, light) +
    poly(`119,139 131,125 144,${y} 132,${y}`, dark);
  if (a.outfit === "hoodie")
    body +=
      poly("82,127 105,146 128,127 119,117 92,117", shade(top, -15)) +
      path("M96 140 95 160 M113 140 115 160", "#ecdfc0", 2) +
      poly("86,173 120,173 125,190 81,190", dark);
  if (a.outfit === "jacket")
    body +=
      poly("98,131 106,144 113,131 116,199 100,199", "#e7d9bd") +
      poly("83,127 102,144 94,158 81,139", dark) +
      poly("123,127 109,144 119,158 131,141", dark) +
      poly("77,166 92,166 92,183 76,183", shade(top, -18));
  if (a.outfit === "tshirt")
    body += poly("89,124 105,137 121,124 115,121 95,121", dark);
  if (a.outfit === "overalls")
    body +=
      poly("81,129 87,129 95,167 115,167 123,129 130,129 132,200 78,200", leg) +
      poly("91,151 120,151 125,197 86,197", shade(leg, 14));
  const back = a.backpack
    ? poly("65,133 78,124 137,136 148,190 132,207 67,196", shade(a.top, -55))
    : "";
  const neck = poly("96,104 116,104 119,130 105,140 92,129", skinDark);
  let head =
    poly(
      "74,52 91,37 120,38 138,54 141,89 127,113 104,122 80,112 66,87",
      skin,
    ) +
    poly("74,52 91,37 104,48 81,66 66,87", skinLight) +
    poly("126,48 138,54 141,89 127,113 113,118 122,93", skinDark) +
    poly("81,66 104,48 126,48 122,93 103,109 79,96", shade(skin, 7)) +
    poly("96,85 105,80 109,94 99,97", skinDark);
  const eyeY = a.eyes === "relaxed" ? 79 : 76;
  const eye = (x) => {
    if (a.eyes === "smile" || pose === "cheer")
      return path(`M${x - 5} 79 Q${x} 73 ${x + 5} 79`, "#261f26", 3);
    const h = a.eyes === "wide" ? 8 : a.eyes === "relaxed" ? 3 : 6;
    const white =
      a.eyes === "almond"
        ? poly(
            `${x - 8},${eyeY} ${x - 3},${eyeY - 4} ${x + 4},${eyeY - 4} ${x + 8},${eyeY} ${x + 3},${eyeY + 5} ${x - 4},${eyeY + 4}`,
            "#fff3df",
          )
        : poly(
            `${x - 6},${eyeY - h} ${x + 5},${eyeY - h} ${x + 6},${eyeY + h} ${x - 6},${eyeY + h}`,
            "#fff3df",
          );
    return (
      white +
      poly(
        `${x - 1},${eyeY - h + 1} ${x + 4},${eyeY - h + 1} ${x + 4},${eyeY + h - 1} ${x - 1},${eyeY + h - 1}`,
        "#292431",
      ) +
      (a.eyes === "relaxed"
        ? path(`M${x - 7} ${eyeY - 4} ${x + 7} ${eyeY - 2}`, hair, 3)
        : "")
    );
  };
  head +=
    eye(86) +
    eye(119) +
    path("M79 64 91 63 M113 63 125 65", hair, 3) +
    path(
      pose === "think" ? "M95 106 113 106" : "M94 103 Q105 113 116 102",
      "#54313a",
      2.5,
    );
  if (a.face === "beard")
    head +=
      poly("78,95 90,104 102,109 119,101 132,93 128,111 106,121 83,113", hair) +
      path("M96 106 113 106", skinDark, 2);
  if (a.face === "freckles")
    head += [78, 83, 88, 120, 125, 130]
      .map((x, i) => poly(`${x},95 ${x + 2},94 ${x + 3},97 ${x},98`, skinDark))
      .join("");
  if (a.face === "angular")
    head += path("M78 100 88 108 M124 106 133 98", skinDark, 2);
  let hairBack = "",
    hairFront = "";
  const baseHair =
    poly(
      "65,72 62,50 75,32 100,26 124,32 141,47 144,77 132,59 111,51 89,56 77,75",
      hair,
    ) +
    poly("62,50 75,32 100,26 108,40 84,46 65,72", hairLight) +
    poly("108,40 124,32 141,47 132,59", shade(hair, -8));
  if (a.hair !== "bald") hairFront = baseHair;
  if (a.hair === "crop")
    hairFront =
      poly("65,67 67,45 83,34 120,34 138,48 141,70 131,53 78,53", hair) +
      poly("67,45 83,34 120,34 106,44", hairLight);
  if (a.hair === "swoop")
    hairFront +=
      poly("67,61 81,31 117,28 139,47 115,55 90,49 72,78", hair) +
      poly("81,31 117,28 102,43 72,62", hairLight);
  if (["afro", "curly", "puffs"].includes(a.hair)) {
    hairFront = "";
    const centres =
      a.hair === "puffs"
        ? [
            [64, 42, 24],
            [140, 42, 24],
            [103, 45, 38],
          ]
        : [[101, 42, a.hair === "afro" ? 48 : 40]];
    for (const [x, y, r] of centres) {
      hairFront +=
        poly(
          `${x - r},${y} ${x - r * 0.7},${y - r * 0.8} ${x},${y - r} ${x + r * 0.8},${y - r * 0.65} ${x + r},${y + r * 0.15} ${x + r * 0.6},${y + r * 0.7} ${x - r * 0.5},${y + r * 0.7}`,
          hair,
        ) +
        poly(
          `${x - r},${y} ${x},${y - r} ${x + 10},${y - 8} ${x - r * 0.5},${y + r * 0.7}`,
          hairLight,
        );
      hairFront += poly(
        `${x},${y - r} ${x + r * 0.8},${y - r * 0.65} ${x + 10},${y - 8}`,
        shade(hair, 40),
      );
    }
  }
  if (["bob", "long", "braids"].includes(a.hair)) {
    hairBack = poly(
      "66,53 74,31 121,28 143,51 151,137 124,142 126,80 79,80 79,139 55,129",
      hair,
    );
    if (a.hair === "long")
      hairBack +=
        poly("63,74 77,89 74,160 55,147", hairLight) +
        poly("135,67 151,90 156,158 137,151", shade(hair, -10));
    if (a.hair === "braids")
      hairFront += Array.from({ length: 4 }, (_, i) => {
        const x = i < 2 ? 62 + i * 9 : 135 + (i - 2) * 8;
        return [0, 1, 2, 3]
          .map((j) =>
            poly(
              `${x},${58 + j * 19} ${x + 7},${66 + j * 19} ${x + 2},${78 + j * 19} ${x - 5},${68 + j * 19}`,
              j % 2 ? hair : hairLight,
            ),
          )
          .join("");
      }).join("");
  }
  if (a.glasses)
    head += `<g fill="none" stroke="#302a34" stroke-width="3"><path d="M73 68h25v20H73z M107 68h25v20h-25z M98 75h9"/></g>`;
  if (a.hat !== "none")
    hairFront +=
      poly(
        a.hat === "cap"
          ? "65,50 70,29 88,18 120,20 140,35 145,55 111,50 84,57"
          : "65,56 68,31 90,14 119,18 140,37 142,59",
        top,
      ) + poly("65,50 85,39 111,42 145,55 133,63 95,55 65,61", dark);
  const armPose = {
    wave: [73, 137, 52, 153, 41, 123, 131, 137, 153, 111, 146, 80],
    cheer: [73, 137, 49, 108, 41, 77, 131, 137, 154, 106, 165, 77],
    think: [73, 137, 58, 174, 73, 201, 131, 137, 148, 157, 115, 110],
    read: [73, 137, 55, 169, 81, 181, 131, 137, 148, 167, 121, 181],
    encourage: [73, 137, 54, 169, 80, 178, 131, 137, 150, 165, 122, 176],
    down: [73, 137, 58, 174, 63, 205, 131, 137, 146, 174, 141, 205],
  }[pose] || [73, 137, 58, 174, 63, 205, 131, 137, 146, 174, 141, 205];
  const arms =
    limb(...armPose.slice(0, 6), skin, top) +
    limb(...armPose.slice(6), skin, top);
  const scarf = a.scarf
    ? poly("88,120 105,132 125,119 129,130 107,142 87,130", "#e3b64f") +
      poly("114,135 125,131 132,157 122,160", "#bc8a28")
    : "";
  const trouserDetails =
    a.trousers === "chinos"
      ? path("M85 208 82 251 M118 208 124 251", shade(leg, 30), 2)
      : a.trousers === "jeans"
        ? path("M78 208 76 252 M129 207 134 252", shade(leg, 35), 1.6)
        : "";
  const book =
    pose === "read"
      ? poly("78,169 103,176 128,168 125,194 103,201 79,193", "#eadbb9") +
        poly("103,176 128,168 125,194 103,201", "#c6b084") +
        path("M103 177V197", "#6e536f", 2)
      : "";
  const escaped = String(label).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" class="kai low-poly-avatar avatar-${pose} ${bust ? "kai-bust" : ""} ${cls}" viewBox="${bust ? "48 8 112 145" : "28 0 160 292"}" ${label ? `role="img" aria-label="${escaped}"` : 'aria-hidden="true"'}><ellipse cx="105" cy="282" rx="58" ry="7" fill="#17101d" opacity=".15"/><g class="avatar-body" transform="translate(105 0) scale(${w} 1) translate(-105 0)">${back}${legs}${shorts}${cargo}${trouserDetails}${shoes}${body}${neck}${arms}${scarf}</g><g class="avatar-head">${hairBack}${head}${hairFront}</g>${book}</svg>`;
}
