export const bibleNormalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const bibleAnswer=(value,answer,aliases=[])=>[answer,...aliases].some(a=>bibleNormalize(a)===bibleNormalize(value));
export function bibleShuffle(items,random=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function bibleWordLine(grid,start,end){
 const n=grid.length,ar=Math.floor(start/n),ac=start%n,br=Math.floor(end/n),bc=end%n;
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<0||start>=n*n||end>=n*n)return '';
 const dr=br-ar,dc=bc-ac;if(dr&&dc&&Math.abs(dr)!==Math.abs(dc))return '';
 return Array.from({length:Math.max(Math.abs(dr),Math.abs(dc))+1},(_,i)=>grid[ar+Math.sign(dr)*i][ac+Math.sign(dc)*i]).join('');
}
export function bibleWordGrid(words,random=Math.random){
 const n=10,dirs=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0]];
 for(let attempt=0;attempt<20;attempt++){
  const grid=Array.from({length:n},()=>Array(n).fill('')),paths={};let valid=true;
  for(const word of words){let placed=false;
   for(let k=0;k<200&&!placed;k++){
    const [dr,dc]=dirs[Math.floor(random()*dirs.length)],r=Math.floor(random()*n),c=Math.floor(random()*n);
    const cells=[...word].map((_,i)=>[r+i*dr,c+i*dc]);
    if(cells.some(([y,x],i)=>y<0||x<0||y>=n||x>=n||(grid[y][x]&&grid[y][x]!==word[i])))continue;
    cells.forEach(([y,x],i)=>grid[y][x]=word[i]);paths[word]=cells.map(([y,x])=>y*n+x);placed=true;
   }if(!placed){valid=false;break;}
  }
  if(valid){for(const row of grid)for(let i=0;i<n;i++)if(!row[i])row[i]='ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(random()*26)];return{grid,paths};}
 }
 // Guaranteed valid fallback even with a degenerate injected RNG.
 const grid=Array.from({length:n},()=>Array(n).fill('X')),paths={};words.forEach((word,r)=>{paths[word]=[];[...word].forEach((letter,c)=>{grid[r][c]=letter;paths[word].push(r*n+c);});});return{grid,paths};
}
export function bibleBingo(marked){const set=new Set(marked);return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(line=>line.every(i=>set.has(i)));}
export function bibleCrossword(entries){
 const rows=Math.max(...entries.map(e=>e.row+(e.dir==='down'?e.word.length:1))),cols=Math.max(...entries.map(e=>e.col+(e.dir==='across'?e.word.length:1)));
 const board=Array.from({length:rows},()=>Array(cols).fill(''));
 for(const e of entries)[...e.word].forEach((letter,i)=>{const r=e.row+(e.dir==='down'?i:0),c=e.col+(e.dir==='across'?i:0);if(board[r][c]&&board[r][c]!==letter)throw Error('Conflicting crossword answers');board[r][c]=letter;});return board;
}
export const tokenize = (text, mode) =>
  mode === "growth"
    ? text.split(" ")
    : text.split(" ").reduce((a, w, i) => {
        if (i % 3 === 0) a.push(w);
        else a[a.length - 1] += " " + w;
        return a;
      }, []);
export const gradeOrder = (expected, actual) =>
  expected.map((x, i) => x === actual[i]);
export const scoreRun = (mistakes, seconds, mode) =>
  Math.max(
    0,
    Math.min(
      100,
      100 - mistakes * 5 - (mode === "growth" ? Math.floor(seconds / 12) : 0),
    ),
  );
export const freshProgress = () => ({
  games: {},
  mastered: [],
  streak: 0,
  lastDay: null,
  runs: 0,
  garden: {},
  journal: [],
});
export function recordCompletion(p, id, score, verses, day) {
  const previous = p.lastDay ? Date.parse(p.lastDay) : 0;
  const diff = Math.round((Date.parse(day) - previous) / 86400000);
  return {
    ...p,
    games: {
      ...p.games,
      [id]: {
        best: Math.max(p.games[id]?.best || 0, score),
        plays: (p.games[id]?.plays || 0) + 1,
      },
    },
    mastered: [...new Set([...p.mastered, ...verses])],
    streak: p.lastDay === day ? p.streak : diff === 1 ? p.streak + 1 : 1,
    lastDay: day,
    runs: p.runs + 1,
  };
}
export const gardenGrowth = (garden, chosen, correct) =>
  chosen === correct
    ? { ...garden, [chosen]: Math.min(3, (garden[chosen] || 0) + 1) }
    : { ...garden };
export function psalmBlanks(v, pass) {
  const words = v.text.split(" ");
  const keys = words
    .map((w, i) =>
      v.keywords.includes(w.toLowerCase().replace(/[^a-z]/g, "")) ? i : -1,
    )
    .filter((i) => i >= 0);
  const rest = words.map((_, i) => i).filter((i) => !keys.includes(i));
  return [...keys, ...rest]
    .slice(0, Math.min(words.length, pass === 1 ? 1 : pass === 2 ? 2 : 4))
    .sort((a, b) => a - b);
}
export function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Bible collection helpers (pure, no DOM).
export function bibleStars(record){
 const runs=Number(record?.runs)||0,best=Number(record?.best)||0;
 if(!runs)return 0;return best>=90?3:best>=60?2:1;
}
// Equirectangular projection for the simplified Bible-world map (lon 8–48°E, lat 28–46°N), as percentages.
export const BIBLE_MAP={west:8,east:48,north:46,south:28,width:700,height:420};
export function bibleMapPoint(lon,lat){
 const {west,east,north,south}=BIBLE_MAP;
 return {x:((lon-west)/(east-west))*100,y:((north-lat)/(north-south))*100};
}
export function bibleDailyPick(ids,day){
 let h=0;for(const ch of String(day))h=(h*31+ch.charCodeAt(0))>>>0;return ids[h%ids.length];
}
export function bibleStreak(meta,day){
 const prev=meta?.lastDay,streak=Number(meta?.streak)||0;
 if(prev===day)return {...meta,streak:Math.max(1,streak),lastDay:day};
 const diff=prev?Math.round((Date.parse(day)-Date.parse(prev))/86400000):0;
 return {...meta,streak:diff===1?streak+1:1,lastDay:day};
}
