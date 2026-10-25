"use client";

import Link from "next/link";
import { BookOpen, CarFront, Church, Map, Phone, Trees, X } from "lucide-react";

/** In-game companion menu for Kairos Games. Calls and private contact exchange are not supported. */
export function GamePhone({
  onClose,
  onMap,
  onLocker,
  onBible,
  onGarage = onMap,
  onWoodland = onMap,
}: {
  onClose: () => void;
  onMap: () => void;
  onLocker: () => void;
  onBible: () => void;
  onGarage?: () => void;
  onWoodland?: () => void;
}) {
  const actions = [
    { name: "London map", Icon: Map, action: onMap },
    { name: "Kharis Church", Icon: Church, action: onMap },
    { name: "Kharis Woodland", Icon: Trees, action: onWoodland },
    { name: "Bible", Icon: BookOpen, action: onBible },
    { name: "Garage", Icon: CarFront, action: onGarage },
  ];

  return (
    <div className="absolute inset-0 z-[100007] flex items-end justify-end bg-black/60 p-3 md:items-center md:p-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label="Kairos companion" onClick={(e) => e.stopPropagation()} className="flex max-h-[90%] w-full max-w-xs flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-[#17121f] text-white shadow-2xl">
        <header className="flex items-center gap-3 bg-[#351563] px-5 py-4">
          <Phone className="size-5 text-[#ffd84d]" />
          <div className="flex-1"><p className="text-[10px] font-black tracking-[.25em] text-[#ffd84d] uppercase">Kairos World</p><h2 className="font-black">Your companion</h2></div>
          <button type="button" aria-label="Close menu" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10"><X className="size-5" /></button>
        </header>
        <div className="grid grid-cols-3 gap-2 p-3 text-[11px] font-bold">
          {actions.map(({ name, Icon, action }) => <button key={name} type="button" onClick={action} className="grid min-h-20 justify-items-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-3 text-center hover:bg-white/10"><Icon className="size-6 text-[#ffd84d]" />{name}</button>)}
        </div>
        <nav aria-label="Kairos World" className="grid grid-cols-2 gap-2 px-3 pb-3 text-xs font-bold">
          {[["Read the Bible", "/bible"], ["Scripture games", "/games/arcade"], ["Kharis events", "https://kharis.org/k-events/"], ["Outreach quests", "/games/world"], ["Family progress", "/games/parents"]].map(([label, href]) => <Link key={href} href={href} onClick={onClose} className="grid min-h-12 place-items-center rounded-xl bg-white px-2 py-3 text-center text-[#26133e] hover:bg-[#ffd84d]">{label}</Link>)}
        </nav>
        <div className="px-3 pb-4 text-xs">
          <button type="button" onClick={onLocker} className="min-h-11 rounded-xl border border-white/15 font-semibold hover:bg-white/10">Character</button>
        </div>
      </section>
    </div>
  );
}
