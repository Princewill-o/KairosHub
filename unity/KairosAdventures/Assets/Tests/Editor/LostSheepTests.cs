using NUnit.Framework;
namespace Kairos.Tests {
 public class LostSheepTests {
  static Round Party(int count=3) {
   var r=new Round {gameId="lost-sheep",phase="playing",players=new Adventurer[count]};
   for(int i=0;i<count;i++)r.players[i]=new Adventurer {id=(ulong)i};
   LostSheep.Begin(r);return r;
  }
  [Test] public void HostAssignsRolesAndRestartClearsState() {
   var r=Party(8);
   Assert.AreEqual(SheepRole.Shepherd,r.players[0].role);
   Assert.AreEqual(SheepRole.Wolf,r.players[1].role);
   for(int i=2;i<8;i++)Assert.AreEqual(SheepRole.Sheep,r.players[i].role);
   r.players[2].tagged=true;LostSheep.Begin(r);Assert.IsFalse(r.players[2].tagged);
  }
  [Test] public void WolfCannotTagAtDistanceOrThroughBushes() {
   var r=Party();var wolf=r.players[1];var sheep=r.players[2];
   wolf.x=800;wolf.y=400;sheep.x=120;sheep.y=130;
   LostSheep.Act(r,wolf,new InputFrame {action=true});Assert.IsFalse(sheep.tagged);
   wolf.x=120;wolf.y=130;wolf.cooldown=0;
   LostSheep.Act(r,sheep,new InputFrame {held=true});
   LostSheep.Act(r,wolf,new InputFrame {action=true});Assert.IsTrue(sheep.hiding);Assert.IsFalse(sheep.tagged);
   sheep.hiding=false;wolf.cooldown=0;LostSheep.Act(r,wolf,new InputFrame {action=true});
   Assert.IsTrue(sheep.tagged);Assert.AreEqual(25,wolf.score);
   wolf.cooldown=0;LostSheep.Act(r,wolf,new InputFrame {action=true});Assert.AreEqual(25,wolf.score);
  }
  [Test] public void ShepherdRescuesTaggedSheepAndFoldEndsRound() {
   var r=Party();var sheep=r.players[2];var shepherd=r.players[0];
   sheep.tagged=true;sheep.x=shepherd.x;sheep.y=shepherd.y;
   LostSheep.Act(r,shepherd,new InputFrame {action=true});Assert.IsFalse(sheep.tagged);
   sheep.x=LostSheep.Fold.x;sheep.y=LostSheep.Fold.y;
   LostSheep.Act(r,sheep,new InputFrame());LostSheep.Resolve(r);
   Assert.IsTrue(sheep.home);Assert.AreEqual("results",r.phase);Assert.AreEqual("flock",r.winner);
  }
  [Test] public void PauseAndFinishedRoundsRejectActions() {
   var r=Party();r.paused=true;var p=r.players[2];p.x=LostSheep.Fold.x;p.y=LostSheep.Fold.y;
   LostSheep.Act(r,p,new InputFrame());Assert.IsFalse(p.home);
   r.paused=false;r.phase="results";LostSheep.Act(r,p,new InputFrame());Assert.IsFalse(p.home);
  }
  [Test] public void TimeoutAwardsWolfAndRoleDisconnectCancelsRound() {
   var r=Party();r.time=Rules.Duration(r.gameId);LostSheep.Resolve(r);Assert.AreEqual("wolf",r.winner);
   r=Party();r.players=new[]{r.players[0],r.players[2]};LostSheep.Resolve(r);
   Assert.AreEqual("cancelled",r.winner);Assert.AreEqual("results",r.phase);
  }
  [Test] public void SoloRetainsEightSheepRescue() {
   var r=Party(1);for(int i=0;i<8;i++)r.sheepSaved[i]=true;
   LostSheep.Resolve(r);Assert.AreEqual("flock",r.winner);
  }
  [Test] public void TaggedSheepCannotMoveAndInvalidInputDoesNotMutateState() {
   var r=Party();var p=r.players[2];p.tagged=true;float x=p.x;
   Rules.Tick(r,p,new InputFrame {x=1},.05f);Assert.AreEqual(x,p.x);
   p.tagged=false;Rules.Tick(r,p,new InputFrame {x=float.NaN},.05f);Assert.AreEqual(x,p.x);
   Rules.Tick(r,p,new InputFrame {x=1},float.NaN);Assert.AreEqual(x,p.x);
  }
  [Test] public void TwoPlayersUseCooperativeRescueAndRemoteCallCannotSaveSheep() {
   var r=Party(2);Assert.IsFalse(r.roleMode);
   var p=r.players[0];p.x=450;p.y=450;
   LostSheep.Act(r,p,new InputFrame {action=true});Assert.AreEqual(0,p.saved);
   p.cooldown=0;var target=Rules.Sheep(0,r.time);p.x=target.x;p.y=target.y;
   LostSheep.Act(r,p,new InputFrame {action=true});Assert.AreEqual(1,p.saved);
  }
  [Test] public void EverySheepMustReachHomeAndResultsCannotAwardTwice() {
   var r=Party(4);var p=r.players[2];p.x=LostSheep.Fold.x;p.y=LostSheep.Fold.y;
   LostSheep.Act(r,p,new InputFrame());LostSheep.Act(r,p,new InputFrame());
   Assert.AreEqual(50,p.score);LostSheep.Resolve(r);Assert.AreEqual("playing",r.phase);
   r.players[3].home=true;LostSheep.Resolve(r);Assert.AreEqual("flock",r.winner);
  }
 }
}
