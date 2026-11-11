/**
 * Kairos Mall: clothes, furniture, home and tech, paid for in Grace and
 * delivered to your house by a driver. Standard delivery is free; express
 * costs a little more and arrives in about a minute and a half.
 * Pure data and rules; storage is passed in so it can be tested.
 */
import { FURNITURE } from "./homes";

export type Dept = "Kharis Wear" | "Clothes" | "Furniture" | "Home & Decor" | "Tech";
export type Appearance = Partial<{ outfit: string; top: string; trousers: string; legs: string; shoe: string; hat: string; scarf: boolean; backpack: boolean; print: string }>;
export interface MallItem {
  id: string;
  name: string;
  dept: Dept;
  price: number;
  /** Price before the sale, if it's on sale. */
  was?: number;
  blurb: string;
  /** Clothes: what wearing it changes. */
  wear?: Appearance;
  /** Furniture: which home item it adds. */
  furniture?: string;
  /** Swatch colour for the catalogue card. */
  colour: string;
}

export const KHARIS_YELLOW = "#f5c518";
export const HOODIE_PRINTS: Record<string, string> = {
  "kharis-church": "KHARIS CHURCH",
  "kharis-phase-2": "KHARIS PHASE 2",
  "kharis-on-campus": "KHARIS ON CAMPUS",
};

const hoodie = (id: string, print: string, was: number, price: number): MallItem => ({
  id, name: `${HOODIE_PRINTS[print]
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())} hoodie`, dept: "Kharis Wear", price, was,
  blurb: `Yellow hoodie with "${HOODIE_PRINTS[print]}" printed in black across the chest.`,
  wear: { outfit: "hoodie", top: KHARIS_YELLOW, print }, colour: KHARIS_YELLOW,
});

export const MALL: MallItem[] = [
  hoodie("hoodie-kharis-church", "kharis-church", 400, 250),
  hoodie("hoodie-kharis-phase-2", "kharis-phase-2", 400, 250),
  hoodie("hoodie-kharis-on-campus", "kharis-on-campus", 400, 250),
  { id: "hoodie-purple", name: "Kairos purple hoodie", dept: "Clothes", price: 180, blurb: "Plain heavyweight hoodie.", wear: { outfit: "hoodie", top: "#6b3fa0", print: "none" }, colour: "#6b3fa0" },
  { id: "hoodie-forest", name: "Forest hoodie", dept: "Clothes", price: 180, blurb: "Deep green, soft lining.", wear: { outfit: "hoodie", top: "#367c73", print: "none" }, colour: "#367c73" },
  { id: "jacket-oat", name: "Oat field jacket", dept: "Clothes", price: 260, blurb: "Four pockets, warm collar.", wear: { outfit: "jacket", top: "#e9dfc7", print: "none" }, colour: "#e9dfc7" },
  { id: "tunic-berry", name: "Berry long tunic", dept: "Clothes", price: 220, blurb: "Long and modest.", wear: { outfit: "tunic", top: "#a44760", print: "none" }, colour: "#a44760" },
  { id: "chinos-sand", name: "Sand chinos", dept: "Clothes", price: 140, blurb: "Smart trousers.", wear: { trousers: "chinos", legs: "#e1cba0" }, colour: "#e1cba0" },
  { id: "cargo-olive", name: "Olive cargo trousers", dept: "Clothes", price: 160, blurb: "Plenty of pockets.", wear: { trousers: "cargo", legs: "#566c4d" }, colour: "#566c4d" },
  { id: "trainers-white", name: "White trainers", dept: "Clothes", price: 120, blurb: "Clean and comfy.", wear: { shoe: "#ece7dc" }, colour: "#ece7dc" },
  { id: "beanie", name: "Knit beanie", dept: "Clothes", price: 60, blurb: "For cold London mornings.", wear: { hat: "beanie" }, colour: "#33313a" },
  { id: "cap", name: "Cap", dept: "Clothes", price: 60, blurb: "Keeps the sun off.", wear: { hat: "cap" }, colour: "#2b5fd9" },
  { id: "scarf", name: "Kharis scarf", dept: "Clothes", price: 80, was: 120, blurb: "Gold scarf.", wear: { scarf: true }, colour: "#d89e34" },
  { id: "backpack", name: "Campus backpack", dept: "Clothes", price: 140, blurb: "Room for a Bible and a laptop.", wear: { backpack: true }, colour: "#334963" },
  // A proper wardrobe: suits, dresses, workwear, sportswear, modest wear and more.
  ...([
    ["suit-navy", "Navy two-piece suit", 420, { outfit: "suit", top: "#334963", trousers: "chinos", legs: "#334963" }, "#334963", "Sharp for interviews and Sundays."],
    ["suit-charcoal", "Charcoal suit", 450, { outfit: "suit", top: "#292c34", trousers: "chinos", legs: "#292c34" }, "#292c34", "Slim fit, wedding-ready."],
    ["suit-cream", "Cream summer suit", 480, { outfit: "suit", top: "#e9dfc7", trousers: "chinos", legs: "#e1cba0" }, "#e9dfc7", "Linen blend."],
    ["dress-gold", "Gold Sunday dress", 260, { outfit: "dress", top: "#e0ab3c" }, "#e0ab3c", "Flowing, ankle length."],
    ["dress-plum", "Plum midi dress", 240, { outfit: "dress", top: "#6b3fa0" }, "#6b3fa0", "Elegant and modest."],
    ["dress-rose", "Rose wrap dress", 230, { outfit: "dress", top: "#d58b9e" }, "#d58b9e", "Soft and pretty."],
    ["skirt-teal", "Teal pleated skirt", 150, { outfit: "skirt", top: "#367c73" }, "#367c73", "With a cream blouse."],
    ["abaya-black", "Black abaya", 220, { outfit: "abaya", top: "#292c34" }, "#292c34", "Long and graceful."],
    ["hijab-sand", "Sand hijab", 70, { hat: "hijab" }, "#e1cba0", "Soft jersey."],
    ["tracksuit-red", "Red tracksuit", 190, { outfit: "jacket", top: "#a44760", trousers: "cargo", legs: "#a44760", print: "none" }, "#a44760", "Matching set."],
    ["jeans-dark", "Dark denim jeans", 110, { trousers: "jeans", legs: "#222730" }, "#222730", "Straight leg."],
    ["shorts-khaki", "Khaki shorts", 70, { trousers: "shorts", legs: "#e1cba0" }, "#e1cba0", "For the one hot week a year."],
    ["tee-white", "White tee", 40, { outfit: "tshirt", top: "#e9dfc7", print: "none" }, "#e9dfc7", "Everyday basic."],
    ["tee-yellow", "Kharis yellow tee", 50, { outfit: "tshirt", top: "#f5c518", print: "none" }, "#f5c518", "Bright as Sunday morning."],
    ["overalls-denim", "Denim dungarees", 160, { outfit: "overalls", top: "#3d8bd9" }, "#3d8bd9", "Garden and workshop ready."],
    ["scrubs-blue", "Hospital scrubs", 120, { outfit: "scrubs", hat: "scrubcap" }, "#3d8bd9", "For the night shift."],
    ["hivis", "Hi-vis work jacket", 90, { outfit: "hivis", hat: "hardhat" }, "#f5c518", "Site safety first."],
    ["labcoat", "Lab coat", 130, { outfit: "labcoat" }, "#ece7dc", "For science."],
    ["boots-brown", "Brown leather boots", 170, { shoe: "#ad6844" }, "#ad6844", "Built to last."],
    ["trainers-black", "Black trainers", 120, { shoe: "#33313a" }, "#33313a", "Go with everything."],
    ["trainers-gold", "Gold high-tops", 190, { shoe: "#d89e34" }, "#d89e34", "Loud, in a good way."],
  ] as const).map(([id, name, price, wear, colour, blurb]): MallItem => ({ id, name, dept: "Clothes", price, blurb, wear: wear as Appearance, colour })),
  ...FURNITURE.filter((f) => f.price > 0).map((f): MallItem => ({
    id: `furniture-${f.id}`,
    name: f.name,
    dept: /tv|gaming|telescope|speaker|computer|laptop/i.test(f.id) ? "Tech" : /rug|plant|lamp|art|frame|tank|mirror|candle|clock|verse/i.test(f.id) ? "Home & Decor" : "Furniture",
    price: f.price,
    blurb: `${f.w} × ${f.h} tiles${f.act ? ` · ${f.act.label}` : f.link ? ` · ${f.link.label}` : ""}`,
    furniture: f.id,
    colour: "#a97c46",
  })),
];
export const mallItem = (id: string) => MALL.find((m) => m.id === id) ?? null;
export const DEPTS: Dept[] = ["Kharis Wear", "Clothes", "Furniture", "Home & Decor", "Tech"];

/* ── Delivery ───────────────────────────────────────────────────────────── */
export type Speed = "standard" | "express";
export const DELIVERY: Record<Speed, { label: string; fee: number; ms: number }> = {
  standard: { label: "Standard · free", fee: 0, ms: 6 * 60_000 },
  express: { label: "Express · 60 Grace", fee: 60, ms: 90_000 },
};
export interface Order { id: string; item: string; speed: Speed; placed: number; eta: number; collected?: boolean }
export interface MallState { orders: Order[]; wardrobe: string[]; wearing: Appearance | null }
export const EMPTY_MALL: MallState = { orders: [], wardrobe: [], wearing: null };
export const MALL_KEY = "kairos-mall-v1";

export function placeOrder(state: MallState, itemId: string, speed: Speed, now = Date.now()): MallState {
  const item = mallItem(itemId);
  if (!item) return state;
  const order: Order = { id: `${now.toString(36)}-${itemId}`, item: itemId, speed, placed: now, eta: now + DELIVERY[speed].ms };
  return { ...state, orders: [order, ...state.orders].slice(0, 40) };
}
export const orderCost = (itemId: string, speed: Speed) => (mallItem(itemId)?.price ?? 0) + DELIVERY[speed].fee;

/** Where the parcel is: packed in the warehouse, in the van, at your door, or collected. */
export function orderStatus(order: Order, now = Date.now()): "packing" | "on-the-way" | "arriving" | "delivered" | "collected" {
  if (order.collected) return "collected";
  const left = order.eta - now;
  const total = order.eta - order.placed;
  if (left <= 0) return "delivered";
  if (left < Math.min(45_000, total * 0.5)) return "arriving";
  if (left < total * 0.8) return "on-the-way";
  return "packing";
}
/** Seconds until the driver reaches your door (0 when delivered). */
export const etaSeconds = (order: Order, now = Date.now()) => Math.max(0, Math.ceil((order.eta - now) / 1000));

/** Open the parcels at your door: clothes go in your wardrobe, furniture into your home store. */
export function collectDeliveries(state: MallState, now = Date.now()): { state: MallState; clothes: string[]; furniture: string[] } {
  const clothes: string[] = [], furniture: string[] = [];
  const orders = state.orders.map((o) => {
    if (o.collected || orderStatus(o, now) !== "delivered") return o;
    const item = mallItem(o.item);
    if (item?.wear) clothes.push(item.id);
    if (item?.furniture) furniture.push(item.furniture);
    return { ...o, collected: true };
  });
  return { state: { ...state, orders, wardrobe: Array.from(new Set([...state.wardrobe, ...clothes])) }, clothes, furniture };
}
export function wear(state: MallState, itemId: string): MallState {
  const item = mallItem(itemId);
  if (!item?.wear || !state.wardrobe.includes(itemId)) return state;
  return { ...state, wearing: { ...(state.wearing ?? {}), ...item.wear } };
}
export function readMall(storage: Pick<Storage, "getItem"> | null, id = ""): MallState {
  try {
    const raw = JSON.parse(storage?.getItem(`${MALL_KEY}:${id}`) ?? "null");
    if (!raw) return { ...EMPTY_MALL };
    return { orders: Array.isArray(raw.orders) ? raw.orders : [], wardrobe: Array.isArray(raw.wardrobe) ? raw.wardrobe : [], wearing: raw.wearing ?? null };
  } catch { return { ...EMPTY_MALL }; }
}
export function writeMall(storage: Pick<Storage, "setItem"> | null, state: MallState, id = "") {
  try { storage?.setItem(`${MALL_KEY}:${id}`, JSON.stringify(state)); window.dispatchEvent(new Event("kairos-mall-updated")); } catch { /* optional */ }
}
/** The next parcel on its way, for the delivery van in the world. */
export function nextDelivery(state: MallState, now = Date.now()) {
  return state.orders
    .filter((o) => ["on-the-way", "arriving", "delivered"].includes(orderStatus(o, now)))
    .sort((a, b) => a.eta - b.eta)[0] ?? null;
}
