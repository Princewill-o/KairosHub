/**
 * Harder, more honest ministry. Not everyone is open; some walk away. Wrong
 * answers aren't cartoonishly rude: they sound reasonable but miss the person.
 * People you lead to faith keep struggling with sin, and you help them back up
 * with grace and truth. Content is written for a 4-17 audience: struggles are
 * everyday ones (lying, anger, envy, gossip, cheating, bad company...).
 */
import { SCENARIOS, type Answer, type Background, type Beat, type Contact, type Persona, type Stage, STAGES } from "./ministry";

/* ── Deterministic randomness (seeded per conversation) ─────────────────── */
export function seeded(seed: string | number) {
  let s = typeof seed === "number" ? seed >>> 0 : [...seed].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/* ── Answers that sound right but miss ──────────────────────────────────── */
type Mood = Beat["mood"];
const PLAUSIBLE: Record<Mood, Answer[]> = {
  challenging: [
    { text: "Quickly line up several verses that prove the point, so the Bible settles it.", score: 0, reply: "That's a lot of verses at once. I asked what *you* think." },
    { text: "Point out the weak spots in what they believe, so they rethink it.", score: 0, reply: "So you came to win an argument. I'm not interested in that." },
    { text: "Say all faiths point to the same God really, so there's no need to disagree.", score: 0, reply: "Then why does Jesus matter so much to you? That doesn't add up." },
    { text: "Admit you can't answer that, and suggest they ask a pastor instead.", score: 1, reply: "Fair enough. Honest, at least." },
  ],
  curious: [
    { text: "Explain the whole of the gospel now while they're interested: creation to new creation.", score: 0, reply: "I... think you lost me halfway through." },
    { text: "Invite them to church: the pastor explains it much better than you.", score: 1, reply: "Maybe. I was asking you, though." },
    { text: "Tell them about an amazing miracle you saw in a video online.", score: 0, reply: "Hm. I'd want to know that was real before I believed it." },
  ],
  guarded: [
    { text: "Ask straight out: \"If you died tonight, do you know where you'd go?\"", score: 0, reply: "That feels like pressure. I'd rather not do this." },
    { text: "Change the subject so they don't feel uncomfortable.", score: 1, reply: "Okay... I thought you wanted to talk about faith." },
    { text: "Reassure them you're not religious, you just have a relationship with God.", score: 1, reply: "People say that. What's the difference, really?" },
  ],
  hurt: [
    { text: "Remind them that everything happens for a reason.", score: 0, reply: "People keep saying that. It honestly doesn't help." },
    { text: "Tell them God never gives us more than we can handle.", score: 0, reply: "Then why does it feel like far too much?" },
    { text: "Tell them, at length, how you got through something similar.", score: 1, reply: "I'm glad that helped you. This feels different." },
  ],
  warm: [
    { text: "Ask them to pray the sinner's prayer with you, right now.", score: 1, reply: "Right now? I don't think I understand it yet." },
    { text: "Tell them they're a good person already, so they're nearly there.", score: 0, reply: "Nearly where, though? I'm not sure that's how it works." },
  ],
};

/**
 * The answers for one beat, made harder: the obviously rude option is swapped
 * for a believable mistake, an extra near-miss may be added, and the order is
 * shuffled so position never gives the answer away.
 */
export function harderAnswers(beat: Beat, rand: () => number): Answer[] {
  const pool = shuffle(PLAUSIBLE[beat.mood], rand);
  const kept = beat.answers.filter((a) => a.score > 0);
  const swaps = beat.answers.filter((a) => a.score === 0).map((_, i) => pool[i % pool.length]);
  const extra = rand() < 0.6 ? pool.find((p) => !swaps.includes(p)) : undefined;
  return shuffle([...kept, ...swaps, ...(extra ? [extra] : [])], rand);
}

/* ── Openness, walking away, and rejection ──────────────────────────────── */
/** How hard it is to reach someone, 0..1: some people are simply not ready. */
const HARDNESS: Record<Background, number> = {
  muslim: 0.3, hindu: 0.22, buddhist: 0.24, sikh: 0.25, jewish: 0.3, atheist: 0.36, agnostic: 0.22,
  spiritual: 0.18, nominal: 0.2, grieving: 0.12, "hurt-by-church": 0.4, backslider: 0.15,
};
export const hardnessOf = (p: Persona) => HARDNESS[p.background] ?? 0.2;

/** Two poor answers in a row and the person makes an excuse and leaves. */
export const walksAway = (scores: number[]) => scores.length >= 2 && scores.slice(-2).every((s) => s === 0);

export type Verdict = { stage: Stage | null; openness: number; rejected: boolean; note: string };
/**
 * Like the original outcome, but harder: each person has a hardness, there is
 * some unpredictability (people are people), and low openness ends in a "no".
 */
export function harderOutcome(score: number, maxScore: number, readiness: number, prayedForThem: boolean, persona: Persona, rand: () => number, walkedAway = false): Verdict {
  const wisdom = maxScore ? score / maxScore : 0;
  const prayer = Math.min(1, readiness / 100) + (prayedForThem ? 0.15 : 0);
  const mood = (rand() - 0.5) * 0.16;
  const openness = Math.max(0, Math.min(1, wisdom * 0.55 + prayer * 0.45 - hardnessOf(persona) * 0.3 + mood));
  if (walkedAway || openness < 0.3)
    return { stage: null, openness, rejected: true, note: walkedAway
      ? "They made an excuse and left. Listening matters more than winning (James 1:19). Pray for them by name and try again another day."
      : "They said no, for now. Some seed falls on hard ground (Matthew 13:4-9). Keep praying for them; rejection of the message is not rejection of you." };
  let stage: Stage = "heard";
  if (openness >= 0.42) stage = "open";
  if (openness >= 0.62 && readiness >= 35) stage = "seeking";
  if (openness >= 0.84 && readiness >= 65) stage = "believer";
  const note = readiness < 20
    ? "Your words were true, but without prayer it stayed on the surface (John 15:5)."
    : wisdom < 0.6
      ? "Some answers sounded right but missed the person. Listen first; answer with gentleness and respect (1 Peter 3:15)."
      : "Prayer prepared the ground and your answers fitted the moment. God gives the increase (1 Corinthians 3:6).";
  return { stage, openness, rejected: false, note };
}

/** After a "no", people need time (and your prayers) before they'll talk again. */
export const COOL_OFF_MS = 6 * 60 * 60_000;
export function stillClosed(closedAt: number | undefined, prayedForThem: boolean, now = Date.now()) {
  if (!closedAt) return false;
  return now - closedAt < (prayedForThem ? COOL_OFF_MS / 3 : COOL_OFF_MS);
}

/* ── Struggles after they come to faith ─────────────────────────────────── */
export type GuideQuality = "wise" | "harsh" | "soft" | "vague";
export type Struggle = {
  id: string;
  title: string;
  confess: (name: string) => string;
  options: { text: string; quality: GuideQuality; reply: string }[];
  verse: string;
};
export const STRUGGLES: Struggle[] = [
  { id: "lying", title: "Lying to cover up", verse: "Ephesians 4:25 · 1 John 1:9",
    confess: (n) => `${n}: "I lied to my mum about where I was, then lied again to cover it. It's getting easier, which scares me."`,
    options: [
      { text: "Remind them they're forgiven when they confess, then help them plan how to tell their mum the truth.", quality: "wise", reply: "Telling her will be hard. But I want to stop hiding." },
      { text: "Tell them real Christians don't lie, so they need to ask whether they were ever saved.", quality: "harsh", reply: "So I'm not even a Christian? Maybe I should just stop trying." },
      { text: "Say everyone tells little lies; God understands, so don't worry too much.", quality: "soft", reply: "Okay... good. I'll just leave it then." },
      { text: "Send a verse about honesty and say you'll pray.", quality: "vague", reply: "Thanks. I'll read it." },
    ]},
  { id: "anger", title: "Losing their temper", verse: "James 1:19-20 · Ephesians 4:26",
    confess: (n) => `${n}: "I blew up at my brother and said things I can't take back. I thought I'd changed."`,
    options: [
      { text: "Say anger is a signal, not a sin in itself. Ask what was underneath it, then help them apologise to their brother.", quality: "wise", reply: "I was jealous, honestly. I'll go and say sorry tonight." },
      { text: "Tell them that kind of anger shows they haven't really surrendered to God.", quality: "harsh", reply: "Wow. I came to you for help." },
      { text: "Tell them brothers fight all the time; it's normal, so forget it.", quality: "soft", reply: "Yeah, he started it anyway." },
      { text: "Suggest they pray about their temper.", quality: "vague", reply: "I have been. It doesn't seem to work." },
    ]},
  { id: "envy", title: "Envy and comparison", verse: "Philippians 4:11-13 · Galatians 5:26",
    confess: (n) => `${n}: "Everyone online has a better life than me. I'm angry at God for what I don't have."`,
    options: [
      { text: "Name the envy kindly, help them thank God for three real things today, and suggest a break from the app that triggers it.", quality: "wise", reply: "Three things... okay. Actually, that helped. I'll mute it for a week." },
      { text: "Tell them envy is a serious sin and they should be ashamed.", quality: "harsh", reply: "I already feel bad. Now I feel worse." },
      { text: "Tell them they deserve nice things too, and God wants them blessed.", quality: "soft", reply: "Right! So I should just pray for more stuff." },
      { text: "Tell them not to compare themselves.", quality: "vague", reply: "Easier said than done." },
    ]},
  { id: "gossip", title: "Gossip in the group chat", verse: "Proverbs 16:28 · Ephesians 4:29",
    confess: (n) => `${n}: "I joined in when the group chat was tearing into someone. I laughed. Now she's not coming to school."`,
    options: [
      { text: "Help them see the harm honestly, then plan two things: apologise to her and stand up for her in the chat.", quality: "wise", reply: "That'll cost me some friends. But it's right. I'll message her first." },
      { text: "Tell them to leave all their friends because they're a bad influence.", quality: "harsh", reply: "Leave everyone? I'd have nobody." },
      { text: "Say they only laughed, so it wasn't really them.", quality: "soft", reply: "Yeah, I didn't actually say anything." },
      { text: "Remind them to be kind online.", quality: "vague", reply: "Yeah. I know." },
    ]},
  { id: "cheating", title: "Cheating on schoolwork", verse: "Colossians 3:23 · Proverbs 11:3",
    confess: (n) => `${n}: "I copied my coursework with AI and handed it in as mine. I got a good mark and I feel sick about it."`,
    options: [
      { text: "Affirm that their conscience is working, and talk through owning up to the teacher, with you there to support them.", quality: "wise", reply: "If you'll pray with me first, I'll talk to Mr Ade tomorrow." },
      { text: "Say God will punish them for it if they don't confess.", quality: "harsh", reply: "So God's waiting to get me. Great." },
      { text: "Everyone uses AI now; the system's unfair anyway, so let it go.", quality: "soft", reply: "True. Everyone does it." },
      { text: "Tell them to just do better next time.", quality: "vague", reply: "Okay. Next time." },
    ]},
  { id: "company", title: "Pulled along by bad company", verse: "1 Corinthians 15:33 · Proverbs 13:20",
    confess: (n) => `${n}: "My old friends keep pulling me into stuff I know is wrong, like shoplifting for a laugh. I don't want to be the boring one."`,
    options: [
      { text: "Don't shame them. Help them script a way to say no, and introduce them to the youth group so they're not alone.", quality: "wise", reply: "If I had people to hang out with instead, it'd be easier. Friday?" },
      { text: "Tell them they're choosing sin over God every time they see those friends.", quality: "harsh", reply: "I came here to be honest and you're making me feel like a criminal." },
      { text: "Say they can still hang out; just don't join in the wrong bits.", quality: "soft", reply: "Yeah, I'll just watch." },
      { text: "Tell them to choose their friends wisely.", quality: "vague", reply: "Sure." },
    ]},
  { id: "unforgiveness", title: "Holding on to a grudge", verse: "Colossians 3:13 · Matthew 6:14-15",
    confess: (n) => `${n}: "My dad walked out. Everyone says forgive him, but I can't. I don't even want to."`,
    options: [
      { text: "Acknowledge how deep it hurts. Forgiveness is a process, not pretending: start by telling God honestly how you feel.", quality: "wise", reply: "I can be honest with God? I've never prayed angry before. I'll try." },
      { text: "Tell them that if they don't forgive, God won't forgive them either.", quality: "harsh", reply: "So it's my fault now? Forget it." },
      { text: "Tell them they don't have to forgive someone who hurt them that much.", quality: "soft", reply: "Good. I won't, then." },
      { text: "Say time heals.", quality: "vague", reply: "It's been three years." },
    ]},
  { id: "screens", title: "Gaming instead of sleeping", verse: "1 Corinthians 6:12 · Psalm 127:2",
    confess: (n) => `${n}: "I've been gaming till 3am. I stopped reading my Bible and I'm snapping at everyone."`,
    options: [
      { text: "No lecture. Help them set a simple plan (phone out of the room at 10pm, a morning reading) and offer to check in.", quality: "wise", reply: "Phone in the kitchen... I can do that. Text me tomorrow?" },
      { text: "Tell them gaming is idolatry and they should delete everything.", quality: "harsh", reply: "Delete everything? That's not realistic." },
      { text: "Say gaming is fine; God just wants them to have fun.", quality: "soft", reply: "Cool, back to it then." },
      { text: "Remind them to get more sleep.", quality: "vague", reply: "Yeah, I know." },
    ]},
];

export type ContactStruggle = { id: string; since: number; tries: number };
export type GrowingContact = Contact & { struggle?: ContactStruggle; restored?: number; falls?: number };

/** Believers and seekers sometimes fall. One struggle at a time, after a while. */
export function maybeStruggle(contact: GrowingContact, now = Date.now()): GrowingContact {
  const order = STAGES.map((s) => s.id);
  if (contact.struggle || order.indexOf(contact.stage) < order.indexOf("seeking")) return contact;
  const since = Math.max(contact.met, contact.restored ?? 0, contact.lastContact);
  if (now - since < 20 * 60_000) return contact;
  const day = Math.floor(now / 86_400_000);
  const rand = seeded(`${contact.name}:${day}:${contact.falls ?? 0}`);
  if (rand() > 0.55) return contact;
  const pick = STRUGGLES[Math.floor(rand() * STRUGGLES.length)];
  return { ...contact, struggle: { id: pick.id, since: now, tries: 0 } };
}

/** How your guidance lands: grace with truth restores; shame or excuses don't. */
export function guide(contact: GrowingContact, quality: GuideQuality, now = Date.now()): { contact: GrowingContact; result: string } {
  const order = STAGES.map((s) => s.id);
  const i = order.indexOf(contact.stage);
  if (!contact.struggle) return { contact, result: "" };
  if (quality === "wise")
    return { contact: { ...contact, struggle: undefined, restored: now, lastContact: now, falls: (contact.falls ?? 0) + 1, stage: order[Math.min(order.length - 1, i + 1)] as Stage },
      result: "Restored. Grace and truth together. \"Restore such an one in the spirit of meekness\" (Galatians 6:1)." };
  if (quality === "harsh")
    return { contact: { ...contact, lastContact: now - 30 * 3_600_000, stage: order[Math.max(0, i - 1)] as Stage, struggle: { ...contact.struggle, tries: contact.struggle.tries + 1 } },
      result: "They felt condemned and pulled away. Truth without love wounds (Ephesians 4:15). Pray, then try again." };
  if (quality === "soft")
    return { contact: { ...contact, lastContact: now, struggle: { ...contact.struggle, tries: contact.struggle.tries + 1 } },
      result: "They felt comforted, but nothing changed and the struggle is still there. Love tells the truth (Hebrews 3:13)." };
  return { contact: { ...contact, lastContact: now, struggle: { ...contact.struggle, tries: contact.struggle.tries + 1 } },
    result: "It didn't really help. Ask questions, then point to a specific promise and a next step." };
}
export const struggleById = (id: string) => STRUGGLES.find((s) => s.id === id);

/** Follow-up replies that are easy to get wrong without thinking. */
export const PLAUSIBLE_FOLLOW_UP: Record<string, { text: string; good: boolean; reply: string }> = {
  message: { text: "Send them a long article explaining why Christianity is true.", good: false, reply: "Thanks... it's a bit long." },
  call: { text: "\"Just checking: did you get a chance to pray the prayer we talked about?\"", good: false, reply: "Um, not exactly. Sorry." },
  invite: { text: "\"Our church is the best in London; you'll love it.\"", good: false, reply: "Okay... I'm a bit nervous about big churches." },
  study: { text: "Let them read alone, then quiz them on what it means.", good: false, reply: "Felt a bit like a test." },
  walk: { text: "\"You've been a Christian a while now, so you should be serving at church.\"", good: false, reply: "I didn't know it was a checklist." },
};

export const backgroundLabel = (b: Background) => SCENARIOS[b]?.label ?? b;
