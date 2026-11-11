/**
 * The phone's App Store. Some apps help you walk with God and look after
 * yourself, some quietly eat your time and peace, and some lead you into
 * trouble. You can install and delete them, and what you keep (and what you
 * delete) says something about where you are spiritually.
 */
export type AppKind = "good" | "neutral" | "bad" | "trouble";
export interface StoreApp {
  id: string;
  name: string;
  glyph: string;
  color: string;
  kind: AppKind;
  maker: string;
  blurb: string;
  /** What you see when you open it. */
  screen: string[];
  /** Something the app pushes you to do, with its Kairos Life effect. */
  offer?: { label: string; reply: string; life: Record<string, unknown> };
  /** Built into the phone: installed from the start. */
  builtIn?: boolean;
  rating: number;
}

export const STORE: StoreApp[] = [
  // ── good
  { id: "bible", name: "Bible", glyph: "bible", color: "#b98a3e", kind: "good", maker: "Kairos", builtIn: true, rating: 4.9, blurb: "The whole Bible, reading plans and verse of the day.", screen: ["Verse of the day: “Thy word is a lamp unto my feet.” Psalm 119:105"] },
  { id: "prayer", name: "Prayer", glyph: "pray", color: "#8a5bd6", kind: "good", maker: "Kairos", builtIn: true, rating: 4.8, blurb: "Your prayer streak, prayer list and readiness.", screen: ["Pray first. Everything else second."] },
  { id: "tv", name: "Kharis TV", glyph: "tv", color: "#e0483e", kind: "good", maker: "Kharis Church", builtIn: true, rating: 4.9, blurb: "Sermons, worship and announcements from Kharis Church.", screen: ["New sermon this Sunday at 2pm."] },
  { id: "memory", name: "Hide It", glyph: "book", color: "#3d8a5b", kind: "good", maker: "Psalm 119 Labs", rating: 4.7, blurb: "Memorise a verse a week with flashcards.", screen: ["This week: “I can do all things through Christ which strengtheneth me.” Philippians 4:13"], offer: { label: "Practise today's verse", reply: "You can say it without looking now.", life: { walk: 2, smarts: 1 } } },
  { id: "worship", name: "Worship FM", glyph: "music", color: "#d6457a", kind: "good", maker: "Psalms Radio", rating: 4.6, blurb: "Worship music all day, ad-free.", screen: ["Now playing: an instrumental worship set."], offer: { label: "Worship for ten minutes", reply: "Your shoulders drop. You remember who's in charge.", life: { walk: 2, happiness: 2 } } },
  { id: "fast", name: "Fast Track", glyph: "flame", color: "#e98a1f", kind: "good", maker: "Daniel Diet Co", rating: 4.4, blurb: "Plan a fast, with prayer prompts every hour.", screen: ["Isaiah 58: the fast God chooses is to loose the bands of wickedness."] },
  { id: "give", name: "Kharis Give", glyph: "heart", color: "#e2556b", kind: "good", maker: "Kharis Church", rating: 4.8, blurb: "Give to your church and to people in need.", screen: ["Give cheerfully. 2 Corinthians 9:7"], offer: { label: "Give £20 to the food bank", reply: "Twenty pounds. Six families eat tonight.", life: { money: -20, fruit: 2, served: true } } },
  { id: "budget", name: "Budget Buddy", glyph: "coin", color: "#2fa48a", kind: "good", maker: "Steward Apps", rating: 4.5, blurb: "Track spending, save and get out of debt.", screen: ["You spent £84 on takeaways this month."], offer: { label: "Set a budget", reply: "For the first time, you know where your money goes.", life: { money: 300, happiness: 1 } } },
  { id: "steps", name: "Step Up", glyph: "run", color: "#43a2e6", kind: "good", maker: "Temple Fit", rating: 4.3, blurb: "Step counter and couch-to-5k.", screen: ["Today: 3,412 steps. Go for a walk?"], offer: { label: "Do today's run", reply: "Lungs burning. Head clear.", life: { health: 3, habit: { exercise: 1 } } } },
  { id: "mood", name: "Still", glyph: "wave", color: "#7a5ce6", kind: "good", maker: "Psalm 46 Studio", rating: 4.6, blurb: "A mood journal with Psalms for every feeling.", screen: ["How are you today? “Be still, and know that I am God.” Psalm 46:10"] },
  { id: "foodbank", name: "Near Need", glyph: "pin", color: "#c26a2f", kind: "good", maker: "Neighbours UK", rating: 4.7, blurb: "Find food banks and people who need a hand near you.", screen: ["3 volunteering slots near you this week."], offer: { label: "Book a volunteering slot", reply: "Saturday, 10am. They're so grateful.", life: { fruit: 3, served: true } } },
  // ── neutral
  { id: "weather", name: "Skies", glyph: "sun", color: "#f2c84b", kind: "neutral", maker: "Met Kairos", rating: 4.2, blurb: "Weather for the week.", screen: ["Drizzle later. Bring a coat."] },
  { id: "bus", name: "Bus Times", glyph: "bus", color: "#d33a2f", kind: "neutral", maker: "TfK", rating: 4.0, blurb: "Live buses and trains.", screen: ["Next 25 bus: 4 minutes."] },
  { id: "news", name: "Daily Brief", glyph: "scroll", color: "#5d6673", kind: "neutral", maker: "Kairos News", rating: 3.9, blurb: "Headlines, once a day.", screen: ["Five stories. That's it."] },
  { id: "puzzle", name: "Word Tiles", glyph: "games", color: "#2f7de1", kind: "neutral", maker: "Tile Co", rating: 4.4, blurb: "One word puzzle a day.", screen: ["Today's word has five letters."] },
  // ── bad: they don't break the law, they just eat you
  { id: "scrollr", name: "Scrollr", glyph: "phone", color: "#13203a", kind: "bad", maker: "Infinite Inc", rating: 4.7, blurb: "Endless short videos picked just for you.", screen: ["You've been scrolling for 2 hours and 41 minutes."], offer: { label: "Just one more video", reply: "It's 3am. You don't remember any of them.", life: { health: -2, happiness: -2, walk: -1 } } },
  { id: "gossip", name: "The Tea", glyph: "chat", color: "#d26aa8", kind: "bad", maker: "Spill Media", rating: 4.1, blurb: "Anonymous gossip from your area.", screen: ["Someone posted about a girl from your church…"], offer: { label: "Read the thread", reply: "Now you can't look at her the same way. That's on you.", life: { fruit: -3, walk: -2 } } },
  { id: "lookbook", name: "Lookbook", glyph: "camera", color: "#f08b2e", kind: "bad", maker: "Perfect Life Ltd", rating: 4.5, blurb: "Everyone's best life, filtered.", screen: ["Your friend is in Bali. You're on a bus."], offer: { label: "Post a filtered selfie", reply: "Twelve likes. You check it forty times.", life: { happiness: -3 } } },
  { id: "rage", name: "Outrage", glyph: "flame", color: "#e0483e", kind: "bad", maker: "Clickbait Co", rating: 3.8, blurb: "The news that makes you angriest, first.", screen: ["You won't BELIEVE what they said."], offer: { label: "Write an angry comment", reply: "You argue with a stranger for an hour.", life: { happiness: -3, walk: -2 } } },
  { id: "streams", name: "After Dark", glyph: "tv", color: "#3a2f5a", kind: "bad", maker: "Late Night TV", rating: 4.0, blurb: "Series that autoplay all night, nothing off limits.", screen: ["Next episode in 5… 4… 3…"], offer: { label: "Let it autoplay", reply: "Things on screen you wouldn't want Jesus watching beside you.", life: { walk: -4, health: -1, drift: 1 } } },
  // ── trouble: these lead you somewhere
  { id: "bet", name: "BetBlitz", glyph: "coin", color: "#1fa34a", kind: "trouble", maker: "Blitz Gaming plc", rating: 4.3, blurb: "Free £20 bet for new players! 18+.", screen: ["Your free bet is waiting. Odds boosted tonight!"], offer: { label: "Place a bet", reply: "You win £40. Then you lose £400 chasing it.", life: { money: -400, happiness: -4, drift: 1, walk: -3 } } },
  { id: "loot", name: "Loot Lord", glyph: "gift", color: "#f2c84b", kind: "trouble", maker: "Chest Games", rating: 4.6, blurb: "Open legendary chests! Limited time only.", screen: ["Legendary chest: 99p. Or 10 for £79.99."], offer: { label: "Buy 10 chests", reply: "Nothing good. Again. Just one more pack…", life: { money: -80, happiness: -2, drift: 1 } } },
  { id: "burner", name: "Burner", glyph: "chat", color: "#4a4a4a", kind: "trouble", maker: "Unknown developer", rating: 3.2, blurb: "Anonymous chat. Messages vanish. No names.", screen: ["“Need someone to drop a parcel. £300. Tonight. You in?”"], offer: { label: "Reply “I'm in”", reply: "You carry the parcel. You don't ask what's in it. Your heart's going like a train.", life: { money: 300, walk: -8, drift: 2, crime: { charge: "Possession with intent to supply", stars: 4, caught: 0.5 } } } },
  { id: "swipe", name: "Swipe Night", glyph: "heart", color: "#e2556b", kind: "trouble", maker: "Casual Co", rating: 3.9, blurb: "No strings. Meet someone tonight.", screen: ["5 people nearby want to meet tonight."], offer: { label: "Arrange to meet someone", reply: "It goes further than you meant. You feel empty on the way home.", life: { walk: -8, happiness: -4, drift: 2 } } },
  { id: "crypto", name: "MoonCoin", glyph: "coin", color: "#7a5ce6", kind: "trouble", maker: "To The Moon Ltd", rating: 4.8, blurb: "Turn £100 into £10,000. Guaranteed.*", screen: ["*Not guaranteed. A man in a Lambo says trust him."], offer: { label: "Invest your savings", reply: "The app vanishes overnight. So does your money.", life: { money: -3000, happiness: -8 } } },
  { id: "tarot", name: "Your Stars", glyph: "star", color: "#5a4fd0", kind: "trouble", maker: "Mystic Media", rating: 4.2, blurb: "Daily horoscope and tarot readings.", screen: ["Today the cards say a stranger will change your life."], offer: { label: "Book a reading", reply: "You start checking it before you make any decision.", life: { walk: -6, drift: 1 } } },
  { id: "plug", name: "The Plug", glyph: "pin", color: "#202020", kind: "trouble", maker: "Unknown developer", rating: 3.0, blurb: "Find parties near you. Anything you need, delivered.", screen: ["Party at a warehouse tonight. Ask for Dee."], offer: { label: "Go to the party", reply: "Someone gives you something. The next day's a blur.", life: { health: -8, walk: -6, drift: 2, risk: 0.01, crime: { charge: "Possession", stars: 1, caught: 0.2 } } } },
];

export const appById = (id: string) => STORE.find((a) => a.id === id);
export const BUILT_IN = STORE.filter((a) => a.builtIn).map((a) => a.id);

export interface PhoneApps {
  installed: string[];
  /** Every install and delete, newest last. */
  history: { id: string; action: "install" | "delete"; at: number }[];
}
export const freshApps = (): PhoneApps => ({ installed: [...BUILT_IN], history: [] });

export function install(p: PhoneApps, id: string, at = Date.now()): PhoneApps {
  if (!appById(id) || p.installed.includes(id)) return p;
  return { installed: [...p.installed, id], history: [...p.history, { id, action: "install", at }].slice(-60) };
}
export function remove(p: PhoneApps, id: string, at = Date.now()): PhoneApps {
  if (!p.installed.includes(id)) return p;
  return { installed: p.installed.filter((x) => x !== id), history: [...p.history, { id, action: "delete", at }].slice(-60) };
}

/** What installing or deleting an app does to your life (Kairos Life effect). */
export function lifeEffect(id: string, action: "install" | "delete"): Record<string, number> {
  const k = appById(id)?.kind;
  if (action === "install") return k === "good" ? { walk: 1 } : k === "bad" ? { walk: -1, happiness: -1 } : k === "trouble" ? { walk: -2, drift: 1 } : {};
  return k === "good" ? { walk: -2 } : k === "bad" ? { walk: 3, happiness: 1 } : k === "trouble" ? { walk: 4, drift: -1 } : {};
}

/**
 * Where you are spiritually, read from your phone: what you keep, what you've
 * added and, above all, what you've chosen to delete.
 */
export function spiritualReading(p: PhoneApps) {
  const kind = (id: string) => appById(id)?.kind;
  const has = (k: AppKind) => p.installed.filter((id) => kind(id) === k).length;
  const recent = p.history.slice(-12);
  const cut = recent.filter((h) => h.action === "delete" && (kind(h.id) === "bad" || kind(h.id) === "trouble")).length;
  const dropped = recent.filter((h) => h.action === "delete" && kind(h.id) === "good").length;
  const good = has("good"), bad = has("bad"), trouble = has("trouble");
  if (cut >= 1 && dropped === 0 && trouble === 0) return { id: "pruning", title: "Pruning", tone: "#2fa48a", text: `You've deleted ${cut} app${cut === 1 ? "" : "s"} that pulled you away. That's what growing looks like.`, verse: "Every branch that beareth fruit, he purgeth it, that it may bring forth more fruit. John 15:2" };
  if (dropped >= 1 && (bad + trouble) > 0) return { id: "cooling", title: "Cooling", tone: "#e98a1f", text: "You're deleting the things that kept you close to God and keeping the things that don't.", verse: "Thou hast left thy first love. Revelation 2:4" };
  if (dropped >= 1) return { id: "cooling", title: "Cooling", tone: "#e98a1f", text: "You've removed apps that kept you close to God. Is something going on?", verse: "Draw nigh to God, and he will draw nigh to you. James 4:8" };
  if (trouble >= 2 || (trouble >= 1 && good <= 1)) return { id: "danger", title: "In danger", tone: "#e0483e", text: "Some of what's on your phone is leading you somewhere you don't want to end up.", verse: "If thy right hand offend thee, cut it off. Matthew 5:30" };
  if (bad + trouble > good) return { id: "drifting", title: "Drifting", tone: "#d26aa8", text: "What fills your phone is filling your heart.", verse: "Keep thy heart with all diligence; for out of it are the issues of life. Proverbs 4:23" };
  if (good >= 5 && bad + trouble === 0) return { id: "rooted", title: "Rooted", tone: "#3d8a5b", text: "Your phone is full of things that help you grow.", verse: "He shall be like a tree planted by the rivers of water. Psalm 1:3" };
  return { id: "steady", title: "Steady", tone: "#43a2e6", text: "Nothing pulling you under. Keep watching what you let in.", verse: "Whatsoever things are pure… think on these things. Philippians 4:8" };
}

/** The trouble apps you keep make certain years harder. */
export const TROUBLE_EVENTS: Record<string, string> = { bet: "t-gamble", loot: "t-gamble", burner: "t-county", swipe: "t-relationship", crypto: "i-scam", tarot: "t-occult", plug: "t-drugs", scrollr: "sleep", lookbook: "comparison", gossip: "t-gossip", streams: "t-lust-media" };

export function readApps(store: Pick<Storage, "getItem"> | null, scope: string): PhoneApps {
  try { const p = JSON.parse(store?.getItem(`kairos-apps:${scope}`) ?? "null") as PhoneApps | null; if (p && Array.isArray(p.installed)) return p; } catch { /* fresh phone */ }
  return freshApps();
}
export function writeApps(store: Pick<Storage, "setItem"> | null, scope: string, p: PhoneApps) {
  try { store?.setItem(`kairos-apps:${scope}`, JSON.stringify(p)); } catch { /* storage full or blocked */ }
}
