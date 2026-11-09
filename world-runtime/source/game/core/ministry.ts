/**
 * Kairos ministry model: prayer readiness, gospel conversations with people of
 * many backgrounds, and the follow-up journey afterwards. Pure data and rules;
 * storage is passed in so it can be tested and scoped per player.
 *
 * Teaching aims (shown to players):
 *  - Fruit is God's work (1 Cor 3:6). Prayer is how we depend on Him (John 15:5).
 *  - Answer with gentleness and respect (1 Pet 3:15), from Scripture.
 *  - A conversation is the start, not the end: follow up (Acts 15:36).
 * NPCs are fictional. Their views are written respectfully and in their own words.
 */

export type Background =
  | "muslim" | "hindu" | "buddhist" | "sikh" | "jewish" | "atheist" | "agnostic"
  | "spiritual" | "nominal" | "grieving" | "hurt-by-church" | "backslider";

export type Answer = { text: string; score: 0 | 1 | 2; reply: string; scripture?: string };
export type Beat = { says: string; mood: "curious" | "guarded" | "hurt" | "warm" | "challenging"; answers: Answer[] };
export type Scenario = {
  background: Background;
  label: string;
  opener: string;
  beats: Beat[];
  /** Line the person says when prayer has prepared the moment (Holy Spirit beat). */
  openHeart: string;
};

export const SCENARIOS: Record<Background, Scenario> = {
  muslim: {
    background: "muslim",
    label: "Muslim",
    opener: "I respect Jesus — Isa — as a great prophet. But you say He is more than that?",
    beats: [
      { says: "How can God have a son? God is One.", mood: "challenging", answers: [
        { text: "Agree that God is One — Christians believe that too — and explain that 'Son' speaks of relationship and nature, not biology.", score: 2, reply: "So you are not saying God has a wife. That is not what I thought Christians meant.", scripture: "Deuteronomy 6:4 · John 1:1, 14" },
        { text: "Tell them their religion is wrong about God.", score: 0, reply: "Then I don't think we can talk about this." },
        { text: "Say it's a mystery you don't really understand.", score: 1, reply: "Hm. Then why believe it?" },
      ]},
      { says: "We believe Isa was not crucified. Why does the cross matter so much?", mood: "curious", answers: [
        { text: "Explain that the cross is where God's justice and mercy meet: Jesus took our sin so we could be forgiven freely.", score: 2, reply: "Forgiveness that I don't earn... that is very different to what I was taught.", scripture: "Romans 5:8 · Isaiah 53:5" },
        { text: "Say history proves it, so they should just accept it.", score: 1, reply: "Historians argue about many things." },
        { text: "Change the subject to church events.", score: 0, reply: "Okay..." },
      ]},
      { says: "How can you be sure you are going to heaven? Only God knows.", mood: "warm", answers: [
        { text: "Share that assurance comes from trusting Jesus' finished work, not your good deeds — and how that has given you peace.", score: 2, reply: "I would like that kind of peace. Can I read about it?", scripture: "1 John 5:13 · Ephesians 2:8-9" },
        { text: "Say you're sure because you go to church every week.", score: 0, reply: "So it is still about what you do." },
        { text: "Offer to read the Gospel of John together.", score: 2, reply: "Maybe. Send me where to start.", scripture: "John 20:31" },
      ]},
    ],
    openHeart: "Last night I dreamt of a man in white who said 'come to me'. I didn't tell anyone. Is that why you stopped to talk to me?",
  },
  hindu: {
    background: "hindu",
    label: "Hindu",
    opener: "All paths lead to God, no? Jesus can be one of them for you.",
    beats: [
      { says: "Why do Christians say Jesus is the only way? That sounds proud.", mood: "challenging", answers: [
        { text: "Say it would be proud if we invented it — but Jesus Himself said it, and it's a gift offered to everyone.", score: 2, reply: "A gift for everyone... not only for Christians?", scripture: "John 14:6 · John 3:16" },
        { text: "Agree that all religions are basically the same.", score: 0, reply: "So then there is nothing different about Jesus?" },
        { text: "Explain other religions are false.", score: 0, reply: "That is exactly the pride I mean." },
      ]},
      { says: "I believe in karma. What you do comes back to you.", mood: "curious", answers: [
        { text: "Say the Bible agrees we reap what we sow — and that's why we need grace: Jesus carried what we deserved.", score: 2, reply: "Grace breaks the cycle? That is something new to me.", scripture: "Galatians 6:7 · Romans 6:23" },
        { text: "Say karma is nonsense.", score: 0, reply: "You haven't even asked what I mean by it." },
        { text: "Ask what they hope happens after this life.", score: 1, reply: "I hope to be free. Moksha. But I am not sure I will get there." },
      ]},
      { says: "My family would be very upset if I changed religion.", mood: "hurt", answers: [
        { text: "Acknowledge that cost honestly, and say Jesus calls us to honour our parents and love our family even more.", score: 2, reply: "Thank you for not pretending it is easy.", scripture: "Ephesians 6:2 · Mark 10:29-30" },
        { text: "Tell them family doesn't matter compared to God.", score: 0, reply: "Family matters to me a lot." },
        { text: "Offer to pray with them for their family.", score: 2, reply: "Yes. Please pray. I would like that.", scripture: "Philippians 4:6" },
      ]},
    ],
    openHeart: "My grandmother was ill and someone prayed in Jesus' name. She got better. I never forgot.",
  },
  buddhist: {
    background: "buddhist",
    label: "Buddhist",
    opener: "Life is suffering because of desire. I try to let go of everything.",
    beats: [
      { says: "Why would I need a God? I can find peace through practice.", mood: "curious", answers: [
        { text: "Ask what peace they've found, listen, then share that Jesus offers a peace that doesn't depend on our effort.", score: 2, reply: "Not depending on my effort... I am tired of trying.", scripture: "John 14:27 · Matthew 11:28" },
        { text: "Say meditation is dangerous.", score: 0, reply: "It has helped me a lot, actually." },
        { text: "Say Christians also value stillness before God.", score: 1, reply: "Really? I didn't know that.", scripture: "Psalm 46:10" },
      ]},
      { says: "Suffering is everywhere. If God is good, why does He allow it?", mood: "challenging", answers: [
        { text: "Admit it's a real question; share that God didn't stay distant but entered our suffering in Jesus — and promises to end it.", score: 2, reply: "A God who suffers too. I've never thought of that.", scripture: "Isaiah 53:3 · Revelation 21:4" },
        { text: "Say suffering is always a punishment.", score: 0, reply: "That is cruel." },
        { text: "Say you don't know, but you trust Him.", score: 1, reply: "That's honest at least." },
      ]},
      { says: "I don't know if I believe in a soul, or a self.", mood: "warm", answers: [
        { text: "Share that God made each person uniquely and knows them by name — you are not an illusion to Him.", score: 2, reply: "Known by name. That is a beautiful idea.", scripture: "Psalm 139:13-14 · Isaiah 43:1" },
        { text: "Argue philosophy until they agree.", score: 0, reply: "I don't think we're getting anywhere." },
        { text: "Invite them to read a Psalm together.", score: 1, reply: "Maybe later." },
      ]},
    ],
    openHeart: "I sat by the river this morning and for the first time I wanted to talk to someone, not just empty my mind.",
  },
  sikh: {
    background: "sikh",
    label: "Sikh",
    opener: "We believe in one God and serving others — seva. Isn't that the same as you?",
    beats: [
      { says: "We also say God is one and is grace. What is different?", mood: "curious", answers: [
        { text: "Honour what you share — one God, serving others — then explain grace in Christianity came in a person: Jesus, who died and rose for us.", score: 2, reply: "Grace with a face. I'd like to hear more.", scripture: "John 1:14, 17 · Titus 2:11" },
        { text: "Say it's all the same anyway.", score: 0, reply: "Then why do you follow Jesus?" },
        { text: "Explain the Trinity at length without asking about them.", score: 1, reply: "That's a lot of information." },
      ]},
      { says: "I try to live truthfully and work hard. Surely God accepts that?", mood: "challenging", answers: [
        { text: "Commend their honesty, then gently share none of us can be good enough — so God made a way through Jesus.", score: 2, reply: "So even my best is not enough... but there is still a way.", scripture: "Romans 3:23-24 · Ephesians 2:8-9" },
        { text: "Tell them their good works are worthless.", score: 0, reply: "That's offensive." },
        { text: "Agree that working hard earns heaven.", score: 0, reply: "So what is Jesus for?" },
      ]},
      { says: "Would I have to stop wearing my turban?", mood: "hurt", answers: [
        { text: "Reassure them following Jesus is about the heart, not erasing their culture.", score: 2, reply: "That's a relief. I thought it meant losing who I am.", scripture: "1 Samuel 16:7 · Galatians 3:28" },
        { text: "Say they'd have to change everything.", score: 0, reply: "Then no." },
        { text: "Say you're not sure.", score: 1, reply: "Okay..." },
      ]},
    ],
    openHeart: "At the langar I served a man who said 'Jesus loves you'. It stuck with me for weeks.",
  },
  jewish: {
    background: "jewish",
    label: "Jewish",
    opener: "Jesus was a Jewish teacher. But the Messiah? We are still waiting.",
    beats: [
      { says: "If Jesus was the Messiah, why isn't there peace in the world?", mood: "challenging", answers: [
        { text: "Show how the prophets speak of a suffering servant first, and a reigning king to come — Jesus fulfils both.", score: 2, reply: "Isaiah 53... I have heard it is not read in synagogue much. I will look.", scripture: "Isaiah 53 · Zechariah 9:9" },
        { text: "Blame them for not believing.", score: 0, reply: "That has a dark history. Please don't." },
        { text: "Say peace is in our hearts now.", score: 1, reply: "That is not what the prophets meant." },
      ]},
      { says: "We have the Torah. Why do I need anything else?", mood: "curious", answers: [
        { text: "Agree the Torah is God's word, and share Jesus said He came to fulfil it, not abolish it.", score: 2, reply: "Fulfil, not abolish. That's interesting.", scripture: "Matthew 5:17 · Jeremiah 31:31-33" },
        { text: "Say the Old Testament doesn't matter now.", score: 0, reply: "It matters to me." },
        { text: "Talk about Christmas traditions.", score: 1, reply: "Hm." },
      ]},
      { says: "My grandparents survived terrible things. Where was God?", mood: "hurt", answers: [
        { text: "Don't rush to an answer. Listen. Then share that God weeps with the broken and that justice will come.", score: 2, reply: "Thank you for listening first.", scripture: "Psalm 34:18 · John 11:35" },
        { text: "Give a quick theological answer.", score: 0, reply: "You don't understand." },
        { text: "Say you're sorry and ask about them.", score: 2, reply: "They were brave. I miss them." },
      ]},
    ],
    openHeart: "I read Psalm 22 last week and it sounded like the crucifixion. It unsettled me.",
  },
  atheist: {
    background: "atheist",
    label: "Atheist",
    opener: "No offence, but there's no evidence for God. Science explains everything.",
    beats: [
      { says: "Why believe in something you can't prove?", mood: "challenging", answers: [
        { text: "Agree evidence matters, and point to the historical evidence for the resurrection and the order of creation.", score: 2, reply: "I'd never actually looked at the resurrection as history.", scripture: "1 Corinthians 15:3-8 · Romans 1:20" },
        { text: "Say faith doesn't need evidence.", score: 1, reply: "That's exactly my problem." },
        { text: "Mock science.", score: 0, reply: "Right. Bye." },
      ]},
      { says: "Religion causes so much harm.", mood: "challenging", answers: [
        { text: "Admit Christians have done wrong, then point them to Jesus Himself, who never did.", score: 2, reply: "Fair. Jesus himself seems... different.", scripture: "1 Peter 2:22 · Luke 23:34" },
        { text: "Deny that Christians ever did harm.", score: 0, reply: "Come on." },
        { text: "Say atheists have done harm too.", score: 1, reply: "Whataboutism doesn't help." },
      ]},
      { says: "If I'm honest, sometimes I wonder if there's more.", mood: "warm", answers: [
        { text: "Thank them for being honest, and invite them to read one Gospel with an open mind.", score: 2, reply: "Okay. Which one?", scripture: "Jeremiah 29:13 · John 20:31" },
        { text: "Say 'I told you so'.", score: 0, reply: "Forget I said anything." },
        { text: "Share your own story of coming to faith.", score: 2, reply: "That's... actually really moving." },
      ]},
    ],
    openHeart: "My mum's Christian. She prays for me every day. I've never told her I sometimes pray too.",
  },
  agnostic: {
    background: "agnostic",
    label: "Agnostic",
    opener: "Maybe there's a God, maybe not. I don't think anyone can know.",
    beats: [
      { says: "How can anyone be sure?", mood: "curious", answers: [
        { text: "Say God made Himself knowable in Jesus — we don't have to guess what He's like.", score: 2, reply: "So the claim is God showed up. Huh.", scripture: "John 14:9 · Hebrews 1:1-3" },
        { text: "Say you just feel it.", score: 1, reply: "Feelings change though." },
        { text: "Tell them they're scared to commit.", score: 0, reply: "Wow, okay." },
      ]},
      { says: "Does it really matter what I believe if I'm a good person?", mood: "challenging", answers: [
        { text: "Gently share that it matters because God wants a relationship with you, not just good behaviour.", score: 2, reply: "A relationship... I hadn't thought of it like that.", scripture: "Revelation 3:20 · John 17:3" },
        { text: "Say good people go to hell.", score: 0, reply: "That's not a great pitch." },
        { text: "Ask what 'good' means to them.", score: 1, reply: "Good question. I don't know." },
      ]},
      { says: "If God's real, why doesn't He just show Himself?", mood: "warm", answers: [
        { text: "Share that He did — and still answers those who seek Him. Offer to pray with them for that.", score: 2, reply: "Okay. Pray. I'm curious what happens.", scripture: "Jeremiah 29:13 · Matthew 7:7" },
        { text: "Say God doesn't owe anyone anything.", score: 0, reply: "Cold." },
        { text: "Say you've wondered that too.", score: 1, reply: "At least you're honest." },
      ]},
    ],
    openHeart: "I've been reading about Jesus online at 2am. I don't know why I keep coming back.",
  },
  spiritual: {
    background: "spiritual",
    label: "Spiritual, not religious",
    opener: "I'm spiritual but not religious. I believe in the universe and good energy.",
    beats: [
      { says: "Isn't religion just rules?", mood: "challenging", answers: [
        { text: "Agree that rules can't save anyone — Jesus offers a relationship, not a rulebook.", score: 2, reply: "That's different to what I expected you to say.", scripture: "Matthew 11:28-30 · Galatians 5:1" },
        { text: "List the rules they're breaking.", score: 0, reply: "Exactly my point." },
        { text: "Say church has good community.", score: 1, reply: "Maybe." },
      ]},
      { says: "I get guidance from crystals and tarot.", mood: "curious", answers: [
        { text: "Ask what they're searching for in it, then share that God offers real guidance and peace, personally.", score: 2, reply: "Honestly I'm searching for someone to tell me it'll be okay.", scripture: "Psalm 32:8 · Proverbs 3:5-6" },
        { text: "Call it demonic straight away.", score: 0, reply: "Judgemental much?" },
        { text: "Warn them kindly the Bible asks us to avoid it, and why.", score: 1, reply: "Hm. I'll think about it.", scripture: "Deuteronomy 18:10-12" },
      ]},
      { says: "Who is Jesus to you, really?", mood: "warm", answers: [
        { text: "Share personally: Saviour, friend, Lord — and what He changed in your life.", score: 2, reply: "You really believe that. I can tell.", scripture: "2 Corinthians 5:17" },
        { text: "Recite a creed without explaining it.", score: 1, reply: "Okay..." },
        { text: "Say 'a good teacher'.", score: 0, reply: "So, like any other." },
      ]},
    ],
    openHeart: "I felt something in a church once, at a funeral. Peace. I've been chasing it ever since.",
  },
  nominal: {
    background: "nominal",
    label: "Cultural Christian",
    opener: "I was christened. I'm Christian, I suppose. Don't really go though.",
    beats: [
      { says: "I'm a decent person. That's what counts, right?", mood: "curious", answers: [
        { text: "Share that Christianity isn't about being decent but being born again through faith in Jesus.", score: 2, reply: "Born again... I've heard that but never understood it.", scripture: "John 3:3 · 2 Corinthians 5:17" },
        { text: "Say they're not a real Christian.", score: 0, reply: "Who are you to say that?" },
        { text: "Invite them to church.", score: 1, reply: "Maybe at Christmas." },
      ]},
      { says: "Church was boring when I was a kid.", mood: "challenging", answers: [
        { text: "Laugh with them, then say Jesus is anything but boring — and share a story from the Gospels.", score: 2, reply: "Okay, that story is actually good.", scripture: "Mark 2:1-12" },
        { text: "Tell them that's their fault.", score: 0, reply: "Right." },
        { text: "Say Kharis has great worship.", score: 1, reply: "I'll take your word for it." },
      ]},
      { says: "What would actually change if I took it seriously?", mood: "warm", answers: [
        { text: "Talk about forgiveness, purpose and the Holy Spirit's help day to day.", score: 2, reply: "I could do with all three of those honestly.", scripture: "Acts 2:38 · Romans 8:28" },
        { text: "Say 'a lot of rules'.", score: 0, reply: "No thanks." },
        { text: "Say 'everything', with your own example.", score: 2, reply: "Tell me more." },
      ]},
    ],
    openHeart: "My nan used to pray for me. She died last year. I've been thinking about what she believed.",
  },
  grieving: {
    background: "grieving",
    label: "Grieving",
    opener: "Sorry, I'm not great company today. Lost my dad a month ago.",
    beats: [
      { says: "Everyone says 'he's in a better place'. It doesn't help.", mood: "hurt", answers: [
        { text: "Don't fix it. Say you're sorry, and ask about their dad.", score: 2, reply: "He was funny. He'd have liked you.", scripture: "Romans 12:15" },
        { text: "Say everything happens for a reason.", score: 0, reply: "Please don't." },
        { text: "Share a verse straight away.", score: 1, reply: "Thanks. I guess." },
      ]},
      { says: "Is it okay to be angry at God?", mood: "challenging", answers: [
        { text: "Say yes — the Psalms are full of honest anger. God can handle it, and He stays close.", score: 2, reply: "I didn't know that was in the Bible.", scripture: "Psalm 13 · Psalm 34:18" },
        { text: "Say anger is a sin.", score: 0, reply: "Great. Now I feel worse." },
        { text: "Say you've been angry too.", score: 1, reply: "Really?" },
      ]},
      { says: "Will I ever see him again?", mood: "warm", answers: [
        { text: "Share the hope of resurrection in Jesus with care, and offer to pray with them now.", score: 2, reply: "Yes... please pray. I'd like that.", scripture: "John 11:25-26 · 1 Thessalonians 4:13-14" },
        { text: "Say you can't know.", score: 1, reply: "I hoped you'd say something else." },
        { text: "Talk about your own problems.", score: 0, reply: "Right." },
      ]},
    ],
    openHeart: "Dad started reading the Bible in hospital. I found it by his bed with a page folded at John 14.",
  },
  "hurt-by-church": {
    background: "hurt-by-church",
    label: "Hurt by church",
    opener: "I used to go to church. People there hurt me. I'm done.",
    beats: [
      { says: "Christians are hypocrites.", mood: "hurt", answers: [
        { text: "Say you're truly sorry for what happened, and that it wasn't how Jesus treats people.", score: 2, reply: "No one's ever apologised before.", scripture: "Matthew 12:20 · Luke 15:20" },
        { text: "Defend the church.", score: 0, reply: "See? Same as them." },
        { text: "Ask what happened, and listen.", score: 2, reply: "...It's a long story. But okay." },
      ]},
      { says: "Why should I trust God when His people let me down?", mood: "challenging", answers: [
        { text: "Distinguish Jesus from His imperfect followers — He is faithful even when we aren't.", score: 2, reply: "I miss Him, honestly. Just not them.", scripture: "2 Timothy 2:13 · Hebrews 13:5" },
        { text: "Tell them to get over it.", score: 0, reply: "Wow." },
        { text: "Say every church has problems.", score: 1, reply: "That's not comforting." },
      ]},
      { says: "I don't know if I could ever walk into a church again.", mood: "warm", answers: [
        { text: "Offer to meet for coffee and read the Bible together first — no pressure.", score: 2, reply: "That... I could do that.", scripture: "Acts 2:46" },
        { text: "Tell them they must come Sunday.", score: 0, reply: "No." },
        { text: "Say you'll pray for healing.", score: 1, reply: "Thanks." },
      ]},
    ],
    openHeart: "I still sing worship songs in the car. I never stopped believing. I just stopped belonging.",
  },
  backslider: {
    background: "backslider",
    label: "Drifted away",
    opener: "I used to be on fire for God. Now... I don't even pray.",
    beats: [
      { says: "God must be disappointed in me.", mood: "hurt", answers: [
        { text: "Remind them of the prodigal son: the father ran to him.", score: 2, reply: "He ran... I forgot that part.", scripture: "Luke 15:20 · 1 John 1:9" },
        { text: "Say yes, they should feel bad.", score: 0, reply: "I already do." },
        { text: "Say everyone goes through seasons.", score: 1, reply: "This one's been long." },
      ]},
      { says: "I don't know how to start again.", mood: "curious", answers: [
        { text: "Suggest starting small: five minutes of prayer, one chapter a day, and meeting with you weekly.", score: 2, reply: "Small steps. I can do small.", scripture: "Lamentations 3:22-23 · Hebrews 10:24-25" },
        { text: "Say they need a 40-day fast.", score: 0, reply: "That's too much right now." },
        { text: "Invite them to Kharis this Sunday.", score: 1, reply: "Maybe." },
      ]},
      { says: "Would you pray with me now?", mood: "warm", answers: [
        { text: "Pray with them, simply and honestly, right there.", score: 2, reply: "Thank you. I feel lighter.", scripture: "James 5:16" },
        { text: "Say you're busy.", score: 0, reply: "Oh. Okay." },
        { text: "Promise to pray later.", score: 1, reply: "Alright." },
      ]},
    ],
    openHeart: "I woke up at 3am last night with a worship song in my head I haven't sung in years.",
  },
};

export type Persona = { name: string; background: Background; age: string; detail: string };
export const PERSONAS: Persona[] = [
  { name: "Amina", background: "muslim", age: "student", detail: "studies pharmacy at King's" },
  { name: "Daniel", background: "atheist", age: "adult", detail: "software engineer in Shoreditch" },
  { name: "Priya", background: "hindu", age: "adult", detail: "runs a family shop in Croydon" },
  { name: "Jordan", background: "hurt-by-church", age: "young adult", detail: "used to lead youth band" },
  { name: "Maya", background: "spiritual", age: "young adult", detail: "yoga teacher in Camden" },
  { name: "Noah", background: "jewish", age: "adult", detail: "history teacher" },
  { name: "Sam", background: "agnostic", age: "student", detail: "first year at UCL" },
  { name: "Talia", background: "grieving", age: "adult", detail: "nurse at St Thomas'" },
  { name: "Harjit", background: "sikh", age: "adult", detail: "taxi driver for 20 years" },
  { name: "Lin", background: "buddhist", age: "adult", detail: "architect from Hong Kong" },
  { name: "Chris", background: "nominal", age: "adult", detail: "christened, rarely goes to church" },
  { name: "Esi", background: "backslider", age: "young adult", detail: "used to attend Kharis youth" },
];
export const personaFor = (index: number) => PERSONAS[((index % PERSONAS.length) + PERSONAS.length) % PERSONAS.length];

/* ── Prayer ─────────────────────────────────────────────────────────────── */
export type PrayerState = { readiness: number; at: number; named: string[]; streak: number; lastDay: string };
export const PRAYER_DEFAULT: PrayerState = { readiness: 0, at: 0, named: [], streak: 0, lastDay: "" };
/** Readiness fades by 25 points per real hour without prayer. */
export function currentReadiness(state: PrayerState, now = Date.now()) {
  const hours = Math.max(0, (now - (state.at || now)) / 3_600_000);
  return Math.max(0, Math.min(100, Math.round(state.readiness - hours * 25)));
}
/**
 * Seconds spent in each ACTS step add readiness. A quick prayer helps a little;
 * a long, sincere session (several minutes, naming people) is what fills it.
 */
export function prayed(state: PrayerState, seconds: number, names: string[], now = Date.now()): PrayerState {
  const minutes = Math.max(0, seconds) / 60;
  const gain = Math.round(Math.min(100, minutes * 12 + names.length * 4));
  const day = new Date(now).toISOString().slice(0, 10);
  const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);
  const streak = state.lastDay === day ? state.streak : state.lastDay === yesterday ? state.streak + 1 : 1;
  return {
    readiness: Math.min(100, currentReadiness(state, now) + gain),
    at: now,
    named: Array.from(new Set([...names, ...state.named])).slice(0, 30),
    streak,
    lastDay: day,
  };
}
export const readinessLabel = (r: number) =>
  r >= 75 ? "Prayed up" : r >= 45 ? "Prepared" : r >= 20 ? "Running low" : "Prayerless";

export const ACTS_STEPS = [
  { id: "adoration", title: "Adoration", prompt: "Praise God for who He is.", verse: "Psalm 145:3 — Great is the LORD, and greatly to be praised.", minSeconds: 20 },
  { id: "confession", title: "Confession", prompt: "Be honest with God about your sin.", verse: "1 John 1:9 — If we confess our sins, he is faithful and just to forgive us.", minSeconds: 20 },
  { id: "thanksgiving", title: "Thanksgiving", prompt: "Thank Him for specific things today.", verse: "1 Thessalonians 5:18 — In every thing give thanks.", minSeconds: 20 },
  { id: "supplication", title: "Intercession", prompt: "Pray for people by name — your contacts, friends and those you will meet.", verse: "Colossians 4:3 — Praying also for us, that God would open unto us a door of utterance.", minSeconds: 40 },
];

/* ── Conversations ──────────────────────────────────────────────────────── */
export type Stage = "heard" | "open" | "seeking" | "believer" | "disciple";
export const STAGES: { id: Stage; label: string }[] = [
  { id: "heard", label: "Heard the gospel" },
  { id: "open", label: "Open" },
  { id: "seeking", label: "Seeking" },
  { id: "believer", label: "New believer" },
  { id: "disciple", label: "Growing disciple" },
];

/**
 * Outcome of a conversation. Wise, gentle answers matter, but without prayer
 * the person stays guarded: the best you can reach is "open".
 */
export function conversationOutcome(score: number, maxScore: number, readiness: number, prayedForThem: boolean) {
  const wisdom = maxScore ? score / maxScore : 0;
  const prayer = Math.min(1, readiness / 100) + (prayedForThem ? 0.15 : 0);
  const openness = wisdom * 0.55 + prayer * 0.45;
  let stage: Stage = "heard";
  if (openness >= 0.4) stage = "open";
  if (openness >= 0.6 && readiness >= 30) stage = "seeking";
  if (openness >= 0.82 && readiness >= 60) stage = "believer";
  const note =
    readiness < 20
      ? "Your words were true, but without prayer the conversation stayed on the surface. \"Without me ye can do nothing\" (John 15:5)."
      : readiness < 45
        ? "You had some prayer behind you. Spend longer with God before you go out and watch for open doors (Colossians 4:2-3)."
        : wisdom < 0.6
          ? "You were prayed up, but some answers missed the moment. Listen first, answer with gentleness and respect (1 Peter 3:15)."
          : "Prayer prepared the ground and your answers were wise. God gives the increase (1 Corinthians 3:6).";
  return { stage, openness, note };
}

/* ── Follow-up ──────────────────────────────────────────────────────────── */
export type FollowStepId = "message" | "call" | "invite" | "study" | "walk";
export type FollowStep = {
  id: FollowStepId;
  title: string;
  afterMinutes: number;
  channel: "message" | "call" | "meet";
  prompt: (name: string) => string;
  options: { text: string; good: boolean; reply: string }[];
};
export const FOLLOW_STEPS: FollowStep[] = [
  { id: "message", title: "Send a thank-you message", afterMinutes: 0, channel: "message",
    prompt: (n) => `Message ${n} after your conversation.`,
    options: [
      { text: "Thanks for chatting today — I really enjoyed it. I'm praying for you.", good: true, reply: "Thank you! That means a lot." },
      { text: "Come to church Sunday. 10am. Don't be late.", good: false, reply: "Uh... maybe." },
      { text: "Here's the Gospel of John if you want to read it: start at chapter 1.", good: true, reply: "Thanks, I'll take a look." },
    ]},
  { id: "call", title: "Call to check in", afterMinutes: 5, channel: "call",
    prompt: (n) => `Call ${n}. Ask how they're really doing.`,
    options: [
      { text: "\"How's your week been? Anything I can pray about?\"", good: true, reply: "Actually, yes. Work's been rough. Thanks for asking." },
      { text: "\"Did you read the Bible yet?\"", good: false, reply: "Not yet... sorry." },
      { text: "\"Just calling to say I was thinking of you.\"", good: true, reply: "That's kind. Nobody does that." },
    ]},
  { id: "invite", title: "Invite to church or a small group", afterMinutes: 15, channel: "message",
    prompt: (n) => `Invite ${n} to come along with you.`,
    options: [
      { text: "\"I'm going Sunday — want to come with me? I'll meet you outside.\"", good: true, reply: "If you're there, yeah, okay." },
      { text: "\"You should really be in church.\"", good: false, reply: "I'll think about it." },
      { text: "\"We've got a relaxed Bible study Wednesday. Food included!\"", good: true, reply: "Food? I'm in." },
    ]},
  { id: "study", title: "Read the Bible together", afterMinutes: 30, channel: "meet",
    prompt: (n) => `Meet ${n} to read John 3 together.`,
    options: [
      { text: "Read the passage, ask what stood out to them, and listen.", good: true, reply: "Verse 16 — I never realised 'whosoever' included me." },
      { text: "Lecture for 30 minutes.", good: false, reply: "That was... a lot." },
      { text: "Share how John 3 changed you, then ask their thoughts.", good: true, reply: "Born again. I want that." },
    ]},
  { id: "walk", title: "Check on their spiritual walk", afterMinutes: 60, channel: "call",
    prompt: (n) => `Call ${n}: how is their walk with God going?`,
    options: [
      { text: "\"How's your prayer life? What's God been showing you?\"", good: true, reply: "I prayed every morning this week. It's changing me." },
      { text: "\"Are you tithing yet?\"", good: false, reply: "Um..." },
      { text: "\"Want to pray together now, then plan next week's reading?\"", good: true, reply: "Yes please. Let's keep going." },
    ]},
];

export type Contact = {
  name: string;
  background: Background;
  stage: Stage;
  met: number;
  steps: Partial<Record<FollowStepId, number>>;
  lastContact: number;
  notes: string[];
};

/** Next follow-up step that is due (or waiting) for this contact. */
export function nextStep(contact: Contact, now = Date.now()) {
  const step = FOLLOW_STEPS.find((s) => !contact.steps[s.id]);
  if (!step) return null;
  const due = contact.met + step.afterMinutes * 60_000;
  return { step, due, ready: now >= due };
}
/** Neglected contacts cool off: a reminder that follow-up needs consistency. */
export function contactWarmth(contact: Contact, now = Date.now()) {
  const hours = (now - contact.lastContact) / 3_600_000;
  return hours < 6 ? "warm" : hours < 48 ? "cooling" : "drifting";
}
export function advanceStage(stage: Stage, good: boolean): Stage {
  const order = STAGES.map((s) => s.id);
  const i = order.indexOf(stage);
  return good ? order[Math.min(order.length - 1, i + 1)] : stage;
}
export function completeStep(contact: Contact, id: FollowStepId, good: boolean, now = Date.now()): Contact {
  const steps = { ...contact.steps, [id]: now };
  const stage = id === "message" ? contact.stage : advanceStage(contact.stage, good);
  return { ...contact, steps, stage, lastContact: now };
}

/* ── Godly friendships ──────────────────────────────────────────────────── */
export type Friend = { name: string; role: string; strength: string; level: number };
export const FELLOWSHIP: Friend[] = [
  { name: "Kwame", role: "Prayer partner", strength: "Faithful in early-morning prayer", level: 1 },
  { name: "Esther", role: "Bible study friend", strength: "Knows the Psalms by heart", level: 1 },
  { name: "Joel", role: "Outreach buddy", strength: "Bold and kind with strangers", level: 1 },
  { name: "Abena", role: "Mentor", strength: "Wise counsel, walked with God 30 years", level: 1 },
];
export const FRIEND_ACTIVITIES = [
  { id: "pray", label: "Pray together", verse: "Matthew 18:20", readiness: 15 },
  { id: "study", label: "Study Scripture", verse: "Proverbs 27:17", readiness: 8 },
  { id: "encourage", label: "Encourage them", verse: "1 Thessalonians 5:11", readiness: 5 },
  { id: "outreach", label: "Go out together", verse: "Luke 10:1", readiness: 10 },
];

/* ── Storage ────────────────────────────────────────────────────────────── */
export type MinistrySave = { prayer: PrayerState; contacts: Contact[]; friends: Record<string, number>; conversations: number; seen: string[] };
export const MINISTRY_KEY = "kairos-ministry-v1";
export const EMPTY_SAVE: MinistrySave = { prayer: PRAYER_DEFAULT, contacts: [], friends: {}, conversations: 0, seen: [] };
export function readMinistry(storage: Pick<Storage, "getItem"> | null): MinistrySave {
  try {
    const raw = JSON.parse(storage?.getItem(MINISTRY_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return { ...EMPTY_SAVE };
    return {
      prayer: { ...PRAYER_DEFAULT, ...(raw.prayer ?? {}) },
      contacts: Array.isArray(raw.contacts) ? raw.contacts.slice(0, 60) : [],
      friends: raw.friends && typeof raw.friends === "object" ? raw.friends : {},
      conversations: Number(raw.conversations) || 0,
      seen: Array.isArray(raw.seen) ? raw.seen.slice(0, 60) : [],
    };
  } catch {
    return { ...EMPTY_SAVE };
  }
}
export function writeMinistry(storage: Pick<Storage, "setItem"> | null, save: MinistrySave) {
  try {
    storage?.setItem(MINISTRY_KEY, JSON.stringify(save));
    window.dispatchEvent(new Event("kairos-ministry-updated"));
  } catch {
    /* Ministry progress is optional local progress. */
  }
}
export function recordConversation(save: MinistrySave, persona: Persona, stage: Stage, now = Date.now()): MinistrySave {
  const existing = save.contacts.find((c) => c.name === persona.name);
  const order = STAGES.map((s) => s.id);
  const contact: Contact = existing
    ? { ...existing, stage: order.indexOf(stage) > order.indexOf(existing.stage) ? stage : existing.stage, lastContact: now }
    : { name: persona.name, background: persona.background, stage, met: now, steps: {}, lastContact: now, notes: [] };
  return {
    ...save,
    conversations: save.conversations + 1,
    contacts: [contact, ...save.contacts.filter((c) => c.name !== persona.name)].slice(0, 60),
  };
}
