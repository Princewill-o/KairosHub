import {handleVercelApi} from '../server/vercel-api.mjs';
export default async function handler(req,res) {
 const incoming=new URL(req.url,'https://'+req.headers.host);
 const route=incoming.searchParams.get('route');
 const url=new URL(route?'/api/'+route:incoming.pathname,incoming.origin);
 for(const [key,value]of incoming.searchParams)if(key!=='route')url.searchParams.append(key,value);
 const headers=new Headers();
 for(const [key,value]of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
 let body;
 if(!['GET','HEAD'].includes(req.method)){body=typeof req.body==='string'?req.body:JSON.stringify(req.body??{});}
 const result=await handleVercelApi(new Request(url,{method:req.method,headers,body}));
 res.statusCode=result.status;for(const [key,value]of result.headers)res.setHeader(key,value);
 res.end(await result.text());
}
