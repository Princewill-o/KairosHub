// Kairos guide characters — original hand-drawn vector art for the Bible games (October 2026).
// Pure SVG strings: no images, fonts or emoji. Outline and colours follow the board-game style in theme.css.
import { accounts } from "../accounts.mjs";
const INK = "#2e1a47";
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const SHARED = {
  cheek: "#e8737f",
  paper: "#fff4d6",
  paperShade: "#ead7a4",
  wool: "#fffaf0",
  woolShade: "#efe4cf",
  sun: "#f5b83d",
};

/** Five explorers. Each one changes skin, hair, outfit and small details, and shares the same poses. */
export const CHARACTERS = [
  {
    id: "kai", name: "Kai", about: "Loves maps and long walks.",
    hair: "curly", outfit: "hoodie",
    skin: "#8a5a3c", skinShade: "#734a31", hairColor: "#2a1a14", hairShine: "#5a3a2c",
    top: "#6b3fa0", topShade: "#56308a", scarf: "#f5b83d", scarfShade: "#d9961c",
    legs: "#f3e2b3", legsShade: "#dcc68e", shoe: "#6b3f22", bag: "#c98a4b", bagShade: "#a96e35",
  },
  {
    id: "ama", name: "Ama", about: "Sings the loudest at church.",
    hair: "puffs", outfit: "tunic",
    skin: "#6e4630", skinShade: "#5a3826", hairColor: "#1f1410", hairShine: "#4a3328",
    top: "#2a9d8f", topShade: "#1f7f73", scarf: "#f07e9b", scarfShade: "#d45f7e", tie: "#f5b83d",
    legs: "#3d2a5c", legsShade: "#2e1f47", shoe: "#c8507a", bag: "#f5b83d", bagShade: "#d9961c",
  },
  {
    id: "leo", name: "Leo", about: "Can’t stop asking questions.",
    hair: "swoop", outfit: "hoodie", freckles: true,
    skin: "#f2c7a5", skinShade: "#e0ab86", hairColor: "#c8642c", hairShine: "#e8894c",
    top: "#4a9b4f", topShade: "#3a7f3f", scarf: "#3d8bd9", scarfShade: "#2c6fb5",
    legs: "#3a4a6b", legsShade: "#2c3a56", shoe: "#2e1a47", bag: "#8a5a3c", bagShade: "#6d4630",
  },
  {
    id: "mei", name: "Mei", about: "Draws every Bible story.",
    hair: "bob", outfit: "tunic",
    skin: "#e9c09a", skinShade: "#d6a57c", hairColor: "#1c1620", hairShine: "#4a4052",
    top: "#f07e5f", topShade: "#d6623f", scarf: "#7fd3b0", scarfShade: "#58b38f",
    legs: "#f3e2b3", legsShade: "#dcc68e", shoe: "#6b3fa0", bag: "#6b3fa0", bagShade: "#56308a",
  },
  {
    id: "theo", name: "Theo", about: "First to help a friend.",
    hair: "short", outfit: "hoodie", glasses: true,
    skin: "#c08b62", skinShade: "#a6734d", hairColor: "#33231a", hairShine: "#5c4434",
    top: "#3d8bd9", topShade: "#2c6fb5", scarf: "#f5a03d", scarfShade: "#d9821c",
    legs: "#f3e2b3", legsShade: "#dcc68e", shoe: "#6b3f22", bag: "#e8506a", bagShade: "#c43b55",
  },
];

const STORE = "kairos-guide-v1";
export function currentCharacter() {
  let id = accounts.active()?.character;
  if (!id)
    try {
      id = localStorage.getItem(STORE) || "kai";
    } catch {}
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
export function chooseCharacter(id) {
  const found = CHARACTERS.find((c) => c.id === id);
  if (!found) return false;
  const player = accounts.active();
  if (player) {
    accounts.update(player.id, { character: found.id });
    return accounts.saved;
  }
  try {
    localStorage.setItem(STORE, found.id);
  } catch {
    return false;
  }
  return true;
}

// Arms: shoulder → elbow control → hand. Drawn as a thick outlined sleeve with a round hand.
const ARMS = {
  down: [[70, 138, 58, 160, 62, 186], [130, 138, 142, 160, 138, 186]],
  wave: [[70, 138, 58, 160, 62, 186], [130, 138, 166, 128, 162, 90]],
  cheer: [[70, 138, 40, 122, 44, 88], [130, 138, 160, 122, 156, 88]],
  think: [[70, 138, 58, 160, 62, 186], [130, 138, 150, 160, 116, 120]],
  encourage: [[70, 138, 54, 170, 84, 160], [130, 138, 146, 170, 116, 160]],
  read: [[70, 138, 56, 168, 76, 166], [130, 138, 144, 168, 124, 166]],
};
const FACES = {
  wave: { brows: "M74 70q8-6 16-1M110 69q8-5 16 1", eyes: "open", mouth: `<path d="M87 101q13 14 26 0z" fill="#7a2335" ${S}/><path d="M93 106q7 4 14 0" fill="#e8737f"/>` },
  cheer: { brows: "M73 66q9-7 17-1M110 65q8-6 17 1", eyes: "happy", mouth: `<path d="M84 99q16 22 32 0z" fill="#7a2335" ${S}/><path d="M91 108q9 6 18 0" fill="#e8737f"/>` },
  think: { brows: "M74 72q8-3 16 0M110 66q8-6 16-2", eyes: "side", mouth: `<path d="M98 105q6-3 11 1" fill="none" ${S}/>` },
  encourage: { brows: "M74 69q8-5 16-2M110 67q8-3 16 2", eyes: "open", mouth: `<path d="M88 102q12 10 24 0" fill="none" ${S}/>` },
  read: { brows: "M74 70q8-4 16-1M110 69q8-3 16 1", eyes: "down", mouth: `<path d="M90 103q10 8 20 0" fill="none" ${S}/>` },
};
FACES.down = FACES.encourage;

const arm = (c, [sx, sy, cx, cy, hx, hy]) =>
  `<path d="M${sx} ${sy}Q${cx} ${cy} ${hx} ${hy}" fill="none" stroke="${INK}" stroke-width="21" stroke-linecap="round"/>` +
  `<path d="M${sx} ${sy}Q${cx} ${cy} ${hx} ${hy}" fill="none" stroke="${c.top}" stroke-width="15" stroke-linecap="round"/>` +
  `<circle cx="${hx}" cy="${hy}" r="9" fill="${c.skin}" ${S}/>`;

function eyes(kind, adult = false) {
  if (kind === "happy")
    return `<path d="M75 86q7-9 14 0M111 86q7-9 14 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  const dx = kind === "side" ? 3 : 0,
    dy = kind === "down" ? 3 : 0;
  const one = (x) =>
    adult
      ? `<ellipse cx="${x}" cy="85" rx="7.5" ry="6.5" fill="#fff" ${S}/><circle cx="${x + dx}" cy="${86 + dy}" r="4.4" fill="${INK}"/><circle cx="${x + dx - 1.5}" cy="${84 + dy}" r="1.5" fill="#fff"/>`
      : `<ellipse cx="${x}" cy="84" rx="8" ry="10" fill="#fff" ${S}/><ellipse cx="${x + dx}" cy="${85 + dy}" rx="5" ry="6.5" fill="${INK}"/><circle cx="${x + dx - 2}" cy="${82 + dy}" r="2" fill="#fff"/>`;
  return `<g class="kai-eyes">${one(82)}${one(118)}</g>`;
}

/** Overlapping outlined circles, merged by redrawing their fills on top. */
const blob = (circles, fill) =>
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="6"/>`).join("") +
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");

// Hair is split into what sits behind the head and what sits on top of it.
const HAIR = {
  curly: (c) => ({
    back: "",
    front:
      blob([[58, 74, 11], [62, 58, 12], [74, 45, 13], [90, 37, 13], [108, 36, 13], [125, 42, 13], [138, 55, 12], [143, 71, 11], [100, 50, 18], [80, 56, 14], [120, 56, 14]], c.hairColor) +
      `<path d="M84 44q6-4 12-1M112 40q6-1 10 3" fill="none" stroke="${c.hairShine}" stroke-width="3" stroke-linecap="round"/>`,
  }),
  puffs: (c) => ({
    back: blob([[56, 44, 22], [144, 44, 22]], c.hairColor) + `<path d="M64 60l10-6M136 60l-10-6" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M64 60l10-6M136 60l-10-6" stroke="${c.tie}" stroke-width="5" stroke-linecap="round"/>`,
    front: `<path d="M58 80q-2-38 42-40 44 2 42 40-10-20-42-22-32 2-42 22z" fill="${c.hairColor}" ${S}/><path d="M78 50q10-6 22-6" fill="none" stroke="${c.hairShine}" stroke-width="3" stroke-linecap="round"/><path d="M50 40q6-8 14-6M150 40q-6-8-14-6" fill="none" stroke="${c.hairShine}" stroke-width="3" stroke-linecap="round"/>`,
  }),
  swoop: (c) => ({
    back: "",
    front: `<path d="M56 84q-6-48 44-50 50 0 46 46-14-22-38-22-20-10-36 6-10 8-16 20z" fill="${c.hairColor}" ${S}/><path d="M74 50q14-10 32-8M116 46q12 2 18 12" fill="none" stroke="${c.hairShine}" stroke-width="3" stroke-linecap="round"/>`,
  }),
  bob: (c) => ({
    back: `<path d="M48 104q-8-66 52-70 60 4 52 70z" fill="${c.hairColor}" ${S}/>`,
    front: `<path d="M56 74q2-34 44-36 42 2 44 36-6-8-14-10H70q-8 2-14 10z" fill="${c.hairColor}" ${S}/><path d="M76 46q12-6 26-6" fill="none" stroke="${c.hairShine}" stroke-width="3" stroke-linecap="round"/>`,
  }),
  short: (c) => ({
    back: "",
    front: `<path d="M57 80q-3-42 43-42 46 0 43 42-12-18-43-18-31 0-43 18z" fill="${c.hairColor}" ${S}/><path d="M80 46q10-4 22-3" fill="none" stroke="${c.hairShine}" stroke-width="3" stroke-linecap="round"/>`,
  }),
};

function scroll() {
  return `<g class="kai-scroll"><path d="M70 150h60v26H70z" fill="${SHARED.paper}" ${S}/><path d="M78 158h44M78 165h34" stroke="${SHARED.paperShade}" stroke-width="3" stroke-linecap="round"/><rect x="62" y="146" width="12" height="34" rx="6" fill="#c98a4b" ${S}/><rect x="126" y="146" width="12" height="34" rx="6" fill="#c98a4b" ${S}/></g>`;
}

function bodyParts(c) {
  const tunic = c.outfit === "tunic";
  const legsTop = tunic ? 206 : 192;
  const legs =
    `<path d="M78 ${legsTop}h18v${230 - legsTop}H78zM104 ${legsTop}h18v${230 - legsTop}h-18z" fill="${c.legs}" ${S}/>` +
    `<path d="M78 ${legsTop + 6}h6v${224 - legsTop}h-6zM104 ${legsTop + 6}h6v${224 - legsTop}h-6z" fill="${c.legsShade}"/>` +
    `<path d="M72 236q0-9 13-9h12v11H74q-2 0-2-2zM128 236q0-9-13-9h-12v11h23q2 0 2-2z" fill="${c.shoe}" ${S}/>`;
  const top = tunic
    ? `<path d="M64 140q4-16 36-16t36 16l12 66q-48 12-96 0z" fill="${c.top}" ${S}/><path d="M64 146l-10 60q8 2 16 3l8-54z" fill="${c.topShade}"/><path d="M58 196q42 10 84 0" fill="none" stroke="${c.topShade}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M64 140q4-16 36-16t36 16l8 52q-44 12-88 0z" fill="${c.top}" ${S}/><path d="M64 146l-6 46q8 2 16 3l4-40z" fill="${c.topShade}"/><path d="M80 194v-14q0-8 8-8h24q8 0 8 8v14" fill="none" stroke="${c.topShade}" stroke-width="3" stroke-linecap="round"/>`;
  const bagY = tunic ? 180 : 172;
  const bag =
    `<path d="M74 134l60 ${bagY - 122}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M74 134l60 ${bagY - 122}" stroke="${c.bag}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="122" y="${bagY}" width="30" height="24" rx="6" fill="${c.bag}" ${S}/><path d="M122 ${bagY + 8}h30" stroke="${c.bagShade}" stroke-width="3"/><circle cx="137" cy="${bagY + 14}" r="3" fill="${SHARED.sun}" stroke="${INK}" stroke-width="2"/>`;
  const neck =
    `<path d="M91 112h18v18H91z" fill="${c.skinShade}" ${S}/><path d="M76 130q24 12 48 0l-3-10q-21 9-42 0z" fill="${c.scarf}" ${S}/><path d="M113 132l6 18 8-4-5-16z" fill="${c.scarfShade}" ${S}/>`;
  return legs + top + bag + neck;
}

function headParts(c, f, adult = false) {
  const hair = HAIR[c.hair](c);
  const ears = c.hair === "bob" ? "" : `<circle cx="55" cy="88" r="9" fill="${c.skin}" ${S}/><circle cx="145" cy="88" r="9" fill="${c.skin}" ${S}/>`;
  const face =
    `<path d="M56 84q0-44 44-44t44 44q0 32-44 32T56 84z" fill="${c.skin}" ${S}/><path d="M60 92q4 20 30 23-22-1-30-23z" fill="${c.skinShade}"/>`;
  const freckles = c.freckles
    ? `<g fill="${c.skinShade}"><circle cx="66" cy="96" r="1.8"/><circle cx="72" cy="101" r="1.8"/><circle cx="77" cy="96" r="1.8"/><circle cx="123" cy="96" r="1.8"/><circle cx="128" cy="101" r="1.8"/><circle cx="134" cy="96" r="1.8"/></g>`
    : "";
  const glasses = c.glasses
    ? `<g fill="none" stroke="${INK}" stroke-width="3.5"><rect x="69" y="72" width="26" height="24" rx="9" fill="#ffffff22"/><rect x="105" y="72" width="26" height="24" rx="9" fill="#ffffff22"/><path d="M95 82q5-4 10 0M69 80l-12-3M131 80l12-3"/></g>`
    : "";
  const browColor = c.hairColor;
  return {
    back: hair.back,
    front:
    ears +
    face +
    hair.front +
    (adult ? `<path d="M68 104q6 4 12 3M132 104q-6 4-12 3" fill="none" stroke="${c.skinShade}" stroke-width="3" stroke-linecap="round"/>` : `<ellipse cx="71" cy="99" rx="7" ry="4" fill="${SHARED.cheek}" opacity=".55"/><ellipse cx="129" cy="99" rx="7" ry="4" fill="${SHARED.cheek}" opacity=".55"/>`) +
    freckles +
    eyes(f.eyes, adult) +
    glasses +
    `<path d="${f.brows}" fill="none" stroke="${browColor}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M98 94q2 3 5 1" fill="none" stroke="${c.skinShade}" stroke-width="3" stroke-linecap="round"/>` +
    f.mouth,
  };
}

/** True on the 18+ KairosGames platform, where characters are drawn older. */
export const isAdultAudience = () => {
  try {
    return globalThis.document?.documentElement?.dataset?.audience === "adult";
  } catch {
    return false;
  }
};

/**
 * A guide character as an SVG string.
 * @param {"wave"|"cheer"|"think"|"encourage"|"read"|"down"} pose
 * @param {{bust?: boolean, cls?: string, label?: string, character?: string|object, age?: "kid"|"adult"}} opts
 *   bust crops to head and shoulders; character defaults to the one the player chose;
 *   age defaults to the current platform (older proportions on the 18+ platform).
 */
export function guide(pose = "wave", { bust = false, cls = "", label = "", character, age } = {}) {
  const c =
    typeof character === "object" && character
      ? character
      : CHARACTERS.find((x) => x.id === character) || currentCharacter();
  const adult = age ? age === "adult" : isAdultAudience();
  const f = FACES[pose] || FACES.wave,
    [left, right] = ARMS[pose] || ARMS.down;
  // Older proportions: a smaller head and a taller body (stretched from the shoulders down).
  const headT = adult ? 'transform="translate(100 116) scale(.72) translate(-100 -116)"' : "";
  const bodyT = adult ? 'transform="translate(0 124) scale(1 1.3) translate(0 -124)"' : "";
  const box = adult ? (bust ? "44 46 112 112" : "18 44 164 234") : bust ? "36 18 128 128" : "18 14 164 238";
  const head = headParts(c, f, adult);
  const body = `<g ${bodyT}>${bodyParts(c)}</g>`,
    back = `<g ${headT}>${head.back}</g>`,
    front = `<g ${headT}>${head.front}</g>`,
    arms = `<g ${bodyT}>${arm(c, left) + arm(c, right)}${pose === "read" ? scroll() : ""}</g>`;
  const inner =
    pose === "read" || pose === "encourage" ? body + back + front + arms : body + back + arms + front;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="kai kai-${pose} guide-${c.id} ${adult ? "kai-adult" : ""} ${bust ? "kai-bust" : ""} ${cls}" viewBox="${box}" ${a11y}><g class="kai-body">${inner}</g></svg>`;
}
/** Kept for earlier call sites. */
export const kai = guide;

/** A small lamb that follows the guide around the hero scene. */
export function lamb(x = 0, y = 0, s = 1) {
  const puffs = [[18, 26, 11], [30, 16, 12], [46, 13, 12], [60, 20, 11], [58, 34, 11], [42, 38, 12], [24, 37, 11], [40, 25, 14]];
  return `<g transform="translate(${x} ${y}) scale(${s})" class="kai-lamb"><path d="M26 42v14M52 42v14" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M26 42v14M52 42v14" stroke="#4a3530" stroke-width="3" stroke-linecap="round"/>${blob(puffs, SHARED.wool)}<path d="M28 36q12 6 24 0" stroke="${SHARED.woolShade}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M64 14q-12 2-10 10 8 2 12-4z" fill="#4a3530" ${S}/><path d="M86 14q12 2 10 10-8 2-12-4z" fill="#4a3530" ${S}/><ellipse cx="75" cy="24" rx="13" ry="15" fill="#4a3530" ${S}/><circle cx="70" cy="21" r="3.2" fill="#fff"/><circle cx="80" cy="21" r="3.2" fill="#fff"/><circle cx="70.6" cy="21.6" r="1.6" fill="${INK}"/><circle cx="80.6" cy="21.6" r="1.6" fill="${INK}"/><path d="M71 31q4 3 8 0" fill="none" stroke="#c9a59a" stroke-width="2" stroke-linecap="round"/><circle cx="70" cy="9" r="6" fill="${SHARED.wool}" stroke="${INK}" stroke-width="3"/><circle cx="79" cy="7" r="6" fill="${SHARED.wool}" stroke="${INK}" stroke-width="3"/><circle cx="74" cy="7" r="5" fill="${SHARED.wool}"/></g>`;
}

/** The library hero illustration: the chosen guide on a hill path with a lamb, sun, clouds and an olive tree. */
export function heroScene(character, { night = isAdultAudience() } = {}) {
  const cloud = (x, y, sc) =>
    `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M10 34q-12 0-10-12 2-10 14-8 4-14 20-12 12 2 14 12 12-2 14 9 0 11-12 11z" fill="#fff" ${S} opacity=".95"/></g>`;
  const svg = guide("wave", { character, age: night ? "adult" : "kid" });
  const box = svg.match(/viewBox="([^"]+)"/)[1];
  const person = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const stars = night
    ? [[40, 40, 2.5], [90, 90, 1.8], [160, 30, 2.2], [230, 70, 1.6], [300, 26, 2.4], [330, 120, 1.6], [430, 140, 2], [60, 150, 1.6], [200, 130, 1.4]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85"/>`)
        .join("") +
      `<path d="M120 60l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#ffd27a"/><path d="M270 110l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffd27a"/>`
    : "";
  const sky = night
    ? `<path d="M398 30a38 38 0 1 0 22 66 30 30 0 1 1-22-66z" fill="#ffe4a6" ${S}/>${stars}`
    : `<circle cx="380" cy="64" r="34" fill="${SHARED.sun}" ${S}/><circle cx="380" cy="64" r="46" fill="none" stroke="${SHARED.sun}" stroke-width="4" stroke-dasharray="4 12" stroke-linecap="round" opacity=".7"/>${cloud(40, 40, 1.1)}${cloud(250, 18, 0.8)}`;
  const [back, front, path, tree] = night ? ["#3a2a6e", "#245a4c", "#c9b98f", "#3f6f4a"] : ["#8f63cf", "#8cc97e", "#f3e2b3", "#6f9a52"];
  return `<svg class="kg-scene" viewBox="0 0 460 300" aria-hidden="true" focusable="false">
${sky}
<path d="M-10 230q90-70 200-40t280-30v150H-10z" fill="${back}" ${S}/>
<path d="M-10 262q120-50 250-22t230-10v80H-10z" fill="${front}" ${S}/>
<path d="M150 300q30-40 120-56 60-10 110-8" fill="none" stroke="${path}" stroke-width="16" stroke-linecap="round"/>
<path d="M150 300q30-40 120-56 60-10 110-8" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="1 14" stroke-linecap="round" opacity=".25"/>
<g transform="translate(372 170)"><path d="M18 76q4-30-2-46" stroke="${INK}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M18 76q4-30-2-46" stroke="#7a5236" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M-12 30q-10-26 18-30 8-16 26-6 22-4 22 18 10 18-14 24-14 10-30 4-20 4-22-10z" fill="${tree}" ${S}/><circle cx="6" cy="16" r="3" fill="${INK}" opacity=".35"/><circle cx="28" cy="10" r="3" fill="${INK}" opacity=".35"/><circle cx="36" cy="28" r="3" fill="${INK}" opacity=".35"/></g>
${lamb(262, 218, 0.9)}
<svg x="118" y="${night ? 58 : 66}" width="146" height="${night ? 214 : 212}" viewBox="${box}">${person}</svg>
</svg>`;
}
