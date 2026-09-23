import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createUnityServer} from './tools/unity-preview.mjs';
test('one origin serves Unity binaries and preserves API origin through the proxy',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'unity-serving-'));
 const backend=http.createServer((req,res)=>res.end(JSON.stringify({host:req.headers.host,origin:req.headers.origin})));
 await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
 const server=createUnityServer({root,upstreamPort:backend.address().port});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 try{
  await fs.writeFile(path.join(root,'game.wasm'),Buffer.from([0,97,115,109,1,0,0,0]));
  const wasm=await fetch(origin+'/unity-build/game.wasm');assert.equal(wasm.headers.get('content-type'),'application/wasm');assert.equal((await wasm.arrayBuffer()).byteLength,8);
  const api=await fetch(origin+'/api/profile',{headers:{Origin:origin}});assert.deepEqual(await api.json(),{host:new URL(origin).host,origin});
  assert.equal((await fetch(origin+'/unity-build/missing')).status,404);
  assert.equal((await fetch(origin+'/unity-build/game.wasm',{method:'POST'})).status,405);
  assert.equal((await fetch(origin+'/unity-build/%2e%2e%2fsecret')).status,404);
 }finally{server.closeAllConnections();backend.closeAllConnections();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>backend.close(r))]);await fs.rm(root,{recursive:true,force:true});}
});
