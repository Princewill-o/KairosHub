// Render each motion lesson to an MP4 loop + poster with headless Chromium and ffmpeg.
// Usage: node tests/render-lessons.mjs [--sheet] (needs the static server on :4180)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const BASE = process.env.BASE ?? 'http://localhost:4180';
const OUT = 'public/lessons';
const FPS = 24, W = 960, H = 600;
const sheetOnly = process.argv.includes('--sheet');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(`${BASE}/index.html#landing`);
await page.evaluate(async () => { await document.fonts.load('800 40px Outfit'); await document.fonts.load('500 20px "DM Sans"'); });
const ids = await page.evaluate(async () => { const m = await import('/motion-lessons.mjs'); window.__ml = m; const c = document.createElement('canvas'); c.width = 960; c.height = 600; window.__c = c; return m.LESSONS.map((l) => l.id); });
for (const id of ids) {
  const times = sheetOnly ? [0.5, 1.6, 2.6, 4.5, 7, 9.5, 11.3, 11.8] : Array.from({ length: 12 * FPS }, (_, i) => i / FPS);
  const dir = `/tmp/lesson-${id}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  for (let i = 0; i < times.length; i += 24) {
    const batch = await page.evaluate(({ id, ts }) => ts.map((t) => { const ctx = window.__c.getContext('2d'); window.__ml.drawLesson(ctx, window.__ml.lessonById(id), t, 960, 600); return window.__c.toDataURL('image/png'); }), { id, ts: times.slice(i, i + 24) });
    batch.forEach((d, k) => writeFileSync(`${dir}/f${String(i + k).padStart(4, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')));
  }
  if (sheetOnly) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${dir}/f%04d.png`, '-vf', 'scale=480:300,tile=4x2', '-frames:v', '1', `/home/claude/shots/sheet-${id}.png`]);
  } else {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}/f%04d.png`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', `${OUT}/${id}.mp4`]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${dir}/f${String(FPS * 8).padStart(4, '0')}.png`, '-q:v', '5', `${OUT}/${id}.jpg`]);
  }
  console.log('rendered', id);
}
await browser.close();
