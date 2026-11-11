import { useEffect, useRef, useState } from "react";
import { drawLesson, lessonById, lessonFor, sermonEmbed, sermonLink, LESSON_SECONDS } from "../../../../../public/motion-lessons.mjs";

export type Lesson = NonNullable<ReturnType<typeof lessonFor>>;
export { lessonFor, lessonById };

/** The lesson behind a life challenge, once per lesson per life. */
export function lessonAfter(category: string, seen: string[] | undefined): Lesson | null {
  const l = lessonFor(category);
  return l && !(seen ?? []).includes(l.id) ? l : null;
}

/**
 * Full-screen motion lesson. The animation is drawLesson() as a pure function
 * of time; "Hear the message" opens the matching Kharis sermon excerpt in the
 * official YouTube player.
 */
export function MotionLesson({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hear, setHear] = useState(false);
  useEffect(() => {
    const el = host.current!, c = canvas.current!, ctx = c.getContext("2d")!;
    const t0 = performance.now();
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const frame = () => {
      const dpr = Math.min(2, devicePixelRatio || 1), W = el.clientWidth, H = el.clientHeight;
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Play once and hold on the full frame rather than looping in-game.
      const t = still ? 9.5 : Math.min((performance.now() - t0) / 1000, 10.6);
      drawLesson(ctx, lesson, t, W, H, { loop: false });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    el.requestFullscreen?.().catch(() => {});
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(); };
    addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(raf); removeEventListener("keydown", key);
      if (document.fullscreenElement === el) document.exitFullscreen?.().catch(() => {});
    };
  }, [lesson, onDone]);
  return (
    <div ref={host} className="ml-player" role="dialog" aria-label={`${lesson.title}, motion lesson`} data-lesson={lesson.id} data-seconds={LESSON_SECONDS}>
      <canvas ref={canvas} aria-hidden="true" />
      <p className="ml-sr">{lesson.title}. {lesson.verse} {lesson.ref}.</p>
      <div className="ml-bar">
        <button type="button" className="ml-hear" onClick={() => setHear(true)}>Hear the message</button>
        <a className="ml-yt" href={sermonLink(lesson.sermon)} target="_blank" rel="noopener noreferrer">Full sermon →</a>
        <button type="button" className="ml-close" onClick={onDone}>Continue</button>
      </div>
      {hear && <div className="ml-sermon"><iframe title={`${lesson.sermon.title}, David Antwi`} src={sermonEmbed(lesson.sermon)} allow="autoplay; encrypted-media; fullscreen" referrerPolicy="strict-origin-when-cross-origin" /></div>}
    </div>
  );
}
