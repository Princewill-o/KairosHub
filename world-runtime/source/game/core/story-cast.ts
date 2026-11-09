/**
 * Who appears in the LTBS Bible stories and what they wear. Everyone is
 * dressed modestly in ankle-length, period-style clothing; women's heads are
 * covered. Costumes are read by biblical-figure3d.ts.
 */
export interface Costume {
  skin: string;
  hair?: "crop" | "swoop" | "curly" | "afro" | "braids" | "bob" | "puffs" | "long" | "bald";
  hairColor?: string;
  beard?: "short" | "full";
  build?: "standard" | "slim" | "broad";
  robe: string;
  sash?: string;
  trim?: string;
  mantle?: string;
  head?: "veil" | "veil-crown" | "wrap" | "turban" | "tall-hat" | "helmet" | "crown";
  veil?: string;
  armour?: boolean;
  prop?: "staff" | "spear" | "scroll" | "jar" | "sheaf" | "sling" | "basket";
}
export interface Character { name: string; costume: Costume; height?: number }

const GREY = "#d8d5cb";
export const CHARACTERS: Record<string, Character> = {
  // The protagonists you play.
  david: { name: "David", costume: { skin: "#a6734d", hair: "curly", hairColor: "#4e3025", robe: "#c9a06a", sash: "#7a4a2a", trim: "#8a5a3c", prop: "staff" } },
  "david-older": { name: "David", costume: { skin: "#a6734d", hair: "curly", hairColor: "#4e3025", beard: "short", robe: "#8f6a45", sash: "#5a3a22", mantle: "#566c4d", prop: "staff" } },
  ruth: { name: "Ruth", costume: { skin: "#c08b62", hair: "long", robe: "#5d7f7a", sash: "#b8893c", head: "veil", veil: "#e8d9b5", prop: "basket" } },
  esther: { name: "Esther", costume: { skin: "#c08b62", hair: "long", robe: "#6b3fa0", sash: "#e0ab3c", trim: "#e0ab3c", mantle: "#a16bd0", head: "veil-crown", veil: "#f3ead6" } },
  daniel: { name: "Daniel", costume: { skin: "#8a5a3c", hair: "crop", robe: "#e9dfc7", sash: "#284e66", trim: "#284e66", mantle: "#284e66", head: "wrap", veil: "#f1ead8", prop: "scroll" } },
  // David's story.
  jesse: { name: "Jesse", costume: { skin: "#a6734d", hair: "bald", hairColor: GREY, beard: "full", robe: "#8a6a4a", mantle: "#5a4632", head: "wrap", veil: "#e2d6bd", prop: "staff" } },
  shepherd: { name: "Shepherd", costume: { skin: "#8a5a3c", hair: "crop", robe: "#a98a62", sash: "#5a3a22", head: "wrap", veil: "#d9cba9", prop: "staff" } },
  eliab: { name: "Eliab", costume: { skin: "#a6734d", hair: "crop", hairColor: "#4e3025", beard: "short", robe: "#7a5a3a", armour: true, head: "helmet", prop: "spear" } },
  soldier: { name: "Soldier", costume: { skin: "#8a5a3c", hair: "crop", beard: "short", robe: "#6a5a45", armour: true, head: "helmet", prop: "spear" } },
  captain: { name: "Captain", costume: { skin: "#6e4630", hair: "crop", beard: "full", robe: "#7a2a24", armour: true, head: "helmet", prop: "spear" } },
  saul: { name: "King Saul", costume: { skin: "#a6734d", hair: "swoop", hairColor: "#241a18", beard: "full", build: "broad", robe: "#3d4f7a", mantle: "#6b3fa0", trim: "#e0ab3c", head: "crown" }, height: 1.32 },
  goliath: { name: "Goliath", costume: { skin: "#a6734d", hair: "crop", beard: "full", build: "broad", robe: "#4a3d33", armour: true, head: "helmet", prop: "spear" }, height: 2.1 },
  abishai: { name: "Abishai", costume: { skin: "#8a5a3c", hair: "crop", beard: "short", robe: "#566c4d", sash: "#3a2a1a", head: "wrap", veil: "#c9bb98", prop: "spear" } },
  // Ruth's story.
  naomi: { name: "Naomi", costume: { skin: "#a6734d", hair: "long", hairColor: GREY, robe: "#4b4a5e", sash: "#8a6a4a", head: "veil", veil: "#5c5a6e", prop: "staff" } },
  orpah: { name: "Orpah", costume: { skin: "#c08b62", hair: "long", robe: "#a16854", head: "veil", veil: "#e1cba0" } },
  boaz: { name: "Boaz", costume: { skin: "#a6734d", hair: "crop", hairColor: "#4e3025", beard: "full", build: "broad", robe: "#e1cba0", sash: "#8a3a2a", mantle: "#8a3a2a", head: "wrap", veil: "#efe6d2" }, height: 1.24 },
  reaper: { name: "Reaper", costume: { skin: "#8a5a3c", hair: "long", robe: "#b5875a", head: "veil", veil: "#e9dfc7", prop: "sheaf" } },
  overseer: { name: "Overseer", costume: { skin: "#6e4630", hair: "crop", beard: "short", robe: "#8a9b68", head: "wrap", veil: "#e2d6bd", prop: "staff" } },
  villager: { name: "Neighbour", costume: { skin: "#c08b62", hair: "long", robe: "#a44760", head: "veil", veil: "#efe0c8", prop: "jar" } },
  elder: { name: "Town elder", costume: { skin: "#a6734d", hair: "bald", hairColor: GREY, beard: "full", robe: "#334963", mantle: "#7a6a55", head: "wrap", veil: "#e9dfc7", prop: "staff" } },
  // Esther's story.
  mordecai: { name: "Mordecai", costume: { skin: "#a6734d", hair: "crop", hairColor: "#4e3025", beard: "full", robe: "#5a4632", sash: "#2a2420", mantle: "#334963", head: "wrap", veil: "#e2d6bd" } },
  "mordecai-mourning": { name: "Mordecai", costume: { skin: "#a6734d", hair: "crop", hairColor: "#4e3025", beard: "full", robe: "#6a5d4a", sash: "#3a332a", head: "wrap", veil: "#8a7d68" } },
  hathach: { name: "Hathach", costume: { skin: "#6e4630", hair: "bald", robe: "#e9dfc7", sash: "#367c73", head: "turban", veil: "#367c73", prop: "scroll" } },
  hegai: { name: "Hegai", costume: { skin: "#8a5a3c", hair: "bald", robe: "#367c73", sash: "#e0ab3c", head: "turban", veil: "#f1ead8" } },
  attendant: { name: "Attendant", costume: { skin: "#c08b62", hair: "long", robe: "#d58b9e", head: "veil", veil: "#f3ead6", prop: "jar" } },
  xerxes: { name: "King Xerxes", costume: { skin: "#c08b62", hair: "swoop", beard: "full", build: "broad", robe: "#a44760", mantle: "#6b3fa0", trim: "#e0ab3c", head: "crown" }, height: 1.3 },
  haman: { name: "Haman", costume: { skin: "#c08b62", hair: "swoop", beard: "short", robe: "#292c34", mantle: "#783f84", trim: "#b9b3a5", head: "tall-hat", veil: "#783f84" } },
  guard: { name: "Palace guard", costume: { skin: "#8a5a3c", hair: "crop", beard: "short", robe: "#284e66", armour: true, head: "tall-hat", veil: "#284e66", prop: "spear" } },
  // Daniel's story.
  hananiah: { name: "Hananiah", costume: { skin: "#8a5a3c", hair: "curly", robe: "#e9dfc7", sash: "#a44760", head: "wrap", veil: "#efe6d2" } },
  mishael: { name: "Mishael", costume: { skin: "#a6734d", hair: "crop", robe: "#e9dfc7", sash: "#367c73", head: "wrap", veil: "#efe6d2" } },
  azariah: { name: "Azariah", costume: { skin: "#6e4630", hair: "afro", robe: "#e9dfc7", sash: "#e0ab3c", head: "wrap", veil: "#efe6d2" } },
  ashpenaz: { name: "Ashpenaz", costume: { skin: "#c08b62", hair: "bald", beard: "short", robe: "#3d8bd9", sash: "#e0ab3c", mantle: "#284e66", head: "tall-hat", veil: "#3d8bd9" } },
  steward: { name: "The steward", costume: { skin: "#a6734d", hair: "crop", robe: "#8a9b68", sash: "#5a3a22", head: "turban", veil: "#e9dfc7", prop: "basket" } },
  nebuchadnezzar: { name: "King Nebuchadnezzar", costume: { skin: "#c08b62", hair: "long", beard: "full", build: "broad", robe: "#3d8bd9", mantle: "#d89e34", trim: "#e0ab3c", head: "crown" }, height: 1.3 },
  darius: { name: "King Darius", costume: { skin: "#c08b62", hair: "swoop", hairColor: GREY, beard: "full", robe: "#a44760", mantle: "#d89e34", trim: "#e0ab3c", head: "crown" }, height: 1.28 },
  official: { name: "Official", costume: { skin: "#a6734d", hair: "crop", beard: "short", robe: "#6a506f", mantle: "#33313a", head: "tall-hat", veil: "#33313a", prop: "scroll" } },
};

/** The character you play in each story, by chapter. */
export const HEROES: Record<string, string[]> = {
  david: ["david", "david", "david", "david", "david", "david-older"],
  ruth: ["ruth", "ruth", "ruth", "ruth", "ruth", "ruth"],
  esther: ["esther", "esther", "esther", "esther", "esther", "esther"],
  daniel: ["daniel", "daniel", "daniel", "daniel", "daniel", "daniel"],
};
