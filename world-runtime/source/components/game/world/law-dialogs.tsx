"use client";
import { useState } from "react";

import { Siren } from "lucide-react";

import { POLICE_QUESTIONS } from "@/game/core/pursuit";
import { cn } from "@/lib/utils";

export function PoliceChallenge({
  onResult,
}: {
  onResult: (correct: boolean) => void;
}) {
  const [question] = useState(
    () => POLICE_QUESTIONS[Math.floor(Math.random() * POLICE_QUESTIONS.length)],
  );
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === question.answer;
  return (
    <div className="absolute inset-0 z-[100008] grid place-items-center overflow-y-auto bg-[#13203a]/80 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Police knowledge challenge"
        className="w-full max-w-lg rounded-3xl bg-[#f7f1e6] p-6 text-[#13203a] [color-scheme:light]"
      >
        <Siren className="size-9 text-[#2b5fd9]" />
        <h2 className="mt-3 text-2xl font-black">
          One chance to talk your way out
        </h2>
        <p className="mt-2 text-sm text-[#5a6272]">
          The officers caught up. Answer correctly for a warning; a wrong answer
          sends you to a court hearing. This is a fictional game rule.
        </p>
        <p className="mt-5 text-xl font-black">{question.prompt}</p>
        <div className="mt-4 grid gap-2">
          {question.options.map((o, i) => (
            <button
              key={o}
              type="button"
              disabled={picked !== null}
              onClick={() => setPicked(i)}
              className={cn(
                "rounded-2xl border-2 bg-white p-3 text-left font-bold",
                picked !== null && i === question.answer
                  ? "border-[#15987f]"
                  : picked === i
                    ? "border-[#c8322d]"
                    : "border-transparent",
              )}
            >
              {o}
            </button>
          ))}
        </div>
        {picked !== null && (
          <>
            <p className="mt-4 text-sm">{question.explain}</p>
            <button
              type="button"
              onClick={() => onResult(correct)}
              className="mt-4 w-full rounded-full bg-[#2b5fd9] py-3 font-black text-white"
            >
              {correct ? "Accept the warning" : "Go to the hearing"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

