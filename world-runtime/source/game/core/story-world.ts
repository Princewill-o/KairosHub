import { BIBLE_STORIES, STORY_SPOTS, spotsFor, type PropKind, type StoryChapter, type StoryId } from "./ltbs-stories";
import type { WorldMap } from "./world";

export type StoryWorldPhase = "opening" | "explore" | "choice" | "resolution";
export const storyWorldId = (story: StoryId, chapter: number) => `story-${story}-${chapter}`;
/** Kept for older callers: the discovery spots, as {x, y} tiles. */
export const STORY_DISCOVERIES = STORY_SPOTS.map(([x, y]) => ({ x, y }));

/** Tiles that big set pieces in the walkway occupy (kept clear of the discovery spots). */
export function storySolids(scene: StoryChapter) {
  const solid = new Set<string>();
  const big: Partial<Record<PropKind, [number, number]>> = { throne: [2, 1.2], table: [2, 0.6], well: [0.9, 0.9], fire: [0.6, 0.6], tent: [1.4, 1.4], house: [1.5, 1.4], column: [0.5, 0.5], bench: [1, 0.3], cave: [3, 1.5] };
  for (const [kind, x, z] of scene.set) {
    const size = big[kind];
    if (!size) continue;
    for (let tx = Math.floor(x - size[0]); tx <= Math.floor(x + size[0] - 0.01); tx++)
      for (let tz = Math.floor(z - size[1]); tz <= Math.floor(z + size[1] - 0.01); tz++) {
        if (spotsFor(scene).some(([sx, sz]) => Math.hypot(tx + 0.5 - sx, tz + 0.5 - sz) < 1.1)) continue;
        solid.add(`${tx},${tz}`);
      }
  }
  return solid;
}

export function storyWorldMap(id: string): WorldMap | null {
  const match = /^story-(david|ruth|esther|daniel)-([0-5])$/.exec(id);
  if (!match) return null;
  const story = BIBLE_STORIES.find((item) => item.id === match[1])!;
  const chapter = Number(match[2]);
  const scene = story.chapters[chapter];
  const cols = 30, rows = 26;
  const solids = storySolids(scene);
  const tiles = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) =>
    x < 2 || x >= 28 || y < 2 || y >= 24 ? "#" : x < 11 || x > 19 ? "X" : solids.has(`${x},${y}`) ? "|" : "g").join(""));
  const portals = spotsFor(scene).map(([x, y], index) => ({
    id: `story-discover-${index}`,
    rect: { x: (x - 0.9) * 32, y: (y - 0.9) * 32, w: 58, h: 58 },
    label: scene.discoveries[index],
    to: { kind: "story-discover" as const, index },
  }));
  return { id, story: { id: story.id, chapter }, kind: "woodland", name: `${story.title} · ${scene.place}`, cols, rows, width: cols * 32, height: rows * 32, tiles, structures: [], rooms: [], portals, spawn: { x: 15 * 32, y: 20 * 32 }, accent: story.colour };
}
