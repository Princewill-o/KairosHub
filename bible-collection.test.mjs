import test from 'node:test';import assert from 'node:assert/strict';
import {bibleGames,questions,crossword} from './public/bible/content.mjs';
import {bibleAnswer,bibleWordLine,bibleBingo,bibleCrossword,bibleShuffle} from './public/learning-engine.mjs';
test('sixteen unique games and answerable questions with references',()=>{
 assert.equal(new Set(bibleGames.map(g=>g.id)).size,16);
 for(const q of questions){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,4);assert.ok(q.ref);}
});
test('answer normalization accepts punctuation and aliases without partial matches',()=>{
 assert.ok(bibleAnswer('  NOAH! ','Noah'));assert.ok(bibleAnswer('Saul','Paul',['Saul']));assert.ok(!bibleAnswer('no','Noah'));
});
test('word search selects straight lines only and supports reverse direction',()=>{
 const grid=['NOAH','ABCD','EFGH','IJKL'];
 assert.equal(bibleWordLine(grid,0,3),'NOAH');assert.equal(bibleWordLine(grid,3,0),'HAON');assert.equal(bibleWordLine(grid,0,6),'');
});
test('bingo needs a full row, column or diagonal',()=>{
 assert.ok(bibleBingo([0,1,2]));assert.ok(bibleBingo([0,4,8]));assert.ok(!bibleBingo([0,1,8]));
});
test('crossword intersections agree and shuffle preserves each item',()=>{
 const board=bibleCrossword(crossword);assert.equal(board[0].join(''),'JERUSALEM');
 assert.equal(board[4][0],'H');assert.equal(board[4][8],'S');
 assert.deepEqual(bibleShuffle([1,2,3,4],()=>.2).sort(),[1,2,3,4]);
});
import {bibleStars,bibleMapPoint,bibleDailyPick,bibleStreak} from './public/learning-engine.mjs';
import {locations,verses} from './public/bible/content.mjs';
test('every game has its own cartoon icon and a players label',()=>{
 assert.equal(new Set(bibleGames.map(g=>g.icon)).size,16);
 for(const g of bibleGames){assert.match(g.icon,/^[A-Za-z]+$/);assert.ok(['solo','group'].includes(g.players));}
});
test('stars reward effort: any finished run earns one, 60% two, 90% three',()=>{
 assert.equal(bibleStars(undefined),0);assert.equal(bibleStars({runs:0,best:0}),0);
 assert.equal(bibleStars({runs:1,best:0}),1);assert.equal(bibleStars({runs:2,best:60}),2);assert.equal(bibleStars({runs:1,best:90}),3);
});
test('map points stay inside the drawing and keep east to the right',()=>{
 for(const p of locations){const {x,y}=bibleMapPoint(p.lon,p.lat);assert.ok(x>2&&x<98&&y>2&&y<98,p.name);}
 assert.ok(bibleMapPoint(12.5,41.9).x<bibleMapPoint(35.2,31.8).x);
});
test('today\'s pick is stable for a date and changes across days',()=>{
 const ids=bibleGames.map(g=>g.id);
 assert.equal(bibleDailyPick(ids,'2026-10-02'),bibleDailyPick(ids,'2026-10-02'));
 assert.ok(new Set(['2026-10-01','2026-10-02','2026-10-03','2026-10-04'].map(d=>bibleDailyPick(ids,d))).size>1);
});
test('streak grows on consecutive days, holds on the same day and resets after a gap',()=>{
 let s=bibleStreak({},'2026-10-01');assert.equal(s.streak,1);
 s=bibleStreak(s,'2026-10-01');assert.equal(s.streak,1);
 s=bibleStreak(s,'2026-10-02');assert.equal(s.streak,2);
 s=bibleStreak(s,'2026-10-05');assert.equal(s.streak,1);
});
test('verse guessing has enough unique verses for six rounds with distinct choices',()=>{
 assert.ok(verses.length>=12);assert.equal(new Set(verses.map(v=>v.ref)).size,verses.length);
});
import {kai,heroScene} from './public/bible/mascot.mjs';
test('Kai is drawn as vector art in five distinct poses, with no emoji characters',()=>{
 const poses=['wave','cheer','think','encourage','read'].map(p=>kai(p));
 assert.equal(new Set(poses).size,5);
 for(const svg of [...poses,kai('cheer',{bust:true}),heroScene()]){assert.match(svg,/^<svg /);assert.equal(/\p{Extended_Pictographic}/u.test(svg),false);}
 assert.match(kai('wave',{label:'Kai waving'}),/role="img" aria-label="Kai waving"/);
 assert.match(kai('wave'),/aria-hidden="true"/);
});
import {guide,CHARACTERS,currentCharacter,chooseCharacter} from './public/bible/mascot.mjs';
test('five characters with distinct looks, each drawable in every pose',()=>{
 assert.equal(CHARACTERS.length,5);assert.equal(new Set(CHARACTERS.map(c=>c.id)).size,5);
 assert.equal(new Set(CHARACTERS.map(c=>c.hair)).size,5,'each has its own hair style');
 for(const c of CHARACTERS)for(const pose of ['wave','cheer','think','encourage','read']){const svg=guide(pose,{character:c.id});assert.match(svg,new RegExp('guide-'+c.id));assert.equal(/\p{Extended_Pictographic}|undefined|NaN/u.test(svg),false,c.id+' '+pose);}
});
test('the chosen character is remembered, unknown choices are refused, and Kai is the default',()=>{
 const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))};
 try{assert.equal(currentCharacter().id,'kai');assert.equal(chooseCharacter('mei'),true);assert.equal(currentCharacter().id,'mei');assert.equal(chooseCharacter('nobody'),false);assert.equal(chooseCharacter('zara'),false);assert.equal(currentCharacter().id,'mei');}
 finally{delete globalThis.localStorage;}
});
