using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Unity.Collections;
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using UnityEngine;
using TwoDCollectables;
using TwoDCollectables.Collectors;

namespace Kairos {
 public sealed class AnimalPickup : MonoBehaviour { public int species; }
 public sealed class ArkCollector : MonoBehaviour,ICollector {
  public KairosRuntime runtime; public ulong player;
  public void OnCollected(Collectable.CollectionEventData data) {
   var animal=data.collectable.GetComponent<AnimalPickup>();
   if(animal)runtime.Collect(player,animal.species);
  }
 }
 public sealed class KairosRuntime : MonoBehaviour {
  public Round round=new Round();
  NetworkManager network; UnityTransport transport;
  readonly Dictionary<ulong,InputFrame> inputs=new Dictionary<ulong,InputFrame>();
  readonly Dictionary<ulong,float> inputAt=new Dictionary<ulong,float>();
  readonly Dictionary<ulong,GameObject> bodies=new Dictionary<ulong,GameObject>();
  readonly List<GameObject> pickups=new List<GameObject>();
  Texture2D walkers,creatures; float sendClock,connectionClock; bool joining,reported;
  string address="127.0.0.1",notice="Solo is available offline. LAN requires a native host.";
  int character; bool reducedMotion; InputFrame local=new InputFrame();
  public bool Authority=>!network.IsListening||network.IsServer;
  ulong Me=>network.IsListening?network.LocalClientId:0;

  [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
  static void Boot(){if(!FindFirstObjectByType<KairosRuntime>())new GameObject("Kairos").AddComponent<KairosRuntime>();}
  void Awake(){
   Application.targetFrameRate=60;
   if(!Camera.main){var camera=new GameObject("KairosCamera").AddComponent<Camera>();camera.tag="MainCamera";camera.clearFlags=CameraClearFlags.SolidColor;camera.backgroundColor=Color.black;camera.cullingMask=0;}
   walkers=Resources.Load<Texture2D>("Kairos/walk");creatures=Resources.Load<Texture2D>("Kairos/creatures");
   var obj=new GameObject("KairosNetwork");transport=obj.AddComponent<UnityTransport>();network=obj.AddComponent<NetworkManager>();
   network.NetworkConfig=new NetworkConfig{NetworkTransport=transport,EnableSceneManagement=false,ConnectionApproval=true};
   network.ConnectionApprovalCallback=(request,response)=>{
    response.Approved=network.ConnectedClientsIds.Count<8&&round.phase!="playing";
    response.CreatePlayerObject=false;response.Pending=false;response.Reason=response.Approved?"":"Room full or round already started";
   };
   network.OnClientConnectedCallback+=Connected;network.OnClientDisconnectCallback+=Disconnected;
   network.OnServerStarted+=RegisterMessages;network.OnClientStarted+=RegisterMessages;
   round.players=new[]{new Adventurer{id=0}};
   for(int i=0;i<8;i++){
    var item=new GameObject("Animal "+i);item.transform.position=new Vector3(Rules.Animal(i).x,Rules.Animal(i).y,0);
    item.AddComponent<CircleCollider2D>().radius=22;item.GetComponent<CircleCollider2D>().isTrigger=true;
    item.AddComponent<AnimalPickup>().species=i;item.AddComponent<Collectable>();pickups.Add(item);item.SetActive(false);
   }
  }
  void RegisterMessages(){
   network.CustomMessagingManager.UnregisterNamedMessageHandler("kairos-input");
   network.CustomMessagingManager.UnregisterNamedMessageHandler("kairos-state");
   network.CustomMessagingManager.RegisterNamedMessageHandler("kairos-input",(sender,reader)=>{
    if(!network.IsServer||!network.ConnectedClients.ContainsKey(sender))return;
    try {reader.ReadValueSafe(out string json);if(json.Length>512)return;var input=JsonUtility.FromJson<InputFrame>(json);
     if(input==null||!Rules.Finite(input.x)||!Rules.Finite(input.y))return;
     input.x=Mathf.Clamp(input.x,-1,1);input.y=Mathf.Clamp(input.y,-1,1);input.character=Mathf.Clamp(input.character,0,3);
     inputs[sender]=input;inputAt[sender]=Time.unscaledTime;
    }catch(Exception){/* Malformed input never mutates the host's round. */}
   });
   network.CustomMessagingManager.RegisterNamedMessageHandler("kairos-state",(sender,reader)=>{
    if(network.IsServer||sender!=NetworkManager.ServerClientId)return;
    try{reader.ReadValueSafe(out string json);var next=JsonUtility.FromJson<Round>(json);
     if(next!=null&&Rules.Known(next.gameId)&&next.players!=null&&next.players.Length<=8)round=next;
    }catch(Exception){notice="A network update could not be read.";}
   });
  }
  void Connected(ulong id){
   joining=false;
   if(network.IsServer&&!round.players.Any(p=>p.id==id))round.players=round.players.Concat(new[]{new Adventurer{id=id,x=350+round.players.Length*30}}).ToArray();
   notice=network.IsServer?"LAN host · port 7777 · share this device's LAN IP":"Connected to host";
  }
  void Disconnected(ulong id){
   inputs.Remove(id);inputAt.Remove(id);
   if(network.IsServer){round.players=round.players.Where(p=>p.id!=id).ToArray();if(round.gameId=="lost-sheep")LostSheep.Resolve(round);}
   else {joining=false;notice="Disconnected. Return to Solo or reconnect. Host migration is not implemented.";round.phase="lobby";}
  }
  void Send(string name,ulong recipient,string json){
   using(var writer=new FastBufferWriter(Encoding.UTF8.GetByteCount(json)*2+64,Allocator.Temp)){
    writer.WriteValueSafe(json);network.CustomMessagingManager.SendNamedMessage(name,recipient,writer,NetworkDelivery.ReliableFragmentedSequenced);
   }
  }
  void StartNetwork(bool host){
   if(network.IsListening||joining)return;
   if(host&&Application.platform==RuntimePlatform.WebGLPlayer){notice="Open the native build to host LAN; browsers can only join a compatible WebSocket host.";return;}
   if(!System.Net.IPAddress.TryParse(address,out _)){notice="Enter the host's numeric LAN IP address.";return;}
   transport.SetConnectionData(address,7777,"0.0.0.0");
   round=new Round{gameId=round.gameId};inputs.Clear();inputAt.Clear();
   joining=!host;connectionClock=0;
   if(!(host?network.StartHost():network.StartClient())){notice="Could not start network connection.";joining=false;}
   else notice=host?"Hosting on port 7777":"Connecting…";
  }
  void Solo(){
   network.Shutdown();joining=false;inputs.Clear();inputAt.Clear();round=new Round{gameId=round.gameId,players=new[]{new Adventurer{id=0,character=character}}};
   notice="Solo · saved on this device";
  }
  public void Collect(ulong id,int species){
   if(!Authority||round.phase!="playing"||round.paused||round.gameId!="ark-park"||species<0||species>=8||round.animalReady[species]>round.time)return;
   var p=round.players.FirstOrDefault(x=>x.id==id);
   if(p==null||Vector2.Distance(new Vector2(p.x,p.y),Rules.Animal(species))>65)return;
   Rules.Collect(p,species);round.animalReady[species]=round.time+4;
   round.message=p.animals[species]%2==0?"A pair found! +35":"Animal collected! Find its partner.";
  }
  void Begin(){
   round=new Round{gameId=round.gameId,phase="playing",players=round.players.Select(p=>new Adventurer{id=p.id,character=p.character,x=400,y=280}).ToArray(),message="Let's explore"};reported=false;
   if(round.gameId=="lost-sheep")LostSheep.Begin(round);
  }
  void Update(){
   float dt=Mathf.Min(Time.unscaledDeltaTime,.05f);
   if(joining){connectionClock+=dt;if(connectionClock>10){network.Shutdown();joining=false;notice="Connection timed out. Check host IP, port and Wi-Fi isolation.";}}
   local.character=character;
   if(Input.GetKeyDown(KeyCode.Space)||Input.GetKeyDown(KeyCode.Return))local.action=true;
   local.held=Input.GetKey(KeyCode.Space)||Input.GetKey(KeyCode.Return)||touchHeld;
   local.x=Mathf.Clamp((Input.GetKey(KeyCode.D)||Input.GetKey(KeyCode.RightArrow)?1:0)-(Input.GetKey(KeyCode.A)||Input.GetKey(KeyCode.LeftArrow)?1:0)+touchX,-1,1);
   local.y=Mathf.Clamp((Input.GetKey(KeyCode.S)||Input.GetKey(KeyCode.DownArrow)?1:0)-(Input.GetKey(KeyCode.W)||Input.GetKey(KeyCode.UpArrow)?1:0)+touchY,-1,1);
   if(Input.GetKeyDown(KeyCode.Escape)&&Authority&&round.phase=="playing")round.paused=!round.paused;
   if(Authority){
    inputs[Me]=local;
    foreach(var p in round.players){
     var input=inputs.TryGetValue(p.id,out var value)?value:new InputFrame();
     if(p.id!=Me&&(!inputAt.TryGetValue(p.id,out float at)||Time.unscaledTime-at>.4f))input=new InputFrame{character=p.character};
     p.character=input.character;
     if(round.phase=="playing"&&!round.paused){Rules.Tick(round,p,input,dt);
      if(round.gameId=="ark-park"&&input.action)for(int i=0;i<8;i++)Collect(p.id,i);
     }
     input.action=false;
    }
    if(round.phase=="playing"&&!round.paused){round.time+=dt;
     if(round.gameId=="lost-sheep")LostSheep.Resolve(round);
     else if(round.time>=Rules.Duration(round.gameId)){round.phase="results";round.message="Adventure complete";}
    }
   }
   sendClock+=dt;
   if(network.IsListening&&sendClock>=.1f){sendClock=0;
    if(network.IsServer){string json=JsonUtility.ToJson(round);foreach(ulong id in network.ConnectedClientsIds)if(id!=Me)Send("kairos-state",id,json);}
    else if(network.IsConnectedClient){Send("kairos-input",NetworkManager.ServerClientId,JsonUtility.ToJson(local));local.action=false;}
   }
   SyncColliders();
   if(round.phase=="results"&&!reported){reported=true;var p=round.players.FirstOrDefault(x=>x.id==Me);if(p!=null){
    try{PlayerPrefs.SetInt("kairos.best."+round.gameId,Math.Max(PlayerPrefs.GetInt("kairos.best."+round.gameId),p.score));PlayerPrefs.Save();}catch(Exception){notice="Device storage unavailable.";}
    if(round.winner!="cancelled")KairosWebBridge.Complete(round.gameId,p.score);
   }}
   if(round.phase=="playing")reported=false;
  }
  void SyncColliders(){
   bool enabled=Authority&&round.phase=="playing"&&!round.paused&&round.gameId=="ark-park";
   foreach(ulong id in bodies.Keys.Where(id=>!round.players.Any(p=>p.id==id)).ToArray()){Destroy(bodies[id]);bodies.Remove(id);}
   foreach(var p in round.players){
    if(!bodies.TryGetValue(p.id,out var body)){
     body=new GameObject("Collector "+p.id);var rb=body.AddComponent<Rigidbody2D>();rb.bodyType=RigidbodyType2D.Kinematic;rb.useFullKinematicContacts=true;
     body.AddComponent<CircleCollider2D>().radius=20;var collector=body.AddComponent<ArkCollector>();collector.runtime=this;collector.player=p.id;bodies[p.id]=body;
    }
    body.SetActive(enabled);body.transform.position=new Vector3(p.x,p.y,0);
   }
   for(int i=0;i<8;i++)pickups[i].SetActive(enabled&&round.animalReady[i]<=round.time);
  }
  public void Configure(string json){
   if(network.IsListening)return;
   var config=JsonUtility.FromJson<Launch>(json);if(config==null||!Rules.Known(config.gameId))return;
   character=Mathf.Clamp(config.character,0,3);reducedMotion=config.reducedMotion;round.gameId=config.gameId;round.players[0].character=character;Begin();
  }
  [Serializable] class Launch {public string gameId;public int character;public bool reducedMotion;}
  float touchX,touchY;bool touchHeld;
  void OnApplicationFocus(bool focus){if(!focus){touchHeld=false;touchX=touchY=0;local=new InputFrame();if(Authority&&round.phase=="playing")round.paused=true;}}
  void OnDestroy(){if(network){network.Shutdown();Destroy(network.gameObject);}foreach(var b in bodies.Values)Destroy(b);foreach(var p in pickups)Destroy(p);}

  void OnGUI(){
   float scale=Mathf.Min(Screen.width/900f,Screen.height/700f);
   GUI.matrix=Matrix4x4.TRS(new Vector3((Screen.width-900*scale)/2,(Screen.height-700*scale)/2,0),Quaternion.identity,new Vector3(scale,scale,1));
   GUI.skin.label.fontSize=18;GUI.skin.button.fontSize=18;GUI.skin.textField.fontSize=18;
   Fill(new Rect(0,0,900,700),new Color(.025f,.027f,.04f));
   GUI.Label(new Rect(20,8,850,32),"KAIROS · "+round.gameId.Replace('-',' ').ToUpperInvariant());
   if(round.phase!="playing"){
    for(int i=0;i<5;i++)if(GUI.Button(new Rect(15+i*177,48,170,45),Rules.Ids[i].Replace('-',' '))&&Authority)round.gameId=Rules.Ids[i];
    for(int i=0;i<4;i++)if(GUI.Button(new Rect(80+i*190,112,180,50),new[]{"Ezra","Mira","Theo","Lumi"}[i]))character=i;
    GUI.Label(new Rect(25,177,850,30),"Selected character: "+new[]{"Ezra","Mira","Theo","Lumi"}[character]+" · Players: "+round.players.Length+" / 8");
    address=GUI.TextField(new Rect(25,222,260,45),address,45);
    GUI.enabled=!network.IsListening&&!joining;
    if(GUI.Button(new Rect(300,222,180,45),"Host LAN"))StartNetwork(true);
    if(GUI.Button(new Rect(495,222,180,45),"Join LAN"))StartNetwork(false);
    GUI.enabled=true;if(GUI.Button(new Rect(690,222,180,45),"Solo"))Solo();
    GUI.enabled=!network.IsListening&&!joining;
    transport.UseWebSockets=GUI.Toggle(new Rect(25,280,650,35),transport.UseWebSockets," WebSocket transport (host and clients must match)");
    GUI.enabled=true;
    GUI.Label(new Rect(25,325,850,55),notice);
    GUI.enabled=Authority&&!joining&&round.players.Length>0;
    if(GUI.Button(new Rect(275,395,350,60),round.phase=="results"?"Play again":"Start adventure"))Begin();GUI.enabled=true;
    if(round.phase=="results")GUI.Label(new Rect(25,470,850,90),round.message+"\n"+string.Join("   ",round.players.Select((p,i)=>"Player "+(i+1)+": "+p.score)));
    GUI.Label(new Rect(25,585,850,50),"Imaginative Bible-inspired games · not historical reenactments");
    reducedMotion=GUI.Toggle(new Rect(25,650,400,35),reducedMotion," Reduce decorative motion");return;
   }
   GUI.Label(new Rect(20,43,650,35),Mathf.CeilToInt(Mathf.Max(0,Rules.Duration(round.gameId)-round.time))+"s · "+round.message);
   GUI.enabled=Authority;
   if(GUI.Button(new Rect(570,15,140,45),"Lobby")){round.phase="lobby";round.paused=false;}
   if(GUI.Button(new Rect(730,15,150,45),round.paused?"Resume":"Pause"))round.paused=!round.paused;GUI.enabled=true;
   GUI.BeginGroup(new Rect(0,90,900,480));DrawArena();GUI.EndGroup();
   var me=round.players.FirstOrDefault(p=>p.id==Me);
   GUI.Label(new Rect(20,575,850,30),"Score "+(me?.score??0)+" · "+Help());
   GUI.enabled=!round.paused;
   touchX=(GUI.RepeatButton(new Rect(145,620,100,65),"Right")?1:0)-(GUI.RepeatButton(new Rect(25,620,100,65),"Left")?1:0);
   touchY=(GUI.RepeatButton(new Rect(385,620,100,65),"Down")?1:0)-(GUI.RepeatButton(new Rect(265,620,100,65),"Up")?1:0);
   bool held=GUI.RepeatButton(new Rect(610,620,265,65),round.gameId=="galilee"?"Hold / release to fish":round.gameId=="lost-sheep"?(me?.role==SheepRole.Wolf?"Tag":me?.role==SheepRole.Sheep?"Hold to hide":"Call sheep"):round.gameId=="pharaoh-chase"?"Jump":"Catch");
   if(held&&!touchHeld)local.action=true;touchHeld=held;GUI.enabled=true;
   if(round.paused){Fill(new Rect(0,90,900,480),new Color(0,0,0,.95f));GUI.Label(new Rect(280,280,400,60),"Paused · host can resume");touchX=touchY=0;touchHeld=false;}
  }
  string Help()=>round.gameId=="galilee"?"Cast, wait for PULL, then track the fish":round.gameId=="lost-sheep"?(round.roleMode?LostSheep.Controls(round.players.FirstOrDefault(p=>p.id==Me)):"Move near sheep and Call · rescue all eight"):round.gameId=="plague-party"?"Frogs / water: stand on islands. Hail: dodge.":round.gameId=="ark-park"?"Walk into animals; every matching pair earns a bonus":"Left / right lanes · Space to jump";
  static void Fill(Rect rect,Color color){Color old=GUI.color;GUI.color=color;GUI.DrawTexture(rect,Texture2D.whiteTexture);GUI.color=old;}
  void Sprite(Texture2D atlas,int col,int row,Rect rect,Color fallback){
   if(!atlas){Fill(rect,fallback);return;}
   GUI.DrawTextureWithTexCoords(rect,atlas,new Rect(col*.25f,(3-row)*.25f,.25f,.25f),true);
  }
  void DrawArena(){
   Fill(new Rect(0,0,900,480),round.gameId=="galilee"?new Color(.04f,.25f,.4f):round.gameId=="pharaoh-chase"?new Color(.45f,.27f,.13f):new Color(.08f,.23f,.2f));
   if(round.gameId=="ark-park"||round.gameId=="plague-party")for(int i=0;i<8;i++){
    Vector2 pos=Rules.Animal(i);Fill(new Rect(pos.x-43,pos.y-35,86,70),new Color(.38f,.48f,.23f));
    if(round.gameId=="ark-park"&&round.animalReady[i]<=round.time)Sprite(creatures,i%4,i/4,new Rect(pos.x-30,pos.y-35,60,65),Color.yellow);
   }
   if(round.gameId=="lost-sheep"){
    Fill(new Rect(402,372,96,96),new Color(.5f,.6f,.22f));GUI.Label(new Rect(422,438,80,30),"Fold");
    for(int i=0;i<8;i++){
     if(round.roleMode){var bush=Rules.Animal(i);Sprite(creatures,3,3,new Rect(bush.x-40,bush.y-40,80,80),Color.green);}
     else if(!round.sheepSaved[i]){var pos=Rules.Sheep(i,round.time);Sprite(creatures,1,0,new Rect(pos.x-30,pos.y-30,60,60),Color.white);}
    }
   }
   if(round.gameId=="plague-party"){
    int wave=Mathf.FloorToInt(round.time/17.5f);GUI.Label(new Rect(20,10,500,30),new[]{"Frogs: climb the islands","Hail: keep moving","Night storm: watch the shadows","Rising water: climb the islands"}[Mathf.Clamp(wave,0,3)]);
    if(wave==1||wave==2)for(int i=0;i<12;i++){var pos=Rules.Hail(i,round.time);Sprite(creatures,1,3,new Rect(pos.x-15,pos.y-15,30,30),Color.cyan);}
   }
   if(round.gameId=="pharaoh-chase"){
    for(int i=0;i<3;i++)Fill(new Rect(140+i*210,0,3,480),new Color(1,.8f,.35f));
    for(int i=0;i<6;i++)Fill(new Rect(210+i%3*210,Mathf.Repeat(round.time*180+i*113,650)-100,60,30),new Color(.8f,.3f,.2f));
   }
   if(round.gameId=="galilee"){
    var p=round.players.FirstOrDefault(x=>x.id==Me);if(p==null)return;
    GUI.Label(new Rect(200,55,600,35),new[]{"Hold to cast","Release to cast","Waiting for a bite…","PULL! Hold now","Keep your bar near the fish"}[p.fishingPhase]);
    Fill(new Rect(200,150,500,35),Color.black);Fill(new Rect(200,150,500*(p.fishingPhase==1?p.cast:p.progress),35),new Color(.9f,.7f,.2f));
    if(p.fishingPhase==4){Fill(new Rect(200,240,500,50),new Color(.08f,.1f,.14f));Fill(new Rect(200+p.reel*400,240,100,50),new Color(.2f,.8f,.6f));Sprite(creatures,0,2,new Rect(200+(.5f+.33f*Mathf.Sin(p.fishingClock*2))*400,240,50,50),Color.white);}
   }else foreach(var p in round.players){
    if(round.gameId=="lost-sheep"&&round.roleMode&&p.hiding&&p.id!=Me)continue;
    int frame=reducedMotion||!p.moving?0:Mathf.FloorToInt(round.time*7)%4;
    Sprite(walkers,frame,p.character,new Rect(p.x-30,p.y-50-p.jump*45,60,75),Color.magenta);
    GUI.Label(new Rect(p.x-45,p.y+22,170,28),round.gameId=="lost-sheep"&&round.roleMode?(p.home?"Safe":p.tagged?"Tagged":p.hiding?"Hidden":p.role.ToString()):p.score.ToString());
   }
  }
 }
}
