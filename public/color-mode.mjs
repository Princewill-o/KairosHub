export function installColorMode(initial,onChange){
 let mode=initial;
 const sync=()=>{
  const host=document.querySelector('.lp-nav nav,.wl-top,.tutorial-top,.top-tools');
  if(!host)return;
  let button=host.querySelector('.theme-toggle');
  if(!button){button=document.createElement('button');button.type='button';button.className='theme-toggle';host.append(button);}
  const modeName=mode==='dark'?'Light':'Dark';
  const label=button.closest('.header-settings')?`Use ${modeName.toLowerCase()} mode`:modeName;
  if(button.textContent!==label)button.textContent=label;
  const aria=`Switch to ${modeName.toLowerCase()} mode`;
  if(button.getAttribute('aria-label')!==aria)button.setAttribute('aria-label',aria);
 };
 document.documentElement.dataset.theme=mode;
 document.addEventListener('click',e=>{if(!e.target.closest('.theme-toggle'))return;e.preventDefault();e.stopImmediatePropagation();mode=mode==='dark'?'light':'dark';document.documentElement.dataset.theme=mode;onChange(mode);sync();},true);
 new MutationObserver(sync).observe(document.querySelector('#app'),{childList:true,subtree:true});sync();
}
