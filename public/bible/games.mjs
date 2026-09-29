import {
  bibleGames,
  questions,
  verses,
  wordSets,
  crossword,
  prompts,
  characters,
  stories,
  hunts,
  locations,
  escapeRooms,
} from "./content.mjs";
import {
  bibleAnswer,
  bibleShuffle as shuffle,
  bibleWordLine,
  bibleWordGrid,
  bibleCrossword,
  bibleBingo,
} from "../learning-engine.mjs";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const button = (label, action, extra = "") =>
  `<button type="button" data-do="${action}" ${extra}>${label}</button>`;
const gameLogo = (id) =>
  `<svg class="game-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${{ trivia: "M12 3a9 9 0 1 0 9 9", quiz: "M4 5h16v14H4z", "word-search": "M4 4h16v16H4z", crossword: "M4 4h16v16H4z", charades: "M5 20V8l7-5 7 5v12", memory: "M4 5h7v7H4z", verse: "M5 4h14v16H5z", jeopardy: "M4 5h16v14H4z", pictionary: "m5 19 2-7L16 3l5 5-9 9z", hangman: "M5 20V4h10", bingo: "M4 4h16v16H4z", scavenger: "m4 5 8-2 8 2v14l-8 2-8-2z", character: "M5 21a7 7 0 0 1 14 0", ordering: "M7 6h12M7 12h12M7 18h12", map: "m4 6 6-2 4 2 6-2v14l-6 2-4-2-6 2z", escape: "M7 4h10v16H7z" }[id] || "M12 3a9 9 0 1 0 9 9"}/><path d="${{ trivia: "M12 7v5l3 2M12 19v.01", quiz: "M8 9h8M8 13h5M16 16l2 2 3-4", "word-search": "m7 7 10 10M17 7 7 17", crossword: "M4 10h16M10 4v16", charades: "M9 13h6M9 16h4", memory: "M11 9l2 2m0-2-2 2", verse: "M8 8h8M8 12h8M8 16h5", jeopardy: "M8 9h8M8 13h5", pictionary: "M14 5l5 5", hangman: "M16 10v6m0 0-3 4m3-4 3 4", bingo: "M4 10h16M10 4v16", scavenger: "M12 3v16M4 5l8 2 8-2", character: "M12 8v.01", ordering: "M5 6v.01M5 12v.01M5 18v.01", map: "M10 4v14M14 6v14", escape: "M12 4V2" }[id] || "M12 7v5l3 2"}/></svg>`;
const note = (ref) => `<p class="bible-reference">Read: ${esc(ref)}</p>`;
const heading = (small, title) =>
  `<p class="bible-kicker">${small}</p><h2>${esc(title)}</h2>`;
const answerForm = () =>
  `<form id="answer-form"><label for="bible-answer">Your answer</label><div class="bible-answer-row"><input id="bible-answer" name="answer" autocomplete="off" maxlength="80" required><button>Check answer</button></div></form>`;
const options = (items) =>
  `<div class="bible-options">${items.map((v, i) => button(esc(v), "answer", `data-value="${esc(v)}"`)).join("")}</div>`;

export function mountBible(root, id = "") {
  let dead = false,
    paused = false,
    done = false,
    clock = 0,
    last = performance.now(),
    tick = null,
    cleanup = () => {},
    tasks = [],
    feedbackText = "";
  let progress = {};
  try {
    progress =
      JSON.parse(localStorage.getItem("kairos-bible-v1") || "{}") || {};
    if (typeof progress !== "object" || Array.isArray(progress)) progress = {};
  } catch {}
  const game = bibleGames.find((g) => g.id === id);
  function library() {
    root.innerHTML = `<section class="bible-library"><div class="bible-library-hero"><div><p class="bible-kicker">THE BIBLE GAME COLLECTION</p><h1>A little wonder.<br>A world to discover.</h1><p>Sixteen ways to explore Scripture. A quiet puzzle, a new discovery, or a game with your favourite people.</p><a href="#bible/quiz" class="bible-feature-link">Start with Bible Quiz <span aria-hidden="true">→</span></a></div><img src="/assets/icons/Books.png" alt="" class="bible-hero-book"></div><div class="bible-library-toolbar"><label class="bible-search">Find your next game<input id="bible-search" type="search" placeholder="Search games…"></label><div class="bible-filters" aria-label="Game category">${["All", "Knowledge", "Puzzles", "Together", "Explore"].map((v, i) => button(v, "filter", `aria-pressed="${i === 0}" data-category="${v}"`).replace(">", ' aria-label="Filter games by ' + v + '">')).join("")}</div></div><div id="bible-grid" class="bible-game-grid"></div><p class="bible-small">Original questions and summaries · Scripture excerpts labelled KJV · Progress stays on this device.</p></section>`;
    let category = "All";
    const draw = () => {
      const query = root.querySelector("#bible-search").value.toLowerCase();
      const selected = bibleGames.filter(
        (g) =>
          (category === "All" || g.category === category) &&
          [g.title, g.description].join(" ").toLowerCase().includes(query),
      );
      root.querySelector("#bible-grid").innerHTML = selected.length
        ? selected
            .map(
              (g) =>
                `<a class="bible-game-card" href="#bible/${g.id}" style="--game-tint:${g.color}"><div class="bible-card-art"><span>${esc(g.category)}</span>${gameLogo(g.id)}<b aria-hidden="true">${String(bibleGames.indexOf(g) + 1).padStart(2, "0")}</b></div><div class="bible-card-copy"><small>${esc(g.tag)}</small><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><div><span>${g.category === "Together" ? "2+ · pass & play" : "Solo · touch & keyboard"}</span><strong aria-hidden="true">↗</strong></div>${progress[g.id]?.runs ? `<small>Played ${Number(progress[g.id].runs) || 0} · Best ${Number(progress[g.id].best) || 0}%</small>` : ""}</div></a>`,
            )
            .join("")
        : '<p role="status">No games match. Try another word or category.</p>';
    };
    root.querySelector("#bible-search").oninput = draw;
    root.querySelectorAll("[data-category]").forEach(
      (b) =>
        (b.onclick = () => {
          category = b.dataset.category;
          root
            .querySelectorAll("[data-category]")
            .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          draw();
        }),
    );
    draw();
  }
  function start() {
    cleanup();
    done = false;
    paused = false;
    clock = 0;
    tasks = [];
    tick = null;
    feedbackText = "";
    last = performance.now();
    root.innerHTML = `<section class="bible-session"><header class="bible-session-top"><a href="#bible">← Collection</a><span>${esc(game.title)}</span><button id="bible-pause" type="button">Pause</button></header><div class="bible-session-meta"><span>${esc(game.tag)}</span><span id="bible-time">0:00</span></div><div class="bible-stage-wrap"><div id="bible-stage"></div><div id="bible-pause-overlay" hidden><h2>Take a moment.</h2><p>Your game is paused.</p><button id="bible-resume">Keep playing</button></div></div><p id="bible-feedback" role="status" aria-live="polite"></p><p class="bible-small">${game.category === "Together" ? "Play together on this device. Your group marks guesses correct." : "Take your time. Every answer is a chance to learn."}</p></section>`;
    const toggle = () => {
      paused = !paused;
      root.querySelector("#bible-stage").inert = paused;
      root.querySelector("#bible-pause-overlay").hidden = !paused;
      root.querySelector("#bible-pause").textContent = paused
        ? "Resume"
        : "Pause";
    };
    root.querySelector("#bible-pause").onclick = toggle;
    root.querySelector("#bible-resume").onclick = toggle;
    const c = {
      get paused() {
        return paused || dead || done || document.hidden;
      },
      stage: () => root.querySelector("#bible-stage"),
      view(html) {
        if (dead || done) return;
        c.stage().innerHTML = html;
      },
      on(action, fn) {
        c.stage()
          .querySelectorAll(`[data-do="${action}"]`)
          .forEach((b) => (b.onclick = () => fn(b)));
      },
      say(text) {
        feedbackText = text;
        const el = root.querySelector("#bible-feedback");
        if (el) el.textContent = text;
      },
      after(seconds, fn) {
        tasks.push({ at: clock + seconds, fn });
      },
      timer(fn) {
        tick = fn;
      },
      end(score, text) {
        if (done || dead) return;
        done = true;
        tick = null;
        tasks = [];
        cleanup();
        const best = Math.max(0, Math.min(100, Math.round(score)));
        let saved = true;
        const prev = progress[id] || {};
        progress[id] = {
          runs: (Number(prev.runs) || 0) + 1,
          best: Math.max(Number(prev.best) || 0, best),
        };
        try {
          localStorage.setItem("kairos-bible-v1", JSON.stringify(progress));
        } catch {
          saved = false;
        }
        root.innerHTML = `<section class="bible-results"><img src="/assets/icons/Star.png" alt=""><p class="bible-kicker">SESSION COMPLETE</p><h1>${esc(game.title)}</h1><p>${esc(text)}</p><strong class="bible-result-score">${best}<small>%</small></strong><p>${saved ? "Saved on this device." : "Storage unavailable; this result lasts for this visit."}</p><div>${button("Play again", "again")}<a href="#bible">Choose another game</a></div></section>`;
        root.querySelector('[data-do="again"]').onclick = start;
        root.querySelector("h1").tabIndex = -1;
        root.querySelector("h1").focus();
      },
    };
    cleanup = implementations[id](c) || (() => {});
  }
  if (!game) library();
  else {
    root.innerHTML = `<section class="bible-welcome" style="--game-tint:${game.color}"><a href="#bible">← Collection</a><div class="bible-welcome-art">${gameLogo(game.id)}</div><p class="bible-kicker">${esc(game.category)}</p><h1>${esc(game.title)}</h1><p>${esc(game.description)}</p><p class="bible-small">${game.category === "Together" ? "Gather two or more people. One person acts or draws; the others guess." : "Touch, mouse and keyboard friendly. Pause whenever you need."}</p><button id="bible-start">Let’s play</button>${id === "escape" ? '<p class="bible-small">A fictional archive adventure, not a biblical event.</p>' : ""}</section>`;
    root.querySelector("#bible-start").onclick = start;
  }
  const interval = setInterval(() => {
    const now = performance.now(),
      dt = Math.min(0.3, (now - last) / 1000);
    last = now;
    if (
      !game ||
      paused ||
      done ||
      dead ||
      document.hidden ||
      !root.querySelector("#bible-time") ||
      document.querySelector("#site-intro")
    )
      return;
    clock += dt;
    root.querySelector("#bible-time").textContent =
      `${Math.floor(clock / 60)}:${String(Math.floor(clock % 60)).padStart(2, "0")}`;
    const ready = tasks.filter((t) => t.at <= clock);
    tasks = tasks.filter((t) => t.at > clock);
    for (const t of ready) t.fn();
    tick?.(dt);
  }, 100);
  return {
    dispose() {
      dead = true;
      clearInterval(interval);
      cleanup();
      tasks = [];
    },
  };
}

function quizGame(c, kind) {
  let deck =
      kind === "quiz"
        ? [1, 2, 3].flatMap((level) =>
            shuffle(questions.filter((q) => q.level === level)).slice(0, 3),
          )
        : shuffle(questions).slice(0, 8),
    index = 0,
    score = 0;
  if (kind === "verse")
    deck = shuffle(verses)
      .slice(0, 6)
      .map((v) => ({
        prompt: "Which verse is this?",
        excerpt: v.excerpt,
        answer: v.ref,
        options: shuffle([
          v.ref,
          ...shuffle(verses.filter((x) => x !== v))
            .slice(0, 3)
            .map((x) => x.ref),
        ]),
        ref: v.ref,
      }));
  function draw() {
    const q = deck[index];
    let locked = false;
    c.view(
      heading(
        `${index + 1} OF ${deck.length}${kind === "quiz" ? " · LEVEL " + q.level : ""}`,
        q.prompt,
      ) +
        (q.excerpt
          ? `<blockquote>${esc(q.excerpt)}<cite>KJV</cite></blockquote>`
          : "") +
        (kind === "trivia" ? answerForm() : options(shuffle(q.options))) +
        `<div id="bible-next"></div>`,
    );
    c.say("");
    function check(value) {
      if (locked) return;
      locked = true;
      const correct = bibleAnswer(value, q.answer);
      if (correct) score++;
      c.say(
        `${correct ? "Correct." : "The answer is " + q.answer + "."} Read ${q.ref}.`,
      );
      c.stage()
        .querySelectorAll("input,button")
        .forEach((b) => (b.disabled = true));
      c.stage().querySelector("#bible-next").innerHTML = button(
        index === deck.length - 1 ? "See results" : "Next question",
        "next",
      );
      c.on("next", () => {
        if (++index === deck.length)
          c.end(
            (score / deck.length) * 100,
            `${score} of ${deck.length} answers correct.`,
          );
        else draw();
      });
    }
    if (kind === "trivia")
      c.stage().querySelector("form").onsubmit = (e) => {
        e.preventDefault();
        check(new FormData(e.currentTarget).get("answer"));
      };
    else c.on("answer", (b) => check(b.dataset.value));
  }
  draw();
}
function wordSearch(c) {
  const words = shuffle(wordSets)[0],
    { grid, paths } = bibleWordGrid(words),
    found = new Set();
  let first = null;
  c.view(
    heading("HIDDEN IN THE LETTERS", "Find six words") +
      "<p>Tap the first letter, then the last. Words can run backwards or diagonally.</p>" +
      `<div class="bible-word-list">${words.map((w) => `<span data-word="${w}">${w}</span>`).join("")}</div><div class="bible-word-grid">${grid
        .flat()
        .map((v, i) =>
          button(
            v,
            "letter",
            `data-cell="${i}" aria-label="Row ${Math.floor(i / 10) + 1}, column ${(i % 10) + 1}: ${v}"`,
          ),
        )
        .join("")}</div>`,
  );
  c.on("letter", (b) => {
    const index = Number(b.dataset.cell);
    if (first === null) {
      first = index;
      b.classList.add("selected");
      c.say("Now select the last letter.");
      return;
    }
    const line = bibleWordLine(grid, first, index),
      word = words.find(
        (w) => w === line || w === [...line].reverse().join(""),
      );
    const start = first;
    first = null;
    c.stage()
      .querySelectorAll(".selected")
      .forEach((x) => x.classList.remove("selected"));
    if (!word || found.has(word)) {
      c.say(
        word
          ? "You already found that word."
          : "That is not one of these words. Try again.",
      );
      return;
    }
    found.add(word);
    c.stage().querySelector(`[data-word="${word}"]`).classList.add("found");
    const dr = Math.sign(Math.floor(index / 10) - Math.floor(start / 10)),
      dc = Math.sign((index % 10) - (start % 10));
    for (let i = 0; i < word.length; i++)
      c.stage()
        .querySelector(`[data-cell="${start + i * (dr * 10 + dc)}"]`)
        .classList.add("found");
    c.say(`${word} found. ${found.size} of ${words.length}.`);
    if (found.size === words.length)
      c.after(0.6, () => c.end(100, "Every word discovered."));
  });
}
function crosswordGame(c) {
  const board = bibleCrossword(crossword);
  c.view(
    heading("ACROSS & DOWN", "The connected crossword") +
      "<p>Choose a clue, then type letters into the highlighted squares. Shared letters belong to both answers.</p>" +
      `<div class="bible-cross-grid">${board.flatMap((row, r) => row.map((letter, col) => (letter ? `<label class="cross-cell"><span>${crossword.find((e) => e.row === r && e.col === col)?.number || ""}</span><input data-r="${r}" data-col="${col}" aria-label="Row ${r + 1}, column ${col + 1}" maxlength="1" autocomplete="off" autocapitalize="characters"></label>` : '<span class="cross-block"></span>'))).join("")}</div><div class="bible-clues">${crossword.map((e, i) => button(`${e.number} ${e.dir}: ${esc(e.clue)} (${e.word.length})`, "clue", `data-entry="${i}"`)).join("")}</div>${button("Check crossword", "check")}`,
  );
  let selected = crossword[0];
  const cells = (e) =>
    [...e.word].map((_, i) =>
      c
        .stage()
        .querySelector(
          `input[data-r="${e.row + (e.dir === "down" ? i : 0)}"][data-col="${e.col + (e.dir === "across" ? i : 0)}"]`,
        ),
    );
  c.on("clue", (b) => {
    selected = crossword[Number(b.dataset.entry)];
    c.stage()
      .querySelectorAll("input")
      .forEach((x) => x.classList.remove("selected"));
    cells(selected).forEach((x) => x.classList.add("selected"));
    cells(selected)[0].focus();
    c.say(selected.ref);
  });
  c.stage()
    .querySelectorAll("input")
    .forEach((input) => {
      input.oninput = () => {
        input.value = input.value
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .slice(-1);
        const group = cells(selected),
          i = group.indexOf(input);
        if (input.value && i >= 0 && i < group.length - 1) group[i + 1].focus();
      };
    });
  c.on("check", () => {
    let count = 0,
      total = 0;
    c.stage()
      .querySelectorAll("input")
      .forEach((input) => {
        total++;
        const correct =
          input.value.toUpperCase() ===
          board[Number(input.dataset.r)][Number(input.dataset.col)];
        if (correct) count++;
        input.setAttribute("aria-invalid", String(!correct));
      });
    if (count === total) c.end(100, "All six clues solved.");
    else
      c.say(
        `${count} of ${total} letters are correct. Review the marked squares and try again.`,
      );
  });
}
function memory(c) {
  const labels = shuffle([
      "Noah",
      "Ruth",
      "David",
      "Mary",
      "Moses",
      "Esther",
      "Jonah",
      "Daniel",
    ]).slice(0, 6),
    deck = shuffle(labels.flatMap((name) => [name, name]));
  let open = [],
    matched = new Set(),
    moves = 0,
    locked = false;
  c.view(
    heading("LOOK CLOSELY", "Find the matching names") +
      `<p id="memory-moves">0 turns · 0 of 6 pairs</p><div class="bible-memory">${deck.map((_, i) => button('<span aria-hidden="true">?</span>', "card", `data-index="${i}" aria-label="Card ${i + 1}, face down"`)).join("")}</div>`,
  );
  c.on("card", (b) => {
    const i = Number(b.dataset.index);
    if (locked || matched.has(i) || open.includes(i)) return;
    open.push(i);
    b.textContent = deck[i];
    b.setAttribute("aria-label", deck[i]);
    if (open.length !== 2) return;
    moves++;
    if (deck[open[0]] === deck[open[1]]) {
      open.forEach((index) => {
        matched.add(index);
        const el = c.stage().querySelector(`[data-index="${index}"]`);
        el.classList.add("found");
        el.disabled = true;
      });
      open = [];
      c.say("A matching pair!");
      if (matched.size === 12)
        c.after(0.5, () =>
          c.end(
            Math.max(25, 100 - (moves - 6) * 4),
            `All six pairs found in ${moves} turns.`,
          ),
        );
    } else {
      locked = true;
      c.say("Not a pair. Remember their positions.");
      c.after(1, () => {
        open.forEach((index) => {
          const el = c.stage().querySelector(`[data-index="${index}"]`);
          el.textContent = "?";
          el.setAttribute("aria-label", `Card ${index + 1}, face down`);
        });
        open = [];
        locked = false;
      });
    }
    c.stage().querySelector("#memory-moves").textContent =
      `${moves} turns · ${matched.size / 2} of 6 pairs`;
  });
}
function jeopardy(c) {
  const categories = ["People", "Places", "Books"],
    deck = categories.flatMap((category) =>
      [1, 2, 3].map(
        (level) =>
          shuffle(
            questions.filter(
              (q) => q.category === category && q.level === level,
            ),
          )[0],
      ),
    );
  let used = new Set(),
    score = 0;
  function board() {
    c.say("");
    c.view(
      heading("CHOOSE A CLUE", `${score} points`) +
        `<div class="bible-jeopardy">${categories
          .map(
            (category, col) =>
              `<section><h3>${category}</h3>${[0, 1, 2]
                .map((row) => {
                  const i = col * 3 + row;
                  return button(
                    used.has(i) ? "Done" : String((row + 1) * 100),
                    "tile",
                    `data-index="${i}" ${used.has(i) ? "disabled" : ""}`,
                  );
                })
                .join("")}</section>`,
          )
          .join("")}</div>`,
    );
    c.on("tile", (b) => question(Number(b.dataset.index)));
  }
  function question(i) {
    const q = deck[i];
    c.view(
      heading(q.category + " · " + q.level * 100 + " POINTS", q.prompt) +
        options(shuffle(q.options)),
    );
    c.on("answer", (b) => {
      if (used.has(i)) return;
      used.add(i);
      const correct = bibleAnswer(b.dataset.value, q.answer);
      if (correct) score += q.level * 100;
      c.view(
        heading(correct ? "CORRECT" : "KEEP EXPLORING", q.answer) +
          note(q.ref) +
          button(used.size === 9 ? "See results" : "Back to board", "next"),
      );
      c.on("next", () =>
        used.size === 9
          ? c.end((score / 1800) * 100, `${score} of 1,800 points earned.`)
          : board(),
      );
    });
  }
  board();
}
function hangman(c) {
  const words = shuffle(wordSets[0]).slice(0, 3);
  let round = 0,
    won = 0;
  function draw() {
    const word = words[round];
    let guessed = new Set(),
      mistakes = 0,
      finished = false;
    c.view(
      heading(`WORD ${round + 1} OF 3`, "Reveal a Bible name") +
        '<p>Six chances. Choose a letter or use your keyboard.</p><p id="hang-word" class="bible-hidden-word"></p><p id="hang-lives" role="status"></p><div class="bible-keyboard">' +
        [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
          .map((letter) => button(letter, "guess", `data-letter="${letter}"`))
          .join("") +
        '</div><div id="hang-next"></div>',
    );
    function update() {
      c.stage().querySelector("#hang-word").textContent = [...word]
        .map((letter) => (guessed.has(letter) ? letter : "_"))
        .join(" ");
      c.stage().querySelector("#hang-lives").textContent =
        `${6 - mistakes} chances remaining`;
    }
    c.on("guess", (b) => {
      if (finished) return;
      const letter = b.dataset.letter;
      if (guessed.has(letter)) return;
      guessed.add(letter);
      b.disabled = true;
      if (!word.includes(letter)) mistakes++;
      update();
      if ([...word].every((x) => guessed.has(x)) || mistakes >= 6) {
        finished = true;
        const success = mistakes < 6;
        if (success) won++;
        c.say(`${success ? "Word found!" : "The name was " + word + "."}`);
        c.stage().querySelector("#hang-next").innerHTML = button(
          round === 2 ? "See results" : "Next name",
          "next",
        );
        c.on("next", () => {
          if (++round === 3)
            c.end((won / 3) * 100, `${won} of 3 names discovered.`);
          else draw();
        });
      }
    });
    update();
  }
  draw();
  const key = (e) => {
    if (
      c.paused ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.target.matches("input,textarea")
    )
      return;
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter))
      c.stage().querySelector(`[data-letter="${letter}"]`)?.click();
  };
  window.addEventListener("keydown", key);
  return () => window.removeEventListener("keydown", key);
}
function bingo(c) {
  const deck = shuffle(questions.filter((q) => q.level === 1)).slice(0, 9),
    calls = shuffle(deck),
    marked = [];
  let index = 0;
  c.view(
    heading("READ THE CLUE. FIND THE ANSWER.", "Bible Bingo") +
      '<p id="bingo-clue"></p>' +
      `<div class="bible-bingo">${deck.map((q, i) => button(esc(q.answer), "mark", `data-index="${i}" aria-pressed="false"`)).join("")}</div><p>Complete a row, column or diagonal.</p>`,
  );
  const call = () =>
    (c.stage().querySelector("#bingo-clue").textContent = calls[index].prompt);
  call();
  c.on("mark", (b) => {
    const i = Number(b.dataset.index);
    if (marked.includes(i)) return;
    if (deck[i] !== calls[index]) {
      c.say("That does not match this clue. Try another square.");
      return;
    }
    marked.push(i);
    b.classList.add("found");
    b.setAttribute("aria-pressed", "true");
    b.disabled = true;
    c.say(`Correct. ${calls[index].ref}`);
    if (bibleBingo(marked))
      c.end(100, `Bingo! A complete line after ${marked.length} clues.`);
    else {
      index++;
      call();
    }
  });
}
function textQuest(c, kind) {
  const deck =
    kind === "character"
      ? shuffle(characters).slice(0, 4)
      : kind === "scavenger"
        ? shuffle(hunts)
        : escapeRooms;
  let i = 0,
    points = 0,
    misses = 0;
  function draw() {
    const q = deck[i];
    let clues = 1,
      locked = false;
    c.say("");
    c.view(
      heading(
        `${kind === "escape" ? "ROOM" : "CHALLENGE"} ${i + 1} OF ${deck.length}`,
        kind === "character"
          ? "Who am I?"
          : kind === "escape"
            ? q.title
            : "Follow the reference",
      ) +
        (kind === "character"
          ? `<ol id="character-clues"><li>${esc(q.clues[0])}</li></ol>${button("Reveal another clue", "clue")}`
          : `<p>${esc(q.prompt)}</p>`) +
        (kind === "scavenger"
          ? `<details><summary>Read the Scripture excerpt</summary><blockquote>${esc(q.excerpt)}<cite>${esc(q.ref)} · KJV excerpt</cite></blockquote></details>`
          : "") +
        (q.options ? options(shuffle(q.options)) : answerForm()) +
        '<div id="quest-next"></div>',
    );
    c.on("clue", (b) => {
      if (clues < q.clues.length) {
        c.stage()
          .querySelector("#character-clues")
          .insertAdjacentHTML("beforeend", `<li>${esc(q.clues[clues++])}</li>`);
        b.disabled = clues === q.clues.length;
      }
    });
    const check = (value) => {
      if (locked) return;
      if (
        !bibleAnswer(value, q.answer, [
          ...(q.aliases || []),
          ...(q.extra || []),
        ])
      ) {
        misses++;
        c.say("Not quite. Look at the clue or Scripture and try again.");
        return;
      }
      locked = true;
      points += kind === "character" ? 4 - clues : 1;
      c.say(`Correct: ${q.answer}. ${q.ref}`);
      c.stage()
        .querySelectorAll('form button,[data-do="answer"]')
        .forEach((b) => (b.disabled = true));
      c.stage().querySelector("#quest-next").innerHTML = button(
        i === deck.length - 1 ? "Finish" : "Continue",
        "next",
      );
      c.on("next", () => {
        if (++i === deck.length)
          c.end(
            kind === "character"
              ? (points / (deck.length * 3)) * 100
              : Math.max(30, 100 - misses * 5),
            kind === "escape"
              ? "All four locks solved. You have opened the archive."
              : `${deck.length} discoveries made.`,
          );
        else draw();
      });
    };
    if (q.options) c.on("answer", (b) => check(b.dataset.value));
    else
      c.stage().querySelector("form").onsubmit = (e) => {
        e.preventDefault();
        check(new FormData(e.currentTarget).get("answer"));
      };
  }
  draw();
}
function ordering(c) {
  const deck = shuffle(stories);
  let i = 0,
    mistakes = 0;
  function draw() {
    const story = deck[i];
    let order = shuffle(story.events.map((_, index) => index));
    if (order.every((v, index) => v === index)) order.reverse();
    function render() {
      c.view(
        heading(`STORY ${i + 1} OF ${deck.length}`, story.title) +
          note(story.ref) +
          `<ol class="bible-order">${order.map((value, index) => `<li><span>${esc(story.events[value])}</span><div>${button("↑", "up", `data-index="${index}" aria-label="Move event ${index + 1} up" ${index === 0 ? "disabled" : ""}`)}${button("↓", "down", `data-index="${index}" aria-label="Move event ${index + 1} down" ${index === order.length - 1 ? "disabled" : ""}`)}</div></li>`).join("")}</ol>${button("Check order", "check")}`,
      );
      for (const [action, delta] of [
        ["up", -1],
        ["down", 1],
      ])
        c.on(action, (b) => {
          const from = Number(b.dataset.index),
            to = from + delta;
          [order[from], order[to]] = [order[to], order[from]];
          render();
          c.stage()
            .querySelector(`[data-do="${action}"][data-index="${to}"]`)
            ?.focus();
        });
      c.on("check", () => {
        const correct = order.filter((v, index) => v === index).length;
        if (correct !== order.length) {
          mistakes++;
          c.say(
            `${correct} events are in the right position. Read ${story.ref} and try again.`,
          );
          return;
        }
        c.view(
          heading("STORY COMPLETE", story.title) +
            note(story.ref) +
            button(
              i === deck.length - 1 ? "See results" : "Next story",
              "next",
            ),
        );
        c.on("next", () => {
          if (++i === deck.length)
            c.end(
              Math.max(30, 100 - mistakes * 5),
              "Three stories put in order.",
            );
          else draw();
        });
      });
    }
    render();
  }
  draw();
}
function mapGame(c) {
  const deck = shuffle(locations);
  let i = 0,
    misses = 0;
  function draw() {
    const q = deck[i];
    let solved = false;
    c.view(
      heading(`LOCATION ${i + 1} OF ${deck.length}`, q.prompt) +
        `<div class="bible-map"><svg viewBox="0 0 700 420" role="img" aria-label="Simplified eastern Mediterranean map"><rect width="700" height="420" fill="#d8ecf0"/><path d="M0 0H700V420H470L450 310 410 260 390 180 350 170 300 220 240 185 160 210 100 130 60 80 0 80Z" fill="#ecdfbc"/><path d="M0 280L170 260 300 300 370 370 470 420H0Z" fill="#ecdfbc"/><text x="150" y="245" fill="#426975" font-size="18">Mediterranean Sea</text></svg>${locations
          .map((place, index) => {
            const x = ((place.lon - 8) / 40) * 100,
              y = ((46 - place.lat) / 18) * 100;
            return `<button class="map-pin" style="left:${x}%;top:${y}%" data-do="pin" data-place="${place.name}" aria-label="Location ${String.fromCharCode(65 + index)}">${String.fromCharCode(65 + index)}</button>`;
          })
          .join(
            "",
          )}</div><div class="bible-map-key">${locations.map((place, index) => button(`${String.fromCharCode(65 + index)} · ${place.name}`, "pin", `data-place="${place.name}"`)).join("")}</div><p class="bible-small">Approximate modern positions; simplified shapes, not historical borders. Buttons below the map are an accessible alternative.</p><div id="map-next"></div>`,
    );
    c.on("pin", (b) => {
      if (solved) return;
      if (b.dataset.place !== q.name) {
        misses++;
        c.say("Try another location.");
        return;
      }
      solved = true;
      c.say(`${q.name}. ${q.ref}`);
      c.stage().querySelector("#map-next").innerHTML = button(
        i === deck.length - 1 ? "See results" : "Next location",
        "next",
      );
      c.on("next", () => {
        if (++i === deck.length)
          c.end(
            Math.max(25, 100 - misses * 10),
            "You explored six places in the Bible world.",
          );
        else draw();
      });
    });
  }
  draw();
}
function partyGame(c, drawing = false) {
  const deck = shuffle(prompts).slice(0, 5);
  let index = 0,
    correct = 0,
    remaining = 60,
    active = false,
    strokes = [],
    current = null,
    color = "#252338";
  function render() {
    active = false;
    remaining = 60;
    strokes = [];
    c.view(
      heading(
        `ROUND ${index + 1} OF ${deck.length}`,
        drawing ? "Take the sketch pad" : "Choose your actor",
      ) +
        `<p>Only the ${drawing ? "drawer" : "actor"} should look at this prompt.</p><div class="bible-secret" id="party-secret"><strong>${esc(deck[index].answer)}</strong>${note(deck[index].ref)}</div>${button("Hide prompt & start 60 seconds", "ready")}<div id="party-action"></div>`,
    );
    c.say("");
    c.on("ready", (b) => {
      b.remove();
      c.stage().querySelector("#party-secret").hidden = true;
      active = true;
      c.stage().querySelector("#party-action").innerHTML =
        `<p id="party-clock" class="bible-party-clock">60 seconds</p>${drawing ? '<p>Draw with a finger or mouse. No letters or numbers.</p><canvas id="bible-drawing" width="700" height="420" aria-label="Drawing pad. A paper drawing is also welcome."></canvas><div class="bible-draw-tools"><label>Ink <input id="draw-color" type="color" value="#252338"></label>' + button("Undo stroke", "undo") + button("Clear drawing", "clear") + "</div>" : "<p>Act without speaking. Your team guesses aloud.</p>"}<div class="bible-party-buttons">${button("Team guessed it", "correct")}${button("Pass / reveal", "pass")}</div><p class="bible-small">Scored by your group. You can also draw on paper.</p>`;
      if (drawing) bindCanvas();
      c.on("correct", () => end(true));
      c.on("pass", () => end(false));
    });
  }
  function paint() {
    const canvas = c.stage().querySelector("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 700, 420);
    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      stroke.points.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.stroke();
    }
  }
  function bindCanvas() {
    const canvas = c.stage().querySelector("canvas");
    const point = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) * 700) / r.width,
        y: ((e.clientY - r.top) * 420) / r.height,
      };
    };
    canvas.onpointerdown = (e) => {
      if (c.paused) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      current = { color, points: [point(e)], pointer: e.pointerId };
      strokes.push(current);
    };
    canvas.onpointermove = (e) => {
      if (c.paused || !current || current.pointer !== e.pointerId) return;
      current.points.push(point(e));
      paint();
    };
    canvas.onpointerup =
      canvas.onpointercancel =
      canvas.onlostpointercapture =
        () => {
          current = null;
        };
    c.stage().querySelector("#draw-color").oninput = (e) => {
      color = e.target.value;
    };
    c.on("undo", () => {
      current = null;
      strokes.pop();
      paint();
    });
    c.on("clear", () => {
      current = null;
      strokes = [];
      paint();
    });
    paint();
  }
  function end(success) {
    if (!active) return;
    active = false;
    if (success) correct++;
    c.view(
      heading(
        success ? "YOUR TEAM GOT IT" : "THE PROMPT WAS",
        deck[index].answer,
      ) +
        note(deck[index].ref) +
        button(
          index === deck.length - 1 ? "See results" : "Next player",
          "next",
        ),
    );
    c.on("next", () => {
      if (++index === deck.length)
        c.end(
          (correct / deck.length) * 100,
          `${correct} of ${deck.length} prompts guessed by your group.`,
        );
      else render();
    });
  }
  c.timer((dt) => {
    if (!active) return;
    remaining = Math.max(0, remaining - dt);
    const el = c.stage().querySelector("#party-clock");
    if (el) el.textContent = Math.ceil(remaining) + " seconds";
    if (remaining === 0) end(false);
  });
  render();
  return () => {
    active = false;
    current = null;
  };
}
const implementations = {
  trivia: (c) => quizGame(c, "trivia"),
  quiz: (c) => quizGame(c, "quiz"),
  "word-search": wordSearch,
  crossword: crosswordGame,
  charades: (c) => partyGame(c),
  memory,
  verse: (c) => quizGame(c, "verse"),
  jeopardy,
  pictionary: (c) => partyGame(c, true),
  hangman,
  bingo,
  scavenger: (c) => textQuest(c, "scavenger"),
  character: (c) => textQuest(c, "character"),
  ordering,
  map: mapGame,
  escape: (c) => textQuest(c, "escape"),
};
