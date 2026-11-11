"use client";
import { islandMap } from "@/game/core/islands";
import {gracePlaces,graceIslands} from '../../../../../public/grace-catalog.mjs';
import {worldAppearance} from '../../../../../public/grace-avatar.mjs';
import { normalizeAvatar } from '../../../../../public/avatar.mjs';
import { readStorySave, LTBS_SAVE_KEY } from "@/game/core/ltbs-stories";
import { SCRIPTURE_CHALLENGES } from "@/game/core/ltbs-challenges";
import { storyWorldMap } from "@/game/core/story-world";
import { StoryWorldHud, useStoryAdventure } from "./story-adventure";
import {GraceWorldPanel} from './grace-world-panel';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BookOpen, Coins, Gamepad2, HeartHandshake, Smartphone, X } from "lucide-react";

import { play, soundOn } from "../sound";
import { NPC_SPOTS, PLAYER, TRAFFIC_BOXES } from "./art";
import { BankDialog, type BankLoan } from "./bank";
import type { BusTrip } from "./bus-stop";
import { MiniMap, PLACES, type Place, nearest, placeForTask } from "./city-map";
import { DeveloperTeleport, type TeleportDestination } from "./developer-teleport";
import { PoliceChallenge } from "./law-dialogs";
import { ArrestOverlay, PrisonHud, ShopDialog, WantedStars } from "./life";
import { JusticeDialog } from "./justice-dialog";
import { NpcDialog } from "./npc-dialog";
import { type Choice, type Encounter, type Story, encounter, excuseEncounter, familyEncounter, roleFor } from "@/game/core/npc-encounters";
import { ARREST_SCENE } from "@/game/core/pursuit";
import { conductOf, fullSentence } from "@/game/core/justice";
import { LevelBadge, LifeHud, type Quest } from "./life-hud";
import { PoliceTransportCutscene } from "./police-transport-cutscene";
import { SceneWipe, Tutorial } from "./scene";
import { SceneMusic } from "./scene-music";
import { PASSENGERS, RIDE, TRAIN_CALL } from "./train-state";
import { advanceRide, nextStop, rideFrame, stationStop, type RideStop } from "@/game/core/ride";
import { isStairway, STREET_STAIRS } from "@/game/core/doors";
import { AMBULANCE_LEAVES, CRASH, DELIVERY_RUN, SCENE_READY, VEIL } from "./world-events";
import { lobbyMap, mallMap } from "@/game/core/lobbies";
import { MallDialog } from "./mall-dialog";
import { collectDeliveries, etaSeconds, mallItem, nextDelivery, orderCost, orderStatus, placeOrder, readMall, writeMall, type Dept, type MallState, type Speed } from "@/game/core/mall";
import { receiveFurniture } from "@/app/games/world/actions";
import { worldAppearance } from "../../../../../public/grace-avatar.mjs";
import { BikeDock, Dealership } from "./transport";
import type { TubeTrip } from "./tube-map";
import { useLife } from "./use-life";
import { useNeeds, doActivity } from "./use-needs";
import { type Me, useLobby } from "./use-world";
import { WorldView } from "./world-view";
import { LifeCutscene, setFor, type Cutscene } from "./life-cutscene";
import { KairosMenu } from "./kairos-menu";
import { MotionLesson, lessonAfter, lessonById, type Lesson } from "./motion-lesson";
import { useKharisUpdates, ChurchService, LifeChip, LifeDecision, LifeEnding, LifePanel, NewLife, isServiceTime, markAttended, useKairosLife, useLifeClock } from "./kairos-life";
import * as KL from "@/game/core/kairos-life";
import { FLIGHT, LIFE_WORLD, setWorldBranch, setWorldFamily } from "@/game/core/life-world";
import { FollowUpDialog } from "./preach-dialog";
import { KairosPhone } from "./kairos-phone";
import { LUCKY_WORLD, LuckyBlock, luckyFace, luckyFaceUrl } from "./lucky-block";
import { GameShow } from "./game-show";
import { LifeHub } from "./life-hub";
import { DARK, buyDark } from "@/game/core/web";
import { NowPlaying } from "./music-app";
import { NextStationBoard } from "./next-station";
import { scriptFor } from "./cutscene-scripts";
import { activeInjury, injure, injurySpeed } from "@/game/core/injury";
import { InPersonGame } from "./in-person-game";
import { PoliceVan } from "./police-van";
import { FIND_CHANCE, TIERS, rollTier, type Tier } from "@/game/core/lucky-blocks";
import { MinistryDialog } from "./ministry-dialog";
import { personaFor } from "@/game/core/ministry";
const BusStop = dynamic(() => import("./bus-stop").then((module) => module.BusStop), { ssr: false, loading: () => null });
const TubeMap = dynamic(() => import("./tube-map").then((module) => module.TubeMap), { ssr: false, loading: () => null });
const HomeEditor = dynamic(() => import("../../careers/home-editor").then(module => module.HomeEditor), { ssr: false });
const ScriptureChallenge = dynamic(() => import("./ltbs-hub").then(module => module.Challenge), { ssr: false });


import { earnWorldXp, worldBankStatus } from "@/app/games/world/actions";
import { recordKairosActivity } from "@/lib/game/kairos-activity";
import type { BikeBrand } from "@/game/core/bikes";
import { carById } from "@/game/core/cars";
import { nearestDrivingSpot, nearestParkingSpot } from "@/game/core/driving";
import { GAME_HOUR_MS, gameDateAt } from "@/game/core/game-clock";
import { type Placed, type HomeAction, furnitureById, homeUse } from "@/game/core/homes";
import { PRISON_LOOK, SHOP, releaseFromPrison, addStar, clearWanted, wantedCharge, sentenceMs } from "@/game/core/law";
import { type Pursuit, startPursuit, tickPursuit, caughtByPrisonGuard } from "@/game/core/pursuit";
import type { RoadViolation } from "@/game/core/traffic-rules";
import { canBoardTrain } from "@/game/core/train";
import {
  CITY,
  churchMap, woodlandMap, kharisHubMap, airportMap, flightMap, ferryMap, greaterLondonMap, branchMap,
  STATION_PLATFORM_Y,
  TILE,
  stationMap,
  trainCarriageMap,
  motorwayMap,
  hospitalMap,
  courtMap,
  prisonMap,
  CARRIAGE_DOORS,
  type Portal,
  SERVERS,
  type WorldMap,
  busStops,
  homeMap,
  tubeStations,
  pickServer,
  safeSpot,
} from "@/game/core/world";
import type { HomeState } from "@/lib/game/careers-server";
import { cn } from "@/lib/utils";


const STATIONS = tubeStations();
const BUS_STOPS = busStops();

let HOME: { style: number; layout: Placed[] } | null = null;
function loadMap(id: string): WorldMap | null {
  if (id === "home" && HOME) return homeMap(HOME.style, HOME.layout);
  const story = storyWorldMap(id);
  if (story) return story;
  if (id === "city") return CITY;
  const island = islandMap(id);
  if (island) return island;
  if (id === "church") return churchMap();
  if (id === "woodland") return woodlandMap();
  if (id === "kharis-hub") return kharisHubMap();
  if (id.startsWith("station-")) return stationMap(id.slice("station-".length));
  if (id === "train-carriage") return trainCarriageMap();
  if (id === "m25") return motorwayMap();
  if (id === "airport") return airportMap();
  if (id === "flight") return flightMap();
  if (id === "ferry") return ferryMap();
  if (id === "greater-london") return greaterLondonMap();
  if (id === "branch") return LIFE_WORLD.branch ? branchMap(LIFE_WORLD.branch.name) : null;
  if (id === "hospital") return hospitalMap();
  if (id === "court") return courtMap();
  if (id === "prison") return prisonMap();
  if (id === "mall") return mallMap();
  if (id.startsWith("lobby-")) return lobbyMap(id);
  return null;
}

export function WorldApp({
  me,
  initialMap,
  initialServer,
  initialArrival,
  home,
  clout,
  quests,
  cars = [],
  xp = 0,
  wantedResetToken,
  initialBuild = false,
  developerTeleport = false,
}: {
  initialBuild?: boolean;
  developerTeleport?: boolean;
  wantedResetToken?: string;
  /** Cars you own (dealership). */
  cars?: string[];
  /** Total XP, for the level badge. */
  xp?: number;
  me: Me;
  initialMap: string;
  initialServer: string | null;
  initialArrival?: { x: number; y: number };
  /** Your home's colourway and furniture layout. */
  home: HomeState & { style: number };
  clout: number;
  quests: Quest[];
}) {
  HOME = home;
  const router = useRouter();
  const [graceOpen,setGraceOpen]=useState(false);
  const openGrace=useCallback((route='home')=>parent.postMessage({type:'kairos-world:grace',route},location.origin),[]);
  const [wardrobe, setWardrobe] = useState(false);
  const [playerAvatar, setPlayerAvatar] = useState(me.avatar);
  // Grace supplies the selected player's appearance; old toy saves remain untouched.
  const [mapId, setMapId] = useState(() => (loadMap(initialMap) ? initialMap : "city"));
  const [building, setBuilding] = useState(initialBuild && initialMap === "home");
  const [tube, setTube] = useState<string | null>(null);
  const [trip, setTrip] = useState(0);
  const [mindGap, setMindGap] = useState(false);
  const [server, setServer] = useState<string | null>(() => initialServer);
  const [arrive, setArrive] = useState<{ x: number; y: number; heading?: number } | undefined>(initialArrival);
  const [bus, setBus] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [fading, setFading] = useState(false);
  const [sceneName, setSceneName] = useState("London");
  const [tutorial, setTutorial] = useState(false);
  const [waypoint, setWaypoint] = useState<Place | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const arrivedRef = useRef<(() => void) | null>(null);
  const arrived = useCallback(() => { arrivedRef.current?.(); setWaypoint(null); }, []);
  useEffect(() => setWaypoint(null), [mapId]);
  useEffect(() => {
    const key = "kairos-how-to-play-seen";
    try {
      const previouslySeen = localStorage.getItem(key) || Object.keys(localStorage).some(item => item.startsWith("world-tutorial-") && localStorage.getItem(item));
      localStorage.setItem(key, "seen");
      if (!previouslySeen) setTutorial(true);
    } catch { /* Keep gameplay accessible when storage is unavailable. */ }
  }, []);
  const [dock, setDock] = useState(false);
  const [bike, setBike] = useState<{ brand: BikeBrand; until: number } | null>(null);
  const [wallet, setWallet] = useState(clout);
  // Offline, your life's money is the money you spend in the world (shops, mall, bank, home).
  const lifeMoneyRef = useRef<number | null>(null);
  // Online Grace is a real balance: it's saved, so what you earn stays and what you
  // spend is gone. (First time: start from your shell Grace plus story-mode Grace.)
  const WALLET_KEY = "kairos-grace-wallet-v1";
  const walletLoaded = useRef(false);
  useEffect(() => {
    let saved: number | null = null;
    try { const v = Number(localStorage.getItem(WALLET_KEY)); if (localStorage.getItem(WALLET_KEY) !== null && Number.isFinite(v)) saved = v; } catch { /* storage optional */ }
    // New players get 300 starter Grace so the shops work from day one.
    setWallet(saved ?? Math.max(300, clout + readStorySave().grace));
    walletLoaded.current = true;
  }, [clout]);
  useEffect(() => {
    if (!walletLoaded.current || (globalThis as { __kairosOffline?: boolean }).__kairosOffline) return;
    try { localStorage.setItem(WALLET_KEY, String(Math.max(0, Math.round(wallet)))); } catch { /* storage optional */ }
  }, [wallet]);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankLoan, setBankLoan] = useState<BankLoan>({ balance: 0, status: "none" });
  const [gameDate, setGameDate] = useState(() => new Date());
  const bankCourtSeen = useRef(false);
  useEffect(() => {
    const updateClock = () => setGameDate(gameDateAt());
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, [me.id]);
  const [dealer, setDealer] = useState(false);
  const [homeAction, setHomeAction] = useState<HomeAction | null>(null);
  useEffect(() => {
    if (!homeAction) return;
    if (mapId !== "home") { setHomeAction(null); return; }
    const timer = window.setTimeout(() => {
      doActivity(homeAction.effect);
      setHomeAction(null);
    }, homeAction.duration);
    return () => window.clearTimeout(timer);
  }, [homeAction, mapId]);
  const [garage, setGarage] = useState<string[]>(cars);
  const [driving, setDriving] = useState<string | null>(null);
  const [xpNow, setXpNow] = useState(xp);
  const [toast, setToast] = useState<{ text: string; big?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gainXp = useCallback(async (kind: "bus" | "hike" | "train" | "eat" | "sleep") => {
    const r = await earnWorldXp(kind);
    if (!r || !r.xp) return;
    setXpNow((x) => r.total ?? x + r.xp);
    setToast(r.levelled ? { text: `Level up! You're now level ${r.level}`, big: true } : { text: `+${r.xp} XP` });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), r.levelled ? 3200 : 1800);
  }, []);
  const [shop, setShop] = useState<"tescow" | "bootz" | null>(null);
  const [phone, setPhone] = useState(false);
  // Lucky blocks: a 10% chance one turns up near you in each minute outdoors.
  const [luckySpotted, setLuckySpotted] = useState<Tier | null>(null);
  const [luckyOpen, setLuckyOpen] = useState<Tier | null>(null);
  const [gameShow, setGameShow] = useState(false);
  useEffect(() => {
    if (!luckySpotted) { LUCKY_WORLD.current = null; return; }
    const t = TIERS.find((x) => x.id === luckySpotted)!;
    const a = Math.random() * Math.PI * 2;
    LUCKY_WORLD.current = { tier: luckySpotted, url: luckyFaceUrl(t.colour, t.edge), x: PLAYER.x / TILE + Math.cos(a) * 3, z: PLAYER.y / TILE + Math.sin(a) * 3 };
  }, [luckySpotted]);
  const [lifeHub, setLifeHub] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("lucky"); if (t && TIERS.some((x) => x.id === t)) setLuckyOpen(t as Tier); else if (t) setLuckySpotted(rollTier());
    if (q.get("gameshow") === "1") setGameShow(true);
    const open = () => { setPhone(false); setGameShow(true); };
    window.addEventListener("kairos-open-gameshow", open);
    const hub = () => { setPhone(false); setLifeHub(true); };
    window.addEventListener("kairos-open-lifehub", hub);
    if (q.get("lifehub") === "1") setLifeHub(true);
    const search = setInterval(() => { if (!document.hidden && Math.random() < FIND_CHANCE) setLuckySpotted((cur) => cur ?? rollTier()); }, 60_000);
    const mine = () => setLuckySpotted((cur) => { if (cur) setLuckyOpen(cur); return null; });
    window.addEventListener("kairos-lucky-mine", mine);
    return () => { clearInterval(search); window.removeEventListener("kairos-lucky-mine", mine); window.removeEventListener("kairos-open-gameshow", open); window.removeEventListener("kairos-open-lifehub", hub); };
  }, []);
  const [miniGamesOpen, setMiniGamesOpen] = useState(false);
  const [nativeChallenge,setNativeChallenge] = useState<string|null>(null);
  const challenge = SCRIPTURE_CHALLENGES.find(item => item.id === nativeChallenge);
  const [inmate, setInmate] = useState<string | null>(null);
  const [pursuit, setPursuit] = useState<Pursuit | null>(null);
  const pursuitRef = useRef<Pursuit | null>(null);
  const guardCaughtAt = useRef(0);
  const drivingOffenceAt = useRef(-Infinity);
  const releaseReason = useRef("released");
  const arrestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set when the police tase you; cleared when the stop is resolved or the stars go. */
  const tasedOnce = useRef(false);
  useEffect(() => () => { if (arrestTimer.current) clearTimeout(arrestTimer.current); }, []);
  useEffect(() => { const q = new URLSearchParams(window.location.search); if (q.get("phone") === "1") setPhone(true); if (q.get("talk") === "1") setPreaching(true); }, []);
  const [arrest, setArrest] = useState(false);
  const [policeTransport, setPoliceTransport] = useState(false);
  const transportStars = useRef(4);
  const { life, update: updateLife } = useLife(me.id,wantedResetToken);
  const updateLifeRef = useRef(updateLife); updateLifeRef.current = updateLife;
  const chatRef = useRef<(index?: number) => void>(() => {});
  const { needs } = useNeeds();
  const [nearPerson, setNearPerson] = useState(false);
  const [nearPersonIndex, setNearPersonIndex] = useState(0);
  const [preaching, setPreaching] = useState(false);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [bibleOpen, setBibleOpen] = useState(false);
  const say = useCallback((text: string, big = false) => {
    setToast({ text, big });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), big ? 3200 : 2200);
  }, []);
  const jailed = life.jailUntil > 0;
  // ── Kairos Life: offline ageing, or online quick play ──
  const kl = useKairosLife(me.id);
  const offline = kl.mode === "offline";
  useEffect(() => {
    if (!offline || !kl.life) return;
    const m = Math.max(0, Math.round(kl.life.money));
    if (lifeMoneyRef.current !== m) { lifeMoneyRef.current = m; setWallet(m); }
  }, [offline, kl.life?.money]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!offline || !kl.life || lifeMoneyRef.current === null || wallet === lifeMoneyRef.current) return;
    lifeMoneyRef.current = wallet;
    kl.update((l) => ({ ...l, money: wallet }));
  }, [wallet]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lifeOpen, setLifeOpen] = useState(false);
  const [churchService, setChurchService] = useState(false);
  const lifeAlive = offline && !!kl.life?.alive;
  const lifeAvatar = useMemo(() => (offline && kl.life ? ({ ...playerAvatar, lifeAge: kl.life.age } as typeof playerAvatar) : playerAvatar), [offline, kl.life?.age, playerAvatar]);
  const tooYoungToPreachRef = useRef(false);
  const lifeName = offline && kl.life ? `${kl.life.name.first} ${kl.life.name.last}` : me.username;
  const tooYoungToPreach = offline && !!kl.life && kl.life.age < KL.PREACH_AGE;
  tooYoungToPreachRef.current = tooYoungToPreach;
  const kharis = useKharisUpdates();
  const [cut, setCut] = useState<(Cutscene & { after?: () => void }) | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  // Entering the world from the landing page opens the main menu first.
  const [menuOpen, setMenuOpen] = useState(() => { try { return new URLSearchParams(location.search).get("menu") === "1"; } catch { return false; } });
  const showMenu = !kl.mode || menuOpen;
  useEffect(() => { try { parent.postMessage({ type: "kairos-world:menu", open: showMenu }, location.origin); } catch { /* not embedded */ } }, [showMenu]);
  // Escape (with nothing else open) brings up the main menu.
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || showMenu || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"]:not(.km-menu), [aria-modal="true"], .kp-phone, .ip-room, .lh-back, .gs-studio, .lb-back, .pv-scene')) return;
      setMenuOpen(true);
    };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [showMenu]);
  const closeLesson = useCallback(() => setLesson(null), []);
  // Preview hooks for art review: ?cutscene=<set> or ?lesson=<id>.
  useEffect(() => {
    const q = new URLSearchParams(location.search), set = q.get("cutscene"), id = q.get("lesson");
    const at = q.get("leadAt")?.split(",").map(Number) as [number, number, number] | undefined;
    const lead = q.get("lead") === "preacher" ? ({ ...playerAvatar, graceAppearance: normalizeAvatar({ skin: "#6e4630", hair: "crop", hairColor: "#1c1412", top: "#f5c518", outfit: "hoodie", print: "kharis-church", trousers: "jeans", scarf: false }) } as typeof playerAvatar) : undefined;
    if (set) setCut({ set: set as Cutscene["set"], eyebrow: `Preview · ${set}`, caption: "A cutscene preview from the Kairos Life kit.", ms: 60000, lead, leadAt: at?.length === 3 ? at : undefined, pose: q.get("pose") ?? undefined, solo: q.has("solo") });
    if (id) { const l = lessonById(id); if (l) setLesson(l); }
    const sceneOf = q.get("scene");
    if (sceneOf) { const sc = scriptFor({ id: sceneOf, title: sceneOf, text: sceneOf, category: "temptation" }, "home"); setCut({ set: sc.set, eyebrow: `Preview · ${sceneOf}`, caption: `Staged scene for “${sceneOf}”.`, ms: 60000, script: sc }); }
    // ?hearing=<charge> opens a court case; ?arrest=1 shows the cuffing scene (art review and tests).
    const hearing = q.get("hearing");
    if (hearing) setTimeout(() => updateLifeRef.current((l) => ({ ...l, hearing: { stars: Number(q.get("stars") ?? 3), charge: hearing } })), 2500);
    if (q.get("arrest") === "1") setTimeout(() => setArrest(true), 1500);
    if (q.get("challenge")) setTimeout(() => setNativeChallenge(q.get("challenge")), 2500);
    const talkTo = q.get("talk");
    if (talkTo !== null) setTimeout(() => chatRef.current(Number(talkTo) || 0), 3000);
  }, []);
  const lifeOverlay = !!cut || !kl.mode || (offline && (!kl.life || !kl.life.alive || !!kl.life.pending)) || lifeOpen || churchService || menuOpen;
  useLifeClock(kl.mode, kl.life, gameDate, kl.update, garage.length > 0);
  // Cutscenes: your birth, then every year's decision or issue plays out before you choose.
  const cutFor = useRef<string>("");
  useEffect(() => {
    const l = kl.life;
    if (!offline || !l?.alive || cut) return;
    if (l.age === 0 && l.log.length === 1 && cutFor.current !== "birth") {
      cutFor.current = "birth";
      setCut({ set: "birth", eyebrow: "A new life", caption: `${l.name.first} ${l.name.last} is born in London${l.christianHome ? ", into a Christian home" : ""}. Every choice from here is yours.`, ms: 5200 });
      return;
    }
    const p = l.pending;
    const key = p ? `${l.age}:${p.id}` : "";
    if (p && cutFor.current !== key) {
      cutFor.current = key;
      const why = (p as { context?: string[] }).context?.[0];
      const script = scriptFor({ id: p.id, title: p.title, text: p.text, category: p.category }, setFor(p.category, l.age));
      setCut({ set: script.set, eyebrow: `${p.category === "temptation" ? "Temptation" : p.title} · age ${l.age}`, caption: why ? `${p.text} ${why}` : p.text, ms: why ? 7200 : 6200, script });
    }
  }, [offline, kl.life, cut]);
  // Your family appears in the world (set before the scene for a map is built).
  setWorldFamily(offline && kl.life?.alive ? [
    ...kl.life.family.filter((p) => p.alive).map((p) => ({ name: p.name, relation: p.relation, age: p.age, sex: p.sex })),
    ...(kl.life.partner ? [{ name: kl.life.partner.name, relation: kl.life.partner.married ? "spouse" : "partner", age: kl.life.age, sex: kl.life.partner.sex }] : []),
  ] : []);
  // ── Journeys: Kairos Air flights and the Kairos Clipper ferry ──
  setWorldBranch(offline && kl.life?.branch ? { city: kl.life.branch.city, name: KL.cityName(kl.life.branch.city), members: kl.life.branch.members } : null);
  // Departures board: where the next Kairos Air flight goes.
  type Destination = { mapId: string; label: string; title: string };
  const [departures, setDepartures] = useState(false);
  const [flightTo, setFlightTo] = useState<Destination>({ mapId: "highlands", label: "The Highlands", title: "Kairos Air KA214 · London → Glen Lorne" });
  const destinations: Destination[] = [
    { mapId: "highlands", label: "The Highlands", title: "Kairos Air KA214 · London → Glen Lorne" },
    ...(LIFE_WORLD.branch ? [{ mapId: "branch", label: `Kharis ${LIFE_WORLD.branch.name}`, title: `Kairos Air KA7 · London → ${LIFE_WORLD.branch.name} · visit your branch` }] : []),
  ];
  const JOURNEYS = { flight: { ms: 80_000, to: flightTo.mapId, label: flightTo.label, title: flightTo.title }, ferry: { ms: 45_000, to: "fellowship-island", label: "Fellowship Quay", title: "Kairos Clipper · London Square Pier → Fellowship Quay" } };
  const [journey, setJourney] = useState<{ id: keyof typeof JOURNEYS; start: number } | null>(null);
  const [journeyNow, setJourneyNow] = useState(0);
  useEffect(() => {
    if (mapId !== "flight" && mapId !== "ferry") { setJourney(null); return; }
    const j = { id: mapId as keyof typeof JOURNEYS, start: Date.now() };
    setJourney(j);
    if (j.id === "flight") { FLIGHT.start = j.start; FLIGHT.ms = JOURNEYS.flight.ms; }
    if (mapId === "ferry") setCut({ set: "ferry", eyebrow: "Kairos Clipper", caption: "The Clipper pulls away from London Square Pier, down the Thames towards Fellowship Quay.", ms: 4200 });
    else say("Seatbelts off. Feel free to walk the cabin.", true);
    const t = setInterval(() => {
      const left = JOURNEYS[j.id].ms - (Date.now() - j.start);
      setJourneyNow(Date.now());
      if (left <= 0) {
        clearInterval(t);
        const J = JOURNEYS[j.id];
        if (j.id === "flight") setCut({ set: "landing", eyebrow: "Kairos Air · Arrivals", caption: `Touchdown. Welcome to ${J.label}.`, ms: 4600, after: () => goTo(J.to, J.label) });
        else { say("Arriving at Fellowship Quay.", true); goTo(J.to, J.label); }
      }
    }, 500);
    return () => clearInterval(t);
  }, [mapId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (bibleOpen) kl.credit("bible"); }, [bibleOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  // 2pm: the service announcement goes out across London.
  const announced = useRef(-1);
  useEffect(() => {
    const day = Math.floor(gameDate.getTime() / 86_400_000);
    if (gameDate.getUTCHours() === 14 && announced.current !== day && (offline || gameDate.getUTCDay() === 0)) {
      announced.current = day;
      say(`Kharis Church: the 2pm service is starting now. Everyone is welcome.${kharis?.latestMessage ? ` Latest message: ${kharis.latestMessage.title}.` : ""}`, true);
    }
  }, [gameDate, offline]); // eslint-disable-line react-hooks/exhaustive-deps
  // Sunday pick-ups: drive to where they're waiting; they get in when you arrive.
  const pickupFor = (name: string) => { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const homes = PLACES.filter((p) => p.kind === "home" || p.kind === "bus"); return homes[h % homes.length] ?? PLACES[0]; };
  const setPickups = (f: (p: { name: string; status: "invited" | "collecting" | "aboard" }[]) => { name: string; status: "invited" | "collecting" | "aboard" }[]) => kl.update((l) => ({ ...l, pickups: f(l.pickups ?? []) }));
  arrivedRef.current = () => {
    const waiting = (kl.life?.pickups ?? []).find((p) => p.status === "collecting");
    if (!waiting) return;
    if (!driving) { say(`Drive here to collect ${waiting.name}. Get your car, then come back.`, true); return; }
    setPickups((ps) => ps.map((p) => p.name === waiting.name ? { ...p, status: "aboard" } : p));
    say(`${waiting.name} got in the car. Head to Kharis Church for 2pm.`, true);
  };

  useEffect(() => setXpNow(xp), [xp]);
  // Hired bikes go back to the dock by themselves when the time runs out.
  useEffect(() => {
    if (!bike) return;
    const t = setTimeout(() => setBike(null), Math.max(0, bike.until - Date.now()));
    return () => clearTimeout(t);
  }, [bike]);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
  }, []);
  const map = useMemo(() => mapId === "home" ? homeMap(home.style, home.layout) : loadMap(mapId) ?? CITY, [mapId, home.style, home.layout]);
  useEffect(() => { if (map.id !== "scripture-island" && !fading) setNativeChallenge(null); }, [map.id, fading]);
  const outdoors = Boolean(map.island) || mapId === "highlands" || mapId === "m25";
  const drivingOffence = useCallback((offence: RoadViolation) => {
    const now = Date.now();
    if (!driving || mapId !== "city" || jailed || arrest || life.hearing || pursuit?.stage === "challenge" || now - drivingOffenceAt.current < 3000) return;
    const charges: Record<RoadViolation["reason"], string> = {
      "red-light": "Driving through a red light",
      "wrong-way": "Driving against the flow of traffic",
      collision: "Causing a road collision",
      crossing: "Failing to give way at a pedestrian crossing",
    };
    drivingOffenceAt.current = now;
    updateLife(l => addStar(l, now, charges[offence.reason]));
    say(`${offence.message} +1 wanted star. Follow the road rules to keep out of trouble.`, true);
  }, [driving, mapId, jailed, arrest, life.hearing, pursuit?.stage, updateLife, say]);
  const driveCar = (car: string | null) => {
    if (!outdoors) { say("Head outside to take a car from your garage."); return; }
    if (car) {
      const spot = nearestDrivingSpot(map, PLAYER, TRAFFIC_BOXES.filter((vehicle): vehicle is NonNullable<typeof vehicle> => Boolean(vehicle)));
      if (!spot) { say("Move closer to a clear road before taking your car out."); return; }
      setArrive(spot);
      setDriving(car);
      setBike(null);
      setDealer(false);
      say("Car ready. Keep left, stop at red lights and give way at crossings. Road offences add wanted stars.", true);
    } else {
      const spot = nearestParkingSpot(map, PLAYER);
      if (!spot) { say("Pull up beside a pavement before getting out."); return; }
      setDriving(null);
      setArrive(spot);
      setDealer(false);
    }
  };
  useEffect(()=>{const scene=(e:Event)=>{const d=(e as CustomEvent<{title?:string;subtitle?:string}>).detail;if(d?.title)say(d.title.slice(0,100));};window.addEventListener("kairos-world:scene",scene);return()=>window.removeEventListener("kairos-world:scene",scene);},[say]);

  const atHome = mapId === "home";
  const lobby = useLobby(server && !atHome && !map.story ? { map: mapId, server } : null, me.id);

  useEffect(() => {
    if (TRAIN_CALL.at < 0) TRAIN_CALL.at = performance.now() - 6500;
  }, []);

  // Kairos Games currently runs the London branch only.
  useEffect(() => {
    setServer((s) => s ?? pickServer("lse", {}).id);
  }, []);

      // Keep the address bar shareable: /games/world?map=woodland&server=lse-1
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("map", mapId);
    if (server) url.searchParams.set("server", server);
    else url.searchParams.delete("server");
    window.history.replaceState(null, "", url);
  }, [mapId, server]);

  /** Taken somewhere (arrest, prison, release): fade and arrive at a set spot or the map's start. */
  const goTo = useCallback((dest: string, label: string, spot?: { x: number; y: number }) => {
    const next = loadMap(dest);
    if (!next) return;
    setBike(null);
    setDriving(null);
    setPhone(false); setInmate(null);
    setShop(null); setTube(null); setBus(null); setMapOpen(false);
    setDealer(false); setDock(false); setBankOpen(false);
    setSceneName(label);
    setFading(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setArrive(spot ?? next.spawn);
      setMapId(dest);
      setTrip((n) => n + 1);
      fadeTimer.current = setTimeout(() => setFading(false), 550);
    }, 430);
  }, []);
  // Police transport: cuffed in the back of a Met van, to court or to prison.
  const [van, setVan] = useState<"court" | "prison" | null>(null);
  const vanRef = useRef(false);
  const escort = useCallback((dest: "court" | "prison") => {
    if (vanRef.current) return;
    vanRef.current = true; setVan(dest);
    setTimeout(() => { goTo(dest, dest === "court" ? "Crown Court" : "HMP Thames"); setVan(null); vanRef.current = false; }, 5200);
  }, [goTo]);
  const adventure = useStoryAdventure(map, goTo, amount => setWallet(value => value + amount));
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Preview hook: ?at=x,y drops you at a tile on the current map.
    const at = params.get("at")?.split(",").map(Number);
    if (at?.length === 2 && at.every(Number.isFinite)) { setArrive({ x: at[0] * TILE, y: at[1] * TILE }); setTrip((n) => n + 1); }
    if (params.get("bible") === "1") setBibleOpen(true);
    else if (params.get("church") === "1") goTo("woodland", "Kharis Forest");
    else if (params.get("woodland") === "1") goTo("woodland", "Kharis Woodland");
  }, [goTo]);

  const teleportDestinations: TeleportDestination[] = useMemo(() => {
    const places: TeleportDestination[] = [
      { id: "westminster", label: "London · Westminster", mapId: "city", x: 23, y: 31 },
      { id: "city", label: "London · City centre", mapId: "city", x: 34, y: 26 },
      { id: "eye", label: "London · South Bank", mapId: "city", x: 33, y: 43 },
      { id: "riverside", label: "London · Riverside Gardens", mapId: "city", x: 146, y: 23 },
      { id: "wharf", label: "London · Wharf Gardens", mapId: "city", x: 146, y: 80 },
      { id: "mews", label: "London · Primrose Mews", mapId: "city", x: 30, y: 119 },
      { id: "orchard", label: "London · Orchard Commons", mapId: "city", x: 93, y: 97 },
      { id: "conservatory", label: "London · Conservatory Quarter", mapId: "city", x: 151, y: 128 },
      { id: "woodland", label: "Kharis Woodland", mapId: "woodland", x: 24, y: 12 },
      { id: "church", label: "Kharis Church", mapId: "church", x: 10, y: 10 },
      ...CITY.portals.filter(portal => portal.to.kind === "map" && portal.to.mapId.startsWith("station-")).map(portal => portal.to.kind === "map" ? ({ id: portal.to.mapId, label: `${portal.label} · Station`, mapId: portal.to.mapId, x: 14, y: 3 }) : null).filter((place): place is TeleportDestination => place !== null),
    ];
    return places;
  }, []);

  useEffect(() => {
    if (life.hearing && mapId !== "court" && !fading) escort("court");
  }, [life.hearing, mapId, fading, goTo]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const loan = await worldBankStatus();
      if (!loan || !active) return;
      setBankLoan(loan);
      if (loan.status === "court" && !bankCourtSeen.current && !life.bankCourtSeen && !life.hearing) {
        bankCourtSeen.current = true;
        const charge = `Failure to repay a ${loan.principal ?? loan.balance} Grace bank loan`;
        updateLife(current => ({ ...current, bankCourtSeen: true, hearing: { stars: 1, charge } }));
        setBankOpen(false);
        goTo("court", "Crown Court");
        say("The bank has referred your overdue loan to Crown Court.", true);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [life.bankCourtSeen, life.hearing, updateLife, goTo, say]);

  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==location.origin||event.source!==parent)return;
      if(event.data?.type==='kairos-world:grace-state')setGraceOpen(event.data.open===true);
      if(event.data?.type==='kairos-world:appearance')setPlayerAvatar(old=>({...old,...worldAppearance(event.data.appearance)}));
      if(event.data?.type==='kairos-world:story'&&['david','ruth','esther','daniel'].includes(event.data.story))adventure.enter(event.data.story);
      if(event.data?.type==='kairos-world:challenge'&&SCRIPTURE_CHALLENGES.some(c=>c.id===event.data.challenge)){if(map.id!=='scripture-island')goTo('scripture-island','LTBS · Scripture games');setNativeChallenge(event.data.challenge);}
      if(event.data?.type==='kairos-world:visit'){
        const id=String(event.data.destination),place=gracePlaces.find(p=>p.id===id),island=id.startsWith('island:')&&graceIslands.find(p=>p.id===id.slice(7));
        if(place){const target=loadMap(place.mapId);if(target)goTo(place.mapId,place.name,safeSpot(target,place.x*TILE,place.y*TILE));}
        else if(island)goTo(island.id,island.name);
      }
    };
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[goTo,adventure.enter,map.id]);
  useEffect(()=>{parent.postMessage({type:'kairos-world:location',mapId:map.id,name:map.name},location.origin);},[map.id,map.name]);
  useEffect(()=>{if(mapOpen){setMapOpen(false);openGrace('atlas');}},[mapOpen,openGrace]);
  useEffect(()=>{if(wardrobe){setWardrobe(false);openGrace('character');}},[wardrobe,openGrace]);
  useEffect(()=>{if(bibleOpen){setBibleOpen(false);openGrace('scripture');}},[bibleOpen,openGrace]);
  useEffect(()=>{if(miniGamesOpen){setMiniGamesOpen(false);openGrace('adventures');}},[miniGamesOpen,openGrace]);
  const [photoMode, setPhotoMode] = useState(false);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (photoMode && (e.key === "Escape" || e.key.toLowerCase() === "p")) { setPhotoMode(false); return; } if (e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=dialog]"))) setPhone(v => !v); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [photoMode]);
  // Seamless swaps: keep the last frame up until the next scene is built, then dissolve.
  const [veil, setVeil] = useState<{ src: string; fading: boolean } | null>(null);
  const holdFrame = useCallback(() => {
    const src = VEIL.take?.();
    if (src) setVeil({ src, fading: false });
  }, []);
  useEffect(() => {
    if (!veil || veil.fading) return;
    const reveal = () => { setVeil((v) => (v ? { ...v, fading: true } : v)); window.setTimeout(() => setVeil(null), 520); };
    window.addEventListener(SCENE_READY, reveal, { once: true });
    const safety = window.setTimeout(reveal, 5000);
    return () => { window.removeEventListener(SCENE_READY, reveal); clearTimeout(safety); };
  }, [veil]);
  // Kairos Mall: shop counters, and parcels the driver leaves at your door.
  const [mallDept, setMallDept] = useState<Dept | "orders" | null>(null);
  const applyWearing = useCallback((state: MallState) => {
    if (!state.wearing) return;
    setPlayerAvatar((old) => ({ ...old, ...worldAppearance({ ...((old as { graceAppearance?: object }).graceAppearance ?? {}), ...state.wearing }) }));
  }, []);
  useEffect(() => { applyWearing(readMall(localStorage, me.id)); }, [applyWearing, me.id]);
  // A small tracker while a parcel is on its way.
  const [parcel, setParcel] = useState<string | null>(null);
  useEffect(() => {
    const t = setInterval(() => {
      const next = nextDelivery(readMall(localStorage, me.id));
      if (!next) { setParcel(null); DELIVERY_RUN.current = null; return; }
      const status = orderStatus(next);
      DELIVERY_RUN.current = status === "collected" ? null : { id: next.id, status, placed: next.placed, eta: next.eta, express: next.speed === "express" };
      const left = etaSeconds(next);
      setParcel(status === "delivered" ? "Parcel at your front door" : status === "arriving" ? `Driver arriving · ${left}s` : status === "on-the-way" ? `Out for delivery · ${Math.ceil(left / 60)} min` : "Packing your order");
    }, 1000);
    return () => clearInterval(t);
  }, [me.id]);
  useEffect(() => {
    if (mapId !== "home") return;
    const { state, clothes, furniture } = collectDeliveries(readMall(localStorage, me.id));
    if (!clothes.length && !furniture.length) return;
    writeMall(localStorage, state, me.id);
    if (furniture.length) void receiveFurniture(furniture);
    const names = [...clothes.map((id) => mallItem(id)?.name), ...furniture.map((id) => mallItem(`furniture-${id}`)?.name)].filter(Boolean);
    say(`You opened your parcels: ${names.join(", ")}. Clothes are in your wardrobe (Mall · Orders); furniture is ready to place.`, true);
  }, [mapId, me.id, say]);
  // Crashes: the car or bike stops, an ambulance comes, and the paramedics take you to hospital.
  const [crashed, setCrashed] = useState<"car" | "bike" | null>(null);
  const [injury, setInjury] = useState(() => activeInjury());
  useEffect(() => { if (!injury) return; const t = setInterval(() => { const i = activeInjury(); if (!i) { setInjury(null); say("You've recovered. Back on your feet!", true); } }, 5000); return () => clearInterval(t); }, [injury, say]);
  useEffect(() => { if (injury && (driving || bike)) { setDriving(null); setBike(null); say(injury.kind === "wheelchair" ? "You can't drive or ride while you're in a wheelchair." : "Not on crutches. Wait till your leg heals.", true); } }, [injury, driving, bike, say]);
  const crash = useCallback((vehicle: "car" | "bike") => {
    if (CRASH.current) return;
    CRASH.current = { map: mapId, x: PLAYER.x / TILE, y: PLAYER.y / TILE, at: performance.now(), vehicle, car: driving, heading: 0 };
    setCrashed(vehicle);
    setDriving(null);
    setBike(null);
    play("door", soundOn());
    window.setTimeout(() => {
      CRASH.current = null;
      setCrashed(null);
      // How bad: speed, and luck. Offline, your health takes the hit, and a serious crash can end your life.
      const severity = Math.min(1, (vehicle === "car" ? 0.25 : 0.1) + Math.random() * 0.75);
      if (offline && kl.life?.alive) {
        const serious = severity > 0.92 || (severity > 0.8 && kl.life.health < 35);
        if (serious) { kl.update((l) => KL.crashed(l, { severity, fatal: true }) as typeof l); say("It was a serious crash. You didn't survive.", true); return; }
        kl.update((l) => KL.crashed(l, { severity, fatal: false }) as typeof l);
      }
      goTo("hospital", "St Thomas' Hospital");
      // Real consequences: serious crashes leave you in a wheelchair, moderate ones on crutches.
      // Offline, recovery runs on the life's clock (a few game days); online, a few minutes.
      const day = 24 * GAME_HOUR_MS;
      if (severity > 0.6) { injure("wheelchair", offline ? 3 * day : 6 * 60_000, "a serious car crash"); setInjury(activeInjury()); say("A bad crash: broken bones and a long recovery. You'll be in a wheelchair for a while.", true); return; }
      if (severity > 0.38) { injure("crutches", offline ? 1.5 * day : 3 * 60_000, "a crash"); setInjury(activeInjury()); say("You hurt your leg in the crash. You're on crutches until it heals.", true); return; }
      say(vehicle === "bike" ? "The paramedics checked you over after the bike crash: bruises, nothing broken. Wear a helmet and ride carefully!" : "The paramedics brought you in after the crash. You're shaken but OK. Slow down and keep your distance.", true);
    }, AMBULANCE_LEAVES * 1000);
  }, [mapId, driving, goTo, say, offline, kl]);
  // Growing a year older takes you to where this year's moment happens.
  const agedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!offline || !kl.life?.alive) return;
    const age = kl.life.age;
    if (agedRef.current === null) { agedRef.current = age; return; }
    if (age === agedRef.current) return;
    agedRef.current = age;
    const p = kl.life.pending as { id: string; category: string } | null;
    if (!p || jailed) return;
    const PLACES: Record<string, [string, string]> = {
      spiritual: ["church", "Kharis Church"], evangelism: ["city", "London Square"], family: ["home", "Home"], relationships: ["home", "Home"],
      health: ["hospital", "St Thomas' Hospital"], money: ["mall", "the shopping centre"], work: ["city", "the City"], school: ["kharis-hub", "school"],
      temptation: ["city", "the streets of London"], mind: ["woodland", "a quiet walk in the woods"], crime: ["court", "the court"],
    };
    const place = p.id === "persecution" ? ["airport", "the airport, on your way to the mission field"] : PLACES[p.category];
    if (!place) return;
    if (mapId !== place[0]) goTo(place[0], place[1]);
    say(`Age ${age}: this year finds you at ${place[1]}.`, true);
  }, [kl.life?.age]); // eslint-disable-line react-hooks/exhaustive-deps
  /** Where the next train you board will take you, if you asked staff for somewhere. */
  const plannedStop = useRef<RideStop | null>(null);
  /** Walk straight from the platform into a real carriage. No cutscene: the ride happens around you. */
  const boardTrain = useCallback((from: RideStop) => {
    const to = plannedStop.current && !(plannedStop.current.kind === "station" && from.kind === "station" && plannedStop.current.id === from.id) ? plannedStop.current : nextStop(from);
    plannedStop.current = null;
    // You stepped in during boarding: the doors close behind you shortly after.
    RIDE.current = { from, to, at: performance.now() - 600, leg: 0 };
    setBike(null); setDriving(null); setTube(null);
    void gainXp("train");
    play("train", soundOn());
    const door = CARRIAGE_DOORS[1];
    holdFrame();
    setArrive({ x: (door + 1) * TILE, y: 1.9 * TILE });
    setMapId("train-carriage");
    setTrip((n) => n + 1);
  }, [gainXp]);
  /** Doors open at the platform: step off into that station, or out at the end of the line. */
  const alight = useCallback(() => {
    const now = performance.now();
    const ride = RIDE.current && advanceRide(RIDE.current, now);
    if (!ride || !rideFrame(now - ride.at).canAlight) { say("Wait for the doors to open at the next station."); return; }
    RIDE.current = null;
    holdFrame();
    if (ride.to.kind === "station") {
      const inside = stationMap(ride.to.id);
      if (!inside) return;
      // The train you just left is still standing at the platform, doors open, then pulls away.
      TRAIN_CALL.at = now - 8200;
      const doorX = inside.cols / 2 - 12.7 + 6.2 + 3;
      setArrive(safeSpot(inside, doorX * TILE, 14.3 * TILE));
      setMapId(`station-${ride.to.id}`);
    } else {
      const next = loadMap(ride.to.mapId);
      if (!next) return;
      setArrive(next.spawn);
      setMapId(ride.to.mapId);
    }
    setTrip((n) => n + 1);
  }, [say]);
  // Reloading the page aboard a carriage: you're on the next train out of London Square.
  if (map.kind === "train" && !RIDE.current) {
    const from = stationStop("london-square");
    // Preview hook: ?ride=ms starts you that far into the run.
    const into = typeof location !== "undefined" ? Number(new URLSearchParams(location.search).get("ride") ?? 0) : 0;
    RIDE.current = { from, to: nextStop(from), at: performance.now() - (Number.isFinite(into) ? into : 0), leg: 0 };
  }
  const onPortal = useCallback(
    (portal: Portal) => {
      const to = portal.to;
      if (portal.id === "departures") { setDepartures(true); return; }
      if (portal.id === "branch-home") { setFlightTo({ mapId: "airport", label: "Kairos International, London", title: `Kairos Air KA8 · ${LIFE_WORLD.branch?.name ?? "Branch"} → London` }); }
      if(to.kind==='grace'){openGrace(to.route);return;}
      if (to.kind === "mall") { setMallDept(to.dept as Dept); return; }
      if (to.kind === "story-enter") { setMiniGamesOpen(false); adventure.enter(to.story); return; }
      if (to.kind === "story-discover") { adventure.discover(to.index); return; }
      if (to.kind === "scripture-challenge") { setNativeChallenge(to.challenge); return; }
      if (to.kind === "home-use") {
        const placed = map.layout?.find(item => item.key === to.key);
        const furniture = placed && furnitureById(placed.item);
        if (placed && furniture) {
          const use = homeUse(placed.item);
          const sofa = use.animation === "watch" ? map.layout?.find(p => (furnitureById(p.item)?.design ?? p.item) === "sofa") : undefined;
          const sofaSize = sofa && furnitureById(sofa.item);
          setHomeAction({ ...use, item: placed.item, x: placed.x, y: placed.y, w: furniture.w, h: furniture.h, started: performance.now(), seat: sofa && sofaSize ? { x: sofa.x, y: sofa.y, w: sofaSize.w, h: sofaSize.h } : undefined });
        }
        return;
      }
      if (jailed && to.kind !== "prison") { say("Wait out your sentence or follow the marked corridor."); return; }
      if (to.kind === "guide") {
        if (to.guide === "transport") setTube(map.id.slice("station-".length));
        else router.push("/games/arcade");
        return;
      }
      if (to.kind === "bank") { setBankOpen(true); return; }
      if (to.kind === "awards") { router.push("/games/arcade"); return; }
      if (to.kind === "prison") {
        if (to.action === "talk") setInmate(to.name ?? "Sam");
        else { releaseReason.current = "escaped"; updateLife(l=>releaseFromPrison(l)); }
        return;
      }
      if (to.kind === "game" || to.kind === "games") setMiniGamesOpen(true);
      else if (to.kind === "link") {
        // Games open as a pop-up right here instead of leaving the world.
        if (to.href === "/games" || to.href === "/games/hub" || to.href === "/games/arcade") router.push("/games/arcade");
        else router.push(to.href);
      } else if (to.kind === "bus") setBus(to.stop);
      else if (to.kind === "act") {
        play("door", soundOn());
        if (to.activity === "study") { setBibleOpen(true); return; }
        doActivity(to.activity);
        void gainXp(to.activity);
        say({sleep:"Rested and recharged",eat:"Meal enjoyed",hike:"Fresh air break complete"}[to.activity]);
      }
      else if (to.kind === "tube") {
        if (map.kind === "station") {
          if (!canBoardTrain(performance.now() - TRAIN_CALL.at, map.cols, PLAYER.x / TILE, PLAYER.y / TILE)) return;
          boardTrain(stationStop(map.id.slice("station-".length)));
          return;
        }
        setTube(to.station);
      }
      else if (to.kind === "alight") alight();
      else if (to.kind === "university") router.push("/games/world");
      else if (to.kind === "work" || to.kind === "workstation") say("Explore Kharis Church or open the Bible instead.");
      else if (to.kind === "bike") {setDock(true);}
      else if (to.kind === "dealer") setDealer(true);
      else if (to.kind === "shop") setShop(to.shop);
      else if (to.kind === "doctor") {
        play("door", soundOn());
        doActivity("hospital");
        updateLife((l) => ({ ...l, sick: false }));
        say("The doctor sorted you out. Feeling much better.", true);
      } else if (to.kind === "map" && (to.mapId === "m25" || portal.id.startsWith("slip-"))) {
        // Motorway slip roads: you keep driving straight on, no fade.
        const next = loadMap(to.mapId);
        if (!next) return;
        holdFrame();
        let arrival: { x: number; y: number; heading?: number } = next.spawn;
        if (to.mapId === "m25") arrival = driving ? { x: 2 * TILE, y: 9.5 * TILE, heading: 0 } : next.spawn;
        else if (to.mapId === "city") arrival = driving ? { x: 45 * TILE, y: 21 * TILE, heading: Math.PI } : safeSpot(next, 46 * TILE, 18 * TILE);
        else { setDriving(null); setBike(null); }
        setArrive(arrival);
        setMapId(to.mapId);
        setTrip((n) => n + 1);
        say(to.label, true);
        return;
      } else if (to.kind === "map") {
        // No bikes or cars indoors: leave them outside.
        if (to.mapId !== "city") setBike(null);
        if (to.mapId !== "city" && to.mapId !== "highlands") setDriving(null);
        const next = loadMap(to.mapId);
        if (!next) return;
        // Arrive outside the door that leads back to where you came from.
        const back = next.portals.find((p) => p.to.kind === "map" && p.to.mapId === mapId);
        const spot = back
          ? safeSpot(next, back.rect.x + back.rect.w / 2, back.rect.y + (back.rect.y + back.rect.h >= next.height - 4 ? -24 : back.rect.y > next.height / 2 ? -50 : back.rect.h + 50))
          : next.spawn;
        // Station stairs: no fade, no scene card. You walk down the steps and keep walking.
        if (isStairway(map, portal)) {
          holdFrame();
          const up = map.kind === "station" && next.island;
          setArrive(up ? safeSpot(next, (STREET_STAIRS.x + STREET_STAIRS.w / 2) * TILE, (STREET_STAIRS.y + 1.5) * TILE) : spot);
          setMapId(to.mapId);
          setTrip((n) => n + 1);
          return;
        }
        // Fade to black, swap the map underneath, then fade back in.
        play("door", soundOn());
        setSceneName(to.label);
        setFading(true);
        if (fadeTimer.current) clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(() => {
          setArrive(spot);
          setMapId(to.mapId);
          fadeTimer.current = setTimeout(() => setFading(false), 550);
        }, 430);
      }
    },
    [router, mapId, map, me.id, updateLife, say, jailed, gainXp, goTo, adventure, boardTrain, alight, driving],
  );

  // Kairos Life: a crime you were caught for becomes a wanted level in the world.
  const handledCase = useRef<string | null>(null);
  useEffect(() => {
    const c = (kl.life as { case?: { charge: string; stars: number; age: number } | null } | null)?.case;
    if (!offline || !c) return;
    const key = `${kl.life?.id}:${c.age}:${c.charge}`;
    if (handledCase.current === key) return;
    handledCase.current = key;
    updateLife((l) => { let n = l; for (let i = 0; i < c.stars; i++) n = addStar(n, Date.now(), c.charge); return n; });
    say(`Wanted for ${c.charge.toLowerCase()}. The police are looking for you.`, true);
  }, [offline, kl.life, updateLife, say]);
  useEffect(() => { ARREST_SCENE.active = arrest; }, [arrest]);
  const courtSteps = useMemo(() => {
    const p = CITY.portals.find((q) => q.id === "court");
    return p ? safeSpot(CITY, p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h + 40) : undefined;
  }, []);

  // Feeling unwell when you run yourself down: slower, until medicine or a doctor.
  useEffect(() => {
    if (needs && needs.energy < 12 && !life.sick) {
      updateLife((l) => ({ ...l, sick: true }));
      say("You feel unwell. Get medicine at Bootz (1 Grace) or see a doctor at St Tomas' Hospital.", true);
    }
  }, [needs, life.sick, updateLife, say]);

  // Police catch the player with a brief taser stop before the challenge or escort.
  useEffect(() => {
    if (life.stars < 1 || jailed || life.hearing || !outdoors) {
      pursuitRef.current = null; setPursuit(null);
      if (life.stars < 1 || jailed || life.hearing) tasedOnce.current = false;
      return;
    }
    if (arrest || policeTransport) return;
    const timer = setInterval(() => {
      const current = pursuitRef.current ?? startPursuit(map, PLAYER);
      // Once you're tased, the chase is over: no more ticks until the stop is resolved
      // (otherwise the taser/arrest screen fires again and again).
      if (current.stage === "tased" || current.stage === "challenge" || tasedOnce.current) return;
      const next = tickPursuit(current, map, PLAYER, Date.now(), 0.2);
      if (next.escaped) {
        pursuitRef.current = null; setPursuit(null);
        updateLife(clearWanted);
        say("You left the search area and lost the police. Wanted stars cleared.", true);
      } else {
        pursuitRef.current = next; setPursuit(next);
        if (next.stage === "tased") {
          tasedOnce.current = true;
          setArrest(true);
          arrestTimer.current = setTimeout(() => {
            setArrest(false);
            if (life.stars >= 4) {
              transportStars.current = life.stars;
              pursuitRef.current = null; setPursuit(null);
              setPoliceTransport(true);
            } else {
              const challenged = { ...next, stage: "challenge" as const };
              pursuitRef.current = challenged; setPursuit(challenged);
            }
          }, 3400);
        }
      }
    }, 200);
    return () => clearInterval(timer);
  }, [life.stars, life.hearing, jailed, outdoors, mapId, map, arrest, policeTransport, updateLife, say]);

  useEffect(() => {
    if (jailed && Date.now() >= life.jailUntil) {
      updateLife(l=>releaseFromPrison(l)); return;
    }
    if (jailed && mapId !== "prison") {
      // Officers cuff you and drive you to prison.
      setArrest(true);
      say("Officers cuff you and put you in the back of the van to HMP Thames.", true);
      const t = setTimeout(() => { setArrest(false); escort("prison"); }, 3600);
      return () => clearTimeout(t);
    }
    if (!jailed && mapId === "prison") {
      if (life.stars || life.heatAt || life.hearing) updateLife(releaseFromPrison);
      say(releaseReason.current === "escaped" ? "You found the service exit. Escape succeeded — your wanted stars are cleared." : "You have served your sentence. Your wanted stars are cleared.", true);
      setInmate(null);
      goTo("city", "London", courtSteps);
      releaseReason.current = "released";
    }
  }, [jailed, life, mapId, goTo, say, courtSteps, updateLife]);

  useEffect(() => {
    if (!jailed || mapId !== "prison" || inmate) return;
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - guardCaughtAt.current > 6000 && caughtByPrisonGuard(map, PLAYER, now/1000)) {
        guardCaughtAt.current = now;
        updateLife(l=>({...l,jailUntil:Math.max(l.jailUntil,now)+45000}));
        say("A guard caught your escape attempt. 45 seconds added to your sentence.", true);
        goTo("prison", "Back to your cell");
      }
    }, 250);
    return () => clearInterval(timer);
  }, [jailed, mapId, map, inmate, updateLife, say, goTo]);

  // Nearby Londoners can be approached for a friendly, opt-in conversation.
  useEffect(() => {
    const aboard = map.kind === "train";
    if (!outdoors && !aboard) { setNearPerson(false); return; }
    const t = setInterval(() => {
      let closest = -1, distance = 52;
      // On the train, the people to talk to are your fellow passengers.
      if (aboard) PASSENGERS.forEach((n, i) => { const d = Math.hypot(n.x - PLAYER.x, n.y - PLAYER.y); if (d < distance + 8) { closest = 200 + i; distance = d; } });
      else NPC_SPOTS.forEach((n, i) => { const d = Math.hypot(n.x - PLAYER.x, n.y - PLAYER.y); if (d < distance) { closest = i; distance = d; } });
      setNearPerson(closest >= 0);
      if (closest >= 0) setNearPersonIndex(closest);
    }, 300);
    return () => clearInterval(t);
  }, [outdoors, map.kind]);
  // Conversations: residents talk to you, shaped by who they are and your story.
  const [chat, setChat] = useState<Encounter | null>(null);
  const [approach, setApproach] = useState(false);
  const nextApproach = useRef(Date.now() + 25_000);
  const storyNow = useCallback((): Story => ({
    offline, age: offline ? kl.life?.age ?? null : null, saved: offline ? !!kl.life?.saved : true, stars: life.stars,
    record: offline ? (kl.life as { record?: unknown[] } | null)?.record?.length ?? 0 : life.record?.length ?? 0,
    inPrison: jailed, mapKind: map.kind, hour: gameDate.getHours(), money: offline ? kl.life?.money ?? null : null,
    job: offline ? kl.life?.job?.title ?? null : null, sunday: gameDate.getDay() === 0,
  }), [offline, kl.life, life.stars, life.record, jailed, map.kind, gameDate]);
  const openChat = useCallback((index?: number) => {
    const i = index ?? nearPersonIndex;
    const who = { index: i, name: personaFor(i).name, role: roleFor(i, map.kind, map.art === "london") };
    setApproach(false);
    setChat(encounter(who, storyNow(), Math.floor(Date.now() / 60_000) + i));
  }, [nearPersonIndex, map.kind, map.art, storyNow]);
  chatRef.current = openChat;
  // Now and then someone near you starts the conversation.
  useEffect(() => {
    if (!nearPerson || chat || preaching || jailed && map.kind !== "prison") { if (!nearPerson) setApproach(false); return; }
    if (Date.now() < nextApproach.current) return;
    nextApproach.current = Date.now() + 30_000 + Math.random() * 40_000;
    setApproach(true);
    // They walk up to you and start talking: you stop where you are.
    const t = setTimeout(() => chatRef.current?.(), 1100);
    return () => clearTimeout(t);
  }, [nearPerson, nearPersonIndex, chat, preaching, jailed, map.kind]);
  // Your family: talk to whoever's near you, and they come to you sometimes.
  const [nearFamily, setNearFamily] = useState<typeof LIFE_WORLD.near>(null);
  useEffect(() => {
    const t = setInterval(() => {
      setNearFamily((cur) => (cur?.name === LIFE_WORLD.near?.name ? cur : LIFE_WORLD.near));
      const a = LIFE_WORLD.approach;
      if (a) { LIFE_WORLD.approach = null; if (!chatRef2.current) talkFamily(a); }
    }, 400);
    return () => clearInterval(t);
  });
  const chatRef2 = useRef(false);
  chatRef2.current = Boolean(chat);
  const talkFamily = (m: NonNullable<typeof LIFE_WORLD.near>) => {
    setChat(familyEncounter(m, { saved: kl.life?.saved, age: kl.life?.age }, Math.floor(Math.random() * 1000)));
    window.dispatchEvent(new CustomEvent("kairos-life:family-call", { detail: { name: m.name, kind: "talk" } }));
  };
  // Hitting or shoving people has consequences: witnesses, wanted stars, people fighting back.
  useEffect(() => {
    const onAssault = (e: Event) => {
      const d = (e as CustomEvent<{ index: number; officer: boolean; kind: "punch" | "push"; down: boolean }>).detail;
      if (map.kind === "home") return;
      const reported = d.officer || d.kind === "punch" || Math.random() < 0.3;
      if (reported) updateLife((l) => { let n = addStar(l, Date.now(), d.officer ? "Assaulting a police officer" : d.kind === "punch" ? "Assault" : "Public disorder"); if (d.officer) n = addStar(n, Date.now(), "Assaulting a police officer"); return n; });
      const fightBack = !d.down && !d.officer && Math.random() < 0.35;
      say(d.officer ? "You hit a police officer. Backup is on the way!" : d.down ? "They go down hard. Someone screams and reaches for their phone." : fightBack ? "They swing back and catch you on the jaw!" : d.kind === "push" ? "You shove them. “Oi! What's your problem?”" : "You punch them. People are staring.", true);
      if (offline && kl.life) kl.update((l) => KL.encountered(l, { who: "A stranger", choice: d.kind === "punch" ? "You punched someone" : "You shoved someone", effect: { walk: d.kind === "punch" ? -4 : -2, happiness: -1, ...(fightBack ? { health: -6 } : {}) } }) as typeof l);
    };
    window.addEventListener("kairos-assault", onAssault);
    return () => window.removeEventListener("kairos-assault", onAssault);
  });
  // The phone's web: shop orders get delivered; the dark web has consequences.
  useEffect(() => {
    const onOrder = (e: Event) => {
      const d = (e as CustomEvent<{ item: string; speed: Speed; reply: (t: string) => void }>).detail;
      const cost = orderCost(d.item, d.speed);
      if (wallet < cost) { d.reply(`Payment declined: you need £${cost}.`); return; }
      writeMall(localStorage, placeOrder(readMall(localStorage, me.id), d.item, d.speed), me.id);
      setWallet((w) => w - cost);
      d.reply(`Order placed: ${mallItem(d.item)?.name}. A driver will bring it to your house.`);
    };
    const onDark = (e: Event) => {
      const d = (e as CustomEvent<{ item: string; reply: (t: string) => void }>).detail;
      const listing = DARK.find((x) => x.id === d.item);
      if (!listing) return;
      if (wallet < listing.price) { d.reply("Insufficient funds. Maybe that's a mercy."); return; }
      const o = buyDark(d.item)!;
      setWallet((w) => Math.max(0, w - o.paid + (o.life.money ?? 0)));
      if (o.stars) updateLife((l) => { let n = l; for (let i = 0; i < o.stars; i++) n = addStar(n, Date.now(), o.charge); return n; });
      if (offline && kl.life) { const { money: _m, ...life } = o.life; void _m; kl.update((l) => KL.encountered(l, { who: "The dark web", choice: listing.name, effect: life }) as typeof l); }
      d.reply(o.text);
      if (o.stars) say(o.text, true);
    };
    window.addEventListener("kairos-web-order", onOrder);
    window.addEventListener("kairos-web-dark", onDark);
    return () => { window.removeEventListener("kairos-web-order", onOrder); window.removeEventListener("kairos-web-dark", onDark); };
  });
  const taughtRef = useRef<string[]>([]);
  const teach = useCallback((category: string, delay = 0) => {
    const seen = [...taughtRef.current, ...(((kl.life as { seenLessons?: string[] } | null)?.seenLessons) ?? [])];
    const l = lessonAfter(category, seen);
    if (!l) return;
    taughtRef.current = [...taughtRef.current, l.id];
    if (offline && kl.life) kl.update(() => ({ ...kl.life!, seenLessons: [...(((kl.life as { seenLessons?: string[] }).seenLessons) ?? []), l.id] }) as typeof kl.life);
    setTimeout(() => setLesson(l), delay);
  }, [kl, offline]);
  const chooseChat = useCallback((c: Choice) => {
    if (!chat) return;
    const lessonCat = { need: "need", officer: "crime", guard: "prison", inmate: "prison", teen: "crime", elder: "neighbour", tourist: "neighbour", seeker: "evangelism" }[chat.who.role as string];
    if (lessonCat && c.life) teach(lessonCat, 2200);
    if (offline && kl.life && c.life) kl.update(() => KL.encountered(kl.life!, { who: chat.who.name, choice: c.label, effect: c.life }) as typeof kl.life);
    if (c.world === "hand-in") setTimeout(() => { setChat(null); updateLife((l) => ({ ...clearWanted(l), hearing: { stars: Math.max(1, l.stars - 1), charge: wantedCharge(l) } })); }, 1800);
    if (c.world === "flee") updateLife((l) => addStar(l, Date.now(), "Fleeing the police"));
    if (c.world === "preach") setTimeout(() => { setChat(null); setPreaching(true); }, 1400);
    if (c.world === "invite") { const w = chat.who; setTimeout(() => setChat(excuseEncounter(w, Math.floor(Math.random() * 1000))), 1300); }
  }, [chat, offline, kl, updateLife, teach]);
  const talk = useCallback(() => {
    const person = personaFor(nearPersonIndex).name;
    // A conversation first; preaching is one of the things you can do in it.
    if (!approach && !(tooYoungToPreachRef.current)) {
      try {
        const records = JSON.parse(localStorage.getItem(`kairos-outreach:${me.id}`) ?? "[]") as { name: string; outcome: string; followedUp?: boolean }[];
        if (records.some((record) => record.name === person && record.outcome === "contact" && !record.followedUp)) { setFollowUp(person); return; }
      } catch { /* fall through to a conversation */ }
    }
    openChat();
  }, [nearPersonIndex, me.id, approach, openChat]);
  const preachTo = useCallback(() => {
    if (tooYoungToPreachRef.current) { say(`You're too young to go out preaching on your own. From ${KL.PREACH_AGE} you can share Jesus with people.`, true); return; }
    const person = personaFor(nearPersonIndex).name;
    try {
      const records = JSON.parse(localStorage.getItem(`kairos-outreach:${me.id}`) ?? "[]") as { name: string; outcome: string; followedUp?: boolean }[];
      if (records.some((record) => record.name === person && record.outcome === "contact" && !record.followedUp)) {
        setFollowUp(person);
        return;
      }
    } catch { /* Start a new practice conversation if local notes are unavailable. */ }
    setPreaching(true);
  }, [nearPersonIndex, me.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" && nearPerson && !chat && !phone && !inmate && !arrest && !preaching && pursuit?.stage !== "challenge" && !document.querySelector('[role="dialog"]') && !(e.target instanceof HTMLElement && e.target.closest("input, textarea, button, [role=dialog]"))) talk();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [nearPerson, talk, chat, phone, inmate, arrest, preaching, pursuit?.stage]);

  // Riding the Underground: to another London station, or further afield.
  const ride = useCallback(
    (t: TubeTrip) => {
      setTube(null);
      const stop: RideStop | null = t.kind === "station"
        ? (STATIONS.some((s) => s.id === t.id) ? stationStop(t.id) : null)
        : loadMap(t.mapId) ? { kind: "map", mapId: t.mapId, name: t.label } : null;
      if (!stop) return;
      if (map.kind === "station") {
        // Chosen at the ticket hall: take the next train from this platform.
        plannedStop.current = stop;
        say(`Next train to ${stop.name}: walk onto the platform and step in when the doors open.`, true);
        return;
      }
      // Away from a station (map shortcut): you're straight onto a train from London Square.
      plannedStop.current = stop;
      boardTrain(stationStop("london-square"));
    },
    [map.kind, say, boardTrain],
  );

  // Riding the bus: travel between London stops and Kharis gathering places.
  const busRide = useCallback(
    (t: BusTrip, revised: boolean) => {
      setBus(null);
      if (revised) {
        doActivity("bus");
        void gainXp("bus");
      }
      let dest = "city";
      let spot: { x: number; y: number } | undefined;
      if (t.kind === "stop") {
        const st = BUS_STOPS.find((s) => s.id === t.id);
        if (!st) return;
        spot = safeSpot(CITY, st.exitPx.x, st.exitPx.y);
      } else {
        dest = t.mapId;
        const next = loadMap(dest);
        if (!next) return;
        spot = next.spawn;
      }
      play("train", soundOn());
      setSceneName(t.kind === "stop" ? t.name : t.label);
      setFading(true);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => {
        setArrive(spot);
        setMapId(dest);
        setTrip((n) => n + 1);
        fadeTimer.current = setTimeout(() => setFading(false), 500);
      }, 500);
    },
    [me.id, gainXp],
  );

  const countFor = (m: string, s: string) => lobby.counts[`${m}:${s}`] ?? 0;

  if (!server) {
    return <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-black">Join the Kharis London branch</h1>
      <p className="mt-2 text-sm text-muted-foreground">London is the active Kairos World. Choose a London branch server to continue.</p>
      <button type="button" onClick={() => setServer(pickServer("lse", Object.fromEntries(SERVERS.filter(s => s.region === "lse").map(s => [s.id, countFor(mapId, s.id)]))).id)} className="mt-5 min-h-11 rounded-full bg-[#f2d15b] px-6 font-black text-[#171221]">Enter London</button>
    </div>;
  }

  if (map.story) return <div className="relative h-[calc(100dvh-56px-64px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-dvh">
    <SceneMusic scene="nature" />
    <WorldView key={`${mapId}:${trip}`} map={map} serverId="solo" me={{...me,avatar:playerAvatar}} arriveAt={arrive} onPortal={onPortal} onChangeServer={adventure.leave} storyPhase={adventure.phase} paused={graceOpen || fading || adventure.phase !== "explore"} />
    <StoryWorldHud adventure={adventure}/>
    <div data-hud="story-wallet" data-tone="ink" className="absolute bottom-3 right-3 z-[100001] rounded-full bg-[#21172c]/90 px-4 py-2 text-xs font-black text-[#ffdd80]">{wallet.toLocaleString()} Grace</div>
    {fading && <div className="pointer-events-none absolute inset-0 z-[100020] grid place-items-center bg-[#171221] text-sm font-black text-[#ffdd80]">{sceneName}</div>}
  </div>;

  return (
    <div className={cn("relative h-[calc(100dvh-56px-64px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-dvh", photoMode && "kp-photo-mode")}>
      <SceneMusic scene={
        bus || map.kind === "train" ? "journey"
          : map.kind === "office" && map.id !== "kharis-hub" ? "quiet"
                  : shop || dealer || map.id === "supermarket" ? "shop"
                    : map.kind === "station" ? "station"
                      : map.art === "highlands" || map.kind === "woodland" ? "nature"
                        : map.kind === "home" ? "home"
                          : map.kind === "prison" || map.kind === "hospital" || map.kind === "court" ? "quiet"
                            : "city"
      } />
      {!(building && mapId === "home") && <WorldView
        key={`${mapId}:${server}:${trip}`}
 paused={lifeOverlay || Boolean(chat) || approach || Boolean(crashed) || Boolean(mallDept) || graceOpen || Boolean(challenge) || wardrobe || preaching || Boolean(followUp) || bibleOpen || miniGamesOpen || Boolean(bus || tube || tutorial || mapOpen || dock || dealer || fading || phone || inmate || shop || homeAction || bankOpen || life.hearing) || arrest || policeTransport || pursuit?.stage === "challenge" || pursuit?.stage === "tased"}
        homeAction={homeAction}
        police={pursuit}
        map={map}
        serverId={atHome || offline ? "solo" : server}
        arriveAt={arrive}
        onPortal={onPortal}
        onRoom={setRoom}
        onChangeServer={() => { if (jailed || life.stars >= 2) say("Finish your current law activity before changing servers."); else setServer(null); }}
        onDrivingOffence={drivingOffence}
        onCrash={crash}
        me={{ ...me, username: lifeName, avatar: jailed || mapId === "prison" ? { ...lifeAvatar, ...PRISON_LOOK } : lifeAvatar }}
        speed={injurySpeed(injury) * (life.sick ? 0.7 : 1) * (driving && outdoors ? (carById(driving)?.speed ?? 1) : bike && outdoors ? bike.brand.speed : 1)}
        car={driving && outdoors ? driving : null}
        bike={!driving && bike && outdoors ? bike.brand.colour : null}
      />}
      {developerTeleport && <DeveloperTeleport destinations={teleportDestinations} onTeleport={destination => {
        const targetMap = loadMap(destination.mapId);
        if (!targetMap) return;
        const spot = safeSpot(targetMap, destination.x * TILE + TILE / 2, destination.y * TILE + TILE / 2);
        setBankOpen(false);
        goTo(destination.mapId, destination.label, spot);
      }} />}
      {building && mapId === "home" && <HomeEditor embedded onClose={() => setBuilding(false)} claimed={home.claimed} avatar={playerAvatar} owned={home.owned} current={home.current} layout={home.layout} bought={home.furniture} clout={wallet} />}
      {mapId === "home" && !building && !homeAction && <button type="button" onClick={() => { setArrive({ x: PLAYER.x, y: PLAYER.y }); setBuilding(true); }} className="absolute top-28 right-3 z-[70] rounded-full border border-[#c8b182] bg-[#fff3d8] px-4 py-3 text-xs font-bold text-[#183b35] shadow-lg">Build & buy · arrange your home</button>}
      {homeAction && <div role="status" className="absolute bottom-24 left-1/2 z-[100002] w-64 -translate-x-1/2 rounded-2xl border border-[#c8b182] bg-[#faf6ed] p-4 text-center text-[#183b35] shadow-xl">
        <p className="font-bold">{homeAction.label}</p>
        <p className="mt-1 text-xs">{Math.round(homeAction.duration / 1000)} seconds · needs improve when you finish</p>
        <button type="button" onClick={() => setHomeAction(null)} className="mt-3 min-h-11 rounded-full bg-[#183b35] px-5 text-xs font-bold text-white">Stop activity</button>
      </div>}
      {bike && mapId === "city" && (
        <button
          type="button"
          onClick={() => setBike(null)}
          className="absolute bottom-3 left-1/2 z-[100001] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-black text-white shadow-lg"
          style={{ background: bike.brand.colour }}
        >
          Riding {bike.brand.name} · Get off
        </button>
      )}
      {dock && (
        <BikeDock
          clout={wallet}
          riding={bike?.brand ?? null}
          onRide={(b, left) => {
            setWallet(left);
            setBike({ brand: b, until: Date.now() + b.minutes * 60_000 });
            setDock(false);
            router.refresh();
          }}
          onDock={() => {
            setBike(null);
            setDock(false);
          }}
          onClose={() => setDock(false)}
        />
      )}
      {dealer && (
        <GraceWorldPanel address="garage" onClose={()=>setDealer(false)}>
        <Dealership
          clout={wallet}
          owned={garage}
          driving={driving}
          onBought={(c, left) => {
            setWallet(left);
            setGarage((g) => g.includes(c) ? g : [...g, c]);
            driveCar(c);
            setDealer(false);
            router.refresh();
          }}
          onDrive={driveCar}
          onClose={() => setDealer(false)}
        />
        </GraceWorldPanel>
      )}
      {driving && outdoors && (
        <button type="button" data-hud="action" data-tone="ink" onClick={() => driveCar(null)} className="absolute right-3 bottom-52 z-[100001] min-h-11 max-w-[55%] rounded-2xl bg-[#13203a] px-4 py-2 text-xs font-black text-white shadow-lg sm:bottom-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          Park {carById(driving)?.name}
        </button>
      )}
      <LevelBadge xp={xpNow} />
      <div data-hud="wallet" data-tone="ink" className="absolute top-14 right-3 z-[70] flex min-h-10 items-center gap-2 rounded-full border border-[#f2d15b]/60 bg-[#171221]/95 px-3 text-xs font-black text-[#f2d15b] shadow-lg" aria-label={offline ? `£${wallet.toLocaleString()} (your life's money)` : `${wallet.toLocaleString()} Grace in-game currency`}>
        <Coins className="size-4" aria-hidden /> {offline ? `£${wallet.toLocaleString()}` : `${wallet.toLocaleString()} Grace`}
      </div>
      <button type="button" data-hud="ltbs" data-tone="violet" onClick={() => setMiniGamesOpen(true)} className="absolute right-3 bottom-40 z-[100001] flex min-h-11 items-center gap-1.5 rounded-full bg-[#6d45a2] px-3 py-1.5 text-xs font-black text-white shadow-lg">
        <Gamepad2 className="size-4" aria-hidden /> LTBS · Stories & games
      </button>
      {challenge && map.id === "scripture-island" && !fading && <InPersonGame kind={challenge.type} title={challenge.title} reference={challenge.reference} onClose={()=>setNativeChallenge(null)}><section aria-label={challenge.title} className="ip-game">
        <ScriptureChallenge key={challenge.id} game={challenge} onExit={()=>setNativeChallenge(null)} onAward={(id,amount)=>{
          const current=readStorySave(),key=`challenge:${id}`;
          if(!current.completed[key]){const next={...current,grace:current.grace+amount,completed:{...current.completed,[key]:{choice:0,grace:amount}}};try{localStorage.setItem(LTBS_SAVE_KEY,JSON.stringify(next));}catch{/* Device storage optional. */}setWallet(value=>value+amount);void recordKairosActivity("scripture_game");say(`+${amount} Grace · Scripture challenge complete`);}
        }}/>
      </section></InPersonGame>}
      <WantedStars stars={life.stars} />
      {veil && <img src={veil.src} alt="" aria-hidden className={`kw-veil${veil.fading ? " out" : ""}`} />}
      {parcel && !mallDept && <button type="button" data-hud="parcel" data-tone="paper" onClick={() => setMallDept("orders")} className="absolute z-[100001] px-3 py-2 text-xs font-black">{parcel}</button>}
      {mallDept && <MallDialog dept={mallDept} playerId={me.id} clout={wallet} onClose={() => setMallDept(null)} onPaid={(left, message) => { setWallet(left); say(message, true); }} onWear={(state) => { applyWearing(state); say("Looking sharp. Your new outfit is on.", true); }} />}
      {crashed && <div role="alert" className="ks-card ks-bottom kw-crash"><p className="ks-eyebrow">{crashed === "bike" ? "Bike crash" : "Crash"}</p><h2>Are you OK?</h2><p>Someone has called 999. An ambulance is on its way, blue lights on. Stay still; the paramedics will take you to St Thomas' Hospital.</p></div>}
      {life.sick && <p className="pointer-events-none absolute top-[104px] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#c8322d] px-3 py-1 text-xs font-black text-white">Unwell: get medicine or see a doctor</p>}
      {nearPerson && (!jailed || map.kind === "prison") && !driving && !chat && (
        <button type="button" data-hud="action" data-tone="violet" onClick={talk} className={cn("absolute right-3 bottom-52 z-[100001] min-h-11 rounded-full bg-[#6d45a2] px-4 py-2 text-sm font-black text-white shadow-lg", approach && "kn-approach")}>
          <span className="flex items-center gap-2"><HeartHandshake className="size-4"/> {approach ? `${personaFor(nearPersonIndex).name} wants a word (F)` : "Talk (F)"}</span>
        </button>
      )}
      {nearPerson && !jailed && !driving && !chat && <button type="button" data-hud="action" onClick={preachTo} className="absolute right-3 bottom-[264px] z-[100001] min-h-11 rounded-full border border-white/30 bg-[#21152e]/95 px-4 py-2 text-xs font-black text-white shadow-lg">Share your faith</button>}
      {chat && <NpcDialog e={chat} onChoose={chooseChat} onClose={() => setChat(null)} />}
      <button type="button" data-hud="bible" data-tone="ink" onClick={() => setBibleOpen(true)} className="absolute left-3 bottom-24 z-[100001] flex min-h-11 items-center gap-2 rounded-full border border-[#f2d15b]/50 bg-[#171221] px-4 py-2 text-sm font-black text-[#f2d15b] shadow-lg"><BookOpen className="size-4"/> Bible</button>
      {preaching && <MinistryDialog persona={personaFor(nearPersonIndex)} onClose={() => setPreaching(false)} onDone={message => {
        void recordKairosActivity("outreach_conversation");
        kl.credit("preach", { name: personaFor(nearPersonIndex).name });
        say(message, true);
      }} />}
      {followUp && <GraceWorldPanel address="outreach/follow-up" onClose={()=>setFollowUp(null)}><FollowUpDialog person={followUp} onClose={() => setFollowUp(null)} onComplete={() => {
        void recordKairosActivity("outreach_followup");
        kl.credit("followup", { name: followUp ?? undefined });
        try {
          const key = `kairos-outreach:${me.id}`;
          const records = JSON.parse(localStorage.getItem(key) ?? "[]") as { name: string; outcome: string; followedUp?: boolean }[];
          const index = records.map((record) => record.name === followUp && record.outcome === "contact" && !record.followedUp).lastIndexOf(true);
          if (index >= 0) records[index] = { ...records[index], followedUp: true };
          localStorage.setItem(key, JSON.stringify(records));
          window.dispatchEvent(new Event("kairos-outreach-updated"));
        } catch { /* Outreach notes are optional local progress. */ }
        setFollowUp(null);
        say(`You followed up kindly with ${followUp}.`, true);
      }} /></GraceWorldPanel>}
      {pursuit && pursuit.stage !== "challenge" && pursuit.stage !== "tased" && <div role="status" className="pointer-events-none absolute top-40 left-1/2 z-[65] max-w-[60%] -translate-x-1/2 rounded-2xl bg-[#13203a]/95 px-4 py-2 text-center text-sm font-bold text-white">{pursuit.stage === "arriving" ? "Police car responding" : "Officers are searching"}<p className="text-xs text-white/80">Leave the red search circle for 6 seconds to clear your stars.{pursuit.outsideSince !== null ? ` ${Math.max(0,6-Math.floor((Date.now()-pursuit.outsideSince)/1000))}s left` : ""}</p></div>}
      {pursuit?.stage === "challenge" && <PoliceChallenge onResult={correct=>{
        tasedOnce.current = false;
        pursuitRef.current = null; setPursuit(null);
        if(correct) { updateLife(clearWanted); say("Correct. The officers let you go with a warning.",true); }
        else { setArrest(true); arrestTimer.current=setTimeout(()=>{updateLife(l=>({...clearWanted(l),hearing:{stars:l.stars,charge:wantedCharge(l)}}));setArrest(false);escort("court");},3600); }
      }}/ >}
      {arrest && <ArrestOverlay />}
      <button type="button" onClick={() => setPhone(true)} aria-label="Open phone (P)" data-hud="phone" className="kp-launch"><Smartphone className="size-5"/><span>Phone</span></button>
      {phone && <KairosPhone gameTime={gameDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} playerName={me.username}
        onClose={() => setPhone(false)}
        onMap={() => { setPhone(false); setMapOpen(true); }}
        onBible={() => { setPhone(false); setBibleOpen(true); }}
        onGrace={route => { setPhone(false); openGrace(route); }}
        onWardrobe={() => { setPhone(false); setWardrobe(true); }}
        onPhoto={() => { setPhone(false); setPhotoMode(true); }} />}
      {photoMode && <div className="kp-photo-hint" role="status">Photo mode · HUD hidden · press P or Esc to return</div>}
      <button type="button" data-hud="grace" data-tone="violet" onClick={()=>openGrace('home')} aria-label="Open Grace browser" className="absolute right-3 bottom-24 z-[100001] grid size-12 place-items-center rounded-2xl border-2 border-[#f1cc85] bg-[#58377b] text-[#fff1c8] shadow-lg"><span className="font-serif text-3xl italic">g</span></button>
      {inmate && <div className="absolute inset-0 z-[100008] grid place-items-center bg-black/60 p-4"><section role="dialog" aria-label={inmate} className="w-full max-w-md rounded-3xl bg-[#f7f1e6] p-6 text-[#13203a]"><h2 className="text-2xl font-black">{inmate}</h2><p className="mt-3 leading-relaxed">{inmate==="Sam"?"Sam is waiting for his sentence to end. The cell doors are open, but the service corridor is watched.":"The service corridor starts through the eastern wall. The gaps alternate north and south. Watch the patrolling guards; getting caught adds time."}</p><p className="mt-3 text-xs text-[#5a6272]">Scripted character dialogue — no live chat.</p><button type="button" onClick={()=>setInmate(null)} className="mt-5 rounded-full bg-[#2b5fd9] px-5 py-2 font-black text-white">End conversation</button></section></div>}
      {mapId === "court" && life.hearing && (() => {
        const h = life.hearing;
        const priors = offline ? (kl.life?.record?.length ?? 0) : (life.record?.length ?? 0);
        const c = { charge: h.charge, stars: Math.max(1, Math.min(5, h.stars)), priors, conduct: offline ? conductOf(kl.life) : priors ? -0.2 * priors : 0.15 };
        const full = fullSentence(c);
        const unit = (f: number) => offline ? `${Math.max(1, Math.round(full * f * 6))} months` : `${Math.round(sentenceMs(c.stars) * full / Math.max(1, c.stars) * f / 1000)} seconds`;
        return <JusticeDialog c={c} unit={unit} onDone={(o) => {
          const served = o.verdict === "guilty" && o.deal !== "caution" && o.deal !== "community" && o.fraction > 0;
          const months = o.verdict === "guilty" && o.deal !== "caution" && o.deal !== "community" ? Math.max(1, Math.round(full * o.fraction * 6)) : 0;
          // Offline the sentence runs on the life's clock: one game day is a year, so each month is two game hours.
          const ms = offline ? months * 2 * GAME_HOUR_MS : Math.max(15_000, sentenceMs(c.stars) * full / Math.max(1, c.stars) * o.fraction);
          updateLife((l) => ({ ...l, hearing: null, record: o.verdict === "guilty" ? [...(l.record ?? []), h.charge] : l.record ?? [], jailUntil: served ? Date.now() + ms : l.jailUntil }));
          if (offline && kl.life) kl.update(() => KL.sentenced(kl.life!, { charge: h.charge, verdict: o.verdict, months }) as typeof kl.life);
          teach(o.verdict === "guilty" ? "court" : "crime", 600);
          if (!served) {
            say(o.verdict === "acquitted" ? "Not guilty. You're free to go." : o.deal === "community" ? "Community service: you'll help at the food bank. It stays on your record." : "A formal caution. Don't let it happen again.", true);
            goTo("city", "London", courtSteps);
          }
        }} />;
      })()}
      {jailed && mapId === "prison" && (
        <PrisonHud
          leftMs={life.jailUntil - Date.now()}
        />
      )}
      {shop && (
        <ShopDialog
          shop={shop}
          clout={wallet}
          onBought={(item, left) => {
            if (left !== null) setWallet(left);
            doActivity(item === "medicine" ? "medicine" : item);
            if (item === "medicine") updateLife((l) => ({ ...l, sick: false }));
            say(item === "medicine" ? "Medicine taken. You feel better." : `${SHOP[item].name}: ${SHOP[item].blurb}`);
            setShop(null);
          }}
          onClose={() => setShop(null)}
        />
      )}
      {bankOpen && <BankDialog loan={bankLoan} clout={wallet} gameDate={gameDate} onClose={() => setBankOpen(false)} onUpdate={(loan, balance) => {
        setBankLoan(loan);
        if (balance !== undefined) setWallet(balance);
        if (loan.status === "active") updateLife(current => ({ ...current, bankCourtSeen: false }));
        if (loan.status === "paid") { updateLife(current => ({ ...current, bankCourtSeen: true })); say("Loan repaid in full. Your account is clear.", true); }
      }} />}
      {toast && (
        <div className={cn("xp-toast pointer-events-none absolute top-20 left-1/2 z-[100002] -translate-x-1/2 rounded-full px-5 py-2 font-black shadow-xl", toast.big ? "bg-[#f2d9a6] text-xl text-[#13203a]" : "bg-[#2b5fd9] text-white")} role="status">
          {toast.text}
        </div>
      )}
      {policeTransport && <PoliceTransportCutscene onArrive={() => {
        const stars = transportStars.current;
        updateLife(life => ({ ...clearWanted(life), jailUntil: Date.now() + sentenceMs(stars), hearing: null }));
        setPoliceTransport(false); setArrest(false);
        say("The police escort has arrived at HMP Thames. Your sentence has started.", true);
        goTo("prison", "HMP Thames");
      }} />}
{departures && <section role="dialog" aria-labelledby="kl-dep" className="ks-card kl-center kl-departures">
        <p className="ks-eyebrow">Kairos International · Departures</p>
        <h2 id="kl-dep">Where are you flying?</h2>
        <ul className="kl-board">{destinations.map((d) => <li key={d.mapId}><span>{d.title}</span><button type="button" className="kl-go" onClick={() => { setFlightTo(d); setDepartures(false); setCut({ set: "takeoff", eyebrow: "Kairos Air · Departures", caption: `Boarding complete. ${d.title}. Cabin crew, prepare for take-off.`, ms: 5200, after: () => goTo("flight", "Kairos Air") }); }}>Board</button></li>)}</ul>
        {!LIFE_WORLD.branch && <p className="ks-muted">Plant a Kharis branch in Kairos Life and you can fly out to visit it.</p>}
        <button type="button" className="kl-ghost" onClick={() => setDepartures(false)}>Not now</button>
      </section>}
      {journey && (() => {
        const J = JOURNEYS[journey.id], p = Math.min(1, (journeyNow - journey.start) / J.ms);
        return <section role="status" data-hud="journey" className="ks-card kl-journey">
          <p className="ks-eyebrow">{journey.id === "flight" ? (p < 0.12 ? "Taking off" : p > 0.88 ? "Landing" : "Cruising · seatbelt sign off") : "On the Thames"}</p>
          <h2>{J.title}</h2>
          <div className="kl-progress"><i style={{ width: `${p * 100}%` }} /></div>
          {journey.id === "flight" && <button type="button" className="kl-go" onClick={() => { setNearPersonIndex(Math.floor(Math.random() * 40)); setPreaching(true); }}>Talk to the passenger beside you</button>}
        </section>;
      })()}
      {/* ── Kairos Life ── */}
      {showMenu && <KairosMenu initial={kl.mode ?? "online"} onResume={kl.mode ? () => setMenuOpen(false) : undefined} onPick={(m) => { setMenuOpen(false); if (m !== kl.mode) kl.setMode(m); }} />}
      {offline && !kl.life && <NewLife onBorn={(l) => { kl.begin(l); say(`${l.name.first} ${l.name.last} was born in London.`, true); }} onOnline={() => kl.setMode("online")} />}
      {kl.mode === "online" && <button type="button" data-hud="kairos-life" className="kl-chip kl-chip-online" onClick={() => setMenuOpen(true)}><span><b>Quick play</b><small>Online · no ageing · start Kairos Life</small></span></button>}
      {lifeAlive && kl.life && <LifeChip life={kl.life} gameDate={gameDate} onOpen={() => setLifeOpen(true)} onAge={() => { kl.update((l) => ({ ...(KL.ageUp(l, Math.random, { issue: true }) as typeof l), lastDay: l.lastDay })); }} />}
      {cut && <LifeCutscene cut={cut} avatar={lifeAvatar} onDone={() => { const after = cut.after; setCut(null); after?.(); }} />}
      {lifeAlive && kl.life?.pending && !churchService && !cut && <LifeDecision life={kl.life} onChoose={(i) => { const before = kl.life!; const category = before.pending?.category ?? ""; let next = KL.choose(before, i) as typeof before & { seenLessons?: string[] }; const lesson = lessonAfter(category, (before as { seenLessons?: string[] }).seenLessons); if (lesson) { next = { ...next, seenLessons: [...(next.seenLessons ?? []), lesson.id] }; setLesson(lesson); } kl.update(() => next); if (next.notice) say(next.notice, true); }} />}
      {lesson && <MotionLesson lesson={lesson} onDone={closeLesson} />}
      {lifeAlive && kl.life && lifeOpen && <LifePanel life={kl.life} gameDate={gameDate} hasCar={garage.length > 0}
        onAct={(id) => kl.update((l) => KL.act(l, id) as typeof l)}
        onAgeUp={() => { setLifeOpen(false); kl.update((l) => ({ ...(KL.ageUp(l, Math.random, { issue: true }) as typeof l), lastDay: l.lastDay })); }}
        onPickup={(name) => {
          if (mapId !== "city") { say("Pick-ups start in London. Head back to the city first.", true); return; }
          setPickups((ps) => [...ps.filter((p) => p.name !== name), { name, status: "collecting" }]);
          const place = pickupFor(name);
          setWaypoint(place); setLifeOpen(false);
          say(`${name} is waiting near ${place.name}. Drive there to collect them.`, true);
        }}
        onOnline={() => { setLifeOpen(false); kl.setMode("online"); }}
        onClose={() => setLifeOpen(false)} />}
      {mapId === "church" && !churchService && kl.mode && (offline ? lifeAlive : true) && (isServiceTime(gameDate, offline) ? (
        <button type="button" data-hud="action" data-tone="violet" className="kl-service-go" onClick={() => {
          const guests = (kl.life?.pickups ?? []).filter((p) => p.status === "aboard").map((p) => p.name.split(" ")[0]);
          setCut({ set: "church-arrival", eyebrow: "Sunday · 2:00pm", caption: guests.length ? `You pull up outside Kharis Church with ${guests.join(" and ")}. The doors are open and the worship has started.` : "You arrive at Kharis Church. The hall is filling up and the worship team is starting.", withYou: guests, ms: 4600, after: () => setChurchService(true) });
        }}>Take a seat · 2pm service is on</button>
      ) : <p role="status" className="kl-service-go kl-quiet">The sanctuary is quiet. {offline ? "The 2pm service runs from late morning to evening." : "Services are Sundays at 2pm."}</p>)}
      {churchService && <ChurchService updates={kharis} guests={(kl.life?.pickups ?? []).filter((p) => p.status === "aboard").map((p) => p.name)} onLeave={() => setChurchService(false)} onDone={() => {
        const guests = (kl.life?.pickups ?? []).filter((p) => p.status === "aboard").map((p) => p.name);
        markAttended(guests);
        if (offline) kl.update((l) => ({ ...(KL.attendService(l, null) as typeof l), pickups: (l.pickups ?? []).filter((p) => p.status !== "aboard") }));
        for (let i = 0; i < guests.length; i++) kl.credit("followup");
        setChurchService(false);
        say(guests.length ? `${guests.join(" and ")} came to church with you.` : "You worshipped at Kharis Church.", true);
      }} />}
      {offline && kl.life && !kl.life.alive && kl.life.ending && <LifeEnding life={kl.life} avatar={playerAvatar} onAgain={() => kl.update(() => null)} />}
      <SceneWipe show={fading} label={sceneName} />
      {tutorial && <Tutorial onClose={() => {
        try { localStorage.setItem("kairos-how-to-play-seen", "seen"); } catch { /* Show again when storage is unavailable. */ }
        setTutorial(false);
      }} />}
      {mindGap && (
        <div className="pointer-events-none absolute inset-0 z-[100001] grid place-items-center" aria-live="polite">
          <p className="rounded-2xl bg-[#f6f2e8] px-5 py-3 text-lg font-black tracking-wide text-[#13203a]">Please mind the gap</p>
        </div>
      )}
      {atHome && (
        <Link href="/games/home" className="absolute right-3 bottom-3 z-[100001] rounded-full bg-[#f2d9a6] px-4 py-2 text-sm font-black text-[#0d1726] shadow-lg">
          Decorate
        </Link>
      )}
      {bus && <GraceWorldPanel address="bus-travel" onClose={()=>setBus(null)}><BusStop here={bus} stops={BUS_STOPS} onGo={busRide} onClose={() => setBus(null)} /></GraceWorldPanel>}
      {luckySpotted && !luckyOpen && (
        <button type="button" data-hud="lucky" className="lb-spotted" style={{ ["--lb" as string]: TIERS.find((x) => x.id === luckySpotted)!.colour, ["--lb-face" as string]: luckyFace(TIERS.find((x) => x.id === luckySpotted)!.colour, TIERS.find((x) => x.id === luckySpotted)!.edge) }} onClick={() => { setLuckyOpen(luckySpotted); setLuckySpotted(null); }}>
          <span className="lb-mini" aria-hidden /> You spotted a {TIERS.find((x) => x.id === luckySpotted)!.name}! Mine it
        </button>
      )}
      {luckyOpen && <LuckyBlock tier={luckyOpen} onDone={(o) => {
        setLuckyOpen(null);
        if (offline && kl.life) kl.update(() => KL.windfall(kl.life!, o) as typeof kl.life);
        else setWallet((w) => Math.max(0, w + o.coins));
        say(`${o.title}: ${o.text}`, true);
      }} />}
      <NowPlaying />
      {injury && <div className="kw-injury" data-hud="injury" role="status">{injury.kind === "wheelchair" ? "In a wheelchair" : "On crutches"} <small>after {injury.cause} · healing</small></div>}
      {van && <PoliceVan dest={van} />}
      {nearFamily && !chat && (
        <button type="button" className="kw-family-talk" data-hud="family-talk" onClick={() => talkFamily(nearFamily)}>
          Talk to {nearFamily.name.split(" ")[0]} <small>({nearFamily.relation})</small>
        </button>
      )}
      {mapId === "train-carriage" && <NextStationBoard ride={RIDE} />}
      {lifeHub && <LifeHub
        // Offline it's your life's pounds; online, Grace coins convert at £20 each so the online economy doesn't inflate.
        wallet={offline ? wallet : wallet * 20}
        setWallet={offline ? setWallet : (f) => setWallet((w) => Math.max(0, w + Math.round((f(w * 20) - w * 20) / 20)))}
        onClose={() => setLifeHub(false)} />}
      {gameShow && <GameShow avatar={lifeAvatar} onDone={(won) => {
        setGameShow(false);
        if (won > 0) {
          if (offline && kl.life) kl.update(() => KL.windfall(kl.life!, { title: `Won ${"£" + won.toLocaleString("en-GB")} on Who Wants to Be a Kairos Millionaire.`, life: { money: won, happiness: 8 } }) as typeof kl.life);
          else setWallet((w) => w + Math.round(won / 100));
        }
      }} />}
      <LifeHud avatar={lifeAvatar} name={lifeName}
        quests={quests}
        onLocate={(q) => {
          const kind = placeForTask(q.tag, q.title);
          if (!kind) return false;
          if (mapId !== "city") return false;
          setWaypoint(nearest(kind));
          return true;
        }}
      />
      {!atHome && <MiniMap map={map} searchArea={pursuit} waypoint={waypoint} onOpen={() => setMapOpen(true)} onArrive={arrived} />}
      {tube && <GraceWorldPanel address="grace-line" onClose={()=>setTube(null)}><TubeMap here={tube} stations={STATIONS} onGo={ride} onClose={() => setTube(null)} /></GraceWorldPanel>}
      {room && (
        <div className="pointer-events-none absolute inset-x-0 top-16 mx-auto w-fit rounded-full bg-brand px-4 py-2 text-sm font-black" role="status">
          {room}
        </div>
      )}
    </div>
  );
}
