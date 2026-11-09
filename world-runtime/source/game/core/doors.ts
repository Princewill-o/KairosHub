import { TILE, type Portal, type WorldMap } from "./world";

/**
 * Real doors instead of glowing teleport rings. A portal becomes a door when it
 * sits on the door side of a building (outdoors) or on the outer wall of an
 * interior. Everything else (bus stops, bike docks, desks, NPC services) keeps
 * its marker. Units: world/tiles. Facing is the direction the door looks out.
 */
export type Doorway = {
  portal: Portal;
  x: number;
  z: number;
  width: number;
  height: number;
  facing: "south" | "north" | "east" | "west";
  double: boolean;
  /** Camera-side interior doors are drawn as a low cut-away so they never hide the room. */
  cutaway?: boolean;
  /** Building or room colour for the frame accent. */
  accent: string;
};

const ENTER_KINDS = new Set(["act", "map", "shop", "doctor", "bank", "dealer", "games", "grace", "story-enter", "scripture-challenge", "work", "university"]);
const NOT_DOORS = new Set(["bus", "bike", "desk", "home-use", "workstation", "guide", "story-discover", "prison", "awards", "tube"]);

export function doorways(map: WorldMap): Doorway[] {
  const out: Doorway[] = [];
  const indoors = !["city", "campus", "woodland"].includes(map.kind) && !map.island && map.art !== "london" && map.art !== "highlands";
  for (const portal of map.portals) {
    if (NOT_DOORS.has(portal.to.kind) || !ENTER_KINDS.has(portal.to.kind)) continue;
    if (portal.to.kind === "act" && portal.to.activity !== "eat") continue;
    const cx = (portal.rect.x + portal.rect.w / 2) / TILE;
    const top = portal.rect.y / TILE, bottom = (portal.rect.y + portal.rect.h) / TILE;
    if (!indoors) {
      const st = (map.structures ?? []).find(
        (s) => cx >= s.x - 0.5 && cx <= s.x + s.w + 0.5 &&
          (s.door === "bottom" ? Math.abs(top - (s.y + s.h - (s.doorInset ?? 0))) <= 1.6 : Math.abs(bottom - (s.y + (s.doorInset ?? 0))) <= 1.6),
      );
      if (!st) continue;
      const big = st.w >= 10;
      out.push({
        portal,
        x: cx,
        z: st.door === "bottom" ? st.y + st.h - (st.doorInset ?? 0) : st.y + (st.doorInset ?? 0),
        width: big ? 1.7 : 1.05,
        height: big ? 2.45 : 2.15,
        facing: st.door === "bottom" ? "south" : "north",
        double: big,
        accent: st.accent,
      });
      continue;
    }
    // Interiors: exits on the outer walls get a door in the wall.
    const cy = (portal.rect.y + portal.rect.h / 2) / TILE;
    const d = { south: map.rows - cy, north: cy, west: cx, east: map.cols - cx };
    const side = (Object.entries(d) as [Doorway["facing"], number][]).sort((a, b) => a[1] - b[1])[0];
    if (side[1] > 2.5) continue;
    const wide = portal.rect.w / TILE >= 2 || portal.rect.h / TILE >= 2;
    out.push({
      portal,
      x: side[0] === "west" ? 0 : side[0] === "east" ? map.cols : cx,
      z: side[0] === "north" ? 0 : side[0] === "south" ? map.rows : cy,
      width: wide ? 1.7 : 1.05,
      height: wide ? 2.45 : 2.15,
      facing: side[0],
      double: wide,
      accent: map.accent ?? "#6b3fa0",
      cutaway: side[0] === "south",
    });
  }
  return out;
}

export const isDoorPortal = (map: WorldMap, portal: Portal | null | undefined) =>
  Boolean(portal && doorways(map).some((d) => d.portal.id === portal.id));

/** 0 = shut, 1 = open. Doors start opening 3 tiles away and are fully open at 1.4. */
export function doorOpenTarget(distance: number) {
  return Math.max(0, Math.min(1, (3 - distance) / 1.6));
}
