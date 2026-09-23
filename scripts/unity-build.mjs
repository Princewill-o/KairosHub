import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
export function unityArguments(project,mode,logs){
 const args=['-batchmode','-nographics','-projectPath',project,'-logFile',path.join(logs,mode+'.log')];
 return mode==='test'?[...args,'-runTests','-testPlatform','EditMode','-testResults',path.join(logs,'results.xml')]:[...args,'-buildTarget','WebGL','-executeMethod','Kairos.Editor.KairosBuild.Web','-quit'];
}
export function testsPassed(xml){
 const tag=xml.match(/<test-run\b[^>]*>/)?.[0]||'';
 return /\bresult="Passed"/.test(tag)&&/\bfailed="0"/.test(tag)&&Number(tag.match(/\btotal="(\d+)"/)?.[1])>0;
}
export async function validateExport(output){
 const marker=JSON.parse(await fs.readFile(path.join(output,'build.json'),'utf8'));
 if(marker.schema!==1||marker.engine!=='unity'||marker.entry!=='index.html')throw Error('Invalid Unity export marker.');
 const html=await fs.readFile(path.join(output,'index.html'),'utf8');
 for(const suffix of ['loader.js','framework.js','data','wasm']){
  const name=(await fs.readdir(path.join(output,'Build'))).find(n=>n.endsWith('.'+suffix));
  if(!name||!html.includes(name))throw Error('Missing or unreferenced Unity '+suffix+' output.');
  const file=path.join(output,'Build',name),stat=await fs.stat(file);if(!stat.size)throw Error('Empty Unity output: '+name);
  if(suffix==='wasm'){
   const handle=await fs.open(file);try{const b=Buffer.alloc(8);await handle.read(b,0,8,0);if(!b.equals(Buffer.from([0,97,115,109,1,0,0,0])))throw Error('Invalid WebAssembly binary.');}finally{await handle.close();}
  }
 }
 return marker;
}
async function run(editor,args){
 await new Promise((resolve,reject)=>{
  const child=spawn(editor,args,{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Unity exited with code '+code+'. Check unity/KairosAdventures/Logs.')));
 });
}
async function main(){
 const project=path.join(root,'unity/KairosAdventures');
 const version=(await fs.readFile(path.join(project,'ProjectSettings/ProjectVersion.txt'),'utf8')).match(/m_EditorVersion: (\S+)/)[1];
 const candidates=[process.env.UNITY_EDITOR,`/Applications/Unity/Hub/Editor/${version}/Unity.app/Contents/MacOS/Unity`,path.join(process.env.HOME||'',`Unity/Hub/Editor/${version}/Editor/Unity`),`C:/Program Files/Unity/Hub/Editor/${version}/Editor/Unity.exe`].filter(Boolean);
 let editor;for(const file of candidates){try{if((await fs.stat(file)).isFile()){editor=file;break;}}catch{}}
 if(!editor)throw Error(`Unity ${version} Editor not found. Install it with Web Build Support on a drive with sufficient space, or set UNITY_EDITOR to its executable path. No Unity build has run.`);
 const logs=path.join(project,'Logs');await fs.mkdir(logs,{recursive:true});
 await fs.rm(path.join(logs,'results.xml'),{force:true});
 console.log('Running Unity EditMode tests…');await run(editor,unityArguments(project,'test',logs));
 if(!testsPassed(await fs.readFile(path.join(logs,'results.xml'),'utf8')))throw Error('Unity tests did not all pass. Build stopped.');
 console.log('Compiling Unity Web export…');await run(editor,unityArguments(project,'build',logs));
 await validateExport(path.join(root,'unity-build'));
 console.log('Unity tests and build succeeded. Run npm run dev, then open http://localhost:4173/#unity/ark-park');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
