using System.Linq;
using UnityEngine;
namespace Kairos {
 public enum SheepRole { Shepherd, Wolf, Sheep }
 // Called only by the authoritative runtime. Roles/scores travel in Round snapshots,
 // never in client InputFrame messages. Two players retain cooperative rescue.
 public static class LostSheep {
  public static readonly Vector2 Fold=new Vector2(450,420);
  static Vector2 Position(Adventurer p)=>new Vector2(p.x,p.y);
  public static void Begin(Round r) {
   r.roleMode=r.players.Length>=3;r.winner="";r.sheepSaved=new bool[8];
   var ordered=r.players.OrderBy(p=>p.id).ToArray();
   for(int i=0;i<ordered.Length;i++){
    var p=ordered[i];p.role=!r.roleMode||i==0?SheepRole.Shepherd:i==1?SheepRole.Wolf:SheepRole.Sheep;
    p.hiding=p.tagged=p.home=false;p.cooldown=0;p.score=p.saved=0;
    p.x=p.role==SheepRole.Shepherd?450:p.role==SheepRole.Wolf?800:120+(i-2)*100;
    p.y=p.role==SheepRole.Shepherd?350:100;
   }
   r.message=r.roleMode?"Sheep: reach the fold. Shepherd: call. Wolf: tag.":"Call all eight sheep home";
  }
  public static bool InBush(Adventurer p)=>Enumerable.Range(0,8).Any(i=>Vector2.Distance(Position(p),Rules.Animal(i))<40);
  public static void Act(Round r,Adventurer p,InputFrame input) {
   if(r.phase!="playing"||r.paused||p.home)return;
   if(!r.roleMode){
    if(!input.action||p.cooldown>0)return;p.cooldown=.4f;
    for(int i=0;i<8;i++)if(!r.sheepSaved[i]&&Vector2.Distance(Position(p),Rules.Sheep(i,r.time))<85){
     r.sheepSaved[i]=true;p.saved++;p.score+=50;r.message="A sheep is safe!";break;
    }return;
   }
   p.hiding=p.role==SheepRole.Sheep&&!p.tagged&&input.held&&InBush(p);
   if(p.role==SheepRole.Sheep){
    if(!p.tagged&&Vector2.Distance(Position(p),Fold)<48){p.home=true;p.hiding=false;p.score+=50;r.message="A sheep reached the fold!";}
    return;
   }
   if(!input.action||p.cooldown>0)return;p.cooldown=.6f;
   foreach(var sheep in r.players.Where(s=>s.role==SheepRole.Sheep&&!s.home)){
    float distance=Vector2.Distance(Position(p),Position(sheep));
    if(p.role==SheepRole.Wolf&&distance<45&&!sheep.hiding&&!sheep.tagged){
     sheep.tagged=true;sheep.hiding=false;p.score+=25;r.message="Sheep tagged! The shepherd can help.";
    }else if(p.role==SheepRole.Shepherd&&distance<95){
     sheep.tagged=false;sheep.hiding=false;
     var next=Vector2.MoveTowards(Position(sheep),Fold,55);sheep.x=next.x;sheep.y=next.y;
     r.message="The shepherd calls the flock home";
    }
   }
  }
  public static void Resolve(Round r) {
   if(r.phase!="playing"||r.paused)return;
   if(r.roleMode&&(!r.players.Any(p=>p.role==SheepRole.Wolf)||!r.players.Any(p=>p.role==SheepRole.Shepherd)||!r.players.Any(p=>p.role==SheepRole.Sheep))){
    Finish(r,"cancelled","Round cancelled: a required role disconnected. Restart to assign roles.");return;
   }
   bool allHome=r.roleMode?r.players.Where(p=>p.role==SheepRole.Sheep).All(p=>p.home):r.sheepSaved.All(x=>x);
   if(allHome)Finish(r,"flock","The flock is safe! Inspired by Luke 15:3–7.");
   else if(r.time>=Rules.Duration(r.gameId))Finish(r,r.roleMode?"wolf":"timeout",r.roleMode?"Time is up. The wolf wins this round.":"Time is up. Some sheep still need finding.");
  }
  static void Finish(Round r,string winner,string message){r.phase="results";r.winner=winner;r.message=message;}
  public static string Controls(Adventurer p)=>p==null?"Waiting for role":p.home?"Safe in the fold":p.tagged?"Tagged: wait for the shepherd":p.role==SheepRole.Wolf?"Wolf: move close and Tag":p.role==SheepRole.Sheep?"Sheep: reach the fold; hold Hide in bushes":"Shepherd: Call nearby sheep home";
 }
}
