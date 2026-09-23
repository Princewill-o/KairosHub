using System;
using UnityEngine;

namespace Kairos {
 [Serializable] public class Adventurer {
  public ulong id; public int character, score, hits, lane=1, saved; public bool moving;
  public float x=450,y=300,cooldown,jump,invulnerable;
  public int[] animals=new int[8];
  public SheepRole role; public bool hiding,tagged,home;
  public int fishingPhase; public float fishingClock,cast,progress=.35f,reel=.5f;
 }
 [Serializable] public class InputFrame {
  public float x,y; public bool action,held; public int character;
 }
 [Serializable] public class Round {
  public string gameId="ark-park",phase="lobby",message="Choose an adventure";
  public float time; public bool paused;
  public bool roleMode; public string winner="";
  public Adventurer[] players=new Adventurer[0];
  public float[] animalReady=new float[8];
  public bool[] sheepSaved=new bool[8];
 }
 public static class Rules {
  public static readonly string[] Ids={"ark-park","pharaoh-chase","galilee","plague-party","lost-sheep"};
  public static bool Finite(float f)=>!float.IsNaN(f)&&!float.IsInfinity(f);
  public static bool Known(string id)=>Array.IndexOf(Ids,id)>=0;
  public static float Duration(string id)=>id=="lost-sheep"?180:id=="pharaoh-chase"?90:id=="plague-party"?70:60;
  public static Vector2 Animal(int i)=>new Vector2(120+(i%4)*210,130+(i/4)*250);
  public static Vector2 Sheep(int i,float time)=>Animal(i)+new Vector2(Mathf.Sin(time*.6f+i)*35,Mathf.Cos(time*.4f+i)*25);
  public static Vector2 Hail(int i,float time)=>new Vector2(45+(i*127)%810,Mathf.Repeat(time*145+i*97,480));
  public static void Move(Adventurer p,float x,float y,float dt) {
   if(!Finite(x)||!Finite(y)||!Finite(dt)||dt<0)return;
   var v=Vector2.ClampMagnitude(new Vector2(x,y),1)*190*Mathf.Min(dt,1);
   p.x=Mathf.Clamp(p.x+v.x,30,870);p.y=Mathf.Clamp(p.y+v.y,45,450);
  }
  public static void Collect(Adventurer p,int species) {
   if(species<0||species>=8)return;
   p.animals[species]++;p.score+=p.animals[species]%2==0?35:10;
  }
  // Cast -> wait for bite -> hook -> hold/release to track the fish.
  // Original Kairos implementation of the CozyFishingGame interaction loop.
  public static void Fish(Adventurer p,bool held,float dt) {
   p.fishingClock+=dt;
   switch(p.fishingPhase) {
    case 0: if(held){p.fishingPhase=1;p.cast=0;p.fishingClock=0;} break;
    case 1: p.cast=Mathf.PingPong(p.fishingClock*.7f,1);if(!held){p.fishingPhase=2;p.fishingClock=0;} break;
    case 2: if(p.fishingClock>1.5f+p.cast){p.fishingPhase=3;p.fishingClock=0;} break;
    case 3:
     if(held){p.fishingPhase=4;p.fishingClock=0;p.progress=.35f;p.reel=.5f;}
     else if(p.fishingClock>1.2f){p.fishingPhase=0;p.fishingClock=0;}
     break;
    case 4:
     p.reel=Mathf.Clamp01(p.reel+(held?.65f:-.5f)*dt);
     float target=.5f+.33f*Mathf.Sin(p.fishingClock*2);
     p.progress=Mathf.Clamp01(p.progress+(Mathf.Abs(target-p.reel)<.2f?.25f:-.18f)*dt);
     if(p.progress>=1){p.score+=30+Mathf.RoundToInt(p.cast*30);p.saved++;p.fishingPhase=0;p.fishingClock=0;}
     else if(p.progress<=0){p.fishingPhase=0;p.fishingClock=0;}
     break;
   }
  }
  public static void Tick(Round r,Adventurer p,InputFrame input,float dt) {
   if(r.phase!="playing"||r.paused||!Finite(dt)||dt<=0||!Finite(input.x)||!Finite(input.y))return;
   p.moving=Mathf.Abs(input.x)+Mathf.Abs(input.y)>.01f||r.gameId=="pharaoh-chase";
   p.cooldown=Mathf.Max(0,p.cooldown-dt);p.jump=Mathf.Max(0,p.jump-dt);p.invulnerable=Mathf.Max(0,p.invulnerable-dt);
   if(r.gameId=="galilee"){Fish(p,input.held,dt);return;}
   if(r.gameId=="pharaoh-chase") {
    if(Mathf.Abs(input.x)>.5f&&p.cooldown<=0){p.lane=Mathf.Clamp(p.lane+(input.x>0?1:-1),0,2);p.cooldown=.22f;}
    if(input.action&&p.jump<=0)p.jump=.8f;
    p.x=240+p.lane*210;p.y=390;
    for(int i=0;i<6;i++)if(i%3==p.lane&&Mathf.Abs(Mathf.Repeat(r.time*180+i*113,650)-100-p.y)<24&&p.jump<=0)Hit(p);
    p.score=Mathf.Max(0,Mathf.FloorToInt(r.time*10)-p.hits*25);return;
   }
   if(r.gameId!="lost-sheep"||(!p.tagged&&!p.home))Move(p,input.x,input.y,dt);
   if(r.gameId=="lost-sheep")LostSheep.Act(r,p,input);
   if(r.gameId=="plague-party") {
    int wave=Mathf.FloorToInt(r.time/17.5f);
    bool safe=false;for(int i=0;i<8;i++)if(Vector2.Distance(new Vector2(p.x,p.y),Animal(i))<42)safe=true;
    if(wave==0||wave==3){if(!safe&&r.time%17.5f>4)Hit(p);}
    else for(int i=0;i<12;i++)if(Vector2.Distance(new Vector2(p.x,p.y),Hail(i,r.time))<26)Hit(p);
    p.score=Mathf.Max(0,Mathf.FloorToInt(r.time*10)-p.hits*20);
   }
  }
  static void Hit(Adventurer p){if(p.invulnerable>0)return;p.hits++;p.invulnerable=1.2f;}
 }
}
