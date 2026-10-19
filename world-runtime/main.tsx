import React, {useState,useEffect} from 'react';
import { createRoot } from 'react-dom/client';
import { WorldApp } from '@/components/game/world/world-app';
import { DEFAULT_AVATAR } from '@/game/core/cosmetics';
import { STARTER_LAYOUT, HOMES } from '@/game/core/homes';
import { KP2_LONDON_BRANCH } from '@/game/core/affiliation';
import { scopedStorage } from './bridge/storage.mjs';

const element=document.getElementById('world-root')!;
let mounted=false;
let originalStorage:Storage|null=null;try{originalStorage=window.localStorage;}catch{}
function mount(profile:{id:string;name:string}){
  if(mounted)return;mounted=true;
  // The iframe has its own storage view, scoped to the selected KairosHub player.
  const prefix=`kairos-world:${profile.id}:`;
  const storage=scopedStorage(originalStorage,prefix);
  Object.defineProperty(window,'localStorage',{value:storage,configurable:true});
  function Game(){
  const [,update]=useState(0);useEffect(()=>{const refresh=()=>update(n=>n+1);window.addEventListener('kairos-world:refresh',refresh);return()=>window.removeEventListener('kairos-world:refresh',refresh);},[]);
  let economy={xp:0,spent:0,cars:['sedan']};try{economy={...economy,...JSON.parse(storage.getItem('world-economy')||'{}')};}catch{}
  let home={claimed:true,owned:['studio'],current:'studio',layout:STARTER_LAYOUT,furniture:{},style:0};try{home={...home,...JSON.parse(storage.getItem('world-home')||'{}')};home.style=HOMES.find(h=>h.id===home.current)?.style??0;}catch{}
  return <WorldApp me={{id:profile.id,username:profile.name,avatar:DEFAULT_AVATAR,org:null,badge:null,pass:null,publicKey:null,affiliation:KP2_LONDON_BRANCH}} initialMap={new URLSearchParams(location.search).get('map')||'city'} initialServer="lse-1" home={home} clout={-economy.spent} xp={economy.xp} cars={economy.cars} quests={[
    {id:'kharis',title:'Visit Kharis Church',tag:'Explore'},
    {id:'bible',title:'Read a chapter of Scripture',tag:'Bible',href:'/bible'},
    {id:'outreach',title:'Start a kind conversation',tag:'Outreach'},
    {id:'stories',title:'Travel to LTBS and enter a Bible story',tag:'Story'},
  ]}/>;}
  createRoot(element).render(<Game/>);
  parent.postMessage({type:'kairos-world:mounted'},location.origin);
}
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='kairos-world:profile')return;const p=event.data.profile;if(!p||typeof p.id!=='string'||typeof p.name!=='string')return;mount({id:p.id.slice(0,100),name:p.name.slice(0,30)});});
parent.postMessage({type:'kairos-world:ready'},location.origin);
if(parent===window)mount({id:'guest',name:'Explorer'});
