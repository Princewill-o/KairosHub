import test from 'node:test';
import assert from 'node:assert/strict';
import {handleVercelApi} from './server/vercel-api.mjs';
test('Vercel forwards room requests without trusting client identity headers',async()=>{
 const response=await handleVercelApi(new Request('https://kairos.vercel.app/api/rooms',{method:'POST',headers:{Origin:'https://kairos.vercel.app','Content-Type':'application/json','oai-authenticated-user-id':'forged'},body:'{"name":"Guest"}'}),async(url,init)=>{
 assert.equal(String(url),'https://kairos-story-games.packzpackz50.chatgpt.site/api/rooms');
 assert.equal(new Headers(init.headers).get('oai-authenticated-user-id'),null);
 assert.equal(new Headers(init.headers).get('origin'),'https://kairos-story-games.packzpackz50.chatgpt.site');
 return Response.json({room:{code:'ABCDEF'}},{status:201});
 });assert.equal(response.status,201);
});
test('Vercel rejects foreign origins and unsupported proxy paths',async()=>{
 const fail=()=>{throw Error('should not fetch');};
 assert.equal((await handleVercelApi(new Request('https://kairos.vercel.app/api/rooms',{method:'POST',headers:{Origin:'https://evil.test'}}),fail)).status,403);
 assert.equal((await handleVercelApi(new Request('https://kairos.vercel.app/api/arbitrary'),fail)).status,404);
 assert.equal((await handleVercelApi(new Request('https://kairos.vercel.app/api/profile',{headers:{'oai-authenticated-user-id':'forged'}}),fail)).status,401);
});
