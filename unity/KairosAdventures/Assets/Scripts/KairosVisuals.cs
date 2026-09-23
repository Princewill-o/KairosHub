using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace Kairos {
 // Lightweight 2D scene dressing. It uses the supplied walk/creature atlases,
 // then builds the themed ground, islands and water as small reusable sprites.
 public sealed class KairosVisuals : MonoBehaviour {
  public KairosRuntime runtime;
  readonly Dictionary<ulong,SpriteRenderer> players=new();
  readonly List<SpriteRenderer> animals=new();
  Sprite[] walk,creature; SpriteRenderer ground;
  Texture2D pixel;
  static Sprite Make(Texture2D t,Rect r,Vector2 pivot)=>Sprite.Create(t,r,pivot,100);
  void Awake(){
   pixel=new Texture2D(2,2,TextureFormat.RGBA32,false);pixel.SetPixels(new[]{Color.white,Color.white,Color.white,Color.white});pixel.Apply();
   var walkers=Resources.Load<Texture2D>("Kairos/walk");var creatures=Resources.Load<Texture2D>("Kairos/creatures");
   walk=Slice(walkers);creature=Slice(creatures);
   ground=Create("Ground",new Vector3(450,250,8),new Vector2(900,500),new Color(.06f,.24f,.20f));
   for(int i=0;i<8;i++){var s=Create("Island "+i,new Vector3(Rules.Animal(i).x,Rules.Animal(i).y,4),new Vector2(105,82),new Color(.34f,.48f,.20f));animals.Add(s);}
  }
  Sprite[] Slice(Texture2D atlas){if(!atlas)return new Sprite[0];var result=new Sprite[16];float w=atlas.width/4f,h=atlas.height/4f;for(int row=0;row<4;row++)for(int col=0;col<4;col++)result[row*4+col]=Make(atlas,new Rect(col*w,(3-row)*h,w,h),new Vector2(.5f,.15f));return result;}
  SpriteRenderer Create(string name,Vector3 pos,Vector2 size,Color color){var o=new GameObject(name);o.transform.position=pos;o.transform.localScale=new Vector3(size.x/2,size.y/2,1);var s=o.AddComponent<SpriteRenderer>();s.sprite=Make(pixel,new Rect(0,0,2,2),new Vector2(.5f,.5f));s.color=color;return s;}
  public void Sync(Round round,ulong me){
   if(!round.players.Any())return;
   ground.color=round.gameId=="galilee"?new Color(.04f,.25f,.42f):round.gameId=="pharaoh-chase"?new Color(.48f,.28f,.12f):round.gameId=="plague-party"?new Color(.12f,.18f,.28f):new Color(.06f,.24f,.20f);
   for(int i=0;i<8;i++){animals[i].enabled=round.gameId=="ark-park"||round.gameId=="plague-party";if(round.gameId=="lost-sheep")animals[i].enabled=round.roleMode;}
   foreach(var p in round.players){if(!players.TryGetValue(p.id,out var s)){var o=new GameObject("Visual Player "+p.id);s=o.AddComponent<SpriteRenderer>();players[p.id]=s;}s.enabled=round.phase=="playing"&&!round.paused&&!(round.gameId=="lost-sheep"&&p.hiding&&p.id!=me);s.transform.position=new Vector3(p.x,p.y,0);if(walk.Length>0)s.sprite=walk[Mathf.Clamp(p.character,0,3)*4+(p.moving?Mathf.FloorToInt(round.time*7)%4:0)];}
   foreach(var p in round.players.Where(p=>!round.players.Any(x=>x.id==p.id)))if(players.TryGetValue(p.id,out var old))old.enabled=false;
  }
  void OnDestroy(){if(pixel)Destroy(pixel);}
 }
}
