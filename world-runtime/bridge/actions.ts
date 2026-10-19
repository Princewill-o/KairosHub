import { carById } from '@/game/core/cars';
import { BIKES } from '@/game/core/bikes';
import { SHOP } from '@/game/core/law';
import { HOMES, FURNITURE, validLayout } from '@/game/core/homes';
const read=()=>{try{return JSON.parse(localStorage.getItem('world-economy')||'{"xp":0,"spent":0,"cars":["sedan"]}');}catch{return {xp:0,spent:0,cars:['sedan']};}};
const write=(state:any)=>localStorage.setItem('world-economy',JSON.stringify(state));
const balance=()=>{try{return Math.max(0,JSON.parse(localStorage.getItem('kairos-ltbs-progress-v1')||'{}').grace||0)-read().spent;}catch{return 0;}};
const spend=(price:number)=>{const state=read();if(balance()<price)return false;state.spent+=price;write(state);return true;};
export async function earnWorldXp(){const state=read();state.xp+=10;write(state);return {xp:10,total:state.xp,levelled:false};}
export async function worldBankStatus(){return {status:'none',balance:0};}
export async function worldBankBorrow(){return {ok:false,error:'Loans are not part of Kairos World.'};}
export async function worldBankRepay(){return {ok:false,error:'No active loan.'};}
export async function buyWorldItem(item:keyof typeof SHOP){const product=SHOP[item];return product&&spend(product.price)?{ok:true,clout:balance()}:{ok:false,error:'You need more Grace for this item.'};}
export async function buyCar(id:string){const car=carById(id),state=read();if(!car)return {ok:false,error:'Unknown vehicle.'};if(state.cars.includes(id))return {ok:true,clout:balance()};if(!spend(car.price))return {ok:false,error:'Earn more Grace through your story journeys first.'};const next=read();next.cars.push(id);write(next);return {ok:true,clout:balance()};}
export async function hireBike(id:string){const bike=BIKES.find(item=>item.id===id);return bike&&spend(bike.price)?{ok:true,clout:balance()}:{ok:false,error:'You need more Grace to hire this bike.'};}
const homeState=()=>{try{return JSON.parse(localStorage.getItem('world-home')||'{"owned":["studio"],"current":"studio","furniture":{}}');}catch{return {owned:['studio'],current:'studio',furniture:{}};}};
export async function buyHome(id:string){const home=HOMES.find(h=>h.id===id),state=homeState();if(!home)return {ok:false,error:'Unknown home.'};if(!state.owned.includes(id)){if(!spend(home.price))return {ok:false,error:'You need more Grace for this home.'};state.owned.push(id);}state.current=id;localStorage.setItem('world-home',JSON.stringify(state));return {ok:true};}
export async function buyFurniture(id:string){const item=FURNITURE.find(f=>f.id===id);if(!item||item.starter)return {ok:false,error:'Choose a furniture item from the shop.'};if(!spend(item.price))return {ok:false,error:'You need more Grace for this furniture.'};const state=homeState();state.furniture[id]=(state.furniture[id]||0)+1;localStorage.setItem('world-home',JSON.stringify(state));return {ok:true};}
export async function saveLayout(layout:any[]){const problem=validLayout(layout);if(problem)return {ok:false,error:problem};const state=homeState();state.layout=layout;localStorage.setItem('world-home',JSON.stringify(state));return {ok:true};}
export async function startCareerSession(){return {ok:false,error:'Career activities are not part of Kairos World.'};}
export async function completeCareerSession(){return {ok:false,error:'Career activities are not part of Kairos World.'};}
export async function cityAction(){return {ok:false,error:'Choose an activity in Kairos World.'};}
