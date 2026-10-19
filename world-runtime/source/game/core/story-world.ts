import { BIBLE_STORIES, type StoryId } from "./ltbs-stories";
import type { WorldMap } from "./world";

export type StoryWorldPhase = "opening" | "explore" | "choice" | "resolution";
export const storyWorldId = (story: StoryId, chapter: number) => `story-${story}-${chapter}`;
export const STORY_DISCOVERIES = [{x:12,y:17},{x:18,y:12},{x:16.8,y:8.5}];
export function storyWorldMap(id: string): WorldMap | null {
  const match=/^story-(david|ruth|esther|daniel)-([0-5])$/.exec(id);
  if(!match)return null;
  const story=BIBLE_STORIES.find(item=>item.id===match[1])!;const chapter=Number(match[2]);const scene=story.chapters[chapter];
  const cols=30,rows=26;
  const tiles=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>x<2||x>=28||y<2||y>=24?"#":x<11||x>19?"X":"g"));
  const portals=STORY_DISCOVERIES.map((spot,index)=>({id:`story-discover-${index}`,rect:{x:(spot.x-.5)*32,y:(spot.y-.5)*32,w:32,h:32},label:scene.discoveries[index],to:{kind:"story-discover" as const,index}}));
  return {id,story:{id:story.id,chapter},kind:"woodland",name:`${story.title} · ${scene.place}`,cols,rows,width:cols*32,height:rows*32,tiles:tiles.map(row=>row.join("")),structures:[],rooms:[],portals,spawn:{x:15*32,y:20*32},accent:story.colour};
}
