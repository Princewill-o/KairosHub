"use client";
import { useEffect, useState } from "react";
import { SkinBust } from "../skin-bust";
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
type Step = "skin" | "face" | "hair" | "clothes" | "colours";
const STEPS: { id: Step; label: string; hint: string }[] = [
  { id: "skin", label: "1 · Body", hint: "Build your own look, or wear a ready-made skin." },
  { id: "face", label: "2 · Face", hint: "Pick eyes, brows and a smile." },
  { id: "hair", label: "3 · Hair", hint: "Choose a hairstyle." },
  { id: "clothes", label: "4 · Clothes", hint: "Choose a top and trousers." },
  { id: "colours", label: "5 · Colours", hint: "Skin tone, hair and outfit colours." },
];
type SkinEntry = { id: string; name: string; category: string; file: string };
const readSkin = () => { try { return localStorage.getItem("kairos-skin-choice"); } catch { return null; } };

/** The character studio: one clear, step-by-step place to change how you look. */
export function ToyWardrobe({ initial, onApply, onClose }: { initial: Avatar; onApply: (avatar: Avatar) => void; onClose: () => void }) {
  const [avatar,setAvatar]=useState(initial);
  const [clip,setClip]=useState<"idle"|"walk"|"wave">("idle");
  const [step,setStep]=useState<Step>("skin");
  const [skin,setSkin]=useState<string|null>(readSkin);
  const [skins,setSkins]=useState<SkinEntry[]>([]);
  const [cat,setCat]=useState("All");
  useEffect(()=>{void fetch("/skins/index.json").then(r=>r.json()).then(setSkins).catch(()=>setSkins([]));},[]);
  const skinEntry=skins.find(e=>e.id===skin);
  const preview=(skinEntry?{...avatar,skinUrl:skinEntry.file}:avatar) as Avatar;
  const custom=(f:()=>void)=>{f();setSkin(null);};
  const at=STEPS.findIndex(x=>x.id===step);
  const wear=()=>{try{if(skin)localStorage.setItem("kairos-skin-choice",skin);else localStorage.removeItem("kairos-skin-choice");}catch{/* storage optional */}window.dispatchEvent(new CustomEvent("kairos-skin-choice",{detail:skin}));onApply(avatar);};
  const chip=(on:boolean)=>`min-h-11 rounded-xl border-2 px-3 text-sm font-bold ${on?"border-[#7045a2] bg-[#e9ddf3] shadow-[0_3px_0_#7045a2]":"border-[#ddcee8] bg-white hover:border-[#7045a2]"}`;
  const name=(slot:Slot)=>STYLES.flatMap(x=>x.choices).find(([v])=>v===avatar[slot])?.[1]??"—";
  return <div className="absolute inset-0 z-[100010] grid place-items-center bg-black/70 p-3"><section role="dialog" aria-modal="true" aria-label="Character studio" className="cs-studio flex max-h-[94%] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#faf5e9] text-[#291c37]">
    <header className="flex items-center justify-between border-b border-[#e7ddeb] px-5 py-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#7045a2]">Character studio</p><h2 className="text-2xl font-black">Make it yours.</h2></div><button type="button" onClick={onClose} aria-label="Close character studio" className="grid size-11 place-items-center rounded-full bg-black/5"><X/></button></header>
    <nav className="cs-steps flex gap-1 overflow-x-auto border-b border-[#e7ddeb] bg-white px-3 py-2" role="tablist">{STEPS.map(x=><button key={x.id} role="tab" aria-selected={step===x.id} onClick={()=>setStep(x.id)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-black ${step===x.id?"bg-[#7045a2] text-white":"text-[#695277] hover:bg-[#f1e8f7]"}`}>{x.label}</button>)}</nav>
    <div className="grid min-h-0 flex-1 overflow-auto sm:grid-cols-[.85fr_1.15fr]">
      <div className="bg-[#eee1f6] p-4 sm:sticky sm:top-0 sm:self-start">
        <Character3DPreview avatar={preview} clip={clip} facing="S" className="h-60 w-full sm:h-80"/>
        <div className="flex justify-center gap-2">{(["idle","walk","wave"] as const).map(animation=><button type="button" key={animation} onClick={()=>setClip(animation)} aria-pressed={clip===animation} className={`min-h-10 rounded-full px-4 text-sm font-bold capitalize ${clip===animation?"bg-[#7045a2] text-white":"bg-white"}`}>{animation}</button>)}</div>
        <dl className="cs-summary mt-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-2xl bg-white/70 p-3 text-xs">
          <dt className="font-black">Look</dt><dd>{skinEntry?`Skin · ${skinEntry.name}`:"My own build"}</dd>
          {!skinEntry&&<><dt className="font-black">Hair</dt><dd>{name("hair")}</dd><dt className="font-black">Top</dt><dd>{name("top")}</dd><dt className="font-black">Trousers</dt><dd>{name("bottom")}</dd></>}
        </dl>
        <p className="mt-2 text-center text-xs text-[#695277]">Drag the preview to turn your character.</p>
      </div>
      <div className="space-y-4 p-5">
        <p className="rounded-xl bg-[#fff3d6] px-3 py-2 text-sm font-bold">{STEPS[at].hint}</p>
        {step==="skin"&&<>
          <div className="grid grid-cols-2 gap-2"><button type="button" className={chip(!skin)} onClick={()=>setSkin(null)}>Build my own look</button><button type="button" className={chip(!!skin)} onClick={()=>setSkin(skin??skins[0]?.id??null)}>Wear a skin ({skins.length})</button></div>
          {skin!==null&&<><nav className="flex flex-wrap gap-1">{["All",...Array.from(new Set(skins.map(e=>e.category)))].map(c=><button key={c} type="button" onClick={()=>setCat(c)} className={`rounded-full px-3 py-1 text-xs font-black ${cat===c?"bg-[#291c37] text-white":"bg-white"}`}>{c}</button>)}</nav>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">{skins.filter(e=>cat==="All"||e.category===cat).map(e=><li key={e.id}><button type="button" aria-pressed={skin===e.id} onClick={()=>setSkin(e.id)} className={`${chip(skin===e.id)} flex w-full flex-col items-center gap-1 py-2`}><SkinBust avatar={{...avatar,skinUrl:e.file} as Avatar} size={52}/><span className="text-[11px] leading-tight">{e.name}</span></button></li>)}</ul></>}
          {skin===null&&<p className="text-sm">Go through steps 2 to 5 to build your own character.</p>}
        </>}
        {step==="face"&&<div className="grid grid-cols-2 gap-2">{FACES.map(face=>{const on=Object.entries(face.look).every(([k,v])=>avatar[k as Slot]===v);return <button type="button" key={face.name} aria-pressed={on} onClick={()=>custom(()=>setAvatar(old=>({...old,...face.look})))} className={chip(on)}>{face.name}</button>;})}</div>}
        {(step==="hair"||step==="clothes")&&STYLES.filter(x=>step==="hair"?x.slot==="hair":x.slot!=="hair").map(section=><fieldset key={section.slot}><legend className="mb-2 font-black">{section.name}</legend><div className="grid grid-cols-2 gap-2">{section.choices.map(([value,label])=><button type="button" key={value} aria-pressed={avatar[section.slot]===value} onClick={()=>custom(()=>setAvatar(old=>({...old,[section.slot]:value})))} className={chip(avatar[section.slot]===value)}>{label}</button>)}</div></fieldset>)}
        {step==="colours"&&COLOURS.map(section=><fieldset key={section.slot}><legend className="mb-2 font-black">{section.name}</legend><div className="flex flex-wrap gap-2">{COSMETICS.filter(item=>item.slot===section.slot).map(item=><button type="button" key={item.id} aria-label={item.name} title={item.name} aria-pressed={avatar[section.slot]===item.id} onClick={()=>custom(()=>setAvatar(old=>({...old,[section.slot]:item.id})))} className={`grid size-10 place-items-center rounded-full border-2 ${avatar[section.slot]===item.id?"border-[#7045a2] ring-2 ring-[#7045a2] ring-offset-2":"border-black/10"}`} style={{background:item.color}}>{avatar[section.slot]===item.id&&<Check className="size-4 rounded-full bg-white text-black"/>}</button>)}</div></fieldset>)}
        <div className="flex justify-between gap-2 pt-2"><button type="button" disabled={at===0} onClick={()=>setStep(STEPS[at-1].id)} className="min-h-11 rounded-full bg-white px-5 font-bold disabled:opacity-30">Back</button>{at<STEPS.length-1?<button type="button" onClick={()=>setStep(STEPS[at+1].id)} className="min-h-11 rounded-full bg-[#291c37] px-5 font-bold text-white">Next: {STEPS[at+1].label.slice(4)}</button>:null}</div>
      </div>
    </div>
    <footer className="flex items-center justify-between gap-3 border-t border-[#e7ddeb] px-5 py-3"><p className="text-xs">Saved on this device. Change it any time from the phone's Character app.</p><button type="button" onClick={wear} className="min-h-12 rounded-full bg-[#7045a2] px-6 font-black text-white">Wear this look</button></footer>
  </section></div>;
}
