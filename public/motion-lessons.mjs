// Kairos motion lessons: short low-poly motion graphics, each paired with a
// Kharis sermon excerpt. Every frame is a pure function of time, so the same
// drawLesson() renders the in-game full-screen lesson, the page players and
// the exported MP4 loops.

export const LESSON_SECONDS = 12;
export const INK = "#17151f";
export const PAPER = "#f3ecdf";
export const ACCENT = "#7c3aed";

const sermon = (video, start, title) => ({ video, start, end: start + 60, title });

export const LESSONS = [
  { id: "grace", kicker: "Lesson · Grace", title: "Saved by grace, not by trying", ref: "Ephesians 2:8", verse: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.", emblem: "cross", categories: ["spiritual"], sermon: sermon("hjhIW911Z44", 561, "Life In Christ") },
  { id: "temptation", kicker: "Lesson · Temptation", title: "There is always a way out", ref: "1 Corinthians 10:13", verse: "God is faithful, who will not suffer you to be tempted above that ye are able.", emblem: "door", categories: ["temptation"], sermon: sermon("eEQyhPZPpxU", 436, "Overcoming Guilt From Sin") },
  { id: "prayer", kicker: "Lesson · Prayer", title: "Bring it to God first", ref: "Philippians 4:6", verse: "Be careful for nothing; but in every thing by prayer and supplication let your requests be made known unto God.", emblem: "flame", categories: ["faith"], sermon: sermon("I4cQ6D2ERuo", 2065, "Faith In Prayer") },
  { id: "body", kicker: "Lesson · Your body", title: "Your body is a temple", ref: "1 Corinthians 6:19", verse: "Know ye not that your body is the temple of the Holy Ghost which is in you?", emblem: "temple", categories: ["health"], sermon: sermon("Ql6DuJReaC4", 2037, "Living According To God") },
  { id: "suffering", kicker: "Lesson · Hard seasons", title: "He is with you in the storm", ref: "Isaiah 43:2", verse: "When thou passest through the waters, I will be with thee.", emblem: "wave", categories: ["family", "loss"], sermon: sermon("IRl718MrEOg", 1968, "How Christians Should Handle Suffering") },
  { id: "time", kicker: "Lesson · Time", title: "Redeem the time", ref: "Ephesians 5:16", verse: "Redeeming the time, because the days are evil.", emblem: "hourglass", categories: ["work", "money"], sermon: sermon("06xvxw5ePKs", 2573, "The Best Use Of Your Time") },
  { id: "rest", kicker: "Lesson · Rest", title: "Come and find rest", ref: "Matthew 11:28", verse: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", emblem: "wave", categories: ["mind"], sermon: sermon("cyKzgs5EPeg", 3338, "How To Enter God's Rest") },
  { id: "word", kicker: "Lesson · The Word", title: "A lamp for every step", ref: "Psalm 119:105", verse: "Thy word is a lamp unto my feet, and a light unto my path.", emblem: "book", categories: ["school"], sermon: sermon("WjWDkhQvZtM", 954, "How To Study The Bible") },
  { id: "worship", kicker: "Lesson · Worship", title: "Worship in spirit and truth", ref: "John 4:24", verse: "God is a Spirit: and they that worship him must worship him in spirit and in truth.", emblem: "flame", categories: ["church"], sermon: sermon("IHoQutb7FHg", 1731, "The True Worshipper") },
  { id: "follow-up", kicker: "Lesson · Follow-up", title: "Go back and see how they are", ref: "Acts 15:36", verse: "Let us go again and visit our brethren in every city where we have preached the word.", emblem: "heart", categories: ["relationships", "evangelism", "friends"], sermon: sermon("IW6HGtwJliU", 524, "What Makes You A Better Christian") },
];

export const lessonById = (id) => LESSONS.find((l) => l.id === id) ?? null;
export const lessonFor = (category) => LESSONS.find((l) => l.categories.includes(category)) ?? null;
export const sermonEmbed = (s) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(s.video)}?start=${s.start}&end=${s.end}&autoplay=1&rel=0&playsinline=1&modestbranding=1`;
export const sermonLink = (s) => `https://www.youtube.com/watch?v=${encodeURIComponent(s.video)}&t=${s.start}s`;

// ---- easing (claude-motion curves) ----
const bez = (x1, y1, x2, y2) => (x) => {
  if (x <= 0) return 0; if (x >= 1) return 1;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
    const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    if (Math.abs(d) < 1e-6) break;
    t = Math.min(1, Math.max(0, t - cx / d));
  }
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
};
export const ease = { out: bez(0.16, 1, 0.3, 1), in: bez(0.6, 0, 0.9, 0.35), inOut: bez(0.65, 0, 0.35, 1), over: bez(0.55, 0, 0.2, 1.12) };
const clamp = (v) => Math.max(0, Math.min(1, v));
const prog = (t, start, dur) => clamp((t - start) / dur);
/** Damped spring, stiffness 200 / damping 10 ("pop"). */
const spring = (t) => (t <= 0 ? 0 : 1 - Math.exp(-6.5 * t) * Math.cos(11 * t));
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

// ---- low-poly emblems: convex pieces, fanned into faceted triangles ----
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const circle = (cx, cy, r, n = 7) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2 - Math.PI / 2) * r, cy + Math.sin((i / n) * Math.PI * 2 - Math.PI / 2) * r]);
const EMBLEMS = {
  cross: [rect(-0.14, -0.62, 0.28, 1.24), rect(-0.46, -0.32, 0.92, 0.26)],
  door: [rect(-0.38, -0.58, 0.76, 1.16), [[-0.2, -0.42], [0.42, -0.5], [0.42, 0.62], [-0.2, 0.5]]],
  flame: [[[0, -0.66], [0.3, -0.18], [0.38, 0.24], [0.2, 0.52], [-0.2, 0.52], [-0.38, 0.24], [-0.3, -0.18]], [[0, -0.12], [0.16, 0.18], [0.12, 0.42], [-0.12, 0.42], [-0.16, 0.18]]],
  temple: [[[-0.6, -0.22], [0, -0.62], [0.6, -0.22]], rect(-0.5, -0.18, 0.18, 0.66), rect(-0.09, -0.18, 0.18, 0.66), rect(0.32, -0.18, 0.18, 0.66), rect(-0.62, 0.5, 1.24, 0.14)],
  wave: [[[-0.66, 0.1], [-0.3, -0.34], [0.02, -0.08], [0.02, 0.5], [-0.66, 0.5]], [[0.02, -0.08], [0.32, -0.44], [0.66, -0.06], [0.66, 0.5], [0.02, 0.5]]],
  hourglass: [rect(-0.46, -0.64, 0.92, 0.12), [[-0.36, -0.52], [0.36, -0.52], [0, 0]], [[0, 0], [0.36, 0.52], [-0.36, 0.52]], rect(-0.46, 0.52, 0.92, 0.12)],
  book: [[[-0.64, -0.38], [-0.04, -0.28], [-0.04, 0.52], [-0.64, 0.42]], [[0.04, -0.28], [0.64, -0.38], [0.64, 0.42], [0.04, 0.52]]],
  heart: [circle(-0.26, -0.2, 0.3), circle(0.26, -0.2, 0.3), [[-0.54, -0.08], [0.54, -0.08], [0, 0.58]]],
};
function facets(name) {
  const tris = [];
  for (const poly of EMBLEMS[name] ?? EMBLEMS.cross) {
    const c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
    for (let i = 0; i < poly.length; i++) tris.push([c, poly[i], poly[(i + 1) % poly.length]]);
  }
  return tris;
}
const SHADES = ["#7c3aed", "#6d28d9", "#8b5cf6", "#a78bfa", "#5b21b6", "#9061f9"];

function drawEmblem(ctx, lesson, t, cx, cy, size) {
  const tris = facets(lesson.emblem);
  // Hard shadow first, then the facets assemble with a staggered pop.
  const appear = (i) => spring(Math.max(0, t - 1.4 - i * 0.045));
  const exit = ease.in(prog(t, 11.1, 0.6));
  ctx.save();
  ctx.translate(cx, cy + Math.sin(t * 1.3) * size * 0.012);
  ctx.rotate(Math.sin(t * 0.6) * 0.03);
  tris.forEach((tri, i) => {
    const a = appear(i) * (1 - exit);
    if (a <= 0.001) return;
    const c = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3];
    const from = 1 - a;
    const path = () => {
      ctx.beginPath();
      tri.forEach(([x, y], k) => {
        const px = (c[0] + (x - c[0]) * a + c[0] * from * 0.9) * size;
        const py = (c[1] + (y - c[1]) * a + c[1] * from * 0.9 + from * 0.5) * size;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.closePath();
    };
    ctx.save(); ctx.translate(size * 0.05, size * 0.05); path(); ctx.fillStyle = "rgba(23,21,31,.9)"; ctx.fill(); ctx.restore();
    path();
    ctx.fillStyle = SHADES[Math.floor(hash(i + 3) * SHADES.length)];
    ctx.fill();
    ctx.lineJoin = "round"; ctx.lineWidth = Math.max(2, size * 0.018); ctx.strokeStyle = INK; ctx.stroke();
  });
  // A single glint sweeps across once the emblem lands: the hero moment.
  const g = prog(t, 3.4, 1.1);
  if (g > 0 && g < 1 && exit === 0) {
    ctx.globalCompositeOperation = "source-atop";
    const x = (-0.9 + g * 1.8) * size;
    const grad = ctx.createLinearGradient(x - size * 0.2, 0, x + size * 0.2, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)"); grad.addColorStop(0.5, "rgba(255,255,255,.55)"); grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad; ctx.fillRect(-size, -size, size * 2, size * 2);
  }
  ctx.restore();
}

function wrap(ctx, text, max) {
  const lines = []; let line = "";
  for (const w of text.split(" ")) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > max && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Word-by-word masked reveal: each word rises out of a mask, 0.09 s apart. */
function revealWords(ctx, lines, x, y, lh, start, t, exitT, color, stagger = 0.09) {
  let n = 0;
  lines.forEach((line, li) => {
    let cx = x;
    for (const word of line.split(" ")) {
      const p = ease.out(prog(t, start + n * stagger, 0.8));
      const out = ease.in(prog(t, exitT + n * 0.012, 0.4));
      const w = ctx.measureText(`${word} `).width;
      if (p > 0) {
        ctx.save();
        ctx.beginPath(); ctx.rect(cx - 4, y + li * lh - lh * 0.9, w + 8, lh * 1.12); ctx.clip();
        ctx.globalAlpha = 1 - out;
        ctx.fillStyle = color;
        ctx.fillText(word, cx, y + li * lh + (1 - p) * lh * 0.9 - out * lh * 0.4);
        ctx.restore();
      }
      cx += w; n++;
    }
  });
  return n;
}

function pill(ctx, text, x, y, h, bg, fg) {
  const w = ctx.measureText(text).width + h * 1.1;
  ctx.beginPath(); ctx.roundRect(x + 4, y + 4, w, h, h / 2); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = fg; ctx.fillText(text, x + h * 0.55, y + h * 0.68);
  return w;
}

/**
 * Draw one frame. `t` is seconds into the lesson; it loops every
 * LESSON_SECONDS. Nothing here reads a clock or keeps state.
 */
export function drawLesson(ctx, lesson, time, w, h, { loop = true } = {}) {
  const t = loop ? ((time % LESSON_SECONDS) + LESSON_SECONDS) % LESSON_SECONDS : Math.min(time, LESSON_SECONDS - 0.0001);
  const u = Math.min(w, h * 1.6) / 1280; // design unit on a 1280 × 800 stage
  const pad = 60 * u;
  ctx.save();
  ctx.textBaseline = "alphabetic";
  // Paper background with a slowly drifting dot grid.
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  const gap = 34 * u, drift = (t * 6 * u) % gap;
  ctx.fillStyle = "rgba(23,21,31,.11)";
  for (let y = -gap + drift; y < h + gap; y += gap) for (let x = -gap + drift * 0.6; x < w + gap; x += gap) { ctx.beginPath(); ctx.arc(x, y, 1.6 * u, 0, Math.PI * 2); ctx.fill(); }
  // Faceted low-poly hills along the bottom: a ridge line split into triangles.
  ctx.save();
  const base = h * 0.84, n = 9;
  const ridge = Array.from({ length: n + 1 }, (_, i) => [(i / n) * w, base - (hash(i + 21) * 70 + 18) * u]);
  for (let i = 0; i < n; i++) {
    const [a, b] = [ridge[i], ridge[i + 1]];
    const mid = [(a[0] + b[0]) / 2, h];
    for (const [tri, k] of [[[a, b, mid], 0], [[a, mid, [a[0], h]], 1], [[b, [b[0], h], mid], 2]]) {
      ctx.beginPath(); tri.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.fillStyle = ["#e3d6be", "#d8c9ac", "#cfbf9f"][(k + i) % 3]; ctx.fill();
      ctx.lineJoin = "round"; ctx.lineWidth = 2 * u; ctx.strokeStyle = "rgba(23,21,31,.4)"; ctx.stroke();
    }
  }
  ctx.beginPath(); ridge.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineWidth = 3 * u; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();

  const wide = w / h > 1.15;
  const textX = pad, textW = wide ? w * 0.52 : w - pad * 2;
  const emblemSize = wide ? Math.min(h * 0.34, w * 0.2) : Math.min(w * 0.3, h * 0.17);
  const ecx = wide ? w * 0.77 : w / 2, ecy = wide ? h * 0.45 : h * 0.24;
  // Soft accent halo behind the emblem breathes in once it lands.
  const halo = ease.out(prog(t, 1.2, 1.2)) * (1 - ease.in(prog(t, 11.1, 0.6)));
  if (halo > 0) {
    ctx.beginPath(); ctx.arc(ecx, ecy, emblemSize * (0.82 + Math.sin(t * 1.4) * 0.02) * halo, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(124,58,237,.12)"; ctx.fill();
    ctx.setLineDash([6 * u, 10 * u]); ctx.lineDashOffset = -t * 20 * u; ctx.lineWidth = 2 * u; ctx.strokeStyle = "rgba(124,58,237,.45)"; ctx.stroke(); ctx.setLineDash([]);
  }
  drawEmblem(ctx, lesson, t, ecx, ecy, emblemSize);

  // Kicker types on at 0.035 s per character.
  const kick = lesson.kicker.toUpperCase();
  const typed = kick.slice(0, Math.floor(prog(t, 0.2, kick.length * 0.035) * kick.length));
  const exitAll = ease.in(prog(t, 11.1, 0.5));
  ctx.globalAlpha = 1 - exitAll;
  ctx.font = `700 ${22 * u}px "DM Sans", system-ui, sans-serif`;
  ctx.fillStyle = ACCENT;
  const topY = wide ? h * 0.27 : h * 0.47;
  ctx.fillText(typed + (typed.length < kick.length && Math.floor(t * 8) % 2 ? "▍" : ""), textX, topY);
  ctx.globalAlpha = 1;

  // Title: the one big moment of type.
  const titleSize = (wide ? 64 : 54) * u;
  ctx.font = `800 ${titleSize}px Outfit, system-ui, sans-serif`;
  const titleLines = wrap(ctx, lesson.title, textW);
  const titleY = topY + titleSize * 1.25;
  revealWords(ctx, titleLines, textX, titleY, titleSize * 1.08, 0.7, t, 11.0, INK);
  // Accent underline draws on under the last line.
  const lastW = ctx.measureText(titleLines.at(-1)).width;
  const ul = ease.out(prog(t, 1.7, 0.9)) * (1 - exitAll);
  const ulY = titleY + (titleLines.length - 1) * titleSize * 1.08 + titleSize * 0.22;
  ctx.fillStyle = ACCENT; ctx.fillRect(textX, ulY, lastW * ul, 8 * u);

  // Verse: reading hold of at least 1 s plus 0.25 s per word.
  const verseSize = 30 * u;
  ctx.font = `500 ${verseSize}px "DM Sans", system-ui, sans-serif`;
  const verseLines = wrap(ctx, `“${lesson.verse}”`, textW);
  const verseY = ulY + verseSize * 2.4;
  const words = revealWords(ctx, verseLines, textX, verseY, verseSize * 1.4, 3.6, t, 10.9, "#2c2838", 0.06);

  // Reference pill, then the sermon line.
  const refT = ease.over(prog(t, 3.6 + words * 0.06 + 0.3, 0.6)) * (1 - exitAll);
  if (refT > 0) {
    ctx.save();
    const py = verseY + verseLines.length * verseSize * 1.4 + 6 * u;
    ctx.translate(textX, py); ctx.scale(Math.max(0.01, refT), Math.max(0.01, refT));
    ctx.font = `700 ${22 * u}px "DM Sans", system-ui, sans-serif`;
    const pw = pill(ctx, `${lesson.ref} · KJV`, 0, 0, 46 * u, "#fff8e8", INK);
    ctx.font = `600 ${20 * u}px "DM Sans", system-ui, sans-serif`;
    ctx.globalAlpha = ease.out(prog(t, 7.4, 0.6));
    ctx.fillStyle = "#4b4560";
    ctx.fillText(`›  Hear “${lesson.sermon.title}” · David Antwi`, pw + 18 * u, 30 * u);
    ctx.restore();
  }

  // Film grain (deterministic per frame) and a progress hairline.
  const frame = Math.floor(t * 24);
  ctx.fillStyle = "rgba(23,21,31,.09)";
  for (let i = 0; i < 260; i++) ctx.fillRect(hash(frame * 977 + i) * w, hash(frame * 331 + i * 7) * h, 1.4 * u, 1.4 * u);
  ctx.fillStyle = ACCENT; ctx.fillRect(0, h - 5 * u, (t / LESSON_SECONDS) * w, 5 * u);
  ctx.restore();
}

/**
 * Mount a full-screen lesson player into `host` (a DOM element). Returns a
 * close function. Used by the browser pages; the world has its own React
 * wrapper around drawLesson().
 */
export function openLessonPlayer(lesson, { onClose } = {}) {
  const el = document.createElement("div");
  el.className = "ml-player";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", `${lesson.title}, motion lesson`);
  el.innerHTML = `<canvas aria-hidden="true"></canvas><div class="ml-bar"><button type="button" class="ml-hear">Hear the message</button><a class="ml-yt" target="_blank" rel="noopener noreferrer" href="${sermonLink(lesson.sermon)}">Full sermon &rarr;</a><button type="button" class="ml-close" aria-label="Close lesson">✕</button></div><div class="ml-sermon" hidden></div>`;
  document.body.append(el);
  const canvas = el.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  let raf = 0; const t0 = performance.now();
  const frame = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = el.clientWidth, H = el.clientHeight;
    if (canvas.width !== Math.round(W * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLesson(ctx, lesson, (performance.now() - t0) / 1000, W, H);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  el.requestFullscreen?.().catch(() => {});
  const close = () => {
    cancelAnimationFrame(raf);
    if (document.fullscreenElement === el) document.exitFullscreen?.().catch(() => {});
    el.remove(); removeEventListener("keydown", key); onClose?.();
  };
  const key = (e) => { if (e.key === "Escape") close(); };
  addEventListener("keydown", key);
  el.querySelector(".ml-close").onclick = close;
  el.querySelector(".ml-hear").onclick = () => {
    const box = el.querySelector(".ml-sermon");
    box.hidden = false;
    box.innerHTML = `<iframe title="${lesson.sermon.title}, David Antwi" src="${sermonEmbed(lesson.sermon)}" allow="autoplay; encrypted-media; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  };
  return close;
}

/** A strip of looping lesson videos; clicking one opens it full screen. */
export function lessonStripHTML(ids = LESSONS.map((l) => l.id), heading = "Watch a lesson") {
  const cards = ids.map(lessonById).filter(Boolean).map((l) => `<button type="button" class="ml-card" data-lesson="${l.id}" aria-label="Play lesson: ${l.title}"><video src="/lessons/${l.id}.mp4" poster="/lessons/${l.id}.jpg" muted loop playsinline autoplay preload="none"></video><span class="ml-card-ref">${l.ref}</span><b>${l.title}</b></button>`).join("");
  return `<section class="ml-strip" aria-label="${heading}"><div class="ml-strip-head"><p class="lp-eyebrow">MOTION LESSONS · KHARIS SERMONS</p><h2>${heading}</h2></div><div class="ml-cards">${cards}</div></section>`;
}
export function wireLessonStrip(root) {
  root.querySelectorAll("[data-lesson]").forEach((b) => { b.onclick = () => { const l = lessonById(b.dataset.lesson); if (l) openLessonPlayer(l); }; });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) root.querySelectorAll(".ml-card video").forEach((v) => { v.autoplay = false; v.pause(); });
}
