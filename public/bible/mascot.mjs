import {avatarSvg,createAvatarStore,normalizeAvatar} from '../avatar.mjs';
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
  const c=CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];return {...c,name:'Your explorer',avatar:createAvatarStore(accounts.active()?.id||'guest',undefined,{...c,hairColor:c.hairColor}).get()};
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

const blob = (circles, fill) =>
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="6"/>`).join("") +
  circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");


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
export function guide(pose='wave',opts={}){const c=typeof opts.character==='object'?opts.character:opts.character?CHARACTERS.find(c=>c.id===opts.character):currentCharacter();return avatarSvg(c?.avatar||c||{},pose,{...opts,cls: [opts.cls,'guide-'+(c?.id||'custom')].filter(Boolean).join(' ')});}
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
