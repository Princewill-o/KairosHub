import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import { unityLaunch, validUnityResult } from './unity/legacy-web/unity.mjs';

test('Unity launch accepts only known games and bounded character choices', () => {
  assert.equal(unityLaunch('lost-sheep', {character:3}).character, 3);
  assert.equal(unityLaunch('galilee', {character:99}).character, 0);
  assert.throws(() => unityLaunch('../../escape', {}));
});
test('Unity results reject unrelated games, invalid scores and unfinished rounds', () => {
  const result={type:'kairos:complete',gameId:'ark-park',score:120,completed:true};
  assert.equal(validUnityResult(result,'ark-park'),true);
  for(const patch of [{gameId:'galilee'},{score:Infinity},{score:-1},{completed:false},{score:'120'}])
    assert.equal(validUnityResult({...result,...patch},'ark-park'),false);
});
test('large Unity exports bypass the browser game offline cache',()=>{
 const handlers={};
 vm.runInNewContext(readFileSync('public/sw.js','utf8'),{
  self:{location:{origin:'http://localhost'},addEventListener:(name,fn)=>handlers[name]=fn},URL,
  fetch:()=>Promise.resolve({ok:false}),
 });
 let intercepted=false;
 handlers.fetch({request:{method:'GET',url:'http://localhost/unity-build/Build/game.wasm'},respondWith:()=>{intercepted=true;}});
 assert.equal(intercepted,false);
});
