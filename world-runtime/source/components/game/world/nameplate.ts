import {
  AFFILIATION_ICONS,
  type WorldAffiliation,
} from "@/game/core/affiliation";
import { logoFor } from "@/game/core/logos";
/** DOM labels sit above WebGL so names remain readable at every camera angle. */
export function makeNameplate(
  username: string,
  affiliation: WorldAffiliation | null | undefined,
  me = false,
) {
  const root = document.createElement("div");
  const bubble = document.createElement("span");
  bubble.dataset.speech = "true";
  bubble.className = "max-w-56 whitespace-normal break-words rounded-2xl border border-[#d4c7ad] bg-[#fffdf7] px-3 py-2 text-center text-xs font-bold text-[#13203a] shadow-lg";
  bubble.style.display = "none";
  root.appendChild(bubble);
  root.className =
    "pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1 whitespace-nowrap text-[10px] font-black";
  if (affiliation) {
    const row = document.createElement("span");
    row.className =
      "inline-flex max-w-48 items-center gap-1 rounded-full border border-white/60 bg-[#f7f1e6] px-2 py-1 text-[#13203a] shadow";
    const logo = affiliation.logo ? logoFor(affiliation.logo) : null;
    if (affiliation.kind === "branch") {
      const img = document.createElement("img");
      img.width = 48;
      img.height = 48;
      img.alt = "Kharis Church";
      img.src = "/brand/kharis-mark.png";
      img.className = "shrink-0 object-contain";
      img.style.cssText = "width:48px;height:48px;min-width:48px;filter:drop-shadow(0 1px 2px #0008)";
      row.appendChild(img);
      row.className = "inline-flex max-w-56 items-center gap-2 rounded-2xl border-2 border-[#f2d15b] bg-[#38214e] px-3 py-1 text-xs text-white shadow-lg";
    } else if (logo) {
      const img = document.createElement("img");
      img.width = 17;
      img.height = 17;
      img.alt = "";
      img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${logo.bg}"/>${logo.shapes.map((s) => `<path d="${s.d}" fill="${s.fill}"/>`).join("")}</svg>`)}`;
      row.appendChild(img);
    } else {
      const icon = document.createElement("span");
      icon.textContent = AFFILIATION_ICONS[affiliation.icon];
      row.appendChild(icon);
    }
    const text = document.createElement("span");
    text.className = "max-w-36 truncate";
    text.textContent = affiliation.label;
    row.title = `${affiliation.kind === "branch" ? "Kharis Church branch ·" : affiliation.kind === "work" ? "Works at" : "Studies"} ${affiliation.label}`;
    row.appendChild(text);
    root.appendChild(row);
  }
  const name = document.createElement("span");
  name.className = `rounded-full px-2 py-1 text-white shadow ${me ? "bg-[#164bc3]" : "bg-[#13203a]/90"}`;
  name.textContent = me ? `@${username} · YOU ↓` : `@${username}`;
  root.appendChild(name);
  return root;
}

export function updateNameplateSpeech(label: HTMLElement, chat?: { text: string; until: number } | null) {
  const speech = label.querySelector<HTMLElement>("[data-speech]");
  if (!speech) return;
  const show = Boolean(chat && chat.until > Date.now());
  speech.style.display = show ? "block" : "none";
  if (show && speech.textContent !== chat!.text) {
    speech.textContent = chat!.text;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) speech.animate([{ opacity: 0, transform: "translateY(5px) scale(.94)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], { duration: 180, easing: "ease-out" });
  }
}
