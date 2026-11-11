import {useRef,useMemo,useState,useEffect} from 'react';
export const PLAYER_CHANGED='kairos-world:player-changed';
export const notifyPlayerChanged=()=>window.dispatchEvent(new Event(PLAYER_CHANGED));
export const useShellPlayer=()=>({username:null,level:1,clout:0,streak:0,avatar:{}});
export const browserSupabase=()=>null;
export function useLobby(){return {counts:{},ready:true};}
/**
 * Kairos World online: a WebSocket to the room for this map and server
 * (Cloudflare Durable Object, or the Node server in server/world-server.mjs).
 * Solo (Kairos Life, story mode, your home) keeps the fictional NPCs only.
 */
const worldUrl=(mapId:string,serverId:string)=>{
  const custom=(window as any).KAIROS_WORLD_SERVER||document.querySelector('meta[name="kairos-world-server"]')?.getAttribute('content')||(()=>{try{return localStorage.getItem('kairos-world-server');}catch{return null;}})();
  const base=custom?String(custom).replace(/\/$/,''):`${location.protocol==='https:'?'wss':'ws'}://${location.host}`;
  return `${base}/api/world/connect?map=${encodeURIComponent(mapId)}&server=${encodeURIComponent(serverId)}`;
};
export function useWorld({mapId,serverId,start,me}:any){
  const players=useRef(new Map<string,any>()),position=useRef(start);
  const [status,setStatus]=useState<string>(serverId&&serverId!=='solo'?'connecting':'solo');
  const [count,setCount]=useState(1),[ping,setPing]=useState<number|null>(null),[messages,setMessages]=useState<any[]>([]);
  const ws=useRef<WebSocket|null>(null),meRef=useRef(me);meRef.current=me;
  const lastSent=useRef({x:-1,y:-1,t:0});
  useEffect(()=>{
    if(!serverId||serverId==='solo'||(window as any).__kairosOffline){setStatus('solo');players.current.clear();return;}
    let closed=false,retry=0,timer:any,pinger:any;
    const remote=(p:any)=>{const old=players.current.get(p.id);players.current.set(p.id,{...old,...p,x:old?.x??p.x,y:old?.y??p.y,tx:p.x,ty:p.y,walking:false,chat:old?.chat??null});};
    const connect=()=>{
      if(closed)return;
      setStatus(retry?'reconnecting':'connecting');
      let sock:WebSocket;
      try{sock=new WebSocket(worldUrl(mapId,serverId));}catch{setStatus('error');return;}
      ws.current=sock;
      sock.onopen=()=>{retry=0;const m=meRef.current||{};const p=position.current||{};sock.send(JSON.stringify({t:'hello',name:m.username||m.name||'Guest',avatar:m.avatar,badge:m.badge,affiliation:m.affiliation,x:p.x??0,y:p.y??0}));
        pinger=setInterval(()=>{if(sock.readyState===1)sock.send(JSON.stringify({t:'ping',at:performance.now()}));},5000);};
      sock.onmessage=(e)=>{let m:any;try{m=JSON.parse(e.data);}catch{return;}
        if(m.t==='welcome'){players.current.clear();for(const p of m.players)remote(p);setCount(m.players.length+1);setStatus('live');}
        else if(m.t==='join'){remote(m.p);setCount(players.current.size+1);}
        else if(m.t==='leave'){players.current.delete(m.id);setCount(players.current.size+1);}
        else if(m.t==='state'){for(const [id,x,y,heading,car,d] of m.ps){const rp=players.current.get(id);if(rp){rp.tx=x;rp.ty=y;rp.heading=heading;rp.car=car;rp.d=d;}}}
        else if(m.t==='chat'){const rp=players.current.get(m.id);if(rp)rp.chat={text:m.text,until:Date.now()+6000};setMessages((l)=>[...l.slice(-40),{id:m.id,name:m.name,text:m.text,at:Date.now()}]);}
        else if(m.t==='pong'){setPing(Math.round(performance.now()-m.at));if(m.count)setCount(m.count);}
        else if(m.t==='full'){setStatus('full');closed=true;}
      };
      sock.onclose=()=>{clearInterval(pinger);ws.current=null;if(closed)return;players.current.clear();setCount(1);
        retry++;if(retry>6){setStatus('error');return;}setStatus(navigator.onLine===false?'offline':'reconnecting');timer=setTimeout(connect,Math.min(15000,600*2**retry));};
      sock.onerror=()=>{try{sock.close();}catch{}};
    };
    connect();
    return()=>{closed=true;clearTimeout(timer);clearInterval(pinger);try{ws.current?.close();}catch{}ws.current=null;players.current.clear();};
  },[mapId,serverId]);
  const send=(m:any)=>{const s=ws.current;if(s&&s.readyState===1)s.send(JSON.stringify(m));};
  return useMemo(()=>({players,status,ping,roster:count,count,messages,duelInvite:null,dismissDuel:()=>{},inviteDuel:async()=>null,
    reportMove:(x:number,y:number,d:number,_moved?:boolean,car?:string|null,heading?:number)=>{position.current={x,y};const t=performance.now(),l=lastSent.current;if(Math.abs(x-l.x)+Math.abs(y-l.y)<1&&t-l.t<1000)return;if(t-l.t<80)return;lastSent.current={x,y,t};send({t:'move',x,y,d,car:car??null,heading:heading??0});},
    stopped:()=>{},
    say:(text:string)=>send({t:'chat',text}),
    sendChat:async(text:string)=>{if(status!=='live')return 'Explore alongside the local characters. Connect online to chat with other players.';send({t:'chat',text});return null;}}),[status,ping,count,messages]);
}
export async function recordKairosActivity(activity:string){
  // Offline Kairos Life is never reported to the online profile.
  if((window as any).__kairosOffline)return;
  const key='activity-summary';let summary:any={};try{summary=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
  summary[activity]=(Number(summary[activity])||0)+1;try{localStorage.setItem(key,JSON.stringify(summary));}catch{}
  parent.postMessage({type:'kairos-world:activity',activity},location.origin);
}
