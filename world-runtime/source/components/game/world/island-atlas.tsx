"use client";
import { ISLANDS } from "@/game/core/islands";
const OUTLINE="-84,-15 -60,-38 -34,-34 -12,-50 21,-43 40,-29 69,-31 86,-8 77,14 53,22 38,37 6,32 -13,42 -42,29 -68,24 -90,5";
function Pine({x,y,size=1}:{x:number;y:number;size?:number}){return <g transform={`translate(${x} ${y}) scale(${size})`}><path d="M-2 0v13h4V0" fill="#805c38"/><path d="M0-25-13 2H13Z" fill="#2c7f65"/><path d="M0-25 0 2H13Z" fill="#205f56"/><path d="M0-17-10 8H10Z" fill="#378c68"/></g>;}
function House({x,y,church=false}:{x:number;y:number;church?:boolean}){return <g transform={`translate(${x} ${y})`}><path d="M-24-4 0-16 27-3 3 10Z" fill="#56416f"/><path d="M-24-4 3 10v23L-24 19Z" fill="#d9d0af"/><path d="M3 10 27-3v24L3 33Z" fill="#aaa28e"/><path d="M-29-6 0-23 32-6 3 10Z" fill={church?"#8d7e68":"#825897"}/><path d="M-10 12v13m-9-17v12m31-5v10m8-15v10" stroke="#faf3d4" strokeWidth="4"/>{church&&<><path d="M-7-21v-17l9-5 10 5v17L2-16Z" fill="#e1d4b4"/><path d="M2-39v17m-5-11h10" stroke="#947c64" strokeWidth="2"/></>}</g>;}
function Landmark({id}:{id:string}){
  if(id==="woodland")return <><Pine x={-49} y={-10}/><Pine x={46} y={-18} size={1.2}/><Pine x={-23} y={-32} size={.8}/><House x={4} y={-8} church/><Pine x={-53} y={18} size={.7}/><Pine x={58} y={12} size={.8}/></>;
  if(id==="scripture-island")return <><path d="M-33 3-4-10 6-4 36-17v33L7 30-4 23-33 36Z" fill="#fff4ce"/><path d="M-4-10V23M6-4V30" stroke="#c79a56" strokeWidth="3"/><path d="M-26 9-11 2m-15 15 15-7M13 4 28-3M13 12 28 5" stroke="#b9aa80" strokeWidth="2"/><path d="M-2-31v18m-6-12H5" stroke="#ffe8a0" strokeWidth="4"/><Pine x={-57} y={0} size={.7}/><Pine x={59} y={-8} size={.9}/></>;
  if(id==="orchard-island")return <>{[-48,-20,14,45].map((x,i)=><g key={x} transform={`translate(${x} ${i%2?-12:4})`}><path d="M0 0v17" stroke="#926740" strokeWidth="5"/><circle cy={-10} r={14} fill={i%2?"#6fa965":"#84b86b"}/><circle cx={-5} cy={-11} r={3} fill="#ecc277"/></g>)}<path d="M-25 25Q0 4 31 25" stroke="#e2d5ab" strokeWidth="7" fill="none"/></>;
  return <><House x={-13} y={-7}/>{id==="city"?<><path d="M-55 21 41-16" stroke="#e8d9b7" strokeWidth="12"/><path d="M-55 21 41-16" stroke="#838b89" strokeWidth="8"/><g transform="translate(32 5)"><rect x="-14" y="-13" width="29" height="18" rx="4" fill="#c34c51"/><path d="M-10-9h22" stroke="#bed0c7" strokeWidth="4"/><circle cx="-7" cy="6" r="3" fill="#42434c"/><circle cx="9" cy="6" r="3" fill="#42434c"/></g></>:<><Pine x={-54} y={-5}/><Pine x={48} y={-12}/><path d="M-5 33 59 6" stroke="#e7d0a5" strokeWidth="6"/></>}</>;
}
export function IslandAtlas({here,onSelect}:{here:string;onSelect?:(station:string)=>void}){
  const active=ISLANDS.find(item=>item.id===here||item.station===here||`station-${item.station}`===here);
  return <svg viewBox="0 0 780 450" className="w-full rounded-3xl bg-[#39a9b8]" role="group" aria-label="Illustrated Kairos islands and Grace Line routes">
    <defs><linearGradient id="ltbs-sea" x2="0" y2="1"><stop stopColor="#55bdc6"/><stop offset="1" stopColor="#2798ae"/></linearGradient><pattern id="ltbs-waves" width="62" height="44" patternUnits="userSpaceOnUse"><path d="M9 26q6-4 12 0t12 0" stroke="#c8f5e6" fill="none" strokeWidth="2" opacity=".23"/></pattern><filter id="atlas-shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#18566b" floodOpacity=".22"/></filter></defs>
    <rect width="780" height="450" rx="24" fill="url(#ltbs-sea)"/><rect width="780" height="450" rx="24" fill="url(#ltbs-waves)"/>
    <text x="27" y="34" fontSize="16" fontWeight="900" letterSpacing="2" fill="#eaffed">KAIROS / WORLD ATLAS</text><text x="27" y="53" fontSize="10" fontWeight="700" fill="#d2f3e9">LONDON BRANCH · FIVE DESTINATIONS</text>
    <path d="M112 150Q175 190 278 315Q350 225 440 118Q533 82 643 115Q681 205 605 305Q440 363 278 315" fill="none" stroke="#f6f2cd" strokeWidth="4" strokeDasharray="7 10" strokeLinecap="round" opacity=".9"/>
    {ISLANDS.map(island=><g key={island.id} role={onSelect?"button":undefined} tabIndex={onSelect?0:undefined} aria-label={`${island.name}${active?.id===island.id?", you are here":" · select station"}`} onClick={()=>onSelect?.(island.station)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelect?.(island.station);}}} className={onSelect?"cursor-pointer outline-none focus:opacity-75":""}>
      <g transform={`translate(${island.x} ${island.y-7})`} filter="url(#atlas-shadow)">
        <ellipse cy="9" rx="102" ry="59" fill="#9ce0ce" opacity=".5"/>
        <polygon points={OUTLINE} transform="translate(0 13)" fill="#a69c76" stroke="#e9d7a4" strokeWidth="7" strokeLinejoin="round"/>
        <polygon points={OUTLINE} fill={island.colour} stroke={active?.id===island.id?"#fff1a2":"#f4e1b0"} strokeWidth={active?.id===island.id?7:4} strokeLinejoin="round"/>
        <path d="M-72 17-41 29-13 41 7 32 38 37 53 22 76 15" stroke="#797d60" fill="none" strokeWidth="2" opacity=".4"/>
        <Landmark id={island.id}/>
        <g transform="translate(53 30)"><path d="M-9-4h18v10H-9Z" fill="#f7e8be"/><path d="M-12-5 0-12 12-5Z" fill="#63487d"/><path d="M-5 1H5" stroke="#755c86" strokeWidth="2"/></g>
      </g>
      <rect x={island.x-90} y={island.y+48} width="180" height="26" rx="13" fill="#25334a" fillOpacity=".9"/><text x={island.x} y={island.y+65} textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff4d8">{island.name}{island.id==="scripture-island"?" · STORY & GAME WORLD":""}</text>
      {active?.id===island.id&&<g transform={`translate(${island.x} ${island.y-76})`}><rect x="-49" y="-13" width="98" height="22" rx="11" fill="#fff1a2"/><text textAnchor="middle" y="2" fontSize="9" fontWeight="900" fill="#45315d">YOU ARE HERE</text><path d="M-5 9 0 15 5 9" fill="#fff1a2"/></g>}
    </g>)}
    <rect x="22" y="407" width="736" height="25" rx="12" fill="#f5f1d8"/><text x="390" y="424" textAnchor="middle" fontSize="10" fontWeight="800" fill="#4a4961">GRACE LINE · Enter your station, choose a destination, then board the train.</text>
  </svg>;
}
