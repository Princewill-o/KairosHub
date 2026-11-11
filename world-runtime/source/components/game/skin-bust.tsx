"use client";
import { useEffect, useRef } from "react";
import type { Avatar } from "@/game/core/cosmetics";
import { skinCanvas, skinLook } from "./skin-look";

/**
 * Your blocky in-game self as a flat pixel bust: head, shoulders and arms cut
 * straight from the same 64×64 skin your 3D body wears, so the HUD portrait is
 * the person walking around the world (uploaded Minecraft skins too).
 */
// [sx, sy, w, h, dx, dy] in skin pixels, base then overlay, front faces only.
const FRONT: number[][] = [
  [44, 20, 4, 12, 0, 8], [44, 36, 4, 12, 0, 8], // right arm (viewer's left)
  [20, 20, 8, 12, 4, 8], [20, 36, 8, 12, 4, 8], // body
  [36, 52, 4, 12, 12, 8], [52, 52, 4, 12, 12, 8], // left arm
  [8, 8, 8, 8, 4, 0], [40, 8, 8, 8, 4, 0], // head, then hat/hair layer
];

export function SkinBust({ avatar, size = 48, className }: { avatar: Avatar; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(avatar ?? {});
  useEffect(() => {
    let live = true;
    void skinCanvas(skinLook(avatar), 0).then((skin) => {
      const c = ref.current;
      if (!live || !c) return;
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, c.width, c.height);
      // 16 px wide figure, 14 px tall crop (head + upper torso), scaled up crisp.
      const px = c.width / 18;
      const ox = px, oy = px * 1.5;
      for (const [sx, sy, w, h, dx, dy] of FRONT) ctx.drawImage(skin, sx, sy, w, h, ox + dx * px, oy + dy * px, w * px, h * px);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <canvas ref={ref} width={size * 2} height={size * 2} style={{ width: size, height: size, imageRendering: "pixelated" }} className={className} aria-hidden data-portrait="skin-bust" />;
}
