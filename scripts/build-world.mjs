import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const requested=process.argv.indexOf('--source-root');
const source=requested>=0?path.resolve(process.argv[requested+1]):path.join(root,'world-runtime/source');
const bridge=path.join(root,'world-runtime/bridge');
const bootstrap=requested>=0;
const originalNode=bootstrap?path.resolve(source,'../node_modules'):path.join(root,'node_modules');
const plugin={name:'kairos-platform',setup(api){
  api.onResolve({filter:/^next\/(link|navigation|dynamic|image)$/},args=>({path:args.path,namespace:'platform'}));
  api.onLoad({filter:/.*/,namespace:'platform'},args=>({contents:args.path==='next/navigation'?`export {useRouter,usePathname,useSearchParams,redirect} from ${JSON.stringify(path.join(bridge,'navigation.tsx'))};`:`export {${args.path==='next/dynamic'?'dynamic':args.path==='next/image'?'Image':'Link'} as default} from ${JSON.stringify(path.join(bridge,'navigation.tsx'))};`,loader:'tsx',resolveDir:root}));
  api.onResolve({filter:/.*/},args=>{
    const resolved=args.path.startsWith('@/')?path.join(source,args.path.slice(2)):args.path.startsWith('.')?path.resolve(path.dirname(args.importer),args.path):null;
    if(!resolved)return;
    const oldPublic=path.join(root,'world-runtime/public');
    if(resolved.startsWith(oldPublic+path.sep))return {path:path.join(root,'public',path.relative(oldPublic,resolved))};
    const normal=resolved.replaceAll('\\','/').replace(/\.(tsx?|jsx?)$/,'');
    if(normal.endsWith('/components/game/world/use-world')||normal.endsWith('/lib/supabase-browser')||normal.endsWith('/components/app/app-shell')||normal.endsWith('/lib/game/kairos-activity'))return {path:path.join(bridge,'platform.tsx')};
    if(args.path.startsWith('@/app/'))return {path:path.join(bridge,'actions.ts')};
    if(args.path.startsWith('@/'))return {path:resolved+(['.tsx','.ts','.json'].find(ext=>{try{return requireExists(resolved+ext);}catch{return false;}})||'')};
  });
}};
import {existsSync as requireExists} from 'node:fs';
await fs.mkdir(path.join(root,'public/world'),{recursive:true});
const result=await build({absWorkingDir:root,entryPoints:['world-runtime/main.tsx'],outdir:'public/world',entryNames:'app',chunkNames:'chunks/[name]-[hash]',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',minify:true,jsx:'automatic',tsconfigRaw:{compilerOptions:{jsx:'react-jsx'}},nodePaths:[originalNode],define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[plugin],metafile:true});
if(bootstrap){
  const target=path.join(root,'world-runtime/source');
  let count=0;
  for(const name of Object.keys(result.metafile.inputs)){
    const absolute=path.resolve(root,name),relative=path.relative(source,absolute);
    if(relative.startsWith('..')||path.isAbsolute(relative))continue;
    const dest=path.join(target,relative);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(absolute,dest);count++;
  }
  const publicSource=path.resolve(source,'../public');
  for(const name of ['world3d','world','characters','campaign'])await fs.cp(path.join(publicSource,name),path.join(root,'public',name),{recursive:true});
  await fs.mkdir(path.join(root,'public/brand'),{recursive:true});await fs.copyFile(path.join(publicSource,'brand/kharis-mark.png'),path.join(root,'public/brand/kharis-mark.png'));
  await fs.copyFile(path.join(source,'styles/globals.css'),path.join(root,'world-runtime/world.css'));
  const packages=new Set();for(const name of Object.keys(result.metafile.inputs)){const normal=name.replaceAll('\\','/'),tail=normal.split('/node_modules/').at(-1);if(normal.includes('/node_modules/'))packages.add(tail.startsWith('@')?tail.split('/').slice(0,2).join('/'):tail.split('/')[0]);}
  console.log(`Imported ${count} runtime source modules. Packages: ${[...packages].sort().join(', ')}`);
}
await fs.writeFile(path.join(root,'public/world/index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Kairos World</title><link rel="stylesheet" href="/world/app.css"></head><body><div id="world-root"></div><script type="module" src="/world/app.js"></script></body></html>');
const cssPath=path.join(root,'world-runtime/world.css');
const css=await postcss([tailwind({base:path.join(root,'world-runtime')})]).process(await fs.readFile(cssPath,'utf8'),{from:cssPath,to:path.join(root,'public/world/app.css')});
await fs.writeFile(path.join(root,'public/world/app.css'),css.css+'\nhtml,body,#world-root{height:100%;margin:0;overflow:hidden}#world-root>div{height:100dvh!important}\n');
console.log('Kairos World browser runtime built.');
