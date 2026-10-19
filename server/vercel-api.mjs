import {handleScripture} from './scripture.mjs';
import {handleWorldScripture} from './world-scripture.mjs';
const backend='https://kairos-story-games.packzpackz50.chatgpt.site';
export async function handleVercelApi(request, fetcher=fetch) {
 const url=new URL(request.url),origin=request.headers.get('origin');
 if(origin && origin!==url.origin)return Response.json({error:'Please open the game on its own site.'},{status:403});
 if(url.pathname==='/api/scripture')return handleScripture(request,fetcher);
 if(url.pathname.startsWith('/api/scripture/'))return handleWorldScripture(request,{},fetcher);
 if(url.pathname==='/api/profile')return Response.json({signedIn:false,error:'Guest progress is saved on this device. Account saves are available on the original Kairos site.'},{status:401,headers:{'Cache-Control':'no-store'}});
 if(!/^\/api\/(?:health|rooms(?:\/[A-Z2-9]{6}(?:\/(?:join|action))?)?)$/.test(url.pathname))return Response.json({error:'Not found.'},{status:404});
 if(!['GET','POST'].includes(request.method))return Response.json({error:'Method not allowed.'},{status:405});
 const headers=new Headers({'Content-Type':'application/json','Origin':backend});
 const token=request.headers.get('authorization');if(token)headers.set('authorization',token);
 let body;
 if(request.method==='POST'){body=await request.text();if(body.length>4096)return Response.json({error:'Message too large.'},{status:413});}
 try{
  const upstream=await fetcher(backend+url.pathname,{method:request.method,headers,body,signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!upstream.headers.get('content-type')?.includes('application/json'))throw Error('Unexpected backend response');
  return new Response(await upstream.text(),{status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return Response.json({error:'The shared room service is unavailable. Please retry; solo games remain available.'},{status:503});}
}
