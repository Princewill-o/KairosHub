"use client";
/**
 * Low-poly app icons and wallpaper: faceted triangle tiles with a bold dark
 * outline, generated as SVG so they stay crisp at any size and cost no images.
 */
import { useMemo } from "react";

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount)))),
  );
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function rand(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
function hash(text: string) {
  let h = 7;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h) + 1;
}

/** Triangulated facets across a w×h box, lit from the top-left. */
export function facets(w: number, h: number, base: string, seed: number, cols = 3, rows = 3, spread = 0.18) {
  const r = rand(seed);
  const pts: [number, number][][] = [];
  for (let j = 0; j <= rows; j++) {
    const row: [number, number][] = [];
    for (let i = 0; i <= cols; i++) {
      const edgeX = i === 0 || i === cols, edgeY = j === 0 || j === rows;
      row.push([
        (i / cols) * w + (edgeX ? 0 : (r() - 0.5) * (w / cols) * 0.7),
        (j / rows) * h + (edgeY ? 0 : (r() - 0.5) * (h / rows) * 0.7),
      ]);
    }
    pts.push(row);
  }
  const tris: { d: string; fill: string }[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
      for (const t of (i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]) {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3 / w, cy = (t[0][1] + t[1][1] + t[2][1]) / 3 / h;
        const light = 0.22 - (cx + cy) * 0.2 + (r() - 0.5) * spread;
        tris.push({ d: `M${t.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L")}Z`, fill: shade(base, light) });
      }
    }
  return tris;
}

const GLYPHS: Record<string, string> = {
  phone: "M18 14c2-2 5-2 6 0l3 4c1 2 0 3-1 4l-2 2c2 5 6 9 11 11l2-2c1-1 3-2 4-1l4 3c2 1 2 4 0 6l-3 3c-4 3-14-1-21-8S14 20 18 14z",
  chat: "M12 16c0-3 3-5 6-5h28c3 0 6 2 6 5v18c0 3-3 5-6 5H30l-10 8v-8h-2c-3 0-6-2-6-5z",
  pray: "M32 8c7 9 12 14 12 22a12 12 0 0 1-24 0c0-6 4-10 7-14 0 5 2 7 5 8-2-6-2-11 0-16zM24 42h16v12H24z",
  bible: "M16 12h26c3 0 5 2 5 5v33H21c-3 0-5-2-5-5zM16 45c0-3 2-5 5-5h26M30 18v16M24 24h12",
  tv: "M10 18h44v28H10zM26 52h12M32 46v6M28 25v14l12-7z",
  map: "M32 10c8 0 14 6 14 14 0 10-14 28-14 28S18 34 18 24c0-8 6-14 14-14zM32 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
  friends: "M24 30a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM42 30a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM10 50c0-9 6-15 14-15s14 6 14 15zM36 50c0-6-1-10-3-13 2-1 5-2 9-2 7 0 12 5 12 15z",
  compass: "M32 8a24 24 0 1 0 0 48 24 24 0 0 0 0-48zM40 24l-5 13-11 5 5-13z",
  games: "M14 24h36c4 0 7 4 7 9l-2 9c-1 5-7 6-10 2l-4-5H23l-4 5c-3 4-9 3-10-2l-2-9c0-5 3-9 7-9zM22 29v8M18 33h8M42 31h1M47 35h1",
  scroll: "M18 12h28v34c0 4-3 7-7 7H17c4 0 7-3 7-7V18c0-3-2-6-6-6zM30 22h10M30 30h10M30 38h6",
  shirt: "M22 12l-12 8 5 9 5-3v26h24V26l5 3 5-9-12-8c-1 4-5 6-10 6s-9-2-10-6z",
  calendar: "M12 16h40v36H12zM12 26h40M22 10v10M42 10v10M24 36h6v6h-6z",
  camera: "M10 22h10l4-6h16l4 6h10v28H10zM32 28a8 8 0 1 0 0 16 8 8 0 0 0 0-16z",
  gear: "M28 8h8l1 7 5 2 6-4 6 6-4 6 2 5 7 1v8l-7 1-2 5 4 6-6 6-6-4-5 2-1 7h-8l-1-7-5-2-6 4-6-6 4-6-2-5-7-1v-8l7-1 2-5-4-6 6-6 6 4 5-2zM32 26a6 6 0 1 0 0 12 6 6 0 0 0 0-12z",
  grace: "M40 14c-14-4-26 6-24 20 2 12 14 18 24 12l2-12H32",
  heart: "M32 52S10 38 10 24c0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 14-22 28-22 28z",
  cross: "M28 8h8v14h12v8H36v26h-8V30H16v-8h12z",
  chatworld: "M8 14h34v22H22l-8 7v-7H8zM46 24h10v20h-4v6l-6-6H30v-4",
  store: "M14 24h36l-3 28H17zM24 24v-4a8 8 0 0 1 16 0v4M26 34h12",
  book: "M12 14h18c2 0 2 2 2 2v36c0-2-2-3-4-3H12zM52 14H34c-2 0-2 2-2 2v36c0-2 2-3 4-3h16z",
  music: "M24 44V16l26-6v28M24 44a6 6 0 1 1-6-6 6 6 0 0 1 6 6zM50 38a6 6 0 1 1-6-6 6 6 0 0 1 6 6z",
  flame: "M32 8c8 10 14 16 14 26a14 14 0 0 1-28 0c0-7 4-11 8-15 0 6 2 8 6 9-2-7-2-13 0-20z",
  coin: "M32 10a22 22 0 1 0 0 44 22 22 0 0 0 0-44zM32 18v28M26 24h10a4 4 0 0 1 0 8h-8a4 4 0 0 0 0 8h10",
  run: "M36 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM30 22l-8 10 6 4 6-8 4 8-6 14h6l8-16-4-10zM20 50l8-12",
  wave: "M8 30c6-6 10-6 16 0s10 6 16 0 10-6 16 0v8c-6-6-10-6-16 0s-10 6-16 0-10-6-16 0z",
  pin: "M32 8c9 0 16 7 16 16 0 12-16 32-16 32S16 36 16 24c0-9 7-16 16-16zM32 18a6 6 0 1 0 0 12 6 6 0 0 0 0-12z",
  sun: "M32 20a12 12 0 1 0 0 24 12 12 0 0 0 0-24zM32 6v8M32 50v8M6 32h8M50 32h8M13 13l6 6M45 45l6 6M13 51l6-6M45 19l6-6",
  bus: "M14 12h36v34H14zM14 30h36M20 46v6M44 46v6M20 38h4M40 38h4",
  star: "M32 8l7 16 17 2-13 11 4 17-15-9-15 9 4-17L8 26l17-2z",
  home: "M8 32L32 12l24 20M14 28v24h14V40h8v12h14V28",
  gift: "M12 26h40v10H12zM16 36h32v18H16zM32 26v28M32 26c-6-10-16-8-12-2 2 2 8 2 12 2 4 0 10 0 12-2 4-6-6-8-12 2z",
};

export function LowPolyIcon({ name, glyph, color, size = 60, image }: { name: string; glyph: string; color: string; size?: number; image?: string }) {
  const tris = useMemo(() => facets(64, 64, color, hash(name)), [name, color]);
  const id = `lp-${hash(name)}`;
  return (
    <svg className="lp-icon" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect x="1.5" y="1.5" width="61" height="61" rx="15" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {tris.map((t, i) => <path key={i} d={t.d} fill={t.fill} stroke={t.fill} strokeWidth=".4" />)}
      </g>
      <rect x="1.5" y="1.5" width="61" height="61" rx="15" fill="none" stroke="#120c18" strokeWidth="3" />
      {image ? <image href={image} x="7" y="7" width="50" height="50" /> : <path d={GLYPHS[glyph] ?? GLYPHS.cross} fill="#fffaf0" stroke="#120c18" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  );
}

export function LowPolyWallpaper({ accent, seed = 3 }: { accent: string; seed?: number }) {
  const tris = useMemo(() => facets(390, 844, accent, seed, 6, 12, 0.32), [accent, seed]);
  return (
    <svg className="kp-wallpaper" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {tris.map((t, i) => <path key={i} d={t.d} fill={t.fill} stroke={t.fill} strokeWidth=".6" />)}
    </svg>
  );
}

const SKINS = ["#f2c9a0", "#d9a273", "#b97a4c", "#8d5634", "#6b3f25", "#e8b98d"];
const HAIRS = ["#1d1410", "#3b2416", "#6b4423", "#121212", "#7a2f1d", "#2a1a3a"];
/** Faceted portrait for conversations: head, hair, eyes and a mood-dependent mouth. */
export function LowPolyPortrait({ name, mood }: { name: string; mood: string }) {
  const h = hash(name);
  const skin = SKINS[h % SKINS.length], hair = HAIRS[(h >> 3) % HAIRS.length];
  const head = useMemo(() => facets(200, 220, skin, h, 4, 4, 0.14), [skin, h]);
  const mouth = mood === "hurt" ? "M82 168q18-12 36 0" : mood === "warm" ? "M78 160q22 22 44 0" : mood === "challenging" ? "M80 164h40" : "M82 162q18 10 36 0";
  const id = `pf-${h}`;
  return (
    <svg viewBox="0 0 200 240" className="km-portrait-svg" aria-hidden="true">
      <defs><clipPath id={id}><path d="M40 40L100 12L160 40L176 120L150 200L100 226L50 200L24 120Z" /></clipPath></defs>
      <path d="M30 240L50 196L100 214L150 196L170 240Z" fill="#5b3f99" stroke="#120c18" strokeWidth="5" strokeLinejoin="round" />
      <g clipPath={`url(#${id})`}>{head.map((t, i) => <path key={i} d={t.d} fill={t.fill} stroke={t.fill} strokeWidth=".6" />)}</g>
      <path d="M40 40L100 12L160 40L176 120L150 200L100 226L50 200L24 120Z" fill="none" stroke="#120c18" strokeWidth="6" strokeLinejoin="round" />
      <path d={h % 2 ? "M30 92L40 34L100 6L160 34L172 92L150 58L100 46L52 60Z" : "M26 120L34 38L100 4L166 38L176 120L160 70L100 52L42 70Z"} fill={hair} stroke="#120c18" strokeWidth="5" strokeLinejoin="round" />
      <path d="M62 112l18-6 6 14-20 2z M138 112l-18-6-6 14 20 2z" fill="#120c18" />
      <path d={mouth} fill="none" stroke="#120c18" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
