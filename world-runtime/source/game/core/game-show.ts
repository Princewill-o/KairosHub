/**
 * "Who Wants to Be a Kairos Millionaire": fifteen Bible questions that get
 * harder, a money ladder with two safe havens, and three lifelines.
 */
export interface Q { q: string; options: [string, string, string, string]; answer: number; ref: string }
export const LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
export const SAFE = [4, 9]; // £1,000 and £32,000

/** Questions by difficulty band, easiest first. */
export const BANDS: Q[][] = [
  [
    { q: "Who built the ark?", options: ["Moses", "Noah", "Abraham", "David"], answer: 1, ref: "Genesis 6" },
    { q: "Where was Jesus born?", options: ["Nazareth", "Jerusalem", "Bethlehem", "Capernaum"], answer: 2, ref: "Luke 2:4–7" },
    { q: "Who killed Goliath?", options: ["Saul", "David", "Samson", "Jonathan"], answer: 1, ref: "1 Samuel 17" },
    { q: "How many disciples did Jesus choose?", options: ["Seven", "Ten", "Twelve", "Forty"], answer: 2, ref: "Luke 6:13" },
    { q: "What is the first book of the Bible?", options: ["Exodus", "Genesis", "Matthew", "Psalms"], answer: 1, ref: "Genesis 1:1" },
    { q: "Who was swallowed by a great fish?", options: ["Jonah", "Peter", "Elijah", "Job"], answer: 0, ref: "Jonah 1:17" },
  ],
  [
    { q: "What did Jesus turn water into at Cana?", options: ["Oil", "Milk", "Wine", "Bread"], answer: 2, ref: "John 2:9" },
    { q: "Who led Israel out of Egypt?", options: ["Joshua", "Aaron", "Moses", "Gideon"], answer: 2, ref: "Exodus 12" },
    { q: "Which apostle walked on water towards Jesus?", options: ["John", "Andrew", "Peter", "James"], answer: 2, ref: "Matthew 14:29" },
    { q: "How many days and nights did it rain in the flood?", options: ["Seven", "Twelve", "Forty", "One hundred"], answer: 2, ref: "Genesis 7:12" },
    { q: "Who was the first king of Israel?", options: ["David", "Saul", "Solomon", "Samuel"], answer: 1, ref: "1 Samuel 10" },
    { q: "Which sea did God part for Israel?", options: ["Dead Sea", "Red Sea", "Sea of Galilee", "Mediterranean"], answer: 1, ref: "Exodus 14" },
  ],
  [
    { q: "Who was thrown into a fiery furnace with Shadrach and Meshach?", options: ["Daniel", "Abednego", "Ezra", "Nehemiah"], answer: 1, ref: "Daniel 3" },
    { q: "Which book comes straight after Acts?", options: ["Romans", "Galatians", "James", "Hebrews"], answer: 0, ref: "New Testament order" },
    { q: "Who was Ruth's mother-in-law?", options: ["Naomi", "Hannah", "Leah", "Deborah"], answer: 0, ref: "Ruth 1" },
    { q: "Which prophet was taken to heaven in a whirlwind?", options: ["Elisha", "Isaiah", "Elijah", "Jeremiah"], answer: 2, ref: "2 Kings 2:11" },
    { q: "What was Paul's name before his conversion?", options: ["Simon", "Saul", "Silas", "Stephen"], answer: 1, ref: "Acts 13:9" },
    { q: "Who sold his birthright for a bowl of stew?", options: ["Jacob", "Esau", "Reuben", "Ishmael"], answer: 1, ref: "Genesis 25:33" },
  ],
  [
    { q: "Who was the first Christian martyr?", options: ["James", "Stephen", "Peter", "Philip"], answer: 1, ref: "Acts 7" },
    { q: "Which judge defeated the Midianites with 300 men?", options: ["Samson", "Gideon", "Jephthah", "Ehud"], answer: 1, ref: "Judges 7" },
    { q: "How many books are in the New Testament?", options: ["24", "27", "39", "66"], answer: 1, ref: "Canon" },
    { q: "Who replaced Judas among the twelve?", options: ["Matthias", "Barnabas", "Timothy", "Mark"], answer: 0, ref: "Acts 1:26" },
    { q: "On which island was John when he wrote Revelation?", options: ["Crete", "Cyprus", "Patmos", "Malta"], answer: 2, ref: "Revelation 1:9" },
    { q: "Which king saw writing on the wall?", options: ["Nebuchadnezzar", "Belshazzar", "Darius", "Cyrus"], answer: 1, ref: "Daniel 5" },
  ],
  [
    { q: "Who was the father of John the Baptist?", options: ["Joseph", "Zacharias", "Simeon", "Eli"], answer: 1, ref: "Luke 1:13" },
    { q: "Which prophet married Gomer?", options: ["Amos", "Hosea", "Micah", "Joel"], answer: 1, ref: "Hosea 1:3" },
    { q: "How old was Methuselah when he died?", options: ["777", "930", "969", "950"], answer: 2, ref: "Genesis 5:27" },
    { q: "Who was the left-handed judge who killed King Eglon?", options: ["Ehud", "Othniel", "Shamgar", "Tola"], answer: 0, ref: "Judges 3:21" },
    { q: "What is the shortest verse in the KJV Bible?", options: ["“Pray without ceasing.”", "“Jesus wept.”", "“Rejoice evermore.”", "“God is love.”"], answer: 1, ref: "John 11:35" },
    { q: "Which tribe of Israel did Paul belong to?", options: ["Judah", "Levi", "Benjamin", "Ephraim"], answer: 2, ref: "Philippians 3:5" },
  ],
];

/** Fifteen questions: three from each band, easiest first. */
export function buildGame(r = Math.random): Q[] {
  return BANDS.flatMap((band) => [...band].sort(() => r() - 0.5).slice(0, 3));
}
/** What you walk away with: safe haven if you're wrong, current level if you walk. */
export function prizeFor(level: number, outcome: "wrong" | "walk" | "won"): number {
  if (outcome === "won") return LADDER[14];
  if (outcome === "walk") return level > 0 ? LADDER[level - 1] : 0;
  const safe = SAFE.filter((s) => s < level).pop();
  return safe == null ? 0 : LADDER[safe];
}
/** 50:50 removes two wrong answers. */
export function fiftyFifty(q: Q, r = Math.random): number[] {
  const wrong = [0, 1, 2, 3].filter((i) => i !== q.answer).sort(() => r() - 0.5);
  return wrong.slice(0, 2);
}
/** The audience gets less sure as the questions get harder. */
export function askAudience(q: Q, level: number, r = Math.random): number[] {
  const sure = Math.max(0.3, 0.85 - level * 0.04);
  const right = level < 5 || r() < 0.85 ? q.answer : Math.floor(r() * 4);
  const votes = [0, 1, 2, 3].map((i) => (i === right ? sure * 100 : r() * (1 - sure) * 100));
  const total = votes.reduce((a, b) => a + b, 0);
  return votes.map((v) => Math.round((v / total) * 100));
}
export const money = (n: number) => `£${n.toLocaleString("en-GB")}`;
