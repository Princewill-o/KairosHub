import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {scopedStorage} from './world-runtime/bridge/storage.mjs';
test('world help describes desktop, touch, travel and stories without auto opening',async()=>{
 const {worldInstructions}=await import('./public/kairos-world.mjs');
 const guide=worldInstructions();for(const text of ['WASD','Space','joystick','LTBS','Grace','train'])assert.ok(guide.includes(text),text);
 assert.match(guide,/<dialog[^>]*aria-labelledby=/);assert.doesNotMatch(guide,/<dialog[^>]*\sopen(?:\s|>)/);
 const source=await readFile('public/kairos-world.mjs','utf8');assert.match(source,/world-help/);assert.match(source,/showModal\(/);
});
test('journey reports only the selected player world progress',async()=>{
 const {readWorldProgress}=await import('./public/kairos-world.mjs');
 const saved={'kairos-world:a:kairos-ltbs-progress-v1':JSON.stringify({grace:90,completed:{'david:0':{grace:90}}}),'kairos-world:b:kairos-ltbs-progress-v1':JSON.stringify({grace:900,completed:{}})};
 const store={getItem:key=>saved[key]??null};assert.equal(readWorldProgress('a',store).grace,90);assert.equal(readWorldProgress('a',store).chapters,1);assert.equal(readWorldProgress('c',store).grace,0);
});
test('world progress is isolated per player and works without device storage',()=>{
 const data=new Map();const original={get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const a=scopedStorage(original,'a:'),b=scopedStorage(original,'b:');a.setItem('grace',50);b.setItem('grace',10);
 assert.equal(a.getItem('grace'),'50');assert.equal(b.getItem('grace'),'10');assert.deepEqual(Object.keys(a),['grace']);a.clear();assert.equal(b.getItem('grace'),'10');
 const blocked=scopedStorage(null,'a:');blocked.setItem('progress','saved');assert.equal(blocked.getItem('progress'),'saved');assert.equal(blocked.length,1);
});
test('Together offers only Kairos World with no chapter room entry points',async()=>{
 const app=await readFile('public/app.js','utf8');
 assert.match(app,/href="#world"/);assert.match(app,/mountKairosWorld/);assert.doesNotMatch(app,/activeModule=multiplayer|party-root|Guess the Chapter/);
 const landing=await readFile('public/landing.mjs','utf8');assert.doesNotMatch(landing,/Guess the Chapter|shared room code/);
});
test('world bridge validates message source and only sends selected profile identity',async()=>{
 const {worldMessage,worldProfile}=await import('./public/kairos-world.mjs');
 const source={};const event={origin:'https://kairos.test',source,data:{type:'kairos-world:ready'}};
 assert.equal(worldMessage(event,'https://kairos.test',source),'ready');
 assert.equal(worldMessage({...event,origin:'https://other.test'},'https://kairos.test',source),null);
 assert.equal(worldMessage({...event,source:{}},'https://kairos.test',source),null);
 assert.deepEqual(worldProfile({id:'p1',name:'Kai',age:9,email:'private'}),{id:'p1',name:'Kai'});
});
test('heavy world assets are excluded from initial offline installation',async()=>{
 const offline=await readFile('scripts/offline.mjs','utf8');assert.match(offline,/world3d/);
});
