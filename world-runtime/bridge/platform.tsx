import {useRef,useMemo} from 'react';
export const PLAYER_CHANGED='kairos-world:player-changed';
export const notifyPlayerChanged=()=>window.dispatchEvent(new Event(PLAYER_CHANGED));
export const useShellPlayer=()=>({username:null,level:1,clout:0,streak:0,avatar:{}});
export const browserSupabase=()=>null;
export function useLobby(){return {counts:{},ready:true};}
/** Local exploration retains fictional NPCs; no fake online players are advertised. */
export function useWorld({start,me}:any){
  const players=useRef(new Map()),position=useRef(start);
  return useMemo(()=>({players,status:'solo',ping:null,roster:0,count:1,messages:[],duelInvite:null,dismissDuel:()=>{},inviteDuel:async()=>null,
    reportMove:(...args:any[])=>{position.current=args;},stopped:()=>{},say:()=>{},sendChat:async()=> 'Explore alongside the local characters. Visit Together to return to Kairos World.'}),[]);
}
export async function recordKairosActivity(activity:string){
  const key='activity-summary';let summary:any={};try{summary=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
  summary[activity]=(Number(summary[activity])||0)+1;try{localStorage.setItem(key,JSON.stringify(summary));}catch{}
  parent.postMessage({type:'kairos-world:activity',activity},location.origin);
}
