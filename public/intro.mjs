const overlay=document.querySelector('#site-intro');
if(overlay){
 const app=document.querySelector('#app'),start=document.querySelector('#intro-start'),video=document.querySelector('#intro-video'),skip=document.querySelector('#intro-skip'),status=document.querySelector('#intro-status');
 let leaving=false,starting=false,loadTimer;
 const showStatus=text=>{status.textContent=text;status.hidden=!text;};
 function finish(){
  if(leaving)return;leaving=true;clearTimeout(loadTimer);video.pause();overlay.classList.add('is-leaving');overlay.setAttribute('aria-hidden','true');overlay.inert=true;
  const remove=()=>{if(!overlay.isConnected)return;overlay.remove();app.inert=false;document.body.classList.remove('intro-active');const focus=app.querySelector('main h1')||app.querySelector('main h2')||app.querySelector('main')||app.querySelector('a, button');if(focus){if(!focus.hasAttribute('tabindex')&&!focus.matches('a,button'))focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});}document.dispatchEvent(new CustomEvent('kairos:intro-complete'));};
  overlay.addEventListener('transitionend',e=>{if(e.target===overlay&&e.propertyName==='opacity')remove();});
  setTimeout(remove,matchMedia('(prefers-reduced-motion: reduce)').matches?0:950);
 }
 function failed(){if(leaving)return;starting=false;clearTimeout(loadTimer);overlay.dataset.state='poster';showStatus('The video could not play. Tap anywhere to retry, or choose Skip intro.');start.disabled=false;start.focus({preventScroll:true});}
 async function play(){
  if(leaving||starting||overlay.dataset.state==='playing')return;
  starting=true;start.disabled=true;showStatus('Loading your intro…');
  if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
  loadTimer=setTimeout(()=>{if(!leaving&&overlay.dataset.state!=='playing')showStatus('The video is taking a moment to load. You can skip the intro anytime.');},8000);
  try{await video.play();if(leaving){video.pause();return;}starting=false;clearTimeout(loadTimer);showStatus('');overlay.dataset.state='playing';skip.focus({preventScroll:true});}catch{video.removeAttribute('src');failed();}
 }
 start.addEventListener('click',play);
 skip.addEventListener('click',finish);
 video.addEventListener('ended',finish);
 video.addEventListener('error',failed);
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();finish();}});
}
