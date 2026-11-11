"use client";
import type { ReactNode } from "react";
import type { Avatar } from "@/game/core/cosmetics";
import { SkinBust } from "../skin-bust";

/** Who runs each kind of table on Scripture Island. */
const HOSTS: Record<string, { name: string; line: string; look: Avatar }> = {
  quiz: { name: "Auntie Grace", line: "Pull up a stool. I'll ask, you answer. No phones!", look: { graceAppearance: { skin: "#8a5a3c", hair: "puffs", hairColor: "#241a18", frame: "fem", outfit: "dress", top: "#a44760", hat: "none", glasses: true } } as unknown as Avatar },
  order: { name: "Brother Tobi", line: "The cards are face up. Slide them into order on the table.", look: { graceAppearance: { skin: "#6e4630", hair: "crop", hairColor: "#241a18", frame: "masc", outfit: "jacket", top: "#367c73", face: "beard" } } as unknown as Avatar },
  pairs: { name: "Sister Mei", line: "Turn two cards that belong together. Take your time.", look: { graceAppearance: { skin: "#e9c09a", hair: "bob", hairColor: "#241a18", frame: "fem", outfit: "tunic", top: "#3d8bd9" } } as unknown as Avatar },
};

/**
 * LTBS challenges as an in-person game: you sit at a wooden table on Scripture
 * Island with a host across from you; answers are cards on the table.
 * The world stays visible behind (no browser window).
 */
export function InPersonGame({ kind, title, reference, onClose, children }: { kind: "quiz" | "order" | "pairs"; title: string; reference: string; onClose: () => void; children: ReactNode }) {
  const host = HOSTS[kind] ?? HOSTS.quiz;
  return (
    <div className="ip-room" role="dialog" aria-modal="true" aria-label={`${title}, played in person`}>
      <div className="ip-host">
        <div className="ip-host-face"><SkinBust avatar={host.look} size={84} /></div>
        <p className="ip-say"><b>{host.name}</b>{host.line}</p>
        <button type="button" className="ip-leave" onClick={onClose}>Stand up and leave</button>
      </div>
      <div className="ip-table" data-kind={kind}>
        <header className="ip-sign"><b>{title}</b><small>{reference}</small></header>
        <div className="ip-felt">{children}</div>
      </div>
    </div>
  );
}
