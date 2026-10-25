"use client";

import { useState } from "react";

import { BookOpen, Footprints, Gamepad2, HeartHandshake, Map, Smartphone, Trees, X } from "lucide-react";

import { CutsceneBrand, sceneBrandFor } from "./cutscene-brand";

/**
 * Motion-graphic scene change: two blue panels sweep in, the hexagon badge spins
 * in with the place name, then the panels sweep away to reveal the new scene.
 */
export function SceneWipe({ show, label }: { show: boolean; label: string }) {
  return (
    <div aria-hidden={!show} className="pointer-events-none absolute inset-0 z-[100001] overflow-hidden">
      <div className={`scene-panel scene-panel-a ${show ? "scene-in" : ""}`} />
      <div className={`scene-panel scene-panel-b ${show ? "scene-in" : ""}`} />
      <div className={`scene-title absolute inset-0 grid place-items-center ${show ? "scene-title-in" : ""}`}>
        <div className="flex items-center gap-3 rounded-2xl bg-[#f6f2e8] px-5 py-3 shadow-xl">
          <span className="scene-badge"><CutsceneBrand kind={sceneBrandFor(label)} compact /></span>
          <span className="text-xl font-black text-[#13203a]">{label}</span>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: Footprints,
    title: "Welcome to Kairos World",
    body: "Explore London, the Kharis Church grounds and the woodland paths. Use W A S D or the arrow keys to walk, and Space to jump; on a phone or tablet, use the joystick. Clicks select menus and activities. Press E or tap a glowing marker to enter a place.",
    hint: "Open the map to find Kharis Church and the woodland gathering spaces.",
  },
  {
    icon: HeartHandshake,
    title: "Meet people with care",
    body: "Walk near a Londoner and press F (or tap Talk) to begin a scripted conversation. Ask permission, listen, and share your faith kindly if they want to hear. Each person chooses whether to continue or stay in touch.",
    hint: "Respect a no. NPC responses are fictional practice, and faith is never a score or reward.",
  },
  {
    icon: BookOpen,
    title: "Read the Bible in your phone",
    body: "Open Bible for a chapter reader, choose a book and chapter, or return to a daily passage. The reader uses a free Bible text API when it is available.",
    hint: "You can read at any time, wherever you are in the world.",
  },
  {
    icon: Gamepad2,
    title: "Play Scripture mini-games in the city",
    body: "Tap Mini-games any time for a Bible quiz, verse-memory challenge or kind-conversation practice. Your practice points stay on this device and do not measure anyone's faith.",
    hint: "Close the game panel to return to the street without losing your place.",
  },
  {
    icon: Trees,
    title: "Find space to gather",
    body: "Follow the woodland path for quiet clearings, benches and an outdoor meeting lodge. Kharis community rooms include a fellowship table, prayer corner and team offices. The main church interior is intentionally an open blank hall for now.",
    hint: "These are gathering places for conversation, reflection and community events.",
  },
  {
    icon: Smartphone,
    title: "Grace is your game currency",
    body: "Grace is a playful in-game currency used by a few optional city activities. It has no cash value, is not connected to donations, and is never awarded for a person's faith decision.",
    hint: "Your Grace balance appears in the game HUD and spending menus.",
  },
  {
    icon: Map,
    title: "Travel around London",
    body: "Each place is now its own island. Enter a station, walk through an open train door, choose an island on the Grace Line map, then follow Way Out at your destination. Kharis Church is reached through Kharis Forest.",
    hint: "Use the map and glowing entrances to find your next stop.",
  },
];

export const TUTORIAL_KEY = "world-tutorial-v4";

/** First-visit walkthrough of how London works (reopen any time with "How to play"). */
export function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const Icon = s.icon;
  return (
    <div className="absolute inset-0 z-[100000] grid place-items-center bg-black/55 p-2 sm:p-3">
      <div role="dialog" aria-modal="true" aria-label="How to play" className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#f7f1e6] text-[#13203a]">
        <div className="relative h-20 shrink-0 overflow-hidden bg-[#2b5fd9] sm:h-24 [@media(max-height:450px)]:h-14">
          <div className="tutorial-rings absolute inset-0" />
          <span key={i} className="tutorial-pop absolute top-1/2 left-1/2 grid size-12 place-items-center rounded-2xl bg-[#f6f2e8] shadow-lg">
            <Icon className="size-6 text-[#2b5fd9]" aria-hidden />
          </span>
          <button type="button" onClick={onClose} aria-label="Skip the tutorial" className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-white/90">
            <X className="size-4" />
          </button>
        </div>
        <div key={`t${i}`} className="tutorial-text min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <p className="text-xs font-black tracking-[0.25em] text-[#2b5fd9] uppercase">
            How to play · {i + 1} of {STEPS.length}
          </p>
          <h2 className="mt-1 text-xl font-black">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed">{s.body}</p>
          <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-bold">{s.hint}</p>
          <div className="mt-4 flex items-center gap-1.5">
            {STEPS.map((_, k) => (
              <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-[#2b5fd9]" : "bg-[#13203a]/15"}`} />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2 border-t border-[#13203a]/10 p-3 pt-2">
          {i > 0 && (
            <button type="button" onClick={() => setI(i - 1)} className="min-h-11 flex-1 rounded-full bg-white px-3 py-2 text-sm font-black">
              Back
            </button>
          )}
          <button type="button" onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : onClose())} className="min-h-11 flex-1 rounded-full bg-[#2b5fd9] px-3 py-2 text-sm font-black text-white">
            {i < STEPS.length - 1 ? "Next" : "Start playing"}
          </button>
        </div>
      </div>
    </div>
  );
}
