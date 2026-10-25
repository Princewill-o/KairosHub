"use client";
import { LtbsHub } from "@/components/game/world/ltbs-hub";

export function ChristianArcade({ onGrace, onEnterStory, onEnterChallenge }: { onGrace?: (amount: number) => void; onEnterStory?: (story: import("@/game/core/ltbs-stories").StoryId, chapter: number) => void; onEnterChallenge?: (id:string)=>void }) {
  return <LtbsHub onGrace={onGrace} onEnterStory={onEnterStory} onEnterChallenge={onEnterChallenge} />;
}
