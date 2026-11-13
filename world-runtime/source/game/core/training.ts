/**
 * The Training Room: a small, safe room where a new player learns the controls with a
 * guide before stepping into Kairos World. Each step is checked by doing it, not reading it.
 */
import { type WorldMap } from "./world";

const TILE = 32;
const rect = (x: number, y: number, w = 1, h = 1) => ({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE });
export const TRAINING_DONE_KEY = "kairos-training-done";
/** Where things are in the room (tiles). */
export const TRAINING_SPOTS = {
  spawn: { x: 4, y: 10 },
  target: { x: 14, y: 10 },
  guide: { x: 20, y: 5 },
  benches: [{ x: 22.5, z: 15.5 }, { x: 24, z: 15.5 }, { x: 25.5, z: 15.5 }],
  door: { x: 29, y: 9 },
};

export function trainingMap(): WorldMap {
  const cols = 31, rows = 20;
  const t = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => (x === 0 || y === 0 || x === cols - 1 || y === rows - 1 ? "#" : ".")));
  for (let x = 2; x < cols - 2; x += 4) t[0][x] = "W";
  // The glowing target pad, the guide's corner, benches, plants and lamps.
  for (let y = 9; y <= 11; y++) for (let x = 13; x <= 15; x++) t[y][x] = "r";
  for (const x of [22, 23, 24, 25, 26]) t[16][x] = "s";
  for (const [x, y] of [[1, 1], [29, 1], [1, 18], [29, 18], [17, 1]]) t[y][x] = "p";
  for (const [x, y] of [[8, 1], [24, 1]]) t[y][x] = "L";
  t[9][cols - 1] = "."; t[10][cols - 1] = ".";
  return {
    id: "training", kind: "office", name: "Training Room", accent: "#6b3fa0",
    cols, rows, width: cols * TILE, height: rows * TILE, tiles: t.map((r) => r.join("")),
    structures: [], rooms: [],
    portals: [
      { id: "training-guide", rect: rect(19, 6, 3, 1), label: "Talk to Hope, your guide", to: { kind: "training", action: "talk" } },
      { id: "training-door", rect: rect(29, 9, 1, 2), label: "Door to Kairos World", to: { kind: "training", action: "finish" } },
    ],
    spawn: { x: TRAINING_SPOTS.spawn.x * TILE + 16, y: TRAINING_SPOTS.spawn.y * TILE + 16 },
    seats: TRAINING_SPOTS.benches,
    sign: { x: 15, y: 3, text: "KAIROS TRAINING ROOM" },
  } as WorldMap;
}

export type StepId = "move" | "turn" | "view" | "run" | "jump" | "pad" | "talk" | "sit" | "phone" | "hud" | "door";
export type TrainingStep = { id: StepId; title: string; text: string; keys?: string[]; alt?: string };
export const TRAINING_STEPS: TrainingStep[] = [
  { id: "move", title: "Walk around", text: "Use W A S D (or the arrow keys) to walk. On a phone, drag the joystick.", keys: ["W", "A", "S", "D"] },
  { id: "turn", title: "Look around", text: "Turn with the ← → arrow keys, or drag on the screen with your mouse or finger.", keys: ["←", "→"], alt: "or drag" },
  { id: "view", title: "Change your view", text: "Press V to switch between the close-up view and first person.", keys: ["V"] },
  { id: "run", title: "Run", text: "Hold Shift while you walk to run.", keys: ["Shift", "W"] },
  { id: "jump", title: "Jump", text: "Press Space to jump.", keys: ["Space"] },
  { id: "pad", title: "Walk to the glowing pad", text: "Head to the purple pad in the middle of the room." },
  { id: "talk", title: "Talk to people", text: "Walk up to Hope by the window and press E (or tap the yellow button) to talk.", keys: ["E"] },
  { id: "sit", title: "Take a seat", text: "Go to the benches at the bottom right and press C to sit. Press C again to stand.", keys: ["C"] },
  { id: "phone", title: "Your phone", text: "Press P or tap Phone (bottom right). Your apps live here: travel, Bible, games, your church and more. Close it with Esc.", keys: ["P"] },
  { id: "hud", title: "Your screen", text: "Here's what everything on your screen does." },
  { id: "door", title: "Into Kairos World", text: "You're ready! Walk through the door on the right to enter London." },
];
/** The tour of the on-screen buttons, in order, by their data-hud anchor. */
export const HUD_TOUR: { hud: string; title: string; text: string }[] = [
  { hud: "life", title: "How you're doing", text: "Energy, focus, mood, hunger, social and hygiene. Eat, sleep, see friends and wash to keep them up." },
  { hud: "tasks", title: "Today's tasks", text: "Little goals for the day. Finish them for XP and Grace." },
  { hud: "wallet", title: "Your Grace", text: "Grace is the money of Kairos World. Earn it by playing, serving and helping; spend it in shops." },
  { hud: "minimap", title: "Map", text: "Where you are. Tap it to open the full map and set a route." },
  { hud: "bible", title: "Bible", text: "Open the Bible anytime and turn the pages." },
  { hud: "ltbs", title: "LTBS World", text: "Step into Bible stories and Scripture games, a separate world." },
  { hud: "phone", title: "Phone", text: "Travel the UK, your Kharis church, games, music, shopping and more." },
  { hud: "settings", title: "Settings and menu", text: "Sound, graphics and help. Press Esc for the main menu." },
];
