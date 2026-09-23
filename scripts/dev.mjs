import {spawnSync,spawn} from 'node:child_process';
import {createUnityServer} from '../tools/unity-preview.mjs';
for(const args of [['scripts/build.mjs'],['node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local']]){const r=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});if(r.status!==0)process.exit(r.status||1);}
const backendPort=Number(process.env.KAIROS_BACKEND_PORT||4175);
const p=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--local','--port',String(backendPort)],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
const server=createUnityServer({upstreamPort:backendPort});
server.on('error',error=>{console.error(error.message);p.kill('SIGTERM');process.exitCode=1;});
server.listen(4173,'127.0.0.1',()=>console.log('Kairos + Unity exports: http://localhost:4173'));
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>{server.closeAllConnections();server.close();p.kill(s);});
p.on('exit',code=>{server.closeAllConnections();server.close();process.exitCode=code||0;});
