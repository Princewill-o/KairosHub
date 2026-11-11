// Low-poly, ink-outlined map art shared by the in-world maps and the Grace browser.
// Faceted terrain (jittered triangles), black ink outlines where land meets water,
// roads or buildings, raised buildings with faceted roofs and hard shadows, and
// pill labels with an ink border — the same look as the world's 3D renderer.

export const INK = "#120c18";
const BASE = { water: "#46a6cf", deep: "#2f86b4", road: "#545866", pave: "#ebe1c9", path: "#dcc69a", grass: "#8dc46a", wall: "#cbbfa7", floor: "#e6d9bd", furn: "#c9a874", bldg: "#e4d8c3", mountain: "#9a98a2", soil: "#a98f6f" };
const ROOFS = ["#c8644e", "#6b4598", "#3f7d8c", "#d9a441", "#7d8a99", "#b0573f", "#4f7d4a"];

const classOf = (ch, indoor) => {
  if (ch === "w") return "water";
  if (ch === "=" || ch === ":") return "road";
  if (ch === "-" || ch === "e") return "pave";
  if (ch === "_") return "path";
  if (ch === "X") return "bldg";
  if (ch === "T") return "tree";
  if (ch === "g" || ch === "f") return "grass";
  if (ch === "k") return "mountain";
  if ("#WG|".includes(ch)) return "wall";
  if (".,ml".includes(ch)) return indoor ? "floor" : "pave";
  return indoor ? "furn" : "grass";
};
// Which classes count as one region for ink outlines.
const outlineGroup = (c) => (c === "tree" ? "grass" : c === "furn" ? "furnish" : c);

const hash = (x, y, k = 0) => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/**
 * Paint a world map at S pixels per tile.
 * map: { tiles: string[], cols, rows, structures?, kind? }
 * opts: { labels?: boolean, frame?: boolean, buildings?: {x,y,w,h,label?,accent?}[] }
 */
export function paintLowPolyMap(ctx, map, S, opts = {}) {
  const { tiles, cols, rows } = map;
  const indoor = !!map.kind && !["city", "campus", "woodland", "station"].includes(map.kind) && !map.island;
  const cls = tiles.map((row) => Array.from(row, (ch) => classOf(ch, indoor)));
  const at = (x, y) => cls[Math.max(0, Math.min(rows - 1, y))][Math.max(0, Math.min(cols - 1, x))];
  // Lattice vertices: jitter only where all four touching tiles are open terrain.
  const soft = (c) => c === "water" || c === "grass" || c === "tree" || c === "mountain";
  const vx = (i, j) => {
    const a = at(i - 1, j - 1), b = at(i, j - 1), c = at(i - 1, j), d = at(i, j);
    const ok = i > 0 && j > 0 && i < cols && j < rows && soft(a) && soft(b) && soft(c) && soft(d) && outlineGroup(a) === outlineGroup(d) && outlineGroup(b) === outlineGroup(c) && outlineGroup(a) === outlineGroup(b);
    return ok ? [(i + (hash(i, j, 1) - 0.5) * 0.55) * S, (j + (hash(i, j, 2) - 0.5) * 0.55) * S] : [i * S, j * S];
  };
  const V = [];
  for (let j = 0; j <= rows; j++) { V.push([]); for (let i = 0; i <= cols; i++) V[j].push(vx(i, j)); }
  const tri = (a, b, c, fill) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = fill; ctx.lineWidth = 0.6; ctx.stroke(); };
  // 1. Faceted ground.
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let c = cls[y][x];
    const base = c === "water" ? (hash(x >> 2, y >> 2, 9) > 0.55 ? BASE.deep : BASE.water) : BASE[c === "tree" ? "grass" : c] ?? BASE.grass;
    const p00 = V[y][x], p10 = V[y][x + 1], p01 = V[y + 1][x], p11 = V[y + 1][x + 1];
    const flip = hash(x, y, 3) > 0.5;
    const j1 = (hash(x, y, 4) - 0.5) * (c === "road" || c === "pave" || c === "floor" ? 0.05 : 0.16);
    const j2 = (hash(x, y, 5) - 0.5) * (c === "road" || c === "pave" || c === "floor" ? 0.05 : 0.16) - 0.04;
    if (flip) { tri(p00, p10, p11, shade(base, j1)); tri(p00, p11, p01, shade(base, j2)); }
    else { tri(p00, p10, p01, shade(base, j1)); tri(p10, p11, p01, shade(base, j2)); }
  }
  // 2. Road markings.
  if (S >= 5) {
    ctx.fillStyle = "rgba(255,255,255,.75)";
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (tiles[y][x] === ":" && (x + y) % 2 === 0) ctx.fillRect(x * S + S * 0.2, y * S + S * 0.45, S * 0.6, Math.max(1, S * 0.1));
  }
  // 3. Ink outlines along region boundaries (shorelines heavier).
  const ink = (w, test) => {
    ctx.beginPath();
    for (let y = 0; y <= rows; y++) for (let x = 0; x < cols; x++) {
      const a = y > 0 ? outlineGroup(cls[y - 1][x]) : null, b = y < rows ? outlineGroup(cls[y][x]) : null;
      if (a && b && a !== b && test(a, b)) { ctx.moveTo(V[y][x][0], V[y][x][1]); ctx.lineTo(V[y][x + 1][0], V[y][x + 1][1]); }
    }
    for (let x = 0; x <= cols; x++) for (let y = 0; y < rows; y++) {
      const a = x > 0 ? outlineGroup(cls[y][x - 1]) : null, b = x < cols ? outlineGroup(cls[y][x]) : null;
      if (a && b && a !== b && test(a, b)) { ctx.moveTo(V[y][x][0], V[y][x][1]); ctx.lineTo(V[y + 1][x][0], V[y + 1][x][1]); }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  };
  const isWater = (a, b) => a === "water" || b === "water";
  ink(Math.max(1, S * 0.12), (a, b) => !isWater(a, b) && a !== "bldg" && b !== "bldg");
  ink(Math.max(1.4, S * 0.22), isWater);
  // 4. Buildings: raised blocks with faceted roofs, a shaded wall and a hard shadow.
  const seen = new Set(), blocks = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (cls[y][x] !== "bldg" || seen.has(y * cols + x)) continue;
    let x1 = x; while (x1 + 1 < cols && cls[y][x1 + 1] === "bldg" && !seen.has(y * cols + x1 + 1)) x1++;
    let y1 = y; const rowOk = (yy) => { for (let xx = x; xx <= x1; xx++) if (cls[yy]?.[xx] !== "bldg" || seen.has(yy * cols + xx)) return false; return true; };
    while (y1 + 1 < rows && rowOk(y1 + 1)) y1++;
    for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) seen.add(yy * cols + xx);
    blocks.push({ x, y, w: x1 - x + 1, h: y1 - y + 1 });
  }
  for (const b of opts.buildings ?? []) blocks.push({ ...b, given: true });
  const structures = map.structures ?? [];
  for (const b of blocks) {
    const st = structures.find((s) => s.x <= b.x + b.w / 2 && s.x + s.w >= b.x + b.w / 2 && s.y <= b.y + b.h / 2 && s.y + s.h >= b.y + b.h / 2);
    const roofBase = b.accent ?? st?.accent ?? ROOFS[Math.floor(hash(b.x, b.y, 7) * ROOFS.length)];
    const bx = (b.x + 0.08) * S, by = (b.y + 0.08) * S, bw = (b.w - 0.16) * S, bh = (b.h - 0.16) * S;
    const lift = Math.min(S * 1.1, bh * 0.4);
    ctx.fillStyle = "rgba(18,12,24,.28)"; ctx.fillRect(bx + S * 0.35, by + S * 0.3, bw, bh);       // hard shadow
    ctx.fillStyle = shade(BASE.wall, -0.18); ctx.fillRect(bx, by + bh - lift, bw, lift);              // south wall
    if (S >= 6 && bw > S * 1.5) { ctx.fillStyle = "#2a3550"; for (let wx = bx + S * 0.4; wx < bx + bw - S * 0.5; wx += S * 0.9) ctx.fillRect(wx, by + bh - lift * 0.7, S * 0.35, lift * 0.4); }
    const top = by - lift * 0.15, rh = bh - lift * 0.85;
    ctx.fillStyle = shade(roofBase, 0.08); ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx + bw, top); ctx.lineTo(bx + bw, top + rh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(roofBase, -0.12); ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx + bw, top + rh); ctx.lineTo(bx, top + rh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.2, S * 0.16); ctx.lineJoin = "round";
    ctx.strokeRect(bx, top, bw, rh); ctx.strokeRect(bx, top + rh, bw, by + bh - (top + rh));
    ctx.lineWidth = Math.max(0.6, S * 0.06); ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx + bw, top + rh); ctx.stroke();
    b.labelAt = { x: bx + bw / 2, y: top + rh / 2, text: b.label ?? st?.label };
  }
  // 5. Low-poly pines.
  if (S >= 3) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (tiles[y][x] !== "T") continue;
    const cx = (x + 0.5) * S, cy = (y + 0.5) * S, r = S * (0.42 + hash(x, y, 6) * 0.14);
    ctx.fillStyle = "#2f7d4f"; ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.3); ctx.lineTo(cx - r, cy + r * 0.7); ctx.lineTo(cx, cy + r * 0.7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#23603f"; ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.3); ctx.lineTo(cx + r, cy + r * 0.7); ctx.lineTo(cx, cy + r * 0.7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(0.8, S * 0.09); ctx.beginPath(); ctx.moveTo(cx, cy - r * 1.3); ctx.lineTo(cx - r, cy + r * 0.7); ctx.lineTo(cx + r, cy + r * 0.7); ctx.closePath(); ctx.stroke();
  }
  // 6. Ink-bordered labels.
  if (opts.labels && S >= 5) {
    ctx.font = `800 ${Math.max(10, Math.round(S * 1.05))}px system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const b of blocks) if (b.labelAt?.text) pill(ctx, b.labelAt.x, b.labelAt.y, b.labelAt.text, S);
  }
  if (opts.frame !== false) { ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, S * 0.35); ctx.strokeRect(0, 0, cols * S, rows * S); }
}

/** A white label pill with an ink border and hard shadow. */
export function pill(ctx, x, y, text, S = 10, fill = "#fff8ec") {
  const w = ctx.measureText(text).width + S * 1.2, h = Math.max(14, S * 1.6);
  const r = h / 2;
  const path = () => { ctx.beginPath(); ctx.moveTo(x - w / 2 + r, y - h / 2); ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r); ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r); ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r); ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r); ctx.closePath(); };
  ctx.save(); ctx.translate(2, 2); path(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK; ctx.fillText(text, x, y + 1);
}

/* ── SVG: the island atlas in the same style ─────────────────────────────── */

const facets = (seed, rx, ry, n = 11) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2, k = 0.82 + hash(seed, i, 11) * 0.3;
  return [Math.cos(a) * rx * k, Math.sin(a) * ry * k];
});
const pts = (list, dy = 0) => list.map(([x, y]) => `${x.toFixed(1)},${(y + dy).toFixed(1)}`).join(" ");

/** A faceted sea for a w × h atlas, with an ink frame. */
export function lowPolySeaSVG(w, h, id = "lp") {
  const cell = 52, tris = [];
  const P = (i, j) => [i * cell + (i > 0 && i < Math.ceil(w / cell) ? (hash(i, j, 21) - 0.5) * 26 : 0), j * cell + (j > 0 && j < Math.ceil(h / cell) ? (hash(i, j, 22) - 0.5) * 26 : 0)];
  for (let j = 0; j < Math.ceil(h / cell); j++) for (let i = 0; i < Math.ceil(w / cell); i++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i, j + 1), d = P(i + 1, j + 1);
    const col = (k) => shade(hash(i, j, 23) > 0.6 ? BASE.deep : BASE.water, (hash(i, j, k) - 0.5) * 0.18);
    tris.push(`<polygon points="${pts([a, b, d])}" fill="${col(24)}"/><polygon points="${pts([a, d, c])}" fill="${col(25)}"/>`);
  }
  return `<clipPath id="${id}-clip"><rect width="${w}" height="${h}" rx="22"/></clipPath><g clip-path="url(#${id}-clip)" stroke="rgba(255,255,255,.06)" stroke-width="1">${tris.join("")}</g><rect width="${w}" height="${h}" rx="22" fill="none" stroke="${INK}" stroke-width="5"/>`;
}

const LANDMARK = {
  woodland: (s) => `${pine(-44, -6, 1, s)}${pine(40, -12, 1.2, s)}${pine(-18, -24, 0.8, s)}${house(4, -4, "#d3c6a9", true)}${pine(52, 10, 0.8, s)}`,
  "scripture-island": () => `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"><polygon points="-34,2 -3,-12 -3,22 -34,36" fill="#fff4ce"/><polygon points="-3,-12 30,2 30,36 -3,22" fill="#f1dfa6"/><path d="M-3-12V22" fill="none"/></g><path d="M-1-34v16m-7-10h14" stroke="#f5b83d" stroke-width="4" stroke-linecap="round"/>`,
  "orchard-island": (s) => [-44, -16, 16, 44].map((x, i) => `<g transform="translate(${x} ${i % 2 ? -10 : 4})" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"><path d="M0 0v16" stroke-width="4"/><polygon points="0,-26 -14,-6 0,2" fill="#7fb35f"/><polygon points="0,-26 14,-6 0,2" fill="#5f9548"/><circle cx="-4" cy="-10" r="2.6" fill="#f2c25a" stroke-width="1.2"/></g>`).join(""),
  "fellowship-island": () => `${house(-6, -6, "#7755aa")}<g stroke="${INK}" stroke-width="2.2"><path d="M30 18h26" stroke-width="4"/><polygon points="34,6 52,6 56,16 30,16" fill="#f5b83d"/></g>`,
  city: () => `${house(-26, -4, "#c8644e")}${house(10, -10, "#6b4598")}<g stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"><rect x="26" y="10" width="26" height="15" rx="3" fill="#c8322d"/><circle cx="31" cy="27" r="3.4" fill="${INK}"/><circle cx="47" cy="27" r="3.4" fill="${INK}"/><rect x="29" y="13" width="20" height="5" fill="#d7ecf6" stroke-width="1.5"/></g>`,
};
function pine(x, y, k, s) { return `<g transform="translate(${x} ${y}) scale(${k})" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"><path d="M0 4v10" stroke-width="4"/><polygon points="0,-26 -14,6 0,6" fill="#2f7d4f"/><polygon points="0,-26 14,6 0,6" fill="#23603f"/></g>`; }
function house(x, y, roof, church = false) {
  return `<g transform="translate(${x} ${y})" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"><polygon points="-16,0 0,8 0,30 -16,22" fill="#efe4cc"/><polygon points="0,8 18,0 18,22 0,30" fill="#cbbd9f"/><polygon points="-19,-1 -1,-16 21,-1 0,9" fill="${roof}"/><path d="M-1-16 0 9" stroke-width="1.4"/>${church ? `<path d="M1-30v14m-6-9h12" stroke="#f5b83d" stroke-width="3.5"/>` : `<rect x="4" y="16" width="6" height="10" fill="${INK}" stroke-width="1"/>`}</g>`;
}

/** One faceted island with ink outline, cliff band, hard shadow and its landmark. */
export function lowPolyIslandSVG({ id, colour, seed = 1, active = false }) {
  const top = facets(seed, 92, 52);
  const facetsTop = top.map((p, i) => { const q = top[(i + 1) % top.length]; return `<polygon points="0,-4 ${pts([p, q])}" fill="${shade(colour, (hash(seed, i, 31) - 0.5) * 0.22)}"/>`; }).join("");
  return `<g><polygon points="${pts(top, 22)}" fill="${INK}" opacity=".35" transform="translate(7 6)"/>`
    + `<polygon points="${pts(top, 14)}" fill="#8a7a5c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    + `<g stroke="${INK}" stroke-width="1" stroke-opacity=".25">${facetsTop}</g>`
    + `<polygon points="${pts(top)}" fill="none" stroke="${active ? "#f5b83d" : INK}" stroke-width="${active ? 7 : 4.5}" stroke-linejoin="round"/>`
    + (active ? `<polygon points="${pts(top)}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` : "")
    + (LANDMARK[id] ?? LANDMARK.city)(seed) + `</g>`;
}

/** The dashed Grace Line route with an ink edge. */
export function lowPolyRouteSVG(d) {
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" opacity=".55"/><path d="${d}" fill="none" stroke="#fff3c4" stroke-width="4.5" stroke-dasharray="10 9" stroke-linecap="round"/>`;
}
/** A label pill in SVG. */
export function lowPolyLabelSVG(x, y, text, { active = false } = {}) {
  const w = text.length * 7.4 + 26;
  return `<g transform="translate(${x} ${y})"><rect x="${-w / 2 + 3}" y="-11" width="${w}" height="24" rx="12" fill="${INK}"/><rect x="${-w / 2}" y="-14" width="${w}" height="24" rx="12" fill="${active ? "#f5b83d" : "#fff8ec"}" stroke="${INK}" stroke-width="2.5"/><text text-anchor="middle" y="3" font-size="12" font-weight="900" fill="${INK}" font-family="system-ui, sans-serif">${text}</text></g>`;
}

/** A faceted ground plate (an island seen from above) with an ink edge. */
export function lowPolyPlanSVG(w, h, colour = "#8dc46a") {
  const cell = 46, tris = [];
  const P = (i, j) => [20 + i * cell + (i > 0 && i < Math.ceil((w - 40) / cell) ? (hash(i, j, 41) - 0.5) * 22 : 0), 20 + j * cell + (j > 0 && j < Math.ceil((h - 40) / cell) ? (hash(i, j, 42) - 0.5) * 22 : 0)];
  for (let j = 0; j < Math.ceil((h - 40) / cell); j++) for (let i = 0; i < Math.ceil((w - 40) / cell); i++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i, j + 1), d = P(i + 1, j + 1);
    tris.push(`<polygon points="${pts([a, b, d])}" fill="${shade(colour, (hash(i, j, 43) - 0.5) * 0.2)}"/><polygon points="${pts([a, d, c])}" fill="${shade(colour, (hash(i, j, 44) - 0.5) * 0.2 - 0.05)}"/>`);
  }
  return `<rect x="26" y="28" width="${w - 40}" height="${h - 40}" rx="34" fill="${INK}"/><clipPath id="plan-clip"><rect x="20" y="20" width="${w - 40}" height="${h - 40}" rx="34"/></clipPath><g clip-path="url(#plan-clip)">${tris.join("")}</g><rect x="20" y="20" width="${w - 40}" height="${h - 40}" rx="34" fill="none" stroke="${INK}" stroke-width="5"/>`;
}
/** A raised low-poly building block with a faceted roof, ink outline and label. */
export function lowPolyBlockSVG(x, y, w, h, roof, label = "") {
  const lift = Math.min(12, h * 0.35);
  return `<g stroke="${INK}" stroke-linejoin="round"><rect x="${x + 5}" y="${y + 5}" width="${w}" height="${h}" fill="${INK}" opacity=".35" stroke="none"/>`
    + `<rect x="${x}" y="${y + h - lift}" width="${w}" height="${lift}" fill="${shade(roof, -0.35)}" stroke-width="2.5"/>`
    + `<polygon points="${x},${y - lift * 0.3} ${x + w},${y - lift * 0.3} ${x + w},${y + h - lift}" fill="${shade(roof, 0.08)}" stroke="none"/><polygon points="${x},${y - lift * 0.3} ${x + w},${y + h - lift} ${x},${y + h - lift}" fill="${shade(roof, -0.12)}" stroke="none"/>`
    + `<rect x="${x}" y="${y - lift * 0.3}" width="${w}" height="${h - lift * 0.7}" fill="none" stroke-width="3"/></g>`
    + (label ? `<text x="${x + w / 2}" y="${y + (h - lift) / 2 + 4}" text-anchor="middle" fill="#fff" font-size="${label.length > 3 ? 11 : 15}" font-weight="900" font-family="system-ui, sans-serif" paint-order="stroke" stroke="${INK}" stroke-width="3">${label}</text>` : "");
}
