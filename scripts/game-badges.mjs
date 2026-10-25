// Original SVG game emblems. Supplied icon packs remain unchanged.
import { mkdir, writeFile } from "node:fs/promises";
const grid = (x, y, size, filled = []) =>
  Array.from(
    { length: 9 },
    (_, i) =>
      `<rect x="${x + (i % 3) * size}" y="${y + Math.floor(i / 3) * size}" width="${size - 3}" height="${size - 3}" rx="4" fill="${filled.includes(i) ? "#f5b83d" : "#fffaf0"}" stroke-width="2.5"/>`,
  ).join("");
const star = (x, y, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="m0-15 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#f5b83d"/>`;
const spark =
  '<path d="M36 50v12m-6-6h12m101 62v12m-6-6h12" stroke="#fffaf0" stroke-width="4"/>';
const book =
  '<path d="M45 70q21-8 43 3v52q-24-13-43-3Zm43 3q22-11 45-3v52q-23-10-45 3Z" fill="#fffaf0"/><path d="M56 83h21m-21 11h21m22-11h22m-22 11h22" stroke="#b7a0d2" stroke-width="3"/>';
const badges = {
  trivia: {
    color: "#ceb7f3",
    art: `${book}<path d="M93 34h37q11 0 11 11v18q0 10-11 10h-10l-13 12V73H93q-9 0-9-10V45q0-11 9-11Z" fill="#6b3fa0"/><path d="M105 47q2-8 10-5 11 5-2 12v4m0 7v1" fill="none" stroke="#fffaf0" stroke-width="5"/>`,
  },
  quiz: {
    color: "#ffe1a0",
    art: `<path d="M43 113h28v27H43Zm28-18h29v45H71Zm29-18h30v63h-30Z" fill="#ac8cd3"/><path d="M62 37h54v24q0 26-27 29-27-3-27-29Zm0 9H45q0 30 23 29m48-29h17q0 30-23 29M89 90v17m-16 1h32" fill="#f5b83d"/>${star(89, 57, 0.7)}`,
  },
  "word-search": {
    color: "#aee1c3",
    art: `${grid(45, 42, 31, [0, 4, 8])}<path d="m60 57 62 62" stroke="#62b4a1" stroke-width="17" opacity=".5"/><g fill="#2e1a47" stroke="none" font-family="sans-serif" font-weight="900" font-size="17"><text x="53" y="63">J</text><text x="84" y="94">O</text><text x="115" y="125">Y</text><text x="83" y="63">A</text><text x="115" y="94">M</text><text x="53" y="125">N</text></g>`,
  },
  crossword: {
    color: "#b9ddf5",
    art: `${grid(43, 43, 32, [0, 5, 6])}<path d="m90 119 42-46 13 12-44 44-17 5Z" fill="#f5b83d"/><path d="m132 73 8-8q5-5 10 0l3 3q5 5 0 10l-8 7" fill="#e68f9e"/><path d="m90 119-6 15 17-5Z" fill="#fffaf0"/>`,
  },
  charades: {
    color: "#ffd0ad",
    art: `<path d="M37 52q25-13 57 0v39q-6 29-28 31-25-8-29-31Z" fill="#fffaf0"/><path d="M86 70q27-14 56 0v36q-6 28-28 31-24-7-28-31Z" fill="#9a77c8"/><path d="m49 72 12-2m14 0 10 2m-30 19q10 13 21 0m24 0 9 3m13 0 9-3m-31 24q11-12 23 0" fill="none"/>`,
  },
  memory: {
    color: "#cbb8ee",
    art: `<rect x="36" y="48" width="58" height="82" rx="10" fill="#6b3fa0" transform="rotate(-12 65 89)"/><path d="m59 66 14 11-10 29-14-11Z" fill="#f5b83d"/><rect x="91" y="44" width="56" height="82" rx="10" fill="#fffaf0" transform="rotate(12 119 85)"/><path d="M109 72q0-11 10-6 10-5 10 6 0 10-10 17-10-7-10-17Z" fill="#e58ba7"/>${star(89, 136, 0.6)}`,
  },
  verse: {
    color: "#b9ddf5",
    art: `<path d="M52 44h74v81q-3 17-19 13H44q18-4 13-20V57H42q-4-13 10-13Z" fill="#fffaf0"/><path d="M126 44q17 0 14 18h-14M63 119h49q-4 18 13 18" fill="#f5b83d"/><path d="M76 65q0-9 10-5 10-4 10 5 0 9-10 15-10-6-10-15Z" fill="#e58ba7"/><path d="M73 91h37m-37 12h28" stroke="#9a77c8"/>`,
  },
  jeopardy: {
    color: "#ffdfa0",
    art: `<rect x="36" y="57" width="108" height="78" rx="9" fill="#6b3fa0"/>${grid(48, 70, 29, [1, 3, 8])}<path d="m65 47-5-20 20 11 10-20 11 20 20-11-6 20Z" fill="#f5b83d"/>`,
  },
  pictionary: {
    color: "#b4e2c6",
    art: `<path d="m70 121-14 24m53-24 14 24m-33-24v24" fill="none"/><rect x="45" y="40" width="87" height="83" rx="8" fill="#fffaf0"/><path d="m57 104 19-23 15 13 15-23 14 33Z" fill="#8fcab0"/><circle cx="69" cy="62" r="8" fill="#f5b83d"/><path d="m112 82 28-47 10 6-29 47-14 9Z" fill="#f5b83d"/><path d="m112 82-5 15q17 3 14-9" fill="#9a77c8"/>`,
  },
  hangman: {
    color: "#ffd0b2",
    art: `<rect x="38" y="55" width="104" height="77" rx="13" fill="#fffaf0"/><path d="M51 114h18m9 0h18m9 0h20"/><g fill="#6b3fa0" stroke="none" font-family="sans-serif" font-weight="900" font-size="31"><text x="49" y="99">N</text><text x="79" y="99">O</text><text x="108" y="99">?</text></g><path d="M61 39q0-10 10-6 10-4 10 6 0 9-10 16-10-7-10-16Zm37 0q0-10 10-6 10-4 10 6 0 9-10 16-10-7-10-16Z" fill="#df86a4"/>`,
  },
  bingo: {
    color: "#b7dff7",
    art: `<rect x="41" y="36" width="98" height="111" rx="12" fill="#fffaf0"/><path d="M42 61h96"/><path d="M60 48h60" stroke="#6b3fa0" stroke-width="7"/>${grid(50, 71, 28, [0, 4, 8])}${star(62, 82, 0.55)}${star(90, 110, 0.55)}${star(118, 138, 0.55)}`,
  },
  scavenger: {
    color: "#ffe0a2",
    art: `<path d="m34 60 37-14 36 12 37-14v82l-37 14-36-12-37 14Z" fill="#fffaf0"/><path d="M71 46v82m36-70v82" stroke="#d0bbdf"/><path d="M48 116q15-52 48-16" stroke="#6b3fa0" stroke-dasharray="4 6" fill="none"/><circle cx="119" cy="65" r="27" fill="#f5b83d"/><path d="m112 46 16 26-25 6Z" fill="#6b3fa0"/><circle cx="116" cy="65" r="3" fill="#fffaf0"/>`,
  },
  character: {
    color: "#d5bcf5",
    art: `<rect x="40" y="38" width="86" height="109" rx="14" fill="#fffaf0"/><circle cx="82" cy="72" r="17" fill="#bd94de"/><path d="M54 120v-7q2-23 28-23t28 23v7Z" fill="#6b3fa0"/><circle cx="119" cy="106" r="23" fill="#b7dff7" fill-opacity=".9"/><path d="m136 123 16 18" stroke-width="12"/><path d="M113 101q0-8 8-6 8 4-1 9m0 7v1" fill="none"/>`,
  },
  ordering: {
    color: "#b8e3c4",
    art: `<path d="M45 105q2 25 30 23t28-33 30-25" stroke="#6b3fa0" stroke-dasharray="5 7" fill="none"/><rect x="30" y="41" width="42" height="54" rx="8" fill="#fffaf0"/><rect x="70" y="78" width="42" height="54" rx="8" fill="#f5b83d"/><rect x="112" y="37" width="42" height="54" rx="8" fill="#fffaf0"/><g fill="#6b3fa0" stroke="none" font-family="sans-serif" font-weight="900" font-size="30"><text x="42" y="78">1</text><text x="82" y="115">2</text><text x="124" y="74">3</text></g>`,
  },
  map: {
    color: "#b7dff7",
    art: `<path d="m32 67 39-16 36 14 39-16v80l-39 14-36-14-39 16Z" fill="#fffaf0"/><path d="m71 51 0 78m36-64v78" stroke="#cfbbdf"/><path d="m35 88 24-11 23 21 22-10 38 18" fill="none" stroke="#79b8d7" stroke-width="9"/><path d="M114 53c0-33-46-33-46 0 0 18 23 38 23 38s23-20 23-38Z" fill="#6b3fa0"/><circle cx="91" cy="52" r="9" fill="#f5b83d"/>`,
  },
  escape: {
    color: "#ffd2b3",
    art: `<path d="M44 140V65q0-37 43-37t43 37v75Z" fill="#6b3fa0"/><path d="M57 140V66q0-25 30-25t30 25v74Z" fill="#ac8ad0"/><path d="M66 140V66q0-18 21-18v92Z" fill="#fff0bc"/><circle cx="105" cy="95" r="4" fill="#f5b83d"/><circle cx="130" cy="116" r="15" fill="#f5b83d"/><path d="m119 127-23 23m4-14 8 8" stroke="#f5b83d" stroke-width="9"/>`,
  },
};
await mkdir("public/assets/games", { recursive: true });
for (const [id, { color, art }] of Object.entries(badges))
  await writeFile(
    `public/assets/games/${id}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="${color}"/></linearGradient></defs><rect x="12" y="17" width="156" height="156" rx="43" fill="#2e1a47"/><rect x="12" y="9" width="156" height="156" rx="43" fill="url(#bg)" stroke="#2e1a47" stroke-width="4"/><circle cx="90" cy="85" r="62" fill="${color}" opacity=".45"/><g stroke="#2e1a47" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${spark}${art}</g></svg>\n`,
  );
console.log("Created 16 original game badges.");
