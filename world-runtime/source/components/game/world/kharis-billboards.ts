import * as THREE from "three";

import { BILLBOARD_SPOTS, billboardContent, seasonFor, thumbnailUrl } from "@/game/core/kharis-media";

/**
 * Large roadside screens for London. Even boards play Kharis Church sermons
 * (thumbnail, title and a live progress bar); odd boards rotate church
 * announcements. Canvases redraw only when content changes or every few seconds.
 */
export function kharisBillboards(prepare: (o: THREE.Object3D) => void) {
  const group = new THREE.Group();
  group.name = "Kharis billboards";
  const season = seasonFor();
  const thumbs = new Map<string, HTMLImageElement | null>();
  const boards = BILLBOARD_SPOTS.map(([x, z], index) => {
    const board = new THREE.Group();
    const ink = new THREE.MeshLambertMaterial({ color: "#16121d" });
    const steel = new THREE.MeshLambertMaterial({ color: "#3a3644" });
    const accent = new THREE.MeshLambertMaterial({ color: season.accent });
    const post = (px: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.2, 0.22), steel);
      m.position.set(px, 1.6, -0.1);
      board.add(m);
    };
    post(-1.6); post(1.6);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.7, 2.85, 0.3), ink);
    frame.position.set(0, 4.25, 0);
    board.add(frame);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.16, 0.34), accent);
    strip.position.set(0, 2.82, 0);
    board.add(strip);
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 384;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.45, 2.6), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    screen.position.set(0, 4.25, 0.16);
    board.add(screen);
    board.position.set(x, 0, z);
    board.scale.setScalar(0.85);
    prepare(board);
    group.add(board);
    return { canvas, texture, key: "", index };
  });

  const loadThumb = (id: string) => {
    if (thumbs.has(id)) return thumbs.get(id);
    thumbs.set(id, null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { thumbs.set(id, img); for (const b of boards) b.key = ""; };
    img.onerror = () => thumbs.set(id, null);
    img.src = thumbnailUrl(id);
    return null;
  };

  const draw = (b: (typeof boards)[number], now: number) => {
    const content = billboardContent(b.index, now);
    const second = Math.floor(now / 3000);
    const key = content.kind === "sermon" ? `s:${content.sermon.id}:${second}` : `a:${content.announcement.title}`;
    if (key === b.key) return;
    b.key = key;
    const ctx = b.canvas.getContext("2d")!;
    const W = 640, H = 384;
    ctx.fillStyle = "#16121d"; ctx.fillRect(0, 0, W, H);
    if (content.kind === "sermon") {
      const img = loadThumb(content.sermon.id);
      if (img) {
        // Gentle Ken Burns drift so the screen feels alive.
        const t = (now / 45_000) % 1, zoom = 1.05 + t * 0.08;
        const w = W * zoom, h = (w * img.height) / img.width;
        ctx.drawImage(img, (W - w) / 2 - t * 14, (H - h) / 2, w, h);
      } else {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#3b2470"); grad.addColorStop(1, "#16121d");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      }
      const shade = ctx.createLinearGradient(0, H * 0.35, 0, H);
      shade.addColorStop(0, "#0000"); shade.addColorStop(1, "#000d");
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e0483e"; ctx.fillRect(22, 22, 132, 36);
      ctx.fillStyle = "#fff"; ctx.font = "800 20px system-ui, sans-serif"; ctx.fillText("KHARIS TV", 36, 47);
      ctx.fillStyle = "#ffffffcc"; ctx.font = "700 18px system-ui, sans-serif"; ctx.fillText("NOW PLAYING · walk closer to watch", 168, 47);
      ctx.fillStyle = "#fff"; ctx.font = "900 40px system-ui, sans-serif";
      wrap(ctx, content.sermon.title, 24, H - 92, W - 48, 44);
      ctx.fillStyle = "#ffffffaa"; ctx.font = "700 18px system-ui, sans-serif"; ctx.fillText("David Antwi · Kharis Church", 24, H - 30);
      const progress = ((now / 1000) % (content.sermon.minutes * 60)) / (content.sermon.minutes * 60);
      ctx.fillStyle = "#ffffff33"; ctx.fillRect(0, H - 8, W, 8);
      ctx.fillStyle = "#e0483e"; ctx.fillRect(0, H - 8, W * progress, 8);
    } else {
      ctx.fillStyle = season.accent; ctx.fillRect(0, 0, W, 64);
      ctx.fillStyle = "#16121d"; ctx.font = "900 26px system-ui, sans-serif"; ctx.fillText("KHARIS CHURCH", 24, 42);
      ctx.font = "700 18px system-ui, sans-serif"; ctx.textAlign = "right"; ctx.fillText(season.name.toUpperCase(), W - 24, 42); ctx.textAlign = "left";
      ctx.fillStyle = "#fff"; ctx.font = "900 46px system-ui, sans-serif";
      wrap(ctx, content.announcement.title, 24, 130, W - 48, 50);
      ctx.fillStyle = "#e9e3f3"; ctx.font = "600 24px system-ui, sans-serif";
      wrap(ctx, content.announcement.detail, 24, 210, W - 48, 32);
      ctx.fillStyle = season.accent; ctx.font = "800 20px system-ui, sans-serif"; ctx.fillText("kharis.org", 24, H - 26);
    }
    b.texture.needsUpdate = true;
  };
  let last = 0;
  return {
    group,
    update(now = Date.now()) {
      if (now - last < 500) return;
      last = now;
      for (const b of boards) draw(b, now);
    },
    dispose() {
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.map?.dispose();
        mat.dispose();
      });
    },
  };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" ");
  let line = "", row = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) { ctx.fillText(line, x, y + row * lh); line = w; row++; if (row > 2) return; }
    else line = test;
  }
  ctx.fillText(line, x, y + row * lh);
}
