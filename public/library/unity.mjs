import {arcadeGames,escapeHtml as esc} from './data.mjs';
import {KEY,normalizeLibrary} from './store.mjs';
export function unityLaunch(gameId,profile={},reducedMotion=false){
 if(!arcadeGames.some(g=>g.id===gameId))throw new Error('Unknown Unity game');
 return {type:'kairos:start',gameId,character:[0,1,2,3].includes(profile.character)?profile.character:0,reducedMotion:!!reducedMotion};
}
export function validUnityResult(value,gameId){
 return !!value&&value.type==='kairos:complete'&&value.gameId===gameId&&value.completed===true&&Number.isInteger(value.score)&&value.score>=0&&value.score<=1000000;
}
export function mountUnity(root,gameId='ark-park'){
 if(!arcadeGames.some(g=>g.id===gameId))gameId='ark-park';
 let disposed=false,frame=null,finished=false,timeout;const controller=new AbortController();
 let profile={};try{profile=normalizeLibrary(JSON.parse(localStorage.getItem(KEY))).profile;}catch{}
 const game=arcadeGames.find(g=>g.id===gameId);
 root.innerHTML=`<section style="max-width:1100px;margin:auto;padding:24px"><a href="#">Back to library</a><h1>${esc(game.title)} · Unity</h1><nav aria-label="Unity adventures">${arcadeGames.map(g=>`<a style="display:inline-block;padding:12px" href="#unity/${g.id}">${esc(g.title)}</a>`).join('')}</nav><p id="unity-status" role="status">Checking for a Unity build…</p><div id="unity-stage"></div><p><a class="arcade-primary" href="#arcade/${gameId}">Play browser version</a></p><details><summary>Unity development checkpoint</summary><p>The Unity source includes five prototype round loops. Lost Sheep includes cooperative rescue and host-assigned shepherd, wolf and sheep roles for groups of three or more. A compiled export must be installed before Unity can run here. LAN hosting needs the native app; browser clients require matching WebSocket transport.</p><a href="https://github.com/Princewill-o/KairosHub/tree/main/unity">Source and setup instructions</a></details></section>`;
 const status=root.querySelector('#unity-status');
 function receive(event){
  if(disposed||!frame||event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='kairos:ready'){
   clearTimeout(timeout);frame.contentWindow.postMessage(unityLaunch(gameId,profile,matchMedia('(prefers-reduced-motion: reduce)').matches),location.origin);status.textContent='Unity game ready.';
  }else if(!finished&&validUnityResult(event.data,gameId)){
   finished=true;status.textContent=`Adventure complete · ${event.data.score} points. Unity scores are separate from browser progress.`;
  }
 }
 window.addEventListener('message',receive);
 fetch('/unity-build/build.json',{signal:controller.signal,cache:'no-store'}).then(async response=>{
  if(!response.ok)throw Error('missing');const manifest=await response.json();
  if(manifest.schema!==1||manifest.engine!=='unity'||manifest.entry!=='index.html')throw Error('invalid');
  if(disposed)return;
  frame=document.createElement('iframe');frame.src='/unity-build/index.html';frame.title=game.title+' Unity game';frame.allow='fullscreen';frame.style='width:100%;height:min(78vh,780px);min-height:420px;border:0;background:#060609';
  root.querySelector('#unity-stage').append(frame);status.textContent='Loading the Unity game…';
  timeout=setTimeout(()=>{if(!disposed)status.textContent='Unity is taking longer to load. The browser version is available below.';},45000);
 }).catch(()=>{if(!disposed)status.textContent='Unity build not installed yet. You can play the working browser version below.';});
 return {dispose(){disposed=true;controller.abort();clearTimeout(timeout);window.removeEventListener('message',receive);frame?.remove();}};
}
