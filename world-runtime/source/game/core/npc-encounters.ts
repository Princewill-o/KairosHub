/**
 * People who talk to you. Every resident can start a conversation, and what
 * they say depends on who they are (officer, child, teen, elder, worker,
 * someone in need, a seeker, a church member, an inmate) and on your story:
 * your age, faith, wanted level, record, whether you're inside, the time and
 * where you are. Choices feed back into Kairos Life (faith, kindness, money,
 * happiness, health) or the world (handing yourself in, sharing your faith).
 */
export type Role = "officer" | "child" | "teen" | "elder" | "worker" | "need" | "seeker" | "church" | "neighbour" | "inmate" | "guard" | "tourist" | "family";
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
  world?: "hand-in" | "flee" | "preach" | "direction" | "invite" | "none";
}
export interface Encounter { who: Who; line: string; choices: Choice[] }

/** Who a resident is, from their index in the crowd and where you are. */
export function roleFor(index: number, mapKind: string, london: boolean): Role {
  if (mapKind === "prison") return index % 3 === 0 ? "guard" : "inmate";
  if (london && index % 9 === 4) return "officer";
  if (index % 9 === 7) return "teen";
  if (index % 7 === 0) return "elder";
  // Fewer work conversations: one worker in eight passers-by.
  const r = ["worker", "need", "seeker", "church", "neighbour", "tourist", "child", "neighbour"] as const;
  return r[(index * 5 + 3) % r.length];
}

/** Why someone can't come on Sunday, and what you could say. */
export const SUNDAY_EXCUSES = [
  { line: "“I work Sundays, sorry.”", answer: "Tell them the service is at 2pm, after most shifts" },
  { line: "“Sunday's my only lie-in.”", answer: "“It's at two. Lie in, then I'll grab you.”" },
  { line: "“I've got the kids all weekend.”", answer: "Tell them about the children's church" },
  { line: "“I wouldn't know anyone.”", answer: "“You'll know me. I'll sit with you.”" },
  { line: "“Church people judge.”", answer: "Share how you were welcomed when you were broken" },
  { line: "“I'm not religious.”", answer: "“Neither was I. It's about Jesus, not religion.”" },
  { line: "“Football's on.”", answer: "“It's 2pm. Come, then we'll catch the second half.”" },
  { line: "“I've got no way of getting there.”", answer: "Offer to pick them up" },
  { line: "“Maybe next week.”", answer: "Fix a date and text them the night before" },
  { line: "“I've done too much wrong to walk in there.”", answer: "Tell them Jesus came for sinners, not the righteous" },
];

const pick = <T,>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

/** You invited them to church; they give a reason they can't come. */
export function excuseEncounter(who: Who, seed = 0): Encounter {
  const x = pick(SUNDAY_EXCUSES as { line: string; answer: string }[], seed);
  return { who, line: `${who.name}: ${x.line}`, choices: [
    { label: x.answer, reply: pick(["“…Alright. Two o'clock, yeah? Text me.”", "“Huh. I didn't think of it like that. Maybe I will.”", "“Go on then. Just this once.”"], seed + 1), life: { witness: 2, walk: 1 } },
    { label: "“No pressure. I'll pray for you.”", reply: "“Thanks… actually, that means a lot.”", life: { walk: 2 } },
    { label: "“Your loss.”", reply: "They roll their eyes and walk off.", life: { fruit: -2 } },
  ] };
}
const invite: Choice = { label: "Invite them to church on Sunday", reply: "“Church? On a Sunday?”", world: "invite" };

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
    `${who.name}: “We're tagging the bridge tonight. Bring a can.”`,
    `${who.name}: “Bunk off tomorrow with us. Nobody checks.”`,
    `${who.name} flashes a bottle: “My brother got us vodka. Park, nine o'clock.”`,
    `${who.name}: “That kid owes my mate money. We're gonna sort him out. Coming?”`,
  ], seed), seed % 6 === 2 ? [
    { label: "“Nah, I'm good.”", reply: "“Suit yourself, saint.”", life: { walk: 3 } },
    { label: "Bring a can", reply: "Your name's on the wall now. So is the CCTV.", life: { walk: -4, drift: 1, crime: { charge: "Criminal damage", stars: 1, caught: 0.45 } } },
  ] : seed % 6 === 3 ? [
    { label: "“I'm going in.”", reply: "Your teacher actually smiles at you.", life: { smarts: 3 } },
    { label: "Bunk off", reply: "It's fun until the school rings home.", life: { smarts: -3, happiness: -2 } },
  ] : seed % 6 === 4 ? [
    { label: "“Not for me.”", reply: "You go home and sleep fine.", life: { health: 2, walk: 2 } },
    { label: "Meet them in the park", reply: "You don't remember getting home.", life: { health: -6, habit: { drinking: 1 }, walk: -4, drift: 1, risk: 0.005 } },
  ] : seed % 6 === 5 ? [
    { label: "Talk them out of it", reply: "One of them backs down. Then another.", life: { fruit: 5, walk: 3 } },
    { label: "Go along", reply: "It goes too far. Someone's filming.", life: { walk: -7, drift: 2, crime: { charge: "Assault", stars: 3, caught: 0.6 } } },
  ] : seed % 2 === 0 ? [
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
    invite,
    { label: "Change the subject", reply: "The moment passes.", life: { walk: -1 } },
  ] : [
    { label: "“All the time.”", reply: "“There's a church near the square. Sunday at two. My friend goes.”", life: { walk: 2 } },
    { label: "“Not really.”", reply: "“Fair enough.” They smile and move on." },
  ]);
  if (who.role === "church" && s.offline && !s.saved && (s.age ?? 30) >= 6) return say(`${who.name} stops you gently: “Can I tell you why Jesus matters to me? He died for our sins and rose again, and He changed my life.”`, [
    { label: "“I want to trust Him too.”", reply: "They pray with you, right there on the pavement. Something lifts.", life: { save: true, walk: 15, happiness: 6 } },
    { label: "“Tell me more.”", reply: "They tell you their story and invite you on Sunday at two.", life: { walk: 4 } },
    { label: "“Not interested.”", reply: "“That's okay. God bless you.”", life: { walk: -1 } },
  ]);
  if (who.role === "neighbour") return say(pick([
    `${who.name}: “Sorry, I'm all over the place. My husband's moved out and I don't know how to tell the kids.”`,
    `${who.name}: “I've just been laid off. Twenty years at that place.”`,
    `${who.name}: “My mum's in hospital. They don't think she'll make it.”`,
    `${who.name}: “I can't make rent this month. Don't suppose you know anyone hiring?”`,
    `${who.name}: “Did you hear what they're saying about the pastor? Juicy stuff.”`,
    `${who.name}: “I'm selling these phones cheap. Don't ask where they came from.”`,
  ], seed), seed % 6 === 4 ? [
    { label: "“I'd rather not hear it.”", reply: "“Fair. You're a good one.”", life: { fruit: 3 } },
    { label: "“Go on then…”", reply: "You feel grubby walking away.", life: { fruit: -4, walk: -3 } },
  ] : seed % 6 === 5 ? [
    { label: "“No thanks.”", reply: "They shrug and slip off.", life: { walk: 2 } },
    { label: "Buy one", reply: "It's a bargain. It's also stolen.", life: { money: -60, walk: -5, drift: 1, crime: { charge: "Handling stolen goods", stars: 2, caught: 0.3 } } },
  ] : [
    { label: "Ask if you can pray for them, right now", reply: "Their eyes fill up. “Nobody's ever done that for me.”", life: s.saved ? { witness: 3, fruit: 3, walk: 2 } : { fruit: 3 } },
    { label: "Offer practical help", reply: "You swap numbers. You'll drop round a meal this week.", life: { fruit: 4, money: -15 } },
    ...(s.saved && (s.age ?? 30) >= 13 ? [invite] : []),
    { label: "“That's rough.” Keep walking", reply: "They nod and look away." },
  ]);
  if (who.role === "church") return say(s.sunday ? `${who.name}: “Great to see you! Coming to the service at two?”` : `${who.name}: “We've got a small group on Wednesdays. You'd be so welcome.”`, [
    { label: s.sunday ? "“I'll be there.”" : "Join the small group", reply: "“Brilliant. I'll save you a seat.”", life: { walk: 4, happiness: 2 } },
    { label: "“Maybe another time.”", reply: "“No pressure. The door's always open.”" },
  ]);
  if (who.role === "elder") return say(`${who.name}: “Excuse me, love, could you help me carry these up the steps?”`, [
    { label: "Carry the shopping home", reply: "They insist on making you a cup of tea and tell you about the war.", life: { fruit: 3, happiness: 2 } },
    { label: "“Sorry, I'm in a rush.”", reply: "They manage, slowly." },
  ]);
  // Work talk only makes sense for grown-ups; younger players get chats that fit their age.
  if (who.role === "worker" && child) return say(pick([
    `${who.name}, in a hi-vis vest: “Careful crossing here, there's a lot of traffic today. Where are you off to?”`,
    `${who.name}, sweeping outside the bakery: “Want to see how we make the bread in the morning?”`,
    `${who.name}: “Shouldn't you be with a grown-up? Is your mum nearby?”`,
  ], seed), [
    { label: "“I'm with my family, thank you!”", reply: "“Good. Stay where they can see you.”", life: { happiness: 1 } },
    { label: "Say thank you and wave", reply: "They wave back with a big smile.", life: { happiness: 2, fruit: 1 } },
  ]);
  if (who.role === "worker" && teen) return say(pick([
    `${who.name}: “Looking for a Saturday job? The café takes on 16-year-olds.”`,
    `${who.name}: “You doing work experience this year? Our shop's got a space.”`,
  ], seed), [
    { label: "Ask about it", reply: "They write the manager's name on a napkin.", life: { happiness: 2, smarts: 1 } },
    { label: "“School first for now.”", reply: "“Fair enough. Good luck with your exams!”", life: { smarts: 1 } },
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
    ...(s.saved && (s.age ?? 30) >= 13 ? [invite] : []),
    { label: "Nod and keep walking", reply: "They nod back." },
  ]);
}

/** Talking to someone in your family: what they say depends on who they are to you. */
export function familyEncounter(m: { name: string; relation: string; age: number; sex?: string }, story: { saved?: boolean; age?: number }, seed = 0): Encounter {
  const first = m.name.split(" ")[0];
  const who: Who = { index: -1, name: m.name, role: "family" };
  const r = m.relation === "parent" ? (m.sex === "female" ? "mother" : "father") : m.relation;
  const lines: Record<string, string[]> = {
    mother: [`${first}: “Have you eaten? There's jollof in the pot.”`, `${first}: “Are you still going to church every Sunday?”`, `${first}: “I worry about you, you know.”`],
    father: [`${first}: “Sit down a minute. How's work treating you?”`, `${first}: “When I was your age, I had two jobs.”`, `${first}: “I'm proud of you. I don't say it enough.”`],
    sibling: [`${first}: “You took my charger again, didn't you.”`, `${first}: “Cover for me tonight? I'll owe you.”`, `${first}: “Mum's asking about you. Ring her.”`],
    child: [`${first}: “Can you help me with my homework?”`, `${first}: “Can we go to the park? Please?”`, `${first}: “Why do we pray before dinner?”`],
    spouse: [`${first}: “Date night this Friday? Just us.”`, `${first}: “I had a long day. Can we talk?”`, `${first}: “I've been praying about us moving.”`],
    partner: [`${first}: “Where is this going, us?”`, `${first}: “Come to my friend's party Saturday?”`],
    grandparent: [`${first}: “Sit with me. Let me tell you about when I first came to London.”`, `${first}: “Read me a psalm, my eyes are tired.”`],
  };
  // When you're still young, your parents and siblings talk to a child, not a grown-up.
  const young = (story.age ?? 30) < 18;
  if (young) Object.assign(lines, {
    mother: [`${first}: “Have you done your homework?”`, `${first}: “Wash your hands, dinner's ready!”`, `${first}: “Who did you sit with at lunch today?”`],
    father: [`${first}: “Want to kick a ball about in the park later?”`, `${first}: “How was school? Tell me one good thing.”`, `${first}: “I'm proud of you, you know.”`],
    sibling: [`${first}: “Race you to the gate!”`, `${first}: “That's MY game, give it back!”`, `${first}: “Can you help me build this?”`],
    grandparent: [`${first}: “Come here, let me look at you. You've grown!”`, `${first}: “Shall I tell you a Bible story?”`],
  });
  const pool = lines[r] ?? lines[r.replace(/^(step|half)-?/, "")] ?? [`${first}: “Alright? Good to see you.”`];
  const line = pool[Math.abs(seed) % pool.length];
  const choices: Choice[] = [
    { label: "Ask how they're really doing", reply: `${first} opens up more than you expected. You listen.`, life: { happiness: 2 } },
    { label: "Pray together", reply: "You hold hands and pray. The room feels lighter.", life: { walk: 3 } },
  ];
  if (r === "child") choices.push({ label: "Help with homework / play", reply: `${first} grins. “You're the best.”`, life: { happiness: 3, fruit: 1 } });
  if (r === "mother" || r === "father" || r === "grandparent") choices.push(young ? { label: "Help set the table", reply: "You lay out the plates and forks. They give you a big hug.", life: { fruit: 2 } } : { label: "Help around the house", reply: "You fix the shelf and do the washing up.", life: { fruit: 2 } });
  if (r === "spouse" || r === "partner") choices.push({ label: "Plan a date night", reply: "Friday, 7pm. They're smiling all evening.", life: { happiness: 4 } });
  if (story.saved && (story.age ?? 30) >= 10) choices.push({ label: "Talk about Jesus", reply: `${first} goes quiet, then asks a question. A good one.`, life: { witness: 1, walk: 1 } });
  choices.push({ label: "Snap at them", reply: `${first} looks hurt and walks off.`, life: { happiness: -3, walk: -1 } });
  return { who, line, choices };
}
