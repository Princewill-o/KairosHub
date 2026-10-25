import React, { lazy, Suspense } from 'react';

export function navigate(href: string) {
  if (/^https?:/.test(href)) { window.open(href,'_blank','noopener,noreferrer'); return; }
  const url=new URL(href,location.origin);
  if(url.pathname.startsWith('/games/world')||url.pathname.startsWith('/games/preview')||url.pathname==='/games/home'||url.pathname==='/games/arcade'){
    const map=url.pathname==='/games/arcade'?'scripture-island':url.pathname==='/games/home'?'home':url.searchParams.get('map')||'city';
    location.assign('/world/index.html?map='+encodeURIComponent(map));return;
  }
  parent.postMessage({type:'kairos-world:navigate',route:url.pathname==='/bible'?'bible':url.pathname.includes('parents')?'journey':'multiplayer'},location.origin);
}
export const useRouter=()=>({push:navigate,replace:navigate,refresh:()=>window.dispatchEvent(new Event('kairos-world:refresh')),back:()=>parent.postMessage({type:'kairos-world:navigate',route:'multiplayer'},location.origin)});
export const usePathname=()=>'/world';
export const useSearchParams=()=>new URLSearchParams(location.search);
export function redirect(href:string){navigate(href);}
export function Link({href,children,onClick,prefetch,replace,scroll,...props}:any){return <a {...props} href={href} onClick={event=>{onClick?.(event);if(!event.defaultPrevented){event.preventDefault();navigate(String(href));}}}>{children}</a>;}
export default Link;
export function dynamic(load:()=>Promise<any>,options:any={}){const Component=lazy(async()=>{const item=await load();return {default:item.default??item};});return function Dynamic(props:any){const Loading=options.loading;return <Suspense fallback={Loading?<Loading/>:null}><Component {...props}/></Suspense>;};}
export function Image({src,alt='',fill,priority,sizes,unoptimized,quality,...props}:any){return <img {...props} src={src} alt={alt} style={{...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{}),...props.style}}/>;}
