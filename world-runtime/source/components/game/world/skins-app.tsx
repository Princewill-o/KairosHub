"use client";
import { useEffect, useState } from "react";
import type { Avatar } from "@/game/core/cosmetics";
import { SkinBust } from "../skin-bust";

type Entry = { id: string; name: string; category: string; file: string };
/** Phone app: the Kairos skin pack (64 Minecraft-format skins). Tap one to wear it. */
export function SkinsApp({ avatar }: { avatar: Avatar }) {
  const [list, setList] = useState<Entry[]>([]);
  const [cat, setCat] = useState("All");
  const [current, setCurrent] = useState<string | null>(() => { try { return localStorage.getItem("kairos-skin-choice"); } catch { return null; } });
  useEffect(() => { void fetch("/skins/index.json").then((r) => r.json()).then(setList).catch(() => setList([])); }, []);
  const cats = ["All", ...Array.from(new Set(list.map((e) => e.category)))];
  const wear = (id: string | null) => {
    setCurrent(id);
    try { if (id) localStorage.setItem("kairos-skin-choice", id); else localStorage.removeItem("kairos-skin-choice"); } catch { /* storage optional */ }
    window.dispatchEvent(new CustomEvent("kairos-skin-choice", { detail: id }));
  };
  return (
    <div className="sk-app">
      <nav className="sk-cats">{cats.map((c) => <button key={c} aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>)}</nav>
      <button className="sk-own" aria-pressed={!current} onClick={() => wear(null)}>Wear my own look</button>
      <ul className="sk-grid">
        {list.filter((e) => cat === "All" || e.category === cat).map((e) => (
          <li key={e.id}><button aria-pressed={current === e.id} onClick={() => wear(e.id)} data-skin={e.id}>
            <SkinBust avatar={{ ...avatar, skinUrl: e.file } as Avatar} size={64} />
            <span>{e.name}</span>
          </button></li>
        ))}
      </ul>
    </div>
  );
}
