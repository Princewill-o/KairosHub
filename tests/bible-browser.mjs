// Plays every Bible game on a phone-sized screen: no runtime errors, no sideways scrolling,
// visible right/wrong feedback, and a finished quiz saves stars to My journey.
// Run `npm run dev` first, then: node tests/bible-browser.mjs
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
import {bibleGames,questions} from '../public/bible/content.mjs';
const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
// Sign in as a 9-year-old on KairosGames Kids (the welcome flow has its own test).
await context.addInitScript(()=>{if(!localStorage.getItem('kairos-accounts-v1'))localStorage.setItem('kairos-accounts-v1',JSON.stringify({parents:[{id:'g-1',name:'Kofi',age:40,email:'k@example.com'}],players:[{id:'p-1',name:'Ama',age:9,band:'kids',character:'ama',parentId:'g-1'}],active:'p-1'}));});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.KAIROS_URL||'http://localhost:4173/';
const fits=async label=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflows sideways');
try{
 await page.goto(base+'#bible');
 if(await page.locator('#intro-skip').count())await page.locator('#intro-skip').click();
 assert.equal(await page.locator('.bible-game-card').count(),16);
 assert.match(await page.locator('.kg-soon').textContent(),/Coming soon[\s\S]*PlayMessages/);
 assert.equal(await page.locator('.kg-soon a, .kg-soon button').count(),0,'PlayMessages is not playable yet');
 assert.match(await page.locator('.brand-mark').getAttribute('src'),/dove/);
 assert.equal(await page.locator('.bible-card-art img').count(),16,'each card shows its icon');
 await fits('library');
 assert.deepEqual(await page.locator('.bible-filters button').allTextContents(),['All','Knowledge','Puzzles','Explore']);
 const libraryLayout=await page.evaluate(()=>({
  firstGame:document.querySelector('.bible-game-card h2').getBoundingClientRect().bottom,
  navigation:document.querySelector('.mobile-tabs').getBoundingClientRect().top,
  announcement:document.querySelector('.kg-soon').getBoundingClientRect().top,
  gamesEnd:document.querySelector('#bible-grid').getBoundingClientRect().bottom,
 }));
 assert.ok(libraryLayout.firstGame<libraryLayout.navigation,'a playable game title is visible above phone navigation without scrolling');
 assert.ok(libraryLayout.announcement>=libraryLayout.gamesEnd,'coming-soon announcement follows playable games');
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.locator('.header-settings summary').evaluate(el=>{
   const control=el.getBoundingClientRect(),header=el.closest('.topbar').getBoundingClientRect();
   return control.left>=header.left&&control.right<=header.right&&control.width>=44&&control.height>=44;
  }),`Settings fits the header at ${width}px with a usable touch target`);
 }
 await page.setViewportSize({width:390,height:844});
 const playStyle=page.getByRole('group',{name:'Who is playing?'});
 await playStyle.getByRole('button',{name:'With friends',exact:true}).click({timeout:1500});
 assert.equal(await page.locator('.bible-game-card').count(),bibleGames.filter(g=>g.players==='group').length);
 assert.deepEqual(await page.locator('.bible-game-card h2').allTextContents(),bibleGames.filter(g=>g.players==='group').map(g=>g.title));
 await page.locator('#bible-search').fill('charades');assert.equal(await page.locator('.bible-game-card').count(),1);
 await page.locator('#bible-search').fill('quiz');assert.equal(await page.locator('.bible-game-card').count(),0);
 await page.getByRole('button',{name:'Show all games',exact:true}).click();assert.equal(await page.locator('.bible-game-card').count(),16);
 await playStyle.getByRole('button',{name:'On my own',exact:true}).click();
 assert.equal(await page.locator('.bible-game-card').count(),bibleGames.filter(g=>g.players==='solo').length);
 await playStyle.getByRole('button',{name:'All games',exact:true}).click();
 const settings=page.locator('.header-settings');
 await settings.locator('summary').click({timeout:1500});
 const soundControl=settings.locator('.sound-toggle');
 await soundControl.click();assert.equal(await soundControl.getAttribute('aria-pressed'),'true');
 await settings.locator('.theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await settings.locator('summary').press('Escape');assert.equal(await settings.getAttribute('open'),null);
 await page.reload();
 await settings.locator('summary').click();
 assert.equal(await soundControl.getAttribute('aria-pressed'),'true','sound preference survives reload');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','theme preference survives reload');
 await soundControl.click();await settings.locator('.theme-toggle').click();
 await settings.locator('summary').press('Escape');
 for(const g of bibleGames){
  await page.goto(base+'#bible/'+g.id);
  if(g.id==='quiz'){
   assert.match(await page.locator('.kg-how-to').textContent(),/9 questions.*3 levels.*No rush/s);
   assert.equal(await page.locator('.kg-how-to li').count(),3);
   assert.ok(await page.locator('#bible-start').evaluate(el=>el.getBoundingClientRect().bottom<document.querySelector('.mobile-tabs').getBoundingClientRect().top),'quiz Play button is visible above phone navigation');
  }
  if(g.players==='group'){
   assert.match(await page.locator('.kg-how-to').textContent({timeout:1500}),/2\+ players.*One device/s);
   assert.match(await page.locator('.kg-how-to').textContent(),/secret story/);
   assert.ok(await page.locator('#bible-start').evaluate(el=>el.getBoundingClientRect().bottom<document.querySelector('.mobile-tabs').getBoundingClientRect().top),g.id+' Play button is visible above phone navigation');
  }
  if(g.id==='word-search'){
   assert.match(await page.locator('.kg-how-to').textContent({timeout:1500}),/6 words.*No rush/s);
   assert.match(await page.locator('.kg-how-to').textContent(),/first and last letters/);
   assert.match(await page.locator('.kg-how-to').textContent(),/diagonally or backwards/);
   assert.ok(await page.locator('#bible-start').evaluate(el=>el.getBoundingClientRect().bottom<document.querySelector('.mobile-tabs').getBoundingClientRect().top),'word-search Play button is visible above phone navigation');
  }
  if(g.id==='memory'){
   assert.match(await page.locator('.kg-how-to').textContent(),/12 cards.*6 pairs.*No rush/s);
   assert.match(await page.locator('.kg-how-to').textContent(),/same Bible name/);
   assert.ok(await page.locator('#bible-start').evaluate(el=>el.getBoundingClientRect().bottom<document.querySelector('.mobile-tabs').getBoundingClientRect().top),'memory Play button is visible above phone navigation');
  }
  await page.locator('#bible-start').click();
  await page.locator('#bible-stage').waitFor();await fits(g.id);
  if(g.id==='word-search'){
   assert.equal(await page.locator('.bible-word-round').count(),1);
   assert.equal(await page.locator('#word-found-count').textContent(),'0 of 6 found');
   const letters=await page.locator('[data-cell]').allTextContents();
   const words=await page.locator('[data-word]').evaluateAll(els=>els.map(el=>el.dataset.word));
   const pathFor=word=>{
    for(let r=0;r<10;r++)for(let col=0;col<10;col++)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
     if(!dr&&!dc)continue;
     const path=Array.from(word,(_,i)=>[r+dr*i,col+dc*i]);
     if(path.every(([y,x],i)=>y>=0&&y<10&&x>=0&&x<10&&letters[y*10+x]===word[i]))return path.map(([y,x])=>y*10+x);
    }
    throw new Error('Word missing from grid: '+word);
   };
   for(const [i,word] of words.entries()){
    const path=pathFor(word),first=page.locator('[data-cell="'+path[0]+'"]'),last=page.locator('[data-cell="'+path.at(-1)+'"]');
    if(i===0){
     await first.scrollIntoViewIfNeeded();const a=await first.boundingBox(),b=await last.boundingBox();
     await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
     await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();
    }else if(i===1){await first.press('Enter');await last.press('Enter');}else{await first.click();await last.click();}
    if(i<5){
     assert.equal(await page.locator('#word-found-count').textContent(),(i+1)+' of 6 found');
     assert.equal(await page.locator('[data-word="'+word+'"] .kg-mark').isVisible(),true);
     assert.equal(await page.locator('[data-word="'+word+'"] .kg-mark').getAttribute('aria-hidden'),'true');
     if(i===4){
      for(const width of [320,360,390,768,1366]){
       await page.setViewportSize({width,height:width>750?900:844});await fits('Word Search at '+width);
       assert.ok(await page.locator('[data-word]').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)),'word labels and ticks fit at '+width);
       assert.ok(await page.locator('[data-cell]').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16),'letter text remains readable at '+width);
      }
      await page.setViewportSize({width:390,height:844});
     }
    }
   }
   await page.locator('.bible-results').waitFor();
  }
  if(g.id==='memory'){
   assert.equal(await page.locator('.bible-memory-round').count(),1);
   assert.equal(await page.locator('.memory-pair-dot').count(),6);
   const names=await page.locator('.memory-name').allTextContents();
   const cards=page.locator('[data-do=card]');
   const different=names.findIndex(n=>n!==names[0]);
   await cards.nth(0).click();await cards.nth(different).click();
   assert.match(await page.locator('#memory-moves').textContent(),/1 turn/);
   await page.waitForFunction(()=>document.querySelectorAll('.kg-flip.is-open').length===0);
   assert.equal(await cards.nth(0).getAttribute('aria-label'),'Card 1, face down');
   const pairs=[...new Set(names)];
   for(const name of pairs){
    const ids=names.flatMap((n,i)=>n===name?[i]:[]);
    await cards.nth(ids[0]).click();await cards.nth(ids[1]).click();
    if(name!==pairs.at(-1)){
     assert.equal(await cards.nth(ids[0]).isDisabled(),true);
     assert.match(await cards.nth(ids[0]).getAttribute('aria-label'),/matched/);
     assert.equal(await page.locator('.memory-pair-dot.is-filled').count(),pairs.indexOf(name)+1);
    }
   }
   await page.locator('.bible-results').waitFor();
  }
  if(g.id==='quiz'){
   assert.equal(await page.locator('.bible-quiz-round').count(),1);
   assert.equal(await page.locator('.bible-answer-letter').count(),4);
   assert.equal(await page.locator('#quiz-response').isVisible(),false);
  }
  if(g.players==='group'){
   assert.equal(await page.locator('#party-secret').isVisible(),false);
   await page.getByRole('button',{name:'Show the secret story',exact:true}).click();
   assert.equal(await page.locator('#party-secret').isVisible(),true);
   await page.getByRole('button',{name:'Hide it and start the timer',exact:true}).click();
   assert.equal(await page.locator('#party-secret').isVisible(),false);
   assert.equal(await page.locator('#party-clock').textContent(),'60');
   if(g.id==='pictionary'){
    const canvas=page.locator('#bible-drawing');assert.equal(await canvas.isVisible(),true);
    assert.equal(await page.getByRole('heading',{name:'Draw now',exact:true}).isVisible(),true);
    assert.equal(await page.getByRole('heading',{name:'Pass the device to the drawer',exact:true}).isVisible(),false);
    assert.equal(await page.locator('.bible-drawing-room').count(),1);
    assert.ok(await canvas.evaluate(el=>el.getBoundingClientRect().bottom<document.querySelector('.mobile-tabs').getBoundingClientRect().top),'drawing pad fits above phone navigation');
    const blue=page.getByRole('button',{name:'Blue pen',exact:true});
    await blue.click({timeout:1500});assert.equal(await blue.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.kg-swatch[aria-pressed=true]').count(),1);
    assert.ok(await page.locator('.kg-swatch').evaluateAll(els=>els.every(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44;})),'pen colours have usable touch targets');
    const blank=await canvas.evaluate(el=>el.toDataURL());
    const draw=async()=>{
     await canvas.scrollIntoViewIfNeeded();
     const box=await canvas.boundingBox();
     await page.mouse.move(box.x+box.width*.2,box.y+box.height*.2);await page.mouse.down();
     await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6,{steps:5});await page.mouse.up();
    };
    await draw();assert.notEqual(await canvas.evaluate(el=>el.toDataURL()),blank,'the pen draws');
    await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await canvas.evaluate(el=>el.toDataURL()),blank,'Undo removes the last stroke');
    await draw();await page.getByRole('button',{name:'Clear',exact:true}).click();
    assert.equal(await canvas.evaluate(el=>el.toDataURL()),blank,'Clear empties the drawing');
   }
   await page.getByRole('button',{name:'We guessed it!',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Next player',exact:true}).isVisible(),true);
  }
  const answer=page.locator('[data-do=answer]:not(:disabled)').first();
  if(await answer.count()){await answer.click();if(g.id==='quiz'){assert.equal(await page.locator('#quiz-response').isVisible(),true);assert.match(await page.locator('#quiz-response').textContent(),/Read it in your Bible/);assert.equal(await page.locator('[data-do=answer]:disabled').count(),4);}assert.ok(await page.locator('#bible-feedback').evaluate(el=>/is-(good|retry)/.test(el.className)),g.id+' shows feedback');}
 }
 await page.goto(base+'#bible/quiz');await page.locator('#bible-start').click();
 for(let i=0;i<9;i++){
  assert.equal(await page.locator('#quiz-response').isVisible(),false,'feedback resets for the next question');
  const prompt=await page.locator('.bible-quiz-round h2').textContent();
  const question=questions.find(q=>q.prompt===prompt);
  if(i===0){
   await page.getByRole('button',{name:'Pause game',exact:true}).click();
   assert.equal(await page.locator('#bible-pause-overlay').isVisible(),true);
   await page.getByRole('button',{name:'Keep playing',exact:true}).click();
   assert.equal(await page.locator('.bible-quiz-round h2').textContent(),prompt);
   await page.getByRole('button',{name:question.answer,exact:true}).click();
   assert.equal(await page.locator('#quiz-response').getAttribute('class'),'bible-quiz-response is-correct');
  }else if(i===1){
   await page.locator('[data-do=answer]').filter({hasNotText:question.answer}).first().click();
   assert.equal(await page.locator('#quiz-response').getAttribute('class'),'bible-quiz-response is-learning');
  }else await page.locator('[data-do=answer]').first().click();
  assert.ok(await page.locator('#quiz-response').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('[data-do=next]').getBoundingClientRect().top),'feedback appears before Next');
  await page.locator('[data-do=next]').click();
 }
 await page.locator('.bible-results').waitFor();
 assert.equal(await page.locator('.kg-result-card .kg-stars img.on').count()>=1,true);
 await page.goto(base+'#character');await page.locator('[data-character=ama]').click();
 assert.match(await page.locator('#picker-status').textContent(),/Ama will join you/);await fits('character picker');
 await page.goto(base+'#bible');assert.match(await page.locator('.kg-hero-character').textContent(),/Ama/);
 await page.goto(base+'#journey');assert.match(await page.locator('.kg-journey').textContent(),/Bible Quiz/);await fits('journey');
 assert.deepEqual(errors,[]);
 console.log('Bible games: all 16 open and answer on a phone, results save to My journey, and the chosen character follows the player.');
}finally{await browser.close();}
