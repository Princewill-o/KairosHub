const slides=[
 ['Your adventure starts here','Choose a game','Open Games and browse quizzes, puzzles and stories. Pick a game, read its instructions, then press Let’s play.','library','The game library with colourful game cards'],
 ['Take it one step at a time','Play, learn, try again','Tap an answer or follow the controls shown on the game board. Read the feedback and Scripture reference. Use Pause whenever you need a break.','quiz','Bible Quiz with answer buttons'],
 ['Make room for discovery','Explore different challenges','Find words, match pairs, draw a story or explore the map. Each game explains its own controls before you play.','memory','Bible Memory matching cards'],
 ['Keep growing together','Your journey and your people','My journey shows your stars and best scores on this device. Charades and Pictionary work together on one device. Ask a grown-up before joining online rooms, and share codes only with people you know.','library','The games library']
];
export function mountTutorial(root,{onDone}){
 let index=0;
 const render=()=>{
  const [tag,title,copy,picture,alt]=slides[index];
  root.innerHTML=`<main class="kg-tutorial" aria-roledescription="carousel" aria-label="Getting started"><div class="tutorial-top"><span>GETTING STARTED · ${index+1} / ${slides.length}</span><button id="tutorial-skip">Skip tutorial</button></div><img src="assets/previews/${picture}.png" alt="${alt}"><section aria-live="polite"><p>${tag}</p><h1 tabindex="-1">${title}</h1><p>${copy}</p></section><div class="tutorial-controls"><button id="tutorial-back" ${index===0?'disabled':''}>Back</button><div aria-label="Tutorial steps">${slides.map((_,i)=>`<button data-slide="${i}" aria-label="Step ${i+1}" ${i===index?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><button id="tutorial-next">${index===slides.length-1?'Start playing':'Next'}</button></div></main>`;
  root.querySelector('#tutorial-skip').onclick=onDone;
  root.querySelector('#tutorial-back').onclick=()=>{index--;render();};
  root.querySelector('#tutorial-next').onclick=()=>{if(index===slides.length-1)onDone();else{index++;render();}};
  root.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.slide);render();});
  root.querySelector('h1').focus({preventScroll:true});
 };render();
}
