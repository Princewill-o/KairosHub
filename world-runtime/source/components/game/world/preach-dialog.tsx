"use client";

import { useState } from "react";
import { HeartHandshake, X } from "lucide-react";
import { BibleReader } from "@/components/bible/bible-reader";

type Encounter = {
  name: string;
  outcome: "conversation" | "contact" | "faith";
  score: number;
};
const MOMENTS = [
  {
    prompt: "They smile back, but seem a little rushed. How do you begin?",
    answers: [
      {
        text: "Ask if they have a moment to talk about faith, and accept their answer.",
        score: 2,
      },
      { text: "Start straight away with what they need to believe.", score: 0 },
      { text: "Ask how their day is going and listen first.", score: 1 },
    ],
  },
  {
    prompt: "They ask, “What does Kharis mean?” What would you share?",
    answers: [
      {
        text: "It comes from the Greek word for grace: God's unearned favour. Jesus is at the centre of our faith.",
        score: 2,
      },
      { text: "You should come to church before asking questions.", score: 0 },
      {
        text: "It means grace. Would you like me to explain what that means to me?",
        score: 2,
      },
    ],
  },
  {
    prompt:
      "They share that life has been difficult lately. How do you respond?",
    answers: [
      {
        text: "Listen without judging, ask what support they would welcome, and offer to pray only if they want.",
        score: 2,
      },
      {
        text: "Tell them faith would solve their problems if they tried harder.",
        score: 0,
      },
      {
        text: "Acknowledge what they shared and ask if they'd like to talk more.",
        score: 1,
      },
    ],
  },
];

export function PreachDialog({
  person,
  onClose,
  onComplete,
}: {
  person: string;
  onClose: () => void;
  onComplete: (result: Encounter) => void;
}) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const choose = (points: number) => {
    const total = score + points;
    setScore(total);
    if (step < MOMENTS.length - 1) {
      setStep(step + 1);
      return;
    }
    setDone(true);
  };
  const finish = (response: "faith" | "contact" | "conversation") => {
    const outcome =
      response === "faith"
        ? "faith"
        : response === "contact"
          ? "contact"
          : "conversation";
    onComplete({ name: person, outcome, score });
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-[100012] grid place-items-center bg-[#090710]/75 p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="preach-title"
        className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#171221] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between bg-[#6d45a2] px-6 py-5">
          <div>
            <p className="text-xs font-black tracking-[.2em] text-[#ffe38a] uppercase">
              Kairos World · Street conversation
            </p>
            <h2 id="preach-title" className="mt-1 text-2xl font-black">
              Talk with {person}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversation"
            className="grid size-10 place-items-center rounded-full bg-black/20"
          >
            <X className="size-5" />
          </button>
        </div>
        {!done ? (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#f4d876]">
              <HeartHandshake className="size-5" /> Ask permission · share grace
              · listen well
            </div>
            <p className="text-lg leading-relaxed">{MOMENTS[step].prompt}</p>
            <div className="mt-5 grid gap-3">
              {MOMENTS[step].answers.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(a.score)}
                  className="min-h-14 rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm leading-relaxed font-semibold hover:border-[#ffe38a]/60 hover:bg-[#6d45a2]/40"
                >
                  {a.text}
                </button>
              ))}
            </div>
            <div
              className="mt-5 flex gap-1.5"
              aria-label={`Conversation moment ${step + 1} of ${MOMENTS.length}`}
            >
              {MOMENTS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#f4d876]" : "bg-white/15"}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-lg leading-relaxed">
              {score >= 5
                ? `${person} says your kindness and the message of grace have stayed with them. They ask what it would mean to follow Jesus.`
                : score >= 3
                  ? `${person} appreciates the conversation and says they might like to talk again.`
                  : `${person} thanks you for listening. They are not ready to continue, and you respect that.`}
            </p>
            <p className="mt-3 text-sm text-white/65">
              A good conversation respects the other person's choice. Never
              pressure someone to share contact details or make a faith
              decision.
            </p>
            <div className="mt-5 grid gap-3">
              {score >= 5 && (
                <button
                  type="button"
                  onClick={() => finish("faith")}
                  className="min-h-12 rounded-full bg-[#f2d15b] px-5 font-black text-[#171221]"
                >
                  {person} chooses to begin following Jesus
                </button>
              )}
              {score >= 3 && (
                <button
                  type="button"
                  onClick={() => finish("contact")}
                  className="min-h-12 rounded-full bg-[#6d45a2] px-5 font-black"
                >
                  {person} offers to stay in touch
                </button>
              )}
              <button
                type="button"
                onClick={() => finish("conversation")}
                className="min-h-12 rounded-full border border-white/20 px-5 font-bold"
              >
                {score >= 5
                  ? "They have questions first"
                  : "End the conversation warmly"}
              </button>
              <a
                href="https://kharis.org/k-life/"
                target="_blank"
                rel="noreferrer"
                className="py-2 text-center text-sm font-bold text-[#e4c977] underline underline-offset-4"
              >
                Explore Kharis faith and next steps ↗
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function FollowUpDialog({ person, onClose, onComplete }: { person: string; onClose: () => void; onComplete: () => void }) {
  return (
    <div className="absolute inset-0 z-[100012] grid place-items-center bg-[#090710]/75 p-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="followup-title" className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#171221] p-6 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-black tracking-[.2em] text-[#ffe38a] uppercase">A kind follow-up</p>
        <h2 id="followup-title" className="mt-2 text-2xl font-black">Check in with {person}</h2>
        <p className="mt-3 leading-relaxed text-white/80">They previously chose to stay in touch. Keep the follow-up simple, respect their boundaries, and let them decide whether to continue.</p>
        <div className="mt-5 grid gap-3">
          <button onClick={onComplete} className="min-h-12 rounded-full bg-[#f2d15b] px-5 font-black text-[#171221]">Ask how they’re doing and listen</button>
          <button onClick={onComplete} className="min-h-12 rounded-full bg-[#6d45a2] px-5 font-black">Offer an invitation to a Kharis event</button>
          <button onClick={onClose} className="min-h-12 rounded-full border border-white/20 px-5 font-bold">They’re not ready; respect that</button>
        </div>
        <p className="mt-4 text-xs text-white/60">This is a fictional practice scenario. Never ask players to exchange real contact details.</p>
      </section>
    </div>
  );
}

export function BibleDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-[100012] grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bible-title"
        className="max-h-[85%] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#fffcf5] p-6 text-[#171221] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-[.2em] text-[#6d45a2] uppercase">
              Berean Standard Bible · Free Use API
            </p>
            <h2 id="bible-title" className="mt-1 text-3xl font-black">
              The Bible
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Bible"
            className="grid size-11 place-items-center rounded-full bg-black/5"
          >
            <X />
          </button>
        </div>
        <p className="mt-2 text-sm text-black/60">
          Read a chapter and carry a verse with you into London.
        </p>
        <div className="mt-4"><BibleReader compact /></div>
      </section>
    </div>
  );
}
