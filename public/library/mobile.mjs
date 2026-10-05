export function makeId(source=globalThis.crypto){
 if(source?.randomUUID)return source.randomUUID();
 const bytes=new Uint8Array(16);source.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export class TouchDirections {
 constructor(){this.points=new Map();}
 set(id,x,y){this.points.set(id,{x,y});}
 remove(id){this.points.delete(id);}
 clear(){this.points.clear();}
 value(){let x=0,y=0;for(const v of this.points.values()){x+=v.x;y+=v.y;}return{x:Math.sign(x),y:Math.sign(y)};}
}
const paths={play:'M7 4l14 8-14 8z',book:'M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4z M12 6v15',people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M20 21v-2a4 4 0 0 0-3-4 M16 3a4 4 0 0 1 0 8',profile:'M20 21a8 8 0 0 0-16 0 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8'};
export function mobileTabs(){
 const hash=location.hash.slice(1),active=hash==='profile'||hash==='journey'||hash==='character'?'profile':hash==='multiplayer'||hash.startsWith('room/')?'people':'play';
 return `<nav class="mobile-tabs" aria-label="App navigation">${[['play','#bible','Games'],['people','#multiplayer','Together'],['profile','#journey','My journey']].map(([id,href,name])=>`<a href="${href}" ${id===active?'aria-current="page"':''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${paths[id]}"/></svg><span>${name}</span></a>`).join('')}</nav>`;
}
