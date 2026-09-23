import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {validateExport,testsPassed,unityArguments} from './scripts/unity-build.mjs';
test('Unity tests must have actually run and passed',()=>{
 assert.equal(testsPassed('<test-run total="5" passed="5" failed="0" result="Passed"/>'),true);
 for(const xml of ['', '<test-run total="0" failed="0" result="Passed"/>','<test-run total="5" failed="1" result="Failed"/>'])assert.equal(testsPassed(xml),false);
});
test('Web compilation selects its target and tests are not quit prematurely',()=>{
 assert.ok(unityArguments('/a project','build','/logs').includes('WebGL'));
 assert.ok(unityArguments('/a project','build','/logs').includes('Kairos.Editor.KairosBuild.Web'));
 assert.ok(!unityArguments('/a project','test','/logs').includes('-quit'));
});
test('a success marker alone cannot pass Unity build validation',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'kairos-unity-'));
 try{
  await writeFile(path.join(root,'build.json'),JSON.stringify({schema:1,engine:'unity',entry:'index.html'}));
  await assert.rejects(validateExport(root));
  await mkdir(path.join(root,'Build'));await writeFile(path.join(root,'index.html'),'Build/game.loader.js Build/game.data Build/game.framework.js Build/game.wasm');
  for(const suffix of ['loader.js','framework.js','data'])await writeFile(path.join(root,'Build/game.'+suffix),'fixture');
  await writeFile(path.join(root,'Build/game.wasm'),'not wasm');await assert.rejects(validateExport(root));
  await writeFile(path.join(root,'Build/game.wasm'),Buffer.from([0,97,115,109,1,0,0,0]));
  assert.equal((await validateExport(root)).engine,'unity');
 }finally{await rm(root,{recursive:true,force:true});}
});
