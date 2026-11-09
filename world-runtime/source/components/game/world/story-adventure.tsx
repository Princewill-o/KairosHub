"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BIBLE_STORIES, completeStoryChapter, LTBS_SAVE_KEY, readStorySave, type StoryId } from "@/game/core/ltbs-stories";
import { storyWorldId, type StoryWorldPhase } from "@/game/core/story-world";
import type { WorldMap } from "@/game/core/world";
import { PLAYER } from "./art";
import { STORY_FOUND } from "./story-state";
import { CHARACTERS } from "@/game/core/story-cast";
import { recordKairosActivity } from "@/lib/game/kairos-activity";

export function useStoryAdventure(map:WorldMap,goTo:(map:string,label:string,spot?:{x:number;y:number})=>void,onGrace:(amount:number)=>void){
  const [phase,setPhase]=useState<StoryWorldPhase>("opening"),[discoveries,setDiscoveries]=useState<number[]>([]),[talking,setTalking]=useState<number|null>(null),[choice,setChoice]=useState<number|null>(null),[earned,setEarned]=useState(0);
  const origin=useRef<{map:string;x:number;y:number}>({map:"scripture-island",x:25*32,y:28*32});
  const campaign=map.story?BIBLE_STORIES.find(item=>item.id===map.story!.id):undefined;
  const chapter=map.story?.chapter??0;const scene=campaign?.chapters[chapter];
  useEffect(()=>{setPhase("opening");setDiscoveries([]);setTalking(null);STORY_FOUND.found=new Set();setChoice(null);setEarned(0);if(!map.story)return;const timer=window.setTimeout(()=>setPhase(p=>p==="opening"?"explore":p),13500);return()=>clearTimeout(timer);},[map.id]);
  const enter=useCallback((id:StoryId,requestedChapter?:number)=>{
    const story=BIBLE_STORIES.find(item=>item.id===id)!;const save=readStorySave();
    const first=story.chapters.findIndex((_,i)=>!save.completed[`${id}:${i}`]);const index=requestedChapter??(first<0?0:first);
    if(index>0&&!save.completed[`${id}:${index-1}`])return;
    if(!map.story){origin.current={map:map.id,x:PLAYER.x,y:PLAYER.y};try{sessionStorage.setItem("kairos-story-return",JSON.stringify(origin.current));}catch{/* Optional. */}}
    goTo(storyWorldId(id,index),`${story.title} · ${story.chapters[index].place}`);
  },[goTo,map.id,map.story]);
  const leave=()=>{let spot=origin.current;try{const saved=JSON.parse(sessionStorage.getItem("kairos-story-return")??"null");if(saved&&typeof saved.map==="string"&&!saved.map.startsWith("story-")&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))spot=saved;}catch{/* Default LTBS return point. */}goTo(spot.map,"Returning to Kairos World",{x:spot.x,y:spot.y});};
  const discover=(index:number)=>{if(phase!=="explore"||index<0||index>2)return;setTalking(index);setDiscoveries(old=>{if(old.includes(index))return old;const next=[...old,index];STORY_FOUND.found=new Set(next);return next;});};
  const decide=(index:number)=>{if(!campaign||discoveries.length!==3||phase!=="choice")return;const result=completeStoryChapter(readStorySave(),campaign.id,chapter,index);try{localStorage.setItem(LTBS_SAVE_KEY,JSON.stringify(result.save));}catch{/* Session can continue. */}setEarned(result.earned);setChoice(index);setPhase("resolution");if(result.earned)onGrace(result.earned);void recordKairosActivity("scripture_game");};
  return {phase,setPhase,discoveries,talking,setTalking,choice,earned,campaign,chapter,scene,enter,leave,discover,decide,next:()=>{if(campaign&&chapter<5)enter(campaign.id,chapter+1);else leave();}};
}

export function StoryWorldHud({adventure}:{adventure:ReturnType<typeof useStoryAdventure>}){
  const {campaign,scene,phase,chapter,discoveries,choice,earned,talking}=adventure;if(!campaign||!scene)return null;
  const line=talking!==null?scene.talk[talking]:null;const speaker=line?.who?CHARACTERS[line.who]?.name:null;
  const text=line?(speaker&&line.text.startsWith(speaker)?line.text.slice(line.text.indexOf(":")+1).trim():line.text):"";
  return <>
    {(phase==="opening"||phase==="resolution")&&<div className="km-bar-top" aria-hidden/>}
    <div className="ks-top"><span className="ks-pill">{campaign.title} · {chapter+1}/6</span><button onClick={adventure.leave} className="ks-pill ks-leave">Return to world</button></div>
    {phase==="opening"&&<div className="ks-card ks-bottom"><p className="ks-eyebrow">{scene.place} · {scene.reference}</p><h2>{scene.title}</h2><p>{scene.opening}</p><button onClick={()=>adventure.setPhase("explore")} className="kp-primary ks-go">Take control →</button></div>}
    {phase==="explore"&&<div className="ks-card ks-goals"><h2>{scene.objective}</h2><ul>{scene.discoveries.map((item,i)=><li key={item} className={discoveries.includes(i)?"done":""}><i>{discoveries.includes(i)?"✓":i+1}</i>{item}</li>)}</ul><p className="ks-muted">Walk to the gold markers. Press E or tap the prompt.</p>{discoveries.length===3&&talking===null&&<button onClick={()=>adventure.setPhase("choice")} className="kp-primary ks-go">Continue the encounter →</button>}</div>}
    {phase==="explore"&&line&&<div className="km-box ks-say" onClick={()=>adventure.setTalking(null)} role="dialog" aria-label={speaker??"Discovery"}><span className="km-who">{speaker??scene.discoveries[talking!]}</span><p className="km-line">{text}</p><button className="km-next" onClick={e=>{e.stopPropagation();adventure.setTalking(null);}}>{discoveries.length===3?"Continue":"OK"}</button></div>}
    {phase==="choice"&&<div className="ks-card ks-bottom"><p className="ks-eyebrow">{scene.reference} · What would you do?</p><h2>{scene.question}</h2><div className="km-choices">{scene.choices.map((option,i)=><button key={i} onClick={()=>adventure.decide(i)}><i>{i+1}</i>{option.text}</button>)}</div></div>}
    {phase==="resolution"&&choice!==null&&<div className="ks-card ks-bottom"><p className="ks-eyebrow">{earned?`+${earned} Grace · journey saved`:"Chapter replay · earlier reward kept"}</p><p>{scene.choices[choice].response}</p><p><b>{scene.ending}</b></p><button onClick={adventure.next} className="kp-primary ks-go">{chapter<5?"Journey onward →":"Return to Kairos World"}</button></div>}
  </>;
}
