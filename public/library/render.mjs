import {animationFrame,motionOffset} from './animation.mjs';
import {animals,fish,crates,bushes,walls,characters} from './data.mjs';
import {hazards,timing} from './engine.mjs';
const atlas=new Image();atlas.src='assets/arcade/characters.png';
const world=new Image();world.src='assets/arcade/world.webp';
const walk=new Image();walk.src='assets/arcade/walk.png';
const creatures=new Image();creatures.src='assets/arcade/creatures.png';
const colors=['#2fc6b3','#fa896e','#ffd16b','#bca0f2'];
export function portrait(index,cls=''){return `<span class="avatar-sprite ${cls}" style="--character:${index}" role="img" aria-label="${characters[index]?.name||'Explorer'}"></span>`;}
export function drawGame(canvas,s,localId,reduced=false){
 const c=canvas.getContext('2d'),ratio=Math.min(devicePixelRatio||1,2);if(canvas.width!==700*ratio){canvas.width=700*ratio;canvas.height=500*ratio;}c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,700,500);
 const text=(t,x,y,size=18,color='#fff',align='center')=>{c.fillStyle=color;c.font=`800 ${size}px Trebuchet MS, sans-serif`;c.textAlign=align;c.fillText(t,x,y);};
 const box=(x,y,w,h,color,r=12)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
 const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
 const creature=(index,x,y,size=80)=>{if(!creatures.complete||!creatures.naturalWidth)return;const cell=creatures.naturalWidth/4;c.save();c.globalCompositeOperation='multiply';c.drawImage(creatures,(index%4)*cell,Math.floor(index/4)*cell,cell,cell,x-size/2,y-size/2,size,size);c.restore();};
 const sprite=(p,x=p.x,y=p.y,scale=1)=>{const bounce=motionOffset(s.time,!!p.moving,reduced);ellipse(x,y+5,22*scale,7*scale,'#123b4438');c.globalAlpha=p.alive===false?.4:1;
  if(atlas.complete&&atlas.naturalWidth){const moving=walk.complete&&walk.naturalWidth,source=moving?walk:atlas,cw=source.naturalWidth/4,ch=source.naturalHeight/(moving?4:2),col=moving?animationFrame(s.time,!!p.moving,reduced):(p.character||0),row=moving?(p.character||0):0;c.save();c.globalCompositeOperation=moving?"source-over":"multiply";c.translate(x,y-40*scale+bounce-(p.jump>0?Math.sin(p.jump/.8*Math.PI)*45:0));if(p.facing===-1)c.scale(-1,1);c.rotate(reduced?0:Math.sin(s.time*8)*.025);c.drawImage(source,col*cw,row*ch,cw,ch,-39*scale,-48*scale,78*scale,96*scale);c.restore();}
  else{ellipse(x,y-25,18,25,colors[p.character%4]);ellipse(x,y-53,15,15,'#efbc83');}
  c.globalAlpha=1;if(p.hat==='crown')text('✦',x,y-78,26,'#ffe16e');if(p.hat==='sunhat'){ellipse(x,y-80,20,5,'#edc675');box(x-12,y-94,24,15,'#f4d388',7);}
  text(p.name+(p.cpu?' · CPU':''),x,y+24,12,p.id===localId?'#fff0aa':'#fff');
 };
 const sky=c.createLinearGradient(0,0,0,500);sky.addColorStop(0,'#78c9df');sky.addColorStop(.5,'#d8f1d4');sky.addColorStop(1,'#87b758');c.fillStyle=sky;c.fillRect(0,0,700,500);
 if(['ark-park','galilee'].includes(s.gameId)){
  if(world.complete&&world.naturalWidth){c.drawImage(world,0,0,700,500);c.fillStyle='#13374755';c.fillRect(0,0,700,500);}
  const lake=s.gameId==='galilee';box(20,90,660,370,lake?'#087b9bbd':'#236447a8',32);
  if(lake){for(let i=0;i<10;i++){c.strokeStyle='#c4f3ec55';c.lineWidth=2;c.beginPath();c.ellipse(70+i*65,180+(i%3)*65,25+Math.sin(s.time+i)*5,5,0,0,7);c.stroke();}}
  const slot=Math.floor(s.time/4),p=s.players.find(p=>p.id===localId)||s.players[0],pool=lake?fish:animals.filter(a=>a[3]===p.biome),item=pool[(s.spawns[slot%s.spawns.length]+(lake?slot:0))%pool.length];
  text(lake?'THE LAKE IS FULL OF SURPRISES':`${p.biome.toUpperCase()} HABITAT`,350,135,15,'#e8f4bf');
  ellipse(350,300,86,23,'#123d3455');creature(item[1],350+Math.sin(s.time*1.8)*24,246+(reduced?0:Math.sin(s.time*3)*6),142);text(item[2],350,330,25);
  if(p.flash>0&&!reduced){for(let i=0;i<12;i++){const angle=i*Math.PI/6,dist=(1-p.flash)*130;ellipse(350+Math.cos(angle)*dist,260+Math.sin(angle)*dist,3*p.flash,3*p.flash,i%2?'#fff6be':'#ffcf68');}text('+'+(10+Math.min(5,p.combo-1)*2),350,210-(1-p.flash)*55,27,'#ffeb98');}
  const caught=lake?p.lastCast===slot:!!s.claims[slot];text(caught?'Next visitor in '+Math.ceil(4-s.time%4)+'…':lake?'A bite! Reel in the green.':'A new friend! Catch in the green.',350,366,16);
  box(190,392,320,23,'#183846',12);const zone=s.age==='little'?.36:.21;box(190+(0.5-zone)*320,392,zone*640,23,'#b9e675',10);ellipse(190+timing(s.time)*320,403,10,16,'#fff5bf');
  for(let i=0;i<s.players.length;i++)sprite(s.players[i],70+i*78,439,.7);
 }else if(s.gameId==='pharaoh-chase'){
  c.fillStyle='#f7d393';c.fillRect(0,150,700,350);for(let i=0;i<3;i++){c.fillStyle=['#d8a45e','#e5b56d','#c99253'][i];c.beginPath();c.moveTo(i*230-80,180);c.lineTo(i*230+80,25+i*20);c.lineTo(i*230+220,180);c.fill();}
  c.fillStyle='#d49553';c.beginPath();c.moveTo(245,160);c.lineTo(455,160);c.lineTo(680,500);c.lineTo(20,500);c.fill();
  for(let i=0;i<3;i++){c.strokeStyle='#f7d78e';c.lineWidth=5;c.beginPath();c.moveTo(280+i*70,160);c.lineTo(80+i*270,500);c.stroke();}
  for(const o of s.course){const delta=o.at-s.time;if(delta<-.5||delta>5)continue;const y=395-delta*53,x=350+(o.lane-1)*(70+(y-130)*.38);if(o.kind==='coin'){ellipse(x,y,12,15,'#ffea69');text('✦',x,y+5,19,'#b17b29');}else if(o.kind==='gap'){ellipse(x,y,44,16,'#734d43');}else if(o.kind==='hurdle'){box(x-32,y-22,64,25,'#b76543',4);box(x-32,y-22,64,6,'#f6cb88',2);}else{ellipse(x,y,40,12,'#e2b275');}}
  s.players.forEach((p,i)=>sprite(p,170+p.lane*180,420-i*19,.9));text('TODAY’S DESERT RUN',350,70,24,'#74472d');
 }else{
  const plague=s.gameId==='plague-party';box(15,55,670,420,plague?'#e5c894':'#a5cd78',30);
  for(let i=0;i<60;i++){const x=30+(i*83%630),y=75+(i*131%370);ellipse(x,y,2,3,plague?'#bc9e6355':'#437e4350');}
  if(plague){
   if(s.wave===0&&s.time%15>3){box(20,65,Math.min(660,(s.time%15-3)*90),395,'#60bb8880',25);for(let i=0;i<8;i++)creature(12,40+i*85,105+(i%3)*120+(reduced?0:Math.abs(Math.sin(s.time*4+i))*12),44);}
   if(s.wave===3){box(20,65,660,395,'#bb6c5780',25);box(285,65,130,395,'#d8c895',8);}
   for(const w of walls){box(w.x,w.y+7,w.w,w.h,'#916943',4);box(w.x,w.y,w.w,w.h-5,'#c59760',4);}
   for(const b of crates){box(b.x-37,b.y-24,74,55,'#a56d3d',9);box(b.x-37,b.y-31,74,45,'#e5b16d',9);c.strokeStyle='#b47b43';c.lineWidth=3;c.strokeRect(b.x-26,b.y-22,52,27);}
   for(const h of hazards(s)){ellipse(h.x,h.y+5,25,9,'#58677c44');creature(13,h.x,h.y,45);}
   text(['FROGS · get onto a crate','HAIL · dodge the ice','DARKNESS · find your way','RED WATER · stay on the stones'][s.wave],350,37,19,'#4d3d39');
   if(s.time%15<3)text('READY…',350,250,42,'#684b43');
  }else{box(286,393,128,73,'#f6dfae',18);text('HOME',350,435,22,'#657544');for(const b of bushes){ellipse(b.x,b.y,49,30,'#568654');ellipse(b.x-15,b.y-15,30,26,'#70a757');ellipse(b.x+17,b.y-12,30,28,'#83b860');}text('BRING EVERY LITTLE SHEEP HOME',350,35,19,'#355747');}
  for(const p of [...s.players].sort((a,b)=>a.y-b.y)){
   if(p.role==='sheep'&&!plague){ellipse(p.x,p.y+8,19,6,'#28544230');creature(p.hidden?15:1,p.x,p.y-12+(reduced?0:Math.sin(s.time*5)*2),65);if(p.lost)text('LOST',p.x,p.y-42,10,'#804c3a');if(p.saved)text('SAFE',p.x,p.y-42,10,'#316846');text(p.name,p.x,p.y+25,12,'#305644');}
   else{sprite(p);if(!plague)text(p.role==='wolf'?'WOLF':'SHEPHERD',p.x,p.y-86,9,'#285941');}
  }
  if(plague&&s.wave===2){const p=s.players.find(p=>p.id===localId)||s.players[0];const light=c.createRadialGradient(p.x,p.y,65,p.x,p.y,155);light.addColorStop(0,'#12263800');light.addColorStop(1,'#122638ef');c.fillStyle=light;c.fillRect(15,55,670,420);}
 }
}
