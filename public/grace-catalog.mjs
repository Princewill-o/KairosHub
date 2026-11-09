// One catalogue drives the real buildings, Grace directory and world atlas.
export const graceGames = [
  ["trivia", "Trivia House"],
  ["quiz", "Quiz Arena"],
  ["word-search", "Word Garden"],
  ["crossword", "Crossword Workshop"],
  ["charades", "Charades Stage"],
  ["memory", "Memory Gallery"],
  ["verse", "Verse Observatory"],
  ["jeopardy", "Jeopardy Hall"],
  ["pictionary", "Drawing Studio"],
  ["hangman", "Letter Lodge"],
  ["bingo", "Bingo Pavilion"],
  ["scavenger", "Scripture Expedition"],
  ["character", "Character Archives"],
  ["ordering", "Story Timeline"],
  ["map", "Bible Atlas"],
  ["escape", "Escape Library"],
].map(([id, name]) => ({ id, name, route: `bible/${id}` }));
export const gameBuildings = graceGames.map((g, i) => ({
  ...g,
  game: g.id,
  x: [4, 11, 37, 44][i % 4],
  y: [4, 11, 18, 27][Math.floor(i / 4)],
  w: 4,
  h: 3,
  mapId: "scripture-island",
  colour: ["#8c68b6", "#c19148", "#598e78", "#638ba6"][i % 4],
}));
export const graceIslands = [
  {
    id: "city",
    name: "London Square",
    station: "london-square",
    x: 112,
    y: 150,
    colour: "#bba8df",
    description: "Streets, traffic, Grace Game Hall and the Social House",
  },
  {
    id: "woodland",
    name: "Kharis Forest",
    station: "kharis-church",
    x: 440,
    y: 118,
    colour: "#83ad72",
    description: "The woodland trail and Kharis Church",
  },
  {
    id: "scripture-island",
    name: "LTBS",
    station: "scripture-gardens",
    x: 278,
    y: 315,
    colour: "#e1bd63",
    description: "Sixteen game buildings and Bible story adventures",
  },
  {
    id: "fellowship-island",
    name: "Fellowship Quay",
    station: "fellowship-quay",
    x: 605,
    y: 305,
    colour: "#8cb7c8",
    description: "Social lodge, conversations and games together",
  },
  {
    id: "orchard-island",
    name: "Orchard Retreat",
    station: "orchard-retreat",
    x: 643,
    y: 115,
    colour: "#bfcb77",
    description: "Prayer walks and gathering circles",
  },
];
export const gracePlaces = [
  ...gameBuildings.map((g) => ({
    ...g,
    id: "game-" + g.id,
    x: g.x + g.w / 2,
    y: g.y + g.h + 1,
  })),
  {
    id: "social-house",
    name: "Social House",
    mapId: "city",
    x: 9.5,
    y: 41,
    route: "social",
  },
  {
    id: "grace-hall",
    name: "Grace Game Hall",
    mapId: "city",
    x: 20.5,
    y: 9,
    route: "bible",
  },
  {
    id: "message-theatre",
    name: "PlayMessages Theatre",
    mapId: "scripture-island",
    x: 26,
    y: 13,
    route: "messages",
  },
  {
    id: "fellowship-lodge",
    name: "Fellowship Lodge",
    mapId: "fellowship-island",
    x: 25,
    y: 16,
    route: "social",
  },
  {
    id: "church",
    name: "Kharis Church",
    mapId: "woodland",
    x: 26,
    y: 18,
    route: "scripture",
  },
];
export const graceStories = [
  {
    id: "david",
    name: "David",
    theme: "Courage, calling and a shepherd’s heart",
  },
  { id: "ruth", name: "Ruth", theme: "Loyalty, kindness and a new beginning" },
  { id: "esther", name: "Esther", theme: "Wisdom and courage for such a time" },
  {
    id: "daniel",
    name: "Daniel",
    theme: "Faithfulness when the pressure rises",
  },
];
export const graceChallenges = [
  ["neighbour", "The Neighbour Test"],
  ["fruit", "Fruit of the Spirit"],
  ["armour", "Armour Workshop"],
  ["timeline", "The Exodus Trail"],
  ["verse", "Psalm Path"],
  ["said", "Who Said It?"],
  ["wisdom", "The Wise Builder"],
  ["journey", "Journeys & Places"],
  ["mercy", "Mercy in Motion"],
  ["gospels", "Gospel Explorer"],
  ["prayer", "Prayer Garden"],
  ["lost", "Lost & Found"],
].map(([id, title]) => ({ id, title }));
export function graceRoute(value) {
  const route = String(value || "home").replace(/^#/, "");
  return /^(home|social|atlas|adventures|scripture|character|journey|help|bible(?:\/(?:trivia|quiz|word-search|crossword|charades|memory|verse|jeopardy|pictionary|hangman|bingo|scavenger|character|ordering|map|escape))?|messages(?:\/[a-z-]+)?)$/.test(
    route,
  )
    ? route
    : "home";
}
