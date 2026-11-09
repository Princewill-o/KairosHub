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
  bubble.className = "kw-speech";
  bubble.style.display = "none";
  root.appendChild(bubble);
  root.className =
    "pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1 whitespace-nowrap text-[10px] font-black";
  if (affiliation) {
    const row = document.createElement("span");
    row.className = "kw-aff";
    const logo = affiliation.logo ? logoFor(affiliation.logo) : null;
    if (affiliation.kind === "branch") {
      const img = document.createElement("img");
      img.width = 20;
      img.height = 20;
      img.alt = "Kharis Church";
      img.src = "/brand/kharis-mark.png";
      img.className = "shrink-0 object-contain";
      img.style.cssText = "width:20px;height:20px;min-width:20px";
      row.appendChild(img);
      row.className = "kw-aff kw-aff-branch";
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
  name.className = me ? "kw-name kw-name-me" : "kw-name";
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
