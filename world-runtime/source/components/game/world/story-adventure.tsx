"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BIBLE_STORIES, completeStoryChapter, LTBS_SAVE_KEY, readStorySave, type StoryId } from "@/game/core/ltbs-stories";
import { storyWorldId, type StoryWorldPhase } from "@/game/core/story-world";
import type { WorldMap } from "@/game/core/world";
import { PLAYER } from "./art";
import { recordKairosActivity } from "@/lib/game/kairos-activity";

export function useStoryAdventure(map:WorldMap,goTo:(map:string,label:string,spot?:{x:number;y:number})=>void,onGrace:(amount:number)=>void){
  const [phase,setPhase]=useState<StoryWorldPhase>("opening"),[discoveries,setDiscoveries]=useState<number[]>([]),[choice,setChoice]=useState<number|null>(null),[earned,setEarned]=useState(0);
  const origin=useRef<{map:string;x:number;y:number}>({map:"scripture-island",x:25*32,y:28*32});
  const campaign=map.story?BIBLE_STORIES.find(item=>item.id===map.story!.id):undefined;
  const chapter=map.story?.chapter??0;const scene=campaign?.chapters[chapter];
  useEffect(()=>{setPhase("opening");setDiscoveries([]);setChoice(null);setEarned(0);if(!map.story)return;const timer=window.setTimeout(()=>setPhase(p=>p==="opening"?"explore":p),13500);return()=>clearTimeout(timer);},[map.id]);
  const enter=useCallback((id:StoryId,requestedChapter?:number)=>{
    const story=BIBLE_STORIES.find(item=>item.id===id)!;const save=readStorySave();
    const first=story.chapters.findIndex((_,i)=>!save.completed[`${id}:${i}`]);const index=requestedChapter??(first<0?0:first);
    if(index>0&&!save.completed[`${id}:${index-1}`])return;
    if(!map.story){origin.current={map:map.id,x:PLAYER.x,y:PLAYER.y};try{sessionStorage.setItem("kairos-story-return",JSON.stringify(origin.current));}catch{/* Optional. */}}
    goTo(storyWorldId(id,index),`${story.title} · ${story.chapters[index].place}`);
  },[goTo,map.id,map.story]);
  const leave=()=>{let spot=origin.current;try{const saved=JSON.parse(sessionStorage.getItem("kairos-story-return")??"null");if(saved&&typeof saved.map==="string"&&!saved.map.startsWith("story-")&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))spot=saved;}catch{/* Default LTBS return point. */}goTo(spot.map,"Returning to Kairos World",{x:spot.x,y:spot.y});};
  const discover=(index:number)=>{if(phase==="explore"&&index>=0&&index<3)setDiscoveries(old=>old.includes(index)?old:[...old,index]);};
  const decide=(index:number)=>{if(!campaign||discoveries.length!==3||phase!=="choice")return;const result=completeStoryChapter(readStorySave(),campaign.id,chapter,index);try{localStorage.setItem(LTBS_SAVE_KEY,JSON.stringify(result.save));}catch{/* Session can continue. */}setEarned(result.earned);setChoice(index);setPhase("resolution");if(result.earned)onGrace(result.earned);void recordKairosActivity("scripture_game");};
  return {phase,setPhase,discoveries,choice,earned,campaign,chapter,scene,enter,leave,discover,decide,next:()=>{if(campaign&&chapter<5)enter(campaign.id,chapter+1);else leave();}};
}

export function StoryWorldHud({adventure}:{adventure:ReturnType<typeof useStoryAdventure>}){
  const {campaign,scene,phase,chapter,discoveries,choice,earned}=adventure;if(!campaign||!scene)return null;
  return <>
    {(phase==="opening"||phase==="resolution")&&<div className="pointer-events-none absolute inset-0 z-[100002] border-y-[5vh] border-black"/>}
    <div className="absolute right-3 top-3 z-[100004] flex gap-2"><span className="rounded-full border border-[#ffdd80]/30 bg-[#21172c]/90 px-4 py-3 text-xs font-black text-[#ffdd80]">{campaign.title} · {chapter+1}/6</span><button onClick={adventure.leave} className="min-h-11 rounded-full bg-[#21172c]/90 px-4 text-xs font-bold text-white">Return to world</button></div>
    {phase==="opening"&&<div className="absolute inset-x-4 bottom-10 z-[100004] mx-auto max-w-2xl rounded-2xl bg-[#17131e]/95 p-5 text-white shadow-xl"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffdd80]">You have entered {scene.place}</p><h2 className="mt-2 text-2xl font-black">{scene.title}</h2><p className="mt-2 text-sm leading-relaxed text-white/80">{scene.opening}</p><button onClick={()=>adventure.setPhase("explore")} className="mt-3 min-h-11 text-sm font-black text-[#ffdd80]">Take control →</button></div>}
    {phase==="explore"&&<div className="absolute left-3 top-24 z-[100001] max-w-[260px] rounded-2xl border border-[#ffdd80]/30 bg-[#21172c]/90 p-4 text-white shadow-xl"><h2 className="text-sm font-black text-[#ffdd80]">{scene.objective}</h2><ul className="mt-3 space-y-2 text-xs">{scene.discoveries.map((item,i)=><li key={item} className={discoveries.includes(i)?"text-[#a6d8a0]":"text-white/75"}>{discoveries.includes(i)?"✓":"◇"} {item}</li>)}</ul><p className="mt-3 text-[10px] text-white/50">Walk to the gold markers and interact.<br/>WASD / arrows · E interact · Space jump</p>{discoveries.length===3&&<button onClick={()=>adventure.setPhase("choice")} className="mt-4 min-h-11 w-full rounded-xl bg-[#ffdd80] px-3 text-xs font-black text-[#21172c]">Continue the encounter →</button>}</div>}
    {phase==="choice"&&<div className="absolute inset-x-4 bottom-8 z-[100004] mx-auto max-w-2xl rounded-2xl border border-[#ffdd80]/30 bg-[#21172c]/95 p-5 text-white shadow-xl"><p className="text-xs font-black text-[#ffdd80]">{scene.reference} · What would you do?</p><h2 className="mt-2 text-xl font-black">{scene.question}</h2><div className="mt-4 grid gap-2">{scene.choices.map((option,i)=><button key={i} onClick={()=>adventure.decide(i)} className="min-h-12 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-sm font-bold hover:border-[#ffdd80]">{option.text}</button>)}</div></div>}
    {phase==="resolution"&&choice!==null&&<div className="absolute inset-x-4 bottom-10 z-[100004] mx-auto max-w-2xl rounded-2xl bg-[#17131e]/95 p-5 text-white shadow-xl"><p className="text-sm font-black text-[#ffdd80]">{earned?`+${earned} Grace · journey saved`:"Chapter replay · previous reward saved"}</p><p className="mt-2 text-sm text-white/80">{scene.choices[choice].response}</p><p className="mt-3 font-bold">{scene.ending}</p><button onClick={adventure.next} className="mt-4 min-h-11 rounded-full bg-[#ffdd80] px-5 text-sm font-black text-[#21172c]">{chapter<5?"Journey onward →":"Return to Kairos World"}</button></div>}
  </>;
}
