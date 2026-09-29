import test from 'node:test';
import assert from 'node:assert/strict';
import {handleScripture} from './server/scripture.mjs';
const request=ref=>new Request('https://kairos.test/api/scripture?reference='+encodeURIComponent(ref));
test('rejects URLs and unsupported references before fetching',async()=>{
 let calls=0; const fetcher=()=>{calls++;throw Error();};
 for(const ref of ['https://example.com','John 3; DROP TABLE','']) assert.equal((await handleScripture(request(ref),fetcher)).status,400);
 assert.equal(calls,0);
});
test('normalizes game references and returns attributed WEB text',async()=>{
 const r=await handleScripture(request('Psalm 23:1–2 (KJV)'),async url=>{
 assert.match(String(url),/translation=web/);
 assert.match(decodeURIComponent(String(url)),/Psalm 23:1-2/);
 return Response.json({reference:'Psalms 23:1-2',text:'Yahweh is my shepherd.',translation_id:'web',verses:[{verse:1,text:'Yahweh is my shepherd.'}]});
 });
 assert.equal(r.status,200);const body=await r.json();assert.equal(body.translation,'World English Bible');assert.equal(body.text,'Yahweh is my shepherd.');
});
test('upstream limits and failures produce recoverable errors',async()=>{
 assert.equal((await handleScripture(request('John 3:16'),async()=>new Response('',{status:429}))).status,429);
 assert.equal((await handleScripture(request('John 3:16'),async()=>{throw Error('offline');})).status,503);
 assert.equal((await handleScripture(request('John 3:16'),async()=>Response.json({text:'bad'}))).status,502);
});
import {loadScripture} from './public/scripture.mjs';
test('saved Scripture works offline and unavailable storage does not break reading',async()=>{
 const data={text:'Jesus wept.',reference:'John 11:35',translationId:'web'};
 let value=null; const storage={getItem:()=>value,setItem:(_k,v)=>{value=v;}};
 await loadScripture('John 11:35',{storage,fetcher:async()=>Response.json(data)});
 assert.equal((await loadScripture('John 11:35',{storage,fetcher:()=>{throw Error('offline');}})).saved,true);
 const blocked={getItem(){throw Error();},setItem(){throw Error();}};
 assert.equal((await loadScripture('John 11:35',{storage:blocked,fetcher:async()=>Response.json(data)})).text,data.text);
});
