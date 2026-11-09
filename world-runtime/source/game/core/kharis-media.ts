/**
 * Kharis Church media shown on in-world billboards, Kharis TV and the phone.
 * Sermon IDs come from public/playmessages/sources.json (official Kharis Church
 * channel). Announcements and seasons are editable here; keep wording factual.
 */
export const KHARIS_CHANNEL = {
  name: "Kharis Church",
  id: "UC4l8WmdF9ivMDQHHVOdYKqQ",
  url: "https://www.youtube.com/@davidantwi",
  site: "https://kharis.org",
};
/** YouTube's automatic "uploads" playlist: always the channel's newest messages. */
export const LATEST_UPLOADS = "UU" + KHARIS_CHANNEL.id.slice(2);

export type Sermon = { id: string; title: string; minutes: number };
export const SERMONS: Sermon[] = [
  { id: "I4cQ6D2ERuo", title: "Faith In Prayer", minutes: 77 },
  { id: "hjhIW911Z44", title: "Life In Christ", minutes: 66 },
  { id: "WjWDkhQvZtM", title: "How To Study The Bible", minutes: 68 },
  { id: "IHoQutb7FHg", title: "The True Worshipper", minutes: 87 },
  { id: "eEQyhPZPpxU", title: "Overcoming Guilt From Sin", minutes: 11 },
  { id: "IRl718MrEOg", title: "How Christians Should Handle Suffering", minutes: 75 },
  { id: "Ql6DuJReaC4", title: "Living According To God", minutes: 82 },
  { id: "cyKzgs5EPeg", title: "How To Enter God's Rest", minutes: 91 },
  { id: "06xvxw5ePKs", title: "The Best Use Of Your Time", minutes: 83 },
  { id: "IW6HGtwJliU", title: "What Makes You A Better Christian", minutes: 39 },
];

export const embedUrl = (id: string, { muted = false, start = 0 } = {}) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1${muted ? "&mute=1" : ""}${start ? `&start=${start}` : ""}`;
export const latestEmbedUrl = (muted = false) =>
  `https://www.youtube-nocookie.com/embed/videoseries?list=${LATEST_UPLOADS}&autoplay=1&playsinline=1&rel=0${muted ? "&mute=1" : ""}`;
export const thumbnailUrl = (id: string) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

export type Announcement = { title: string; detail: string; href?: string };
export const ANNOUNCEMENTS: Announcement[] = [
  { title: "Our new home", detail: "Kharis has acquired the former Spurgeon's College to restore it as a home for advancing the gospel.", href: "https://kharis.org" },
  { title: "Kharis Phase Two", detail: "KP2 — find your local branch and get involved.", href: "https://kharis.org" },
  { title: "Share your testimony", detail: "What has God done for you? Share it with the church family.", href: "https://kharis.org" },
  { title: "Sunday worship", detail: "Join a Kharis branch this Sunday. Times on kharis.org.", href: "https://kharis.org" },
  { title: "Watch online", detail: "New messages from Kharis Church every week on YouTube.", href: KHARIS_CHANNEL.url },
];

/**
 * The Kharis year in Kairos World. Each season changes billboards, the phone
 * widget, a world tint and a seasonal quest. Dates are month/day, inclusive.
 */
export type Season = {
  id: string;
  name: string;
  theme: string;
  verse: string;
  reference: string;
  from: [number, number];
  to: [number, number];
  accent: string;
  sky: string;
  quest: string;
};
export const SEASONS: Season[] = [
  { id: "new-year-fast", name: "January Fast", theme: "Enter the new year with prayer and fasting", verse: "Draw nigh to God, and he will draw nigh to you.", reference: "James 4:8", from: [1, 1], to: [1, 31], accent: "#f2d15b", sky: "#dfe8f2", quest: "Complete a 10-minute prayer session three days in a row" },
  { id: "grace", name: "Season of Grace", theme: "Changing the world with a touch of His grace", verse: "For by grace are ye saved through faith.", reference: "Ephesians 2:8", from: [2, 1], to: [3, 14], accent: "#b58cff", sky: "#e2dcf2", quest: "Share what grace means with two people" },
  { id: "easter", name: "Easter", theme: "He is risen", verse: "He is not here: for he is risen, as he said.", reference: "Matthew 28:6", from: [3, 15], to: [4, 30], accent: "#ffd27a", sky: "#f3e8d6", quest: "Invite a contact to an Easter service" },
  { id: "pentecost", name: "Pentecost", theme: "Power from on high", verse: "But ye shall receive power, after that the Holy Ghost is come upon you.", reference: "Acts 1:8", from: [5, 1], to: [6, 15], accent: "#ff7a4d", sky: "#f6e3d8", quest: "Pray for boldness before every conversation this week" },
  { id: "summer-outreach", name: "Summer Outreach", theme: "Go into all the world", verse: "Go ye into all the world, and preach the gospel to every creature.", reference: "Mark 16:15", from: [6, 16], to: [8, 31], accent: "#5fd0a0", sky: "#d9efe6", quest: "Have five genuine conversations in London" },
  { id: "harvest", name: "Harvest", theme: "The harvest truly is plenteous", verse: "The harvest truly is plenteous, but the labourers are few.", reference: "Matthew 9:37", from: [9, 1], to: [9, 30], accent: "#e5a24a", sky: "#efe3cf", quest: "Follow up with every contact this month" },
  { id: "winter-arc", name: "Q4 Winter Arc", theme: "Build discipline, finish the year strong", verse: "I have fought a good fight, I have finished my course, I have kept the faith.", reference: "2 Timothy 4:7", from: [10, 1], to: [12, 14], accent: "#7ec8ff", sky: "#dde6ef", quest: "Pray, read and follow up every day for a week" },
  { id: "christmas", name: "Christmas", theme: "Unto us a child is born", verse: "For unto us a child is born, unto us a son is given.", reference: "Isaiah 9:6", from: [12, 15], to: [12, 31], accent: "#e6564e", sky: "#e9edf2", quest: "Invite three people to a carol service" },
];

const dayOfYear = (month: number, day: number) => month * 40 + day;
export function seasonFor(date = new Date()): Season {
  const today = dayOfYear(date.getMonth() + 1, date.getDate());
  return (
    SEASONS.find((s) => today >= dayOfYear(...s.from) && today <= dayOfYear(...s.to)) ?? SEASONS[1]
  );
}

/** London billboard spots in world units (x, z) — beside the main roads. */
export const BILLBOARD_SPOTS: [number, number][] = [
  [30, 18.6],
  [56, 18.6],
  [24, 62.4],
  [62, 62.4],
  [44, 36.6],
  [80, 36.6],
];
/** Even boards show sermons; odd boards show announcements. Rotates every 45 s. */
export function billboardContent(index: number, now = Date.now()) {
  const slot = Math.floor(now / 45_000);
  if (index % 2 === 0) {
    const sermon = SERMONS[(slot + index) % SERMONS.length];
    return { kind: "sermon" as const, sermon };
  }
  const announcement = ANNOUNCEMENTS[(slot + index) % ANNOUNCEMENTS.length];
  return { kind: "announcement" as const, announcement };
}
