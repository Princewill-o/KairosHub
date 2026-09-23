// Serve Unity exports outside the Worker bundle; forward the existing site/API unchanged.
import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const defaultRoot=fileURLToPath(new URL('../unity-build/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.wasm':'application/wasm','.data':'application/octet-stream','.png':'image/png','.css':'text/css'};
export function createUnityServer({root=defaultRoot,upstreamPort=4173}={}){return http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(!pathname.startsWith('/unity-build/')){
  const upstream=http.request({hostname:'127.0.0.1',port:upstreamPort,path:req.url,method:req.method,headers:req.headers},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
  upstream.on('error',()=>{if(!res.headersSent)res.writeHead(503);res.end('Kairos development backend is starting or unavailable.');});req.pipe(upstream);return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 try{
  const target=path.resolve(root,decodeURIComponent(pathname.slice('/unity-build/'.length)));
  const realRoot=await fs.realpath(root),realTarget=await fs.realpath(target);
  if(!realTarget.startsWith(realRoot+path.sep))throw Error();
  const stat=await fs.stat(realTarget);if(!stat.isFile())throw Error();
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(realTarget);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch{res.writeHead(404);res.end('Unity export not installed.');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.UNITY_PREVIEW_PORT||4174);
 createUnityServer().listen(port,'127.0.0.1',()=>console.log(`Unity + Kairos preview: http://localhost:${port}/#unity/ark-park`));
}
