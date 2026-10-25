"use client";
import { islandMap } from "@/game/core/islands";
import { readStorySave, LTBS_SAVE_KEY } from "@/game/core/ltbs-stories";
import { SCRIPTURE_CHALLENGES } from "@/game/core/ltbs-challenges";
import { storyWorldMap } from "@/game/core/story-world";
import { StoryWorldHud, useStoryAdventure } from "./story-adventure";
import { COSMETICS, sanitiseAvatar } from "@/game/core/cosmetics";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BookOpen, Coins, Gamepad2, HeartHandshake, Smartphone, X } from "lucide-react";

import { play, soundOn } from "../sound";
import { NPC_SPOTS, PLAYER, TRAFFIC_BOXES } from "./art";
import { BankDialog, type BankLoan } from "./bank";
import type { BusTrip } from "./bus-stop";
import { CityMap, MiniMap, type Place, nearest, placeForTask } from "./city-map";
import { DeveloperTeleport, type TeleportDestination } from "./developer-teleport";
import { PoliceChallenge } from "./law-dialogs";
import { ArrestOverlay, HearingDialog, PrisonHud, ShopDialog, WantedStars } from "./life";
import { LevelBadge, LifeHud, type Quest } from "./life-hud";
import { PoliceTransportCutscene } from "./police-transport-cutscene";
import { SceneWipe, Tutorial } from "./scene";
import { SceneMusic } from "./scene-music";
import { TRAIN_CALL } from "./train-state";
import { BikeDock, Dealership } from "./transport";
import type { TubeTrip } from "./tube-map";
import { useLife } from "./use-life";
import { useNeeds, doActivity } from "./use-needs";
import { type Me, useLobby } from "./use-world";
import { WorldView } from "./world-view";
import { BibleDialog, FollowUpDialog, PreachDialog } from "./preach-dialog";
const GamePhone = dynamic(() => import("./game-phone").then((module) => module.GamePhone), { ssr: false, loading: () => null });
const ToyWardrobe = dynamic(() => import("./toy-wardrobe").then(module => module.ToyWardrobe), { ssr: false });
const BusStop = dynamic(() => import("./bus-stop").then((module) => module.BusStop), { ssr: false, loading: () => null });
const TubeMap = dynamic(() => import("./tube-map").then((module) => module.TubeMap), { ssr: false, loading: () => null });
const HomeEditor = dynamic(() => import("../../careers/home-editor").then(module => module.HomeEditor), { ssr: false });
const ChristianArcade = dynamic(() => import("../../arcade/christian-arcade").then((module) => module.ChristianArcade), { ssr: false });
const ScriptureChallenge = dynamic(() => import("./ltbs-hub").then(module => module.Challenge), { ssr: false });

const TrainCutscene = dynamic(() => import("./train-cutscene").then((module) => module.TrainCutscene), { ssr: false, loading: () => null });

import { earnWorldXp, worldBankStatus } from "@/app/games/world/actions";
import { recordKairosActivity } from "@/lib/game/kairos-activity";
import type { BikeBrand } from "@/game/core/bikes";
import { carById } from "@/game/core/cars";
import { nearestDrivingSpot, nearestParkingSpot } from "@/game/core/driving";
import { gameDateAt } from "@/game/core/game-clock";
import { type Placed, type HomeAction, furnitureById, homeUse } from "@/game/core/homes";
import { PRISON_LOOK, SHOP, releaseFromPrison, addStar, clearWanted, wantedCharge, sentenceMs } from "@/game/core/law";
import { type Pursuit, startPursuit, tickPursuit, caughtByPrisonGuard } from "@/game/core/pursuit";
import type { RoadViolation } from "@/game/core/traffic-rules";
import { canBoardTrain } from "@/game/core/train";
import {
  CITY,
  churchMap, woodlandMap, kharisHubMap,
  STATION_PLATFORM_Y,
  TILE,
  stationMap,
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
  const [wardrobe, setWardrobe] = useState(false);
  const [playerAvatar, setPlayerAvatar] = useState(me.avatar);
  const avatarStorageKey = `kairos-toy-avatar:${me.id.startsWith("kairos-guest-") ? "guest" : me.id}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(avatarStorageKey);
      if (saved) setPlayerAvatar(sanitiseAvatar(JSON.parse(saved), new Set(COSMETICS.map(item => item.id))));
    } catch { /* Optional device-local appearance. */ }
  }, [avatarStorageKey]);
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
  const arrived = useCallback(() => setWaypoint(null), []);
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
  useEffect(() => { setWallet(clout + readStorySave().grace); }, [clout]);
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
  const boardedStation = useRef<string | null>(null);
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
  useEffect(() => () => { if (arrestTimer.current) clearTimeout(arrestTimer.current); }, []);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("phone") === "1") setPhone(true); }, []);
  const [arrest, setArrest] = useState(false);
  const [policeTransport, setPoliceTransport] = useState(false);
  const transportStars = useRef(4);
  const { life, update: updateLife } = useLife(me.id,wantedResetToken);
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
  const [journey, setJourney] = useState<{ to: string; go: () => void } | null>(null);

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
  const outdoors = Boolean(map.island) || mapId === "highlands";
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
  const adventure = useStoryAdventure(map, goTo, amount => setWallet(value => value + amount));
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
    if (life.hearing && mapId !== "court" && !fading) goTo("court", "Crown Court");
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

  const onPortal = useCallback(
    (portal: Portal) => {
      const to = portal.to;
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
          boardedStation.current = map.id;
        }
        setTube(to.station);
      }
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
    [router, mapId, map, me.id, updateLife, say, jailed, gainXp, goTo, adventure],
  );

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
      pursuitRef.current = null; setPursuit(null); return;
    }
    if (arrest || policeTransport) return;
    const timer = setInterval(() => {
      const current = pursuitRef.current ?? startPursuit(map, PLAYER);
      const next = tickPursuit(current, map, PLAYER, Date.now(), 0.2);
      if (next.escaped) {
        pursuitRef.current = null; setPursuit(null);
        updateLife(clearWanted);
        say("You left the search area and lost the police. Wanted stars cleared.", true);
      } else {
        pursuitRef.current = next; setPursuit(next);
        if (next.stage === "tased") {
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
          }, 1700);
        }
      }
    }, 200);
    return () => clearInterval(timer);
  }, [life.stars, life.hearing, jailed, outdoors, mapId, map, arrest, policeTransport, updateLife, say]);

  useEffect(() => {
    if (jailed && Date.now() >= life.jailUntil) {
      updateLife(l=>releaseFromPrison(l)); return;
    }
    if (jailed && mapId !== "prison") goTo("prison", "HMP Thames");
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
    if (!outdoors) { setNearPerson(false); return; }
    const t = setInterval(() => {
      let closest = -1, distance = 52;
      NPC_SPOTS.forEach((n, i) => { const d = Math.hypot(n.x - PLAYER.x, n.y - PLAYER.y); if (d < distance) { closest = i; distance = d; } });
      setNearPerson(closest >= 0);
      if (closest >= 0) setNearPersonIndex(closest);
    }, 300);
    return () => clearInterval(t);
  }, [outdoors]);
  const talk = useCallback(() => {
    const person = ["Amina", "Daniel", "Grace", "Jordan", "Maya", "Noah", "Sam", "Talia"][nearPersonIndex % 8];
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
      if (e.key.toLowerCase() === "f" && nearPerson && !phone && !inmate && !arrest && !preaching && pursuit?.stage !== "challenge" && !document.querySelector('[role="dialog"]') && !(e.target instanceof HTMLElement && e.target.closest("input, textarea, button, [role=dialog]"))) talk();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [nearPerson, talk, phone, inmate, arrest, preaching, pursuit?.stage]);

  // Riding the Underground: to another London station, or further afield.
  const ride = useCallback(
    (t: TubeTrip) => {
      if (map.kind === "station" && boardedStation.current !== map.id) return;
      boardedStation.current = null;
      setTube(null);
      let dest = "city";
      let spot: { x: number; y: number } | undefined;
      if (t.kind === "station") {
        const st = STATIONS.find((s) => s.id === t.id);
        const inside = stationMap(t.id);
        if (!st || !inside) return;
        // Ride inside the carriage, then step off onto the other station's platform.
        setBike(null);
        // The player has already walked into a stopped train before choosing a destination.
        void gainXp("train"); setJourney({
          to: st.name,
          go: () => {
            setJourney(null);
            setArrive(safeSpot(inside, inside.width / 2, (STATION_PLATFORM_Y + 0.5) * TILE));
            TRAIN_CALL.at = performance.now() - 6500;
            setMapId(`station-${t.id}`);
            setTrip((n) => n + 1);
          },
        });
        play("train", soundOn());
        return;
      } else {
        dest = t.mapId;
        const next = loadMap(dest);
        if (!next) return;
        spot = next.spawn;
        if (dest === "highlands") {
          // The long way north: ride the train, then step out at Glen Lorne.
          setBike(null);
          setJourney({
            to: "Glen Lorne",
            go: () => {
              setJourney(null);
              setArrive(spot);
              setMapId(dest);
              setTrip((n) => n + 1);
            },
          });
          play("train", soundOn());
          return;
        }
      }
      play("train", soundOn());
      setMindGap(true);
      setSceneName(t.kind === "map" ? t.label : "London");
      setFading(true);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => {
        setArrive(spot);
        setMapId(dest);
        setTrip((n) => n + 1);
        fadeTimer.current = setTimeout(() => {
          setFading(false);
          setMindGap(false);
        }, 650);
      }, 700);
    },
    [me.id, gainXp, map.kind, map.id],
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
    <WorldView key={`${mapId}:${trip}`} map={map} serverId="solo" me={{...me,avatar:playerAvatar}} arriveAt={arrive} onPortal={onPortal} onChangeServer={adventure.leave} storyPhase={adventure.phase} paused={fading || adventure.phase !== "explore"} />
    <StoryWorldHud adventure={adventure}/>
    <div className="absolute bottom-3 right-3 z-[100001] rounded-full bg-[#21172c]/90 px-4 py-2 text-xs font-black text-[#ffdd80]">{wallet.toLocaleString()} Grace</div>
    {fading && <div className="pointer-events-none absolute inset-0 z-[100020] grid place-items-center bg-[#171221] text-sm font-black text-[#ffdd80]">{sceneName}</div>}
  </div>;

  return (
    <div className="relative h-[calc(100dvh-56px-64px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-dvh">
      <SceneMusic scene={
        journey || bus ? "journey"
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
        paused={Boolean(challenge) || wardrobe || preaching || Boolean(followUp) || bibleOpen || miniGamesOpen || Boolean(bus || tube || tutorial || mapOpen || dock || dealer || journey || fading || phone || inmate || shop || homeAction || bankOpen || life.hearing) || arrest || policeTransport || pursuit?.stage === "challenge" || pursuit?.stage === "tased"}
        homeAction={homeAction}
        police={pursuit}
        map={map}
        serverId={atHome ? "solo" : server}
        arriveAt={arrive}
        onPortal={onPortal}
        onRoom={setRoom}
        onChangeServer={() => { if (jailed || life.stars >= 2) say("Finish your current law activity before changing servers."); else setServer(null); }}
        onDrivingOffence={drivingOffence}
        me={{ ...me, avatar: jailed || mapId === "prison" ? { ...playerAvatar, ...PRISON_LOOK } : playerAvatar }}
        speed={(life.sick ? 0.7 : 1) * (driving && outdoors ? (carById(driving)?.speed ?? 1) : bike && outdoors ? bike.brand.speed : 1)}
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
      )}
      {driving && outdoors && (
        <button type="button" onClick={() => driveCar(null)} className="absolute right-3 bottom-52 z-[100001] min-h-11 max-w-[55%] rounded-2xl bg-[#13203a] px-4 py-2 text-xs font-black text-white shadow-lg sm:bottom-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          Park {carById(driving)?.name}
        </button>
      )}
      <LevelBadge xp={xpNow} />
      <div className="absolute top-14 right-3 z-[70] flex min-h-10 items-center gap-2 rounded-full border border-[#f2d15b]/60 bg-[#171221]/95 px-3 text-xs font-black text-[#f2d15b] shadow-lg" aria-label={`${wallet.toLocaleString()} Grace in-game currency`}>
        <Coins className="size-4" aria-hidden /> {wallet.toLocaleString()} Grace
      </div>
      <button type="button" onClick={() => setMiniGamesOpen(true)} className="absolute right-3 bottom-40 z-[100001] flex min-h-11 items-center gap-1.5 rounded-full bg-[#6d45a2] px-3 py-1.5 text-xs font-black text-white shadow-lg">
        <Gamepad2 className="size-4" aria-hidden /> LTBS · Stories & games
      </button>
      {miniGamesOpen && <div className="absolute inset-0 z-[100010] grid place-items-center overflow-y-auto bg-[#171221]/80 p-2 backdrop-blur-sm sm:p-5">
        <section role="dialog" aria-modal="true" aria-label="LTBS Bible story worlds and Scripture games" className="relative max-h-full w-full max-w-5xl overflow-y-auto rounded-3xl bg-[#f8f4fb] p-2 shadow-2xl sm:p-4">
          <button type="button" onClick={() => setMiniGamesOpen(false)} aria-label="Close mini-games" className="sticky top-2 z-10 ml-auto grid size-11 place-items-center rounded-full bg-[#26133e] text-white shadow-lg"><X className="size-5" /></button>
          <ChristianArcade onEnterChallenge={id => { setNativeChallenge(id); setMiniGamesOpen(false); if(map.id !== "scripture-island")goTo("scripture-island","LTBS · Scripture activity trail"); }} onEnterStory={(story,chapter) => { setMiniGamesOpen(false); adventure.enter(story,chapter); }} onGrace={amount => { setWallet(value => value + amount); say(`+${amount} Grace · LTBS chapter progress saved`); }} />
        </section>
      </div>}
      {challenge && map.id === "scripture-island" && !fading && <section aria-label={challenge.title} className="absolute bottom-4 right-3 z-[100006] max-h-[70%] w-[min(620px,calc(100%-1.5rem))] overflow-y-auto rounded-3xl border border-[#ffdd80]/40 bg-[#20182b]/95 text-white shadow-2xl backdrop-blur">
        <ScriptureChallenge key={challenge.id} game={challenge} onExit={()=>setNativeChallenge(null)} onAward={(id,amount)=>{
          const current=readStorySave(),key=`challenge:${id}`;
          if(!current.completed[key]){const next={...current,grace:current.grace+amount,completed:{...current.completed,[key]:{choice:0,grace:amount}}};try{localStorage.setItem(LTBS_SAVE_KEY,JSON.stringify(next));}catch{/* Device storage optional. */}setWallet(value=>value+amount);void recordKairosActivity("scripture_game");say(`+${amount} Grace · Scripture challenge complete`);}
        }}/>
      </section>}
      <WantedStars stars={life.stars} />
      {life.sick && <p className="pointer-events-none absolute top-[104px] left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#c8322d] px-3 py-1 text-xs font-black text-white">Unwell: get medicine or see a doctor</p>}
      {nearPerson && !jailed && !driving && (
        <button type="button" onClick={talk} className="absolute right-3 bottom-52 z-[100001] min-h-11 rounded-full bg-[#6d45a2] px-4 py-2 text-sm font-black text-white shadow-lg">
          <span className="flex items-center gap-2"><HeartHandshake className="size-4"/> Preach / talk (F)</span>
        </button>
      )}
      <button type="button" onClick={() => setBibleOpen(true)} className="absolute left-3 bottom-24 z-[100001] flex min-h-11 items-center gap-2 rounded-full border border-[#f2d15b]/50 bg-[#171221] px-4 py-2 text-sm font-black text-[#f2d15b] shadow-lg"><BookOpen className="size-4"/> Bible</button>
      {preaching && <PreachDialog person={["Amina","Daniel","Grace","Jordan","Maya","Noah","Sam","Talia"][nearPersonIndex % 8]} onClose={() => setPreaching(false)} onComplete={result => {
        void recordKairosActivity("outreach_conversation");
        try {
          const key = `kairos-outreach:${me.id}`;
          const previous = JSON.parse(localStorage.getItem(key) ?? "[]") as { name: string; outcome: string; at: number }[];
          localStorage.setItem(key, JSON.stringify([...previous, { name: result.name, outcome: result.outcome, at: Date.now() }].slice(-100)));
          window.dispatchEvent(new Event("kairos-outreach-updated"));
        } catch { /* Outreach notes are optional local progress. */ }
        say(result.outcome === "faith" ? `${result.name} chose to follow Jesus. Offer a warm welcome and support.` : result.outcome === "contact" ? `${result.name} chose to stay in touch.` : `${result.name} appreciated being heard.`, true);
      }} />}
      {followUp && <FollowUpDialog person={followUp} onClose={() => setFollowUp(null)} onComplete={() => {
        void recordKairosActivity("outreach_followup");
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
      }} />}
      {bibleOpen && <BibleDialog onClose={() => setBibleOpen(false)} />}
      {pursuit && pursuit.stage !== "challenge" && pursuit.stage !== "tased" && <div role="status" className="pointer-events-none absolute top-40 left-1/2 z-[65] max-w-[60%] -translate-x-1/2 rounded-2xl bg-[#13203a]/95 px-4 py-2 text-center text-sm font-bold text-white">{pursuit.stage === "arriving" ? "Police car responding" : "Officers are searching"}<p className="text-xs text-white/80">Leave the red search circle for 6 seconds to clear your stars.{pursuit.outsideSince !== null ? ` ${Math.max(0,6-Math.floor((Date.now()-pursuit.outsideSince)/1000))}s left` : ""}</p></div>}
      {pursuit?.stage === "challenge" && <PoliceChallenge onResult={correct=>{
        pursuitRef.current = null; setPursuit(null);
        if(correct) { updateLife(clearWanted); say("Correct. The officers let you go with a warning.",true); }
        else { setArrest(true); arrestTimer.current=setTimeout(()=>{updateLife(l=>({...clearWanted(l),hearing:{stars:l.stars,charge:wantedCharge(l)}}));setArrest(false);goTo("court","Crown Court");},2600); }
      }}/ >}
      {arrest && <ArrestOverlay />}
      <button type="button" onClick={()=>setPhone(true)} aria-label="Open your game phone" className="absolute right-3 bottom-24 z-[100001] grid size-12 place-items-center rounded-2xl border-2 border-white bg-[#13203a] text-white shadow-lg"><Smartphone className="size-6"/></button>
      {phone && <GamePhone onGarage={() => { setPhone(false); if (outdoors && !jailed) setDealer(true); else say("Head outside to open your garage."); }} onBible={() => { setPhone(false); setBibleOpen(true); }} onWoodland={()=>{setPhone(false);setMapOpen(true);say("Take the Grace Line to Kharis Forest. The church is beyond the woodland trail.",true);}} onClose={()=>setPhone(false)} onMap={()=>{setPhone(false);setMapOpen(true);}} onLocker={()=>{setPhone(false);setWardrobe(true);}} />}
      {wardrobe && <ToyWardrobe initial={playerAvatar} onClose={()=>setWardrobe(false)} onApply={avatar=>{setPlayerAvatar(avatar);try{localStorage.setItem(avatarStorageKey,JSON.stringify(avatar));}catch{/* Optional device storage. */}setWardrobe(false);say("Your new look is ready.");}} />}
      {inmate && <div className="absolute inset-0 z-[100008] grid place-items-center bg-black/60 p-4"><section role="dialog" aria-label={inmate} className="w-full max-w-md rounded-3xl bg-[#f7f1e6] p-6 text-[#13203a]"><h2 className="text-2xl font-black">{inmate}</h2><p className="mt-3 leading-relaxed">{inmate==="Sam"?"Sam is waiting for his sentence to end. The cell doors are open, but the service corridor is watched.":"The service corridor starts through the eastern wall. The gaps alternate north and south. Watch the patrolling guards; getting caught adds time."}</p><p className="mt-3 text-xs text-[#5a6272]">Scripted character dialogue — no live chat.</p><button type="button" onClick={()=>setInmate(null)} className="mt-5 rounded-full bg-[#2b5fd9] px-5 py-2 font-black text-white">End conversation</button></section></div>}
      {mapId === "court" && life.hearing && (
        <HearingDialog
          charge={life.hearing.charge}
          stars={life.hearing.stars}
          onVerdict={(v) => {
            const h = life.hearing!;
            if (v === "guilty") {
              updateLife((l) => ({ ...l, hearing: null, jailUntil: Date.now() + sentenceMs(h.stars) }));
            } else {
              updateLife((l) => ({ ...l, hearing: null }));
              say("Not guilty. You're free to go.", true);
              goTo("city", "London", courtSteps);
            }
          }}
        />
      )}
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
      {journey && <TrainCutscene to={journey.to} line="Grace" avatar={playerAvatar} onArrive={journey.go} />}
      {policeTransport && <PoliceTransportCutscene onArrive={() => {
        const stars = transportStars.current;
        updateLife(life => ({ ...clearWanted(life), jailUntil: Date.now() + sentenceMs(stars), hearing: null }));
        setPoliceTransport(false); setArrest(false);
        say("The police escort has arrived at HMP Thames. Your sentence has started.", true);
        goTo("prison", "HMP Thames");
      }} />}
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
      {bus && <BusStop here={bus} stops={BUS_STOPS} onGo={busRide} onClose={() => setBus(null)} />}
      <LifeHud avatar={playerAvatar} name={me.username}
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
      {mapOpen && <CityMap map={map} searchArea={pursuit} waypoint={waypoint} onPick={setWaypoint} onClose={() => setMapOpen(false)} />}
      {tube && <TubeMap here={tube} stations={STATIONS} onGo={ride} onClose={() => setTube(null)} />}
      {room && (
        <div className="pointer-events-none absolute inset-x-0 top-16 mx-auto w-fit rounded-full bg-brand px-4 py-2 text-sm font-black" role="status">
          {room}
        </div>
      )}
    </div>
  );
}