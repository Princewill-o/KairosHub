import test from 'node:test';
import assert from 'node:assert/strict';
import {makeId,TouchDirections} from './public/library/mobile.mjs';
test('local HTTP play does not require randomUUID',()=>{
 const crypto={getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=i;return a;}};
 assert.match(makeId(crypto),/^[0-9a-f-]{36}$/);
});
test('releasing one finger preserves another held direction and cancel clears movement',()=>{
 const pad=new TouchDirections();pad.set(1,1,0);pad.set(2,0,-1);
 assert.deepEqual(pad.value(),{x:1,y:-1});pad.remove(1);assert.deepEqual(pad.value(),{x:0,y:-1});pad.clear();assert.deepEqual(pad.value(),{x:0,y:0});
});
