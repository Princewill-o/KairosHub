"use client";
import { useState } from "react";
import { X, Check } from "lucide-react";
import { Character3DPreview } from "../character-3d-preview";
import { COSMETICS, type Avatar, type Slot } from "@/game/core/cosmetics";

const FACES: { name: string; look: Partial<Avatar> }[] = [
  { name: "Warm smile", look: { eyes: "eyes-round", brows: "brows-soft", mouth: "mouth-smile" } },
  { name: "Big grin", look: { eyes: "eyes-round", brows: "brows-soft", mouth: "mouth-grin" } },
  { name: "Sleepy", look: { eyes: "eyes-sleepy", brows: "brows-soft", mouth: "mouth-smile" } },
  { name: "Bright eyes", look: { eyes: "eyes-sparkle", brows: "brows-raised", mouth: "mouth-smile" } },
  { name: "Little fangs", look: { eyes: "eyes-focused", brows: "brows-soft", mouth: "mouth-smirk" } },
  { name: "Moustache", look: { eyes: "eyes-dots", brows: "brows-bold", mouth: "mouth-small" } },
  { name: "Wink", look: { eyes: "eyes-wink", brows: "brows-soft", mouth: "mouth-smile" } },
  { name: "Fierce", look: { eyes: "eyes-dots", brows: "brows-fierce", mouth: "mouth-cheeky" } },
];
const STYLES: { name: string; slot: Slot; choices: [string,string][] }[] = [
  { name: "Hair", slot: "hair", choices: [["hair-curly","Curls"],["hair-bob","Bob"],["hair-buns","Buns"],["hair-short","Swept"],["hair-buzz","Cropped"],["hair-bald","No hair"]] },
  { name: "Tops", slot: "top", choices: [["top-hoodie","Hoodie"],["top-suit","Tailored jacket"],["top-stripes","Striped knit"],["top-denim","Denim jacket"],["top-tracksuit","Varsity"],["top-polo","Kharis badge"]] },
  { name: "Trousers", slot: "bottom", choices: [["bottom-jeans","Denim"],["bottom-cargo","Cargo pockets"],["bottom-joggers","Sports stripe"],["bottom-smart","Tailored"],["bottom-shorts","Turn-up cuffs"]] },
];
const COLOURS: { name: string; slot: Slot }[] = [{name:"Skin tone",slot:"skin"},{name:"Hair colour",slot:"hairColor"},{name:"Top colour",slot:"topColor"},{name:"Trouser colour",slot:"bottomColor"},{name:"Shoe colour",slot:"shoesColor"}];
export function ToyWardrobe({ initial, onApply, onClose }: { initial: Avatar; onApply: (avatar: Avatar) => void; onClose: () => void }) {
  const [avatar,setAvatar]=useState(initial);
  const [clip,setClip]=useState<"idle"|"walk"|"wave">("idle");
  return <div className="absolute inset-0 z-[100010] grid place-items-center bg-black/70 p-3"><section role="dialog" aria-modal="true" aria-label="Create your Kairos toy character" className="flex max-h-[94%] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-[#faf5e9] text-[#291c37]">
    <header className="flex items-center justify-between border-b border-[#e7ddeb] px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#7045a2]">Kairos character studio</p><h2 className="text-2xl font-black">Make it yours.</h2></div><button type="button" onClick={onClose} aria-label="Close character studio" className="grid size-11 place-items-center rounded-full bg-black/5"><X/></button></header>
    <div className="grid min-h-0 flex-1 overflow-auto sm:grid-cols-[.8fr_1.2fr]">
      <div className="bg-[#eee1f6] p-4 sm:sticky sm:top-0 sm:self-start"><Character3DPreview avatar={avatar} clip={clip} facing="S" className="h-60 w-full sm:h-96"/><div className="flex justify-center gap-2">{(["idle","walk","wave"] as const).map(animation=><button type="button" key={animation} onClick={()=>setClip(animation)} aria-pressed={clip===animation} className={`min-h-10 rounded-full px-4 text-sm font-bold ${clip===animation?"bg-[#7045a2] text-white":"bg-white"}`}>{animation}</button>)}</div><p className="mt-3 text-center text-xs text-[#695277]">Drag the preview to turn your character.</p></div>
      <div className="space-y-6 p-5"><fieldset><legend className="mb-2 font-black">Faces</legend><div className="grid grid-cols-2 gap-2">{FACES.map(face=><button type="button" key={face.name} onClick={()=>setAvatar(old=>({...old,...face.look}))} className="min-h-11 rounded-xl border border-[#ddcee8] bg-white px-3 text-sm font-bold hover:border-[#7045a2]">{face.name}</button>)}</div></fieldset>
      {STYLES.map(section=><fieldset key={section.slot}><legend className="mb-2 font-black">{section.name}</legend><div className="grid grid-cols-2 gap-2">{section.choices.map(([value,label])=><button type="button" key={value} aria-pressed={avatar[section.slot]===value} onClick={()=>setAvatar(old=>({...old,[section.slot]:value}))} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${avatar[section.slot]===value?"border-[#7045a2] bg-[#e9ddf3]":"border-[#ddcee8] bg-white"}`}>{label}</button>)}</div></fieldset>)}
      {COLOURS.map(section=><fieldset key={section.slot}><legend className="mb-2 font-black">{section.name}</legend><div className="flex flex-wrap gap-2">{COSMETICS.filter(item=>item.slot===section.slot).map(item=><button type="button" key={item.id} aria-label={item.name} title={item.name} aria-pressed={avatar[section.slot]===item.id} onClick={()=>setAvatar(old=>({...old,[section.slot]:item.id}))} className={`grid size-10 place-items-center rounded-full border-2 ${avatar[section.slot]===item.id?"border-[#7045a2] ring-2 ring-[#7045a2] ring-offset-2":"border-black/10"}`} style={{background:item.color}}>{avatar[section.slot]===item.id&&<Check className="size-4 rounded-full bg-white text-black"/>}</button>)}</div></fieldset>)}</div>
    </div>
    <footer className="flex items-center justify-between gap-3 border-t border-[#e7ddeb] px-5 py-3"><p className="text-xs">Your look is saved on this device.</p><button type="button" onClick={()=>onApply(avatar)} className="min-h-12 rounded-full bg-[#7045a2] px-6 font-black text-white">Wear this look</button></footer>
  </section></div>;
}
