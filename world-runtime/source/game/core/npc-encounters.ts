/**
 * People who talk to you. Every resident can start a conversation, and what
 * they say depends on who they are (officer, child, teen, elder, worker,
 * someone in need, a seeker, a church member, an inmate) and on your story:
 * your age, faith, wanted level, record, whether you're inside, the time and
 * where you are. Choices feed back into Kairos Life (faith, kindness, money,
 * happiness, health) or the world (handing yourself in, sharing your faith).
 */
export type Role = "officer" | "child" | "teen" | "elder" | "worker" | "need" | "seeker" | "church" | "neighbour" | "inmate" | "guard" | "tourist";
export interface Who { index: number; name: string; role: Role }
export interface Story {
  offline: boolean; age: number | null; saved: boolean; stars: number; record: number;
  inPrison: boolean; mapKind: string; hour: number; money: number | null; job: string | null; sunday: boolean;
}
export interface Choice {
  label: string;
  reply: string;
  /** Kairos Life effect (same shape as life decisions). */
  life?: Record<string, unknown>;
  /** What happens in the world. */
  world?: "hand-in" | "flee" | "preach" | "direction" | "none";
}
export interface Encounter { who: Who; line: string; choices: Choice[] }

/** Who a resident is, from their index in the crowd and where you are. */
export function roleFor(index: number, mapKind: string, london: boolean): Role {
  if (mapKind === "prison") return index % 3 === 0 ? "guard" : "inmate";
  if (london && index % 9 === 4) return "officer";
  if (index % 9 === 7) return "teen";
  if (index % 7 === 0) return "elder";
  const r = ["worker", "need", "seeker", "church", "neighbour", "tourist", "child", "worker"] as const;
  return r[(index * 5 + 3) % r.length];
}

const pick = <T,>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

export function encounter(who: Who, s: Story, seed = 0): Encounter {
  const child = s.age !== null && s.age < 13, teen = s.age !== null && s.age >= 13 && s.age < 18;
  const night = s.hour >= 22 || s.hour < 5;
  const say = (line: string, choices: Choice[]): Encounter => ({ who, line, choices });

  if (who.role === "officer") {
    if (s.stars > 0) return say("Stop there. You match the description of someone we're looking for.", [
      { label: "Hand yourself in", reply: "“Sensible. Hands where I can see them.” You'll go before the court.", world: "hand-in", life: { fruit: 2 } },
      { label: "Run", reply: "You bolt. Sirens start up behind you.", world: "flee", life: { walk: -2, drift: 1 } },
    ]);
    if (s.record > 0) return say("Evening. Keeping out of trouble these days?", [
      { label: "“Trying to. One day at a time.”", reply: "“Good. People can change. Look after yourself.”", life: { happiness: 2 } },
      { label: "“Mind your own business.”", reply: "The officer notes your face and walks on.", life: { happiness: -1 } },
    ]);
    return say(night ? "Late to be out. Everything alright?" : "Afternoon. Any trouble round here today?", [
      { label: "“All good, thanks officer.”", reply: "“Stay safe.”" },
      { label: "Report something you saw", reply: "“Thank you. That helps more than you'd think.”", life: { fruit: 2 } },
    ]);
  }
  if (who.role === "guard") return say(s.inPrison ? "Chapel's open on Thursday. Education wing's got spaces too. Use your time." : "Visiting hours are over.", [
    { label: "Sign up for the chapel", reply: "“I'll put your name down.”", life: { walk: 4, happiness: 1 } },
    { label: "Ignore him", reply: "He shrugs and carries on his round." },
  ]);
  if (who.role === "inmate") return say(pick([
    "First time inside? Keep your head down and don't owe anyone anything.",
    "The chaplain's alright, you know. Never thought I'd say that.",
    "I've got a daughter outside. Haven't seen her in two years.",
  ], seed), [
    { label: "Ask if they want to come to chapel", reply: "“Maybe. If you're going.”", life: { witness: 3, walk: 2 } },
    { label: "Listen and encourage them", reply: "They go quiet, then nod. “Cheers. Needed that.”", life: { fruit: 3, happiness: 1 } },
    { label: "Keep to yourself", reply: "You walk off. It's lonely in here." },
  ]);
  if (who.role === "child" || child) return say(child ? `${who.name} runs up: “Do you want to play football? We need one more!”` : "A kid kicks a ball over to you: “Can you pass it back?”", child ? [
    { label: "Play!", reply: "You play until the streetlights come on. Best afternoon in ages.", life: { happiness: 4, health: 2, habit: { exercise: 1 } } },
    { label: "Stay inside on your tablet", reply: "They find someone else.", life: { happiness: -1 } },
  ] : [
    { label: "Pass it back with a smile", reply: "“Thanks!” They wave.", life: { happiness: 1 } },
    { label: "Ignore it", reply: "The ball rolls into the road. Someone tuts." },
  ]);
  if (who.role === "teen" && (teen || (s.age ?? 30) < 25)) return say(pick([
    `${who.name} holds out a vape: “Go on, everyone's doing it.”`,
    `${who.name}: “We're nicking stuff from the corner shop later. You in?”`,
  ], seed), seed % 2 === 0 ? [
    { label: "“No thanks.”", reply: "They shrug. You feel lighter walking away.", life: { health: 2, walk: 1 } },
    { label: "Try it", reply: "It burns. You cough, and want another.", life: { health: -5, habit: { smoking: 1 }, drift: 1 } },
  ] : [
    { label: "“Not a chance.”", reply: "“Boring.” But you know you're right.", life: { walk: 3, fruit: 2 } },
    { label: "Go with them", reply: "You get away with it, this time. Your heart's pounding.", life: { walk: -5, drift: 1, crime: { charge: "Shoplifting", stars: 1, caught: 0.4 } } },
  ]);
  if (who.role === "need") return say(night ? `${who.name} is sitting by a doorway: “Spare anything for a hot drink? It's freezing.”` : `${who.name}: “Sorry to bother you, I haven't eaten today.”`, [
    { label: "Buy them a meal and sit with them", reply: "You learn their name and story. They thank you twice.", life: { fruit: 5, money: -10, happiness: 3 } },
    { label: "Give some change", reply: "“God bless you.”", life: { fruit: 2, money: -2 } },
    { label: "Walk past", reply: "You don't look back." },
  ]);
  if (who.role === "seeker") return say(s.saved ? `${who.name}: “You go to church, don't you? Can I ask… why?”` : `${who.name}: “Do you ever wonder what it's all for?”`, s.saved && (s.age ?? 30) >= 13 ? [
    { label: "Share what Jesus has done for you", reply: "They listen closely.", world: "preach" },
    { label: "Invite them to church on Sunday", reply: "“Maybe I will. What time?” “Two o'clock.”", life: { witness: 3 } },
    { label: "Change the subject", reply: "The moment passes.", life: { walk: -1 } },
  ] : [
    { label: "“All the time.”", reply: "“There's a church near the square. Sunday at two. My friend goes.”", life: { walk: 2 } },
    { label: "“Not really.”", reply: "“Fair enough.” They smile and move on." },
  ]);
  if (who.role === "church") return say(s.sunday ? `${who.name}: “Great to see you! Coming to the service at two?”` : `${who.name}: “We've got a small group on Wednesdays. You'd be so welcome.”`, [
    { label: s.sunday ? "“I'll be there.”" : "Join the small group", reply: "“Brilliant. I'll save you a seat.”", life: { walk: 4, happiness: 2 } },
    { label: "“Maybe another time.”", reply: "“No pressure. The door's always open.”" },
  ]);
  if (who.role === "elder") return say(`${who.name}: “Excuse me, love, could you help me carry these up the steps?”`, [
    { label: "Carry the shopping home", reply: "They insist on making you a cup of tea and tell you about the war.", life: { fruit: 3, happiness: 2 } },
    { label: "“Sorry, I'm in a rush.”", reply: "They manage, slowly." },
  ]);
  if (who.role === "worker") return say(s.job ? `${who.name}: “You look like you know your stuff. Any chance you could look over my CV?”` : `${who.name}: “We're hiring at the café, you know. They need someone reliable.”`, s.job ? [
    { label: "Help with the CV", reply: "Two weeks later they text: they got the job.", life: { fruit: 3, happiness: 2 } },
    { label: "“Not really my thing.”", reply: "“No worries.”" },
  ] : [
    { label: "Ask about the job", reply: "They give you the manager's number.", life: { happiness: 2, job: "find" } },
    { label: "“I'm alright, thanks.”", reply: "“Suit yourself!”" },
  ]);
  if (who.role === "tourist") return say(`${who.name}, holding a paper map: “Sorry, which way is London Square?”`, [
    { label: "Walk them there", reply: "They take a photo with you outside the station.", world: "direction", life: { fruit: 2, happiness: 1 } },
    { label: "Point the way", reply: "“Cheers!”" },
  ]);
  return say(`${who.name}: “Morning! Lovely day for it.”`, [
    { label: "Stop and chat", reply: "Turns out you went to the same school.", life: { happiness: 2 } },
    { label: "Nod and keep walking", reply: "They nod back." },
  ]);
}
