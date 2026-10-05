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
  bibleStars,
  bibleMapPoint,
  bibleDailyPick,
  bibleStreak,
  BIBLE_MAP,
} from "../learning-engine.mjs";
import { kai, heroScene, currentCharacter, isAdultAudience } from "./mascot.mjs";

import { accounts } from "../accounts.mjs";
// Progress is kept per player on this device.
const storeKey = () => accounts.progressKey("kairos-bible-v1");
const metaKey = () => accounts.progressKey("kairos-bible-meta-v1");
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
const primary = (label, action, extra = "") =>
  button(label, action, `class="kg-btn" ${extra}`);
const gameIcon = (game, cls = "") =>
  `<img class="kg-icon ${cls}" src="/assets/icons/${game.icon}.png" alt="">`;
const tick =
  '<svg class="kg-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const cross =
  '<svg class="kg-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
const starRow = (n, cls = "") =>
  `<span class="kg-stars ${cls}" role="img" aria-label="${n} of 3 stars">${[0, 1, 2]
    .map(
      (i) =>
        `<img src="/assets/ui/yellow-star-filled.png" alt="" class="${i < n ? "on" : "off"}">`,
    )
    .join("")}</span>`;
const note = (ref) => `<p class="bible-reference">Read it in your Bible: ${esc(ref)}</p>`;
const heading = (small, title) =>
  `<p class="bible-kicker">${small}</p><h2>${esc(title)}</h2>`;
const answerForm = (label = "Your answer") =>
  `<form id="answer-form" class="kg-answer"><label for="bible-answer">${label}</label><div class="bible-answer-row"><input id="bible-answer" name="answer" autocomplete="off" autocapitalize="words" maxlength="80" required><button class="kg-btn">Check</button></div></form>`;
const options = (items) =>
  `<div class="bible-options">${items.map((v) => button(`<span>${esc(v)}</span>`, "answer", `data-value="${esc(v)}"`)).join("")}</div>`;
const today = () => new Date().toLocaleDateString("en-CA");
const signal = (name, detail) => {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {}
};

export function readBibleProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(storeKey()) || "{}") || {};
    return typeof p === "object" && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}
export function readBibleMeta() {
  try {
    return JSON.parse(localStorage.getItem(metaKey()) || "{}") || {};
  } catch {
    return {};
  }
}

/** Mark the answer buttons after a multiple-choice guess: right in green, a wrong pick in rose. */
function markOptions(stage, chosen, answer) {
  stage.querySelectorAll('[data-do="answer"]').forEach((b) => {
    b.disabled = true;
    const isAnswer = bibleAnswer(b.dataset.value, answer);
    if (isAnswer) {
      b.classList.add("is-right");
      b.insertAdjacentHTML("beforeend", tick);
    } else if (b.dataset.value === chosen) {
      b.classList.add("is-wrong");
      b.insertAdjacentHTML("beforeend", cross);
    }
  });
}

export function mountBible(root, id = "") {
  let dead = false,
    paused = false,
    done = false,
    clock = 0,
    last = performance.now(),
    tick = null,
    cleanup = () => {},
    tasks = [];
  let progress = readBibleProgress();
  const game = bibleGames.find((g) => g.id === id);

  function library() {
    const played = bibleGames.filter((g) => progress[g.id]?.runs).length;
    const stars = bibleGames.reduce((n, g) => n + bibleStars(progress[g.id]), 0);
    const pick = bibleGames.find(
      (g) => g.id === bibleDailyPick(bibleGames.map((x) => x.id), today()),
    );
    root.innerHTML = `<section class="bible-library">
<header class="kg-hero">
  <div class="kg-hero-copy">
    ${isAdultAudience() ? "<h1>Play the stories. Know the Word.</h1><p>Sixteen Bible games, from quick quizzes and puzzles to party games for your small group.</p>" : "<h1>Pick a game and discover a Bible story.</h1><p>Sixteen games to play on your own, with your family or with your Sunday school group.</p>"}
    <div class="kg-hero-actions"><a class="kg-btn kg-btn-gold kg-today" href="#bible/${pick.id}">${gameIcon(pick)}<span><small>Today’s game</small>${esc(pick.title)}</span></a><a class="kg-hero-character" href="#character">${kai("wave", { bust: true })}<span><small>Playing as</small>${esc(currentCharacter().name)}</span><b>Change</b></a></div>
  </div>
  <div class="kg-hero-scene">${heroScene()}</div>
</header>
<div class="kg-progress-strip" role="status">
  <span><b>${played}</b> of ${bibleGames.length} games played</span>
  <span class="kg-strip-stars"><img src="/assets/ui/yellow-star-filled.png" alt=""><b>${stars}</b> of ${bibleGames.length * 3} stars</span>
  <a href="#journey">See my journey</a>
</div>
<section class="kg-soon" aria-labelledby="soon-title">
  <div class="kg-soon-art" aria-hidden="true">${kai("read")}</div>
  <div class="kg-soon-copy"><span class="kg-soon-tag">Coming soon</span><h2 id="soon-title">PlayMessages</h2><p>A bigger game is on its way. We’re still building it, so check back soon.</p></div>
  <svg class="kg-soon-lock" viewBox="0 0 48 56" aria-hidden="true"><path d="M13 24v-8a11 11 0 0 1 22 0v8" fill="none" stroke="#2e1a47" stroke-width="9" stroke-linecap="round"/><path d="M13 24v-8a11 11 0 0 1 22 0v8" fill="none" stroke="#f5b83d" stroke-width="4" stroke-linecap="round"/><rect x="4" y="22" width="40" height="30" rx="9" fill="#f5b83d" stroke="#2e1a47" stroke-width="3"/><circle cx="24" cy="35" r="4" fill="#2e1a47"/><path d="M24 37v6" stroke="#2e1a47" stroke-width="3" stroke-linecap="round"/></svg>
</section>
<div class="bible-library-toolbar">
  <label class="bible-search"><span class="kg-visually-hidden">Search games</span><input id="bible-search" type="search" placeholder="Search games" autocomplete="off"></label>
  <div class="bible-filters" role="group" aria-label="Show games by type">${["All", "Knowledge", "Puzzles", "Together", "Explore"].map((v, i) => button(v, "filter", `aria-pressed="${i === 0}" data-category="${v}" class="kg-chip kg-chip-${v.toLowerCase()}"`)).join("")}</div>
</div>
<div id="bible-grid" class="bible-game-grid"></div>
<p class="bible-small">Questions and summaries are written for Kairos. Bible quotations are from the King James Version (KJV). Progress is saved on this device.</p>
</section>`;
    let category = "All";
    const draw = () => {
      const query = root.querySelector("#bible-search").value.toLowerCase().trim();
      const selected = bibleGames.filter(
        (g) =>
          (category === "All" || g.category === category) &&
          [g.title, g.description, g.tag].join(" ").toLowerCase().includes(query),
      );
      root.querySelector("#bible-grid").innerHTML = selected.length
        ? selected
            .map((g) => {
              const rec = progress[g.id];
              return `<a class="bible-game-card" href="#bible/${g.id}" style="--game-tint:${g.color}"><span class="bible-card-art">${gameIcon(g)}</span><span class="bible-card-copy"><span class="kg-cat kg-cat-${g.category.toLowerCase()}">${esc(g.category)}</span><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><span class="kg-card-foot"><span class="kg-who">${g.players === "group" ? "With friends" : "On your own"}</span>${rec?.runs ? starRow(bibleStars(rec), "small") : '<span class="kg-new">New</span>'}</span></span></a>`;
            })
            .join("")
        : `<div class="kg-empty" role="status">${kai("think", { bust: true })}<p>No games match that search. Try another word, or choose All.</p></div>`;
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
    last = performance.now();
    root.innerHTML = `<section class="bible-session" style="--game-tint:${game.color}">
<header class="bible-session-top"><a href="#bible" class="kg-back">Games</a><span class="kg-session-title">${gameIcon(game)}${esc(game.title)}</span><button id="bible-pause" type="button" class="kg-pause" aria-label="Pause game">Pause</button></header>
<div class="bible-session-meta"><div class="kg-meter" role="progressbar" aria-label="Game progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="bible-meter"></i></div><span id="bible-time" aria-label="Time played">0:00</span></div>
<div class="bible-stage-wrap"><div id="bible-stage"></div><p id="bible-feedback" role="status" aria-live="polite"></p>
<div id="bible-pause-overlay" hidden><div class="kg-pause-kai">${kai("think")}</div><h2>Paused</h2><p>Take a break. Your game will wait for you.</p><button id="bible-resume" class="kg-btn">Keep playing</button></div></div>
<p class="bible-small">${game.players === "group" ? "Play together on one device. Your group decides when a guess is right." : "Take your time. Every answer helps you learn."}</p></section>`;
    const toggle = () => {
      paused = !paused;
      root.querySelector("#bible-stage").inert = paused;
      root.querySelector("#bible-pause-overlay").hidden = !paused;
      root.querySelector("#bible-pause").textContent = paused ? "Resume" : "Pause";
      if (paused) root.querySelector("#bible-resume").focus();
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
          .forEach((b) => (b.onclick = (e) => fn(b, e)));
      },
      say(text, tone = null) {
        const el = root.querySelector("#bible-feedback");
        if (!el) return;
        el.className = tone ? `is-${tone}` : "";
        if (tone) el.innerHTML = `${kai(tone === "good" ? "cheer" : "encourage", { bust: true })}<span>${esc(text)}</span>`;
        else el.textContent = text;
        if (tone) {
          signal("kairos:feedback", { ok: tone === "good" });
          const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
          requestAnimationFrame(() => el.scrollIntoView?.({ block: "nearest", behavior: reduce ? "auto" : "smooth" }));
        }
      },
      step(doneSteps, total) {
        const pct = Math.round((Math.max(0, Math.min(total, doneSteps)) / total) * 100);
        const el = root.querySelector("#bible-meter");
        if (el) el.style.width = pct + "%";
        root.querySelector(".kg-meter")?.setAttribute("aria-valuenow", String(pct));
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
        const before = bibleStars(prev);
        progress[id] = {
          runs: (Number(prev.runs) || 0) + 1,
          best: Math.max(Number(prev.best) || 0, best),
          last: today(),
        };
        try {
          localStorage.setItem(storeKey(), JSON.stringify(progress));
          localStorage.setItem(metaKey(), JSON.stringify(bibleStreak(readBibleMeta(), today())));
        } catch {
          saved = false;
        }
        const earned = bibleStars({ runs: 1, best });
        const index = bibleGames.indexOf(game);
        const next = bibleGames[(index + 1) % bibleGames.length];
        const cheer = earned === 3 ? "Brilliant work!" : earned === 2 ? "Great job!" : "Well done for finishing!";
        root.innerHTML = `<section class="bible-results" style="--game-tint:${game.color}"><div class="kg-result-card"><div class="kg-result-kai">${kai(earned >= 2 ? "cheer" : "encourage")}</div>${starRow(earned, "big")}<h1 tabindex="-1">${cheer}</h1><p class="kg-result-game">${gameIcon(game)}${esc(game.title)}</p><strong class="bible-result-score">${best}<small>%</small></strong><p>${esc(text)}</p>${bibleStars(progress[id]) > before && before > 0 ? '<p class="kg-new-best">New best for this game!</p>' : ""}<p class="bible-small">${saved ? "Saved on this device." : "This result lasts until you close the page, because storage is turned off."}</p><div class="kg-result-actions">${primary("Play again", "again")}<a class="kg-btn kg-btn-soft" href="#bible/${next.id}">Next: ${esc(next.title)}</a><a class="kg-link" href="#bible">All games</a></div></div></section>`;
        root.querySelector('[data-do="again"]').onclick = start;
        root.querySelector("h1").focus();
        signal("kairos:bible-complete", { id, score: best });
        signal("kairos:feedback", { ok: true });
      },
    };
    cleanup = implementations[id](c) || (() => {});
  }

  if (!game) library();
  else {
    const rec = progress[game.id];
    root.innerHTML = `<section class="bible-welcome" style="--game-tint:${game.color}"><a href="#bible" class="kg-back">Games</a><div class="kg-welcome-card"><div class="kg-welcome-kai">${kai(game.players === "group" ? "wave" : "read")}</div><div class="bible-welcome-art">${gameIcon(game)}</div><span class="kg-cat kg-cat-${game.category.toLowerCase()}">${esc(game.category)}</span><h1>${esc(game.title)}</h1><p class="kg-welcome-tag">${esc(game.tag)}</p><p>${esc(game.description)}</p>${rec?.runs ? `<p class="kg-welcome-best">${starRow(bibleStars(rec), "small")} Your best: ${Number(rec.best) || 0}%</p>` : ""}<button id="bible-start" class="kg-btn kg-btn-gold kg-btn-big">Play</button><p class="bible-small">${game.players === "group" ? "You need two or more people. One person acts or draws, and the others guess." : "Works with touch, mouse and keyboard. You can pause at any time."}</p>${id === "escape" ? '<p class="bible-small">The library is make-believe. The puzzles come from the Bible.</p>' : ""}</div></section>`;
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
        : shuffle(questions.filter((q) => q.level < 3)).slice(0, 8),
    index = 0,
    score = 0;
  if (kind === "verse")
    deck = shuffle(verses)
      .slice(0, 6)
      .map((v) => ({
        prompt: "Where is this verse from?",
        excerpt: v.excerpt,
        answer: v.ref,
        options: [
          v.ref,
          ...shuffle(verses.filter((x) => x !== v))
            .slice(0, 3)
            .map((x) => x.ref),
        ],
        ref: v.ref,
      }));
  function draw() {
    const q = deck[index];
    let locked = false;
    c.step(index, deck.length);
    c.view(
      heading(
        `Question ${index + 1} of ${deck.length}${kind === "quiz" ? " · Level " + q.level : ""}`,
        q.prompt,
      ) +
        (q.excerpt
          ? `<blockquote>${esc(q.excerpt)}<cite>King James Version</cite></blockquote>`
          : "") +
        (kind === "trivia" ? answerForm() : options(shuffle(q.options))) +
        `<div id="bible-next" class="kg-next"></div>`,
    );
    c.say("");
    if (kind === "trivia") c.stage().querySelector("input").focus({ preventScroll: true });
    function check(value) {
      if (locked) return;
      locked = true;
      const correct = bibleAnswer(value, q.answer, q.aliases || []);
      if (correct) score++;
      if (kind === "trivia") {
        const input = c.stage().querySelector("input");
        input.classList.add(correct ? "is-right" : "is-wrong");
        c.stage().querySelectorAll("input,button").forEach((b) => (b.disabled = true));
      } else markOptions(c.stage(), value, q.answer);
      c.say(
        correct
          ? `Correct! ${q.ref}`
          : `Good try. The answer is ${q.answer}. Read ${q.ref}.`,
        correct ? "good" : "retry",
      );
      c.stage().querySelector("#bible-next").innerHTML = primary(
        index === deck.length - 1 ? "See my score" : "Next question",
        "next",
      );
      c.stage().querySelector('[data-do="next"]').focus({ preventScroll: true });
      c.on("next", () => {
        if (++index === deck.length) {
          c.step(1, 1);
          c.end(
            (score / deck.length) * 100,
            `You got ${score} of ${deck.length} right.`,
          );
        } else draw();
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
    { grid } = bibleWordGrid(words),
    n = grid.length,
    found = new Set();
  let first = null,
    dragFrom = null,
    dragTo = null;
  c.view(
    heading("Hidden in the letters", "Find six words") +
      "<p>Drag across a word, or tap its first letter and then its last letter. Words can go across, down, diagonally or backwards.</p>" +
      `<div class="bible-word-list">${words.map((w) => `<span data-word="${w}">${w}</span>`).join("")}</div><div class="bible-word-grid">${grid
        .flat()
        .map((v, i) =>
          button(
            v,
            "letter",
            `data-cell="${i}" aria-label="Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}: ${v}"`,
          ),
        )
        .join("")}</div>`,
  );
  c.step(0, words.length);
  const gridEl = c.stage().querySelector(".bible-word-grid");
  const cell = (i) => c.stage().querySelector(`[data-cell="${i}"]`);
  const clearMarks = (cls) =>
    c.stage().querySelectorAll("." + cls).forEach((x) => x.classList.remove(cls));
  const lineCells = (a, b) => {
    const ar = Math.floor(a / n), ac = a % n, br = Math.floor(b / n), bc = b % n;
    const dr = br - ar, dc = bc - ac;
    if (dr && dc && Math.abs(dr) !== Math.abs(dc)) return [a];
    const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
    return Array.from({ length: len }, (_, i) => (ar + Math.sign(dr) * i) * n + ac + Math.sign(dc) * i);
  };
  function attempt(start, end) {
    clearMarks("selected");
    const line = bibleWordLine(grid, start, end),
      word = words.find((w) => w === line || w === [...line].reverse().join(""));
    if (!word || found.has(word)) {
      c.say(
        word ? "You already found that word." : "That isn’t one of the words. Try again.",
        word ? null : "retry",
      );
      return;
    }
    found.add(word);
    c.stage().querySelector(`[data-word="${word}"]`).classList.add("found");
    lineCells(start, end).forEach((i) => cell(i).classList.add("found"));
    c.step(found.size, words.length);
    c.say(`You found ${word}! ${found.size} of ${words.length}.`, "good");
    if (found.size === words.length)
      c.after(0.7, () => c.end(100, "You found every hidden word."));
  }
  function tap(index) {
    if (first === null) {
      first = index;
      cell(index).classList.add("selected");
      c.say("Now choose the last letter of the word.");
      return;
    }
    const startIndex = first;
    first = null;
    if (startIndex === index) {
      clearMarks("selected");
      c.say("");
      return;
    }
    attempt(startIndex, index);
  }
  const indexAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-cell]");
    return el && gridEl.contains(el) ? Number(el.dataset.cell) : null;
  };
  gridEl.onpointerdown = (e) => {
    const i = indexAt(e);
    if (i === null || c.paused) return;
    e.preventDefault();
    dragFrom = i;
    dragTo = i;
    gridEl.setPointerCapture?.(e.pointerId);
  };
  gridEl.onpointermove = (e) => {
    if (dragFrom === null) return;
    const i = indexAt(e);
    if (i === null || i === dragTo) return;
    dragTo = i;
    clearMarks("dragging");
    lineCells(dragFrom, dragTo).forEach((k) => cell(k).classList.add("dragging"));
  };
  const finish = () => {
    if (dragFrom === null) return;
    const a = dragFrom, b = dragTo;
    dragFrom = dragTo = null;
    clearMarks("dragging");
    if (a === b) tap(a);
    else {
      first = null;
      attempt(a, b);
    }
  };
  gridEl.onpointerup = finish;
  gridEl.onpointercancel = () => {
    dragFrom = dragTo = null;
    clearMarks("dragging");
  };
  // Keyboard users press Enter/Space on letters (click with detail 0).
  c.on("letter", (b, e) => {
    if (e.detail === 0) tap(Number(b.dataset.cell));
  });
}

function crosswordGame(c) {
  const board = bibleCrossword(crossword);
  c.view(
    heading("Across and down", "Bible names crossword") +
      "<p>Choose a clue, then type the letters. Where two words cross, they share a letter.</p>" +
      `<div class="kg-cross-layout"><div class="bible-cross-grid" style="--cols:${board[0].length}">${board.flatMap((row, r) => row.map((letter, col) => (letter ? `<label class="cross-cell"><span>${crossword.find((e) => e.row === r && e.col === col)?.number || ""}</span><input data-r="${r}" data-col="${col}" aria-label="Row ${r + 1}, column ${col + 1}" maxlength="1" autocomplete="off" autocapitalize="characters" inputmode="text"></label>` : '<span class="cross-block"></span>'))).join("")}</div><div class="bible-clues">${crossword.map((e, i) => button(`<b>${e.number} ${e.dir}</b> ${esc(e.clue)} <small>(${e.word.length} letters)</small>`, "clue", `data-entry="${i}"`)).join("")}</div></div>${primary("Check my answers", "check")}`,
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
  const select = (entry, focus = true) => {
    selected = entry;
    c.stage().querySelectorAll("input").forEach((x) => x.classList.remove("selected"));
    c.stage().querySelectorAll('[data-do="clue"]').forEach((b) =>
      b.setAttribute("aria-pressed", String(crossword[Number(b.dataset.entry)] === entry)),
    );
    cells(entry).forEach((x) => x.classList.add("selected"));
    if (focus) (cells(entry).find((x) => !x.value) || cells(entry)[0]).focus();
    c.say(`${entry.number} ${entry.dir}: ${entry.clue}`);
  };
  c.on("clue", (b) => select(crossword[Number(b.dataset.entry)]));
  const filled = () =>
    [...c.stage().querySelectorAll("input")].filter((x) => x.value).length;
  const total = c.stage().querySelectorAll("input").length;
  c.stage()
    .querySelectorAll("input")
    .forEach((input) => {
      input.onfocus = () => {
        if (!cells(selected).includes(input)) {
          const entry = crossword.find((e) => cells(e).includes(input));
          if (entry) select(entry, false);
        }
      };
      input.oninput = () => {
        input.value = input.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
        input.removeAttribute("aria-invalid");
        const group = cells(selected),
          i = group.indexOf(input);
        if (input.value && i >= 0 && i < group.length - 1) group[i + 1].focus();
        c.step(filled(), total);
      };
      input.onkeydown = (e) => {
        if (e.key !== "Backspace" || input.value) return;
        const group = cells(selected),
          i = group.indexOf(input);
        if (i > 0) group[i - 1].focus();
      };
    });
  select(crossword[0], false);
  c.on("check", () => {
    let count = 0;
    c.stage()
      .querySelectorAll("input")
      .forEach((input) => {
        const correct =
          input.value.toUpperCase() ===
          board[Number(input.dataset.r)][Number(input.dataset.col)];
        if (correct) count++;
        input.setAttribute("aria-invalid", String(!correct));
      });
    if (count === total) c.end(100, "You solved all six clues.");
    else
      c.say(
        `${count} of ${total} letters are right. Fix the squares marked in pink and check again.`,
        "retry",
      );
  });
}

function memory(c) {
  const labels = shuffle(["Noah", "Ruth", "David", "Mary", "Moses", "Esther", "Jonah", "Daniel"]).slice(0, 6),
    deck = shuffle(labels.flatMap((name) => [name, name]));
  let open = [],
    matched = new Set(),
    moves = 0,
    locked = false;
  c.view(
    heading("Look closely", "Find the matching names") +
      `<p id="memory-moves" class="kg-counter">0 turns · 0 of 6 pairs</p><div class="bible-memory">${deck.map((name, i) => `<button type="button" data-do="card" data-index="${i}" class="kg-flip" aria-label="Card ${i + 1}, face down"><span class="kg-face kg-face-back" aria-hidden="true"><img src="/assets/icons/Star.png" alt=""></span><span class="kg-face kg-face-front" aria-hidden="true">${esc(name)}</span></button>`).join("")}</div>`,
  );
  c.step(0, 6);
  const el = (i) => c.stage().querySelector(`[data-index="${i}"]`);
  c.on("card", (b) => {
    const i = Number(b.dataset.index);
    if (locked || matched.has(i) || open.includes(i)) return;
    open.push(i);
    b.classList.add("is-open");
    b.setAttribute("aria-label", deck[i]);
    if (open.length !== 2) return;
    moves++;
    if (deck[open[0]] === deck[open[1]]) {
      open.forEach((index) => {
        matched.add(index);
        el(index).classList.add("found");
        el(index).disabled = true;
      });
      c.say(`A pair! You found ${deck[open[0]]}.`, "good");
      open = [];
      c.step(matched.size / 2, 6);
      if (matched.size === 12)
        c.after(0.7, () =>
          c.end(Math.max(25, 100 - (moves - 6) * 4), `You found all six pairs in ${moves} turns.`),
        );
    } else {
      locked = true;
      c.say("Not a pair. Try to remember where they are.");
      c.after(1.1, () => {
        open.forEach((index) => {
          el(index).classList.remove("is-open");
          el(index).setAttribute("aria-label", `Card ${index + 1}, face down`);
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
          shuffle(questions.filter((q) => q.category === category && q.level === level))[0],
      ),
    );
  let used = new Set(),
    right = new Set(),
    score = 0;
  function board() {
    c.say("");
    c.step(used.size, 9);
    c.view(
      heading("Choose a clue", `${score} points`) +
        `<div class="bible-jeopardy">${categories
          .map(
            (category, col) =>
              `<section><h3>${category}</h3>${[0, 1, 2]
                .map((row) => {
                  const i = col * 3 + row;
                  return button(
                    used.has(i) ? (right.has(i) ? tick : cross) : String((row + 1) * 100),
                    "tile",
                    `data-index="${i}" ${used.has(i) ? `disabled class="${right.has(i) ? "is-right" : "is-wrong"}" aria-label="${right.has(i) ? "Answered correctly" : "Answered"}"` : `aria-label="${category} for ${(row + 1) * 100} points"`}`,
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
      heading(`${q.category} · ${q.level * 100} points`, q.prompt) +
        options(shuffle(q.options)) +
        '<div id="bible-next" class="kg-next"></div>',
    );
    c.on("answer", (b) => {
      if (used.has(i)) return;
      used.add(i);
      const correct = bibleAnswer(b.dataset.value, q.answer);
      if (correct) {
        score += q.level * 100;
        right.add(i);
      }
      markOptions(c.stage(), b.dataset.value, q.answer);
      c.say(
        correct ? `Correct! +${q.level * 100} points. ${q.ref}` : `The answer is ${q.answer}. Read ${q.ref}.`,
        correct ? "good" : "retry",
      );
      c.stage().querySelector("#bible-next").innerHTML = primary(
        used.size === 9 ? "See my score" : "Back to the board",
        "next",
      );
      c.on("next", () =>
        used.size === 9 ? c.end((score / 1800) * 100, `You earned ${score} of 1,800 points.`) : board(),
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
    c.step(round, 3);
    c.view(
      heading(`Name ${round + 1} of 3`, "Reveal a Bible name") +
        '<p>Choose a letter, or type it on your keyboard. Each wrong letter costs a heart.</p><div id="hang-lives" class="kg-hearts" role="status"></div><p id="hang-word" class="bible-hidden-word"></p><div class="bible-keyboard">' +
        [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => button(letter, "guess", `data-letter="${letter}"`)).join("") +
        '</div><div id="hang-next" class="kg-next"></div>',
    );
    function update() {
      c.stage().querySelector("#hang-word").innerHTML = [...word]
        .map((letter) => `<span class="${guessed.has(letter) ? "shown" : ""}">${guessed.has(letter) ? letter : ""}</span>`)
        .join("");
      c.stage().querySelector("#hang-word").setAttribute(
        "aria-label",
        [...word].map((l) => (guessed.has(l) ? l : "blank")).join(" "),
      );
      c.stage().querySelector("#hang-lives").innerHTML =
        Array.from({ length: 6 }, (_, i) => `<img src="/assets/icons/Heart.png" alt="" class="${i < 6 - mistakes ? "" : "lost"}">`).join("") +
        `<span class="kg-visually-hidden">${6 - mistakes} hearts left</span>`;
    }
    c.on("guess", (b) => {
      if (finished) return;
      const letter = b.dataset.letter;
      if (guessed.has(letter)) return;
      guessed.add(letter);
      b.disabled = true;
      const hit = word.includes(letter);
      b.classList.add(hit ? "is-right" : "is-wrong");
      if (!hit) mistakes++;
      update();
      if ([...word].every((x) => guessed.has(x)) || mistakes >= 6) {
        finished = true;
        const success = mistakes < 6;
        if (success) won++;
        if (!success) word.split("").forEach((l) => guessed.add(l)), update();
        c.say(success ? `You revealed ${word}!` : `The name was ${word}.`, success ? "good" : "retry");
        c.stage().querySelectorAll('[data-do="guess"]').forEach((x) => (x.disabled = true));
        c.stage().querySelector("#hang-next").innerHTML = primary(round === 2 ? "See my score" : "Next name", "next");
        c.on("next", () => {
          if (++round === 3) c.end((won / 3) * 100, `You revealed ${won} of 3 names.`);
          else draw();
        });
      }
    });
    update();
  }
  draw();
  const key = (e) => {
    if (c.paused || e.ctrlKey || e.metaKey || e.altKey || e.target.matches("input,textarea")) return;
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter)) c.stage().querySelector(`[data-letter="${letter}"]`)?.click();
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
    heading("Read the clue and find the answer", "Bible Bingo") +
      '<div class="kg-callout" id="bingo-clue" aria-live="polite"></div>' +
      `<div class="bible-bingo">${deck.map((q, i) => button(esc(q.answer), "mark", `data-index="${i}" aria-pressed="false"`)).join("")}</div><p class="bible-small">Complete a row, a column or a diagonal to win.</p>`,
  );
  const call = () => {
    c.stage().querySelector("#bingo-clue").innerHTML = `<small>Clue ${index + 1}</small>${esc(calls[index].prompt)}`;
    c.step(marked.length, 3);
  };
  call();
  c.on("mark", (b) => {
    const i = Number(b.dataset.index);
    if (marked.includes(i)) return;
    if (deck[i] !== calls[index]) {
      b.classList.add("kg-shake");
      setTimeout(() => b.classList.remove("kg-shake"), 400);
      c.say("That doesn’t match this clue. Try another square.", "retry");
      return;
    }
    marked.push(i);
    b.classList.add("found");
    b.setAttribute("aria-pressed", "true");
    b.disabled = true;
    c.say(`Correct! ${calls[index].ref}`, "good");
    if (bibleBingo(marked)) {
      c.step(1, 1);
      c.after(0.6, () => c.end(Math.max(50, 100 - (marked.length - 3) * 8), `Bingo! You made a line with ${marked.length} clues.`));
    } else {
      index++;
      call();
    }
  });
}

function textQuest(c, kind) {
  const deck = kind === "character" ? shuffle(characters).slice(0, 4) : kind === "scavenger" ? shuffle(hunts) : escapeRooms;
  let i = 0,
    points = 0,
    misses = 0;
  function draw() {
    const q = deck[i];
    let clues = 1,
      locked = false;
    c.say("");
    c.step(i, deck.length);
    c.view(
      heading(
        `${kind === "escape" ? "Lock" : kind === "character" ? "Person" : "Hunt"} ${i + 1} of ${deck.length}`,
        kind === "character" ? "Who am I?" : kind === "escape" ? q.title : "Find the answer in your Bible",
      ) +
        (kind === "escape" ? `<div class="kg-locks">${deck.map((_, k) => `<span class="${k < i ? "open" : k === i ? "now" : ""}"></span>`).join("")}</div>` : "") +
        (kind === "character"
          ? `<ol id="character-clues" class="kg-clues"><li>${esc(q.clues[0])}</li></ol>${button("Show another clue", "clue", 'class="kg-btn kg-btn-soft"')}<p class="bible-small">Guess with fewer clues to earn more points.</p>`
          : `<p class="kg-prompt">${esc(q.prompt)}</p>`) +
        (kind === "scavenger"
          ? `<details class="kg-hint"><summary>No Bible nearby? Read the verse here</summary><blockquote>${esc(q.excerpt)}<cite>${esc(q.ref)} · KJV</cite></blockquote></details>`
          : "") +
        (q.options ? options(shuffle(q.options)) : answerForm()) +
        '<div id="quest-next" class="kg-next"></div>',
    );
    c.on("clue", (b) => {
      if (clues < q.clues.length) {
        c.stage().querySelector("#character-clues").insertAdjacentHTML("beforeend", `<li>${esc(q.clues[clues++])}</li>`);
        b.disabled = clues === q.clues.length;
      }
    });
    const check = (value, btn) => {
      if (locked) return;
      if (!bibleAnswer(value, q.answer, [...(q.aliases || []), ...(q.extra || [])])) {
        misses++;
        if (btn) {
          btn.classList.add("is-wrong");
          btn.disabled = true;
        } else {
          const input = c.stage().querySelector("input");
          input.classList.add("kg-shake");
          setTimeout(() => input.classList.remove("kg-shake"), 400);
          input.select();
        }
        c.say(kind === "character" && clues < q.clues.length ? "Not quite. Try another clue." : "Not quite. Read the clue again and have another go.", "retry");
        return;
      }
      locked = true;
      points += kind === "character" ? 4 - clues : 1;
      if (btn) markOptions(c.stage(), value, q.answer);
      else c.stage().querySelector("input").classList.add("is-right");
      c.say(`Correct! ${q.answer}. ${q.ref}`, "good");
      c.stage().querySelectorAll('form button,form input,[data-do="clue"]').forEach((b) => (b.disabled = true));
      c.stage().querySelector("#quest-next").innerHTML = primary(i === deck.length - 1 ? "Finish" : kind === "escape" ? "Open the next door" : "Next", "next");
      c.on("next", () => {
        if (++i === deck.length)
          c.end(
            kind === "character" ? (points / (deck.length * 3)) * 100 : Math.max(30, 100 - misses * 5),
            kind === "escape" ? "You opened all four locks and escaped the library!" : kind === "character" ? `You guessed all ${deck.length} people.` : `You found all ${deck.length} answers.`,
          );
        else draw();
      });
    };
    if (q.options) c.on("answer", (b) => check(b.dataset.value, b));
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
    let order = shuffle(story.events.map((_, index) => index)),
      picked = null;
    if (order.every((v, index) => v === index)) order.reverse();
    c.step(i, deck.length);
    function render(focusIndex = null, focusAction = null) {
      c.view(
        heading(`Story ${i + 1} of ${deck.length}`, story.title) +
          '<p>Put the events in order. Use the arrows, or tap one event and then another to swap them.</p>' +
          `<ol class="bible-order">${order.map((value, index) => `<li class="${picked === index ? "picked" : ""}"><button type="button" class="kg-event" data-do="pick" data-index="${index}" aria-pressed="${picked === index}">${esc(story.events[value])}</button><div>${button("↑", "up", `data-index="${index}" aria-label="Move up" ${index === 0 ? "disabled" : ""}`)}${button("↓", "down", `data-index="${index}" aria-label="Move down" ${index === order.length - 1 ? "disabled" : ""}`)}</div></li>`).join("")}</ol>${primary("Check the order", "check")}`,
      );
      if (focusAction) c.stage().querySelector(`[data-do="${focusAction}"][data-index="${focusIndex}"]`)?.focus();
      for (const [action, delta] of [["up", -1], ["down", 1]])
        c.on(action, (b) => {
          const from = Number(b.dataset.index),
            to = from + delta;
          [order[from], order[to]] = [order[to], order[from]];
          picked = null;
          render(to, action);
        });
      c.on("pick", (b) => {
        const k = Number(b.dataset.index);
        if (picked === null) picked = k;
        else {
          if (picked !== k) [order[picked], order[k]] = [order[k], order[picked]];
          picked = null;
        }
        render(k, "pick");
      });
      c.on("check", () => {
        const correct = order.filter((v, index) => v === index).length;
        if (correct !== order.length) {
          mistakes++;
          c.stage().querySelectorAll(".bible-order li").forEach((li, index) => li.classList.toggle("is-right", order[index] === index));
          c.say(`${correct} of ${order.length} events are in the right place (marked green). Keep going!`, "retry");
          return;
        }
        c.view(
          heading("Story complete", story.title) +
            `<ol class="bible-order is-done">${story.events.map((e) => `<li class="is-right"><span>${esc(e)}</span></li>`).join("")}</ol>` +
            note(story.ref) +
            primary(i === deck.length - 1 ? "See my score" : "Next story", "next"),
        );
        c.say("You put the story in order!", "good");
        c.on("next", () => {
          if (++i === deck.length) c.end(Math.max(30, 100 - mistakes * 5), "You put three stories in order.");
          else draw();
        });
      });
    }
    render();
  }
  draw();
}

// Simplified coastlines (lon, lat). Approximate shapes for children, not historical borders.
const SEA = [[8,44.4],[10,44],[10.5,43.5],[11,42.5],[12.3,41.7],[13.5,41.2],[15,40.2],[15.7,40],[16,38.9],[15.6,38],[16.1,38],[16.6,38.4],[17.1,39],[17.2,40.4],[18.5,40.1],[18.5,40.6],[17,41],[16,41.9],[14,42.6],[13.6,43.5],[12.4,44.2],[12.3,45.2],[13.5,45.7],[14.5,45.2],[15.2,44.3],[16,43.5],[17.5,43],[18.5,42.4],[19.5,41.8],[19.4,40.3],[20.2,39.6],[20.7,38.8],[21.1,38.3],[21.6,37.5],[21.7,36.8],[22.4,36.4],[22.8,37],[23.2,36.4],[23.1,37.4],[23.7,37.8],[24,38.2],[23.2,38.9],[23,39.6],[22.6,40.3],[23.7,40.2],[24.3,40.8],[26,40.8],[26.7,40.4],[26.2,40],[26.8,39.2],[27.1,38.4],[26.4,38.2],[27.3,37.4],[27.4,37],[28.2,36.7],[29.7,36.2],[30.6,36.8],[32,36.5],[33,36.1],[34.6,36.8],[36,36.8],[36.2,36.2],[35.8,35.6],[35.9,34.6],[35.5,33.9],[35.1,33.1],[34.9,32.4],[34.5,31.5],[34.2,31.3],[32.3,31.3],[31,31.6],[30,31.3],[29,30.9],[27,31.3],[25.2,31.6],[23,32.6],[21,32.9],[20,32],[20,31],[19,30.3],[17,31],[15.5,31.6],[15.2,32.4],[13,32.9],[11.5,33.2],[10.5,33.8],[10,35],[11,35.3],[11,36.8],[10.2,37.2],[9.5,37.3],[8,36.9]];
const BLACK_SEA = [[28,41.2],[29,41.2],[31,41.1],[33,42],[35,42],[36,41.6],[38,41],[40,41],[41.5,41.5],[41.5,42.6],[40,43.5],[38,44.5],[37,45],[36,45.3],[35,45],[33.5,44.5],[32.5,45.4],[31,46],[30,46],[29.6,45],[28.6,44],[27.9,42.7]];
const RED_SEA = [[32.5,30],[32.7,29.6],[33.6,28],[32.9,28],[32.3,29.6]];
const AQABA = [[34.9,29.5],[35,28],[34.4,28],[34.6,28.9]];
const ISLANDS = [
  [[12.4,38.1],[15.6,38.3],[15.1,36.7],[14.3,37],[12.4,37.8]],
  [[23.5,35.3],[24.3,35.6],[26.3,35.3],[25.8,35],[24.7,34.9],[23.6,35.2]],
  [[32.3,35],[33,35.4],[34.6,35.7],[33.9,35.1],[33,34.6],[32.4,34.7]],
  [[8.4,41],[9.3,41.2],[9.7,40],[9.5,39.1],[8.6,38.9],[8.4,40]],
  [[8.6,42.9],[9.4,43],[9.5,41.6],[8.8,41.6]],
];
const NILE = [[31.2,31.4],[31.1,30.1],[31.3,29],[30.8,28]];
const EUPHRATES = [[39.5,39.5],[38.5,38],[38,36.9],[38.4,35.9],[40.2,35],[41.3,34.4],[43.2,33.4],[44.4,32.5],[45.5,31.5],[47,31],[48,30.4]];
const TIGRIS = [[40.5,38.3],[42,37.3],[43.2,36.4],[43.8,35],[44.4,33.3],[45.7,32.5],[47.2,31.2],[48,30.4]];
const toXY = ([lon, lat]) => {
  const p = bibleMapPoint(lon, lat);
  return `${((p.x / 100) * BIBLE_MAP.width).toFixed(1)} ${((p.y / 100) * BIBLE_MAP.height).toFixed(1)}`;
};
const shape = (pts, close = true) => "M" + pts.map(toXY).join("L") + (close ? "Z" : "");
const MAP_SVG = `<svg viewBox="0 0 ${BIBLE_MAP.width} ${BIBLE_MAP.height}" role="img" aria-label="Map of the Bible world around the Mediterranean Sea"><rect width="700" height="420" class="kg-land"/><path class="kg-water" d="${shape(SEA)} ${shape(BLACK_SEA)} ${shape(RED_SEA)} ${shape(AQABA)}"/>${ISLANDS.map((i) => `<path class="kg-land kg-island" d="${shape(i)}"/>`).join("")}${[NILE, EUPHRATES, TIGRIS].map((r) => `<path class="kg-river" d="${shape(r, false)}"/>`).join("")}<text x="190" y="300" class="kg-map-label">Mediterranean Sea</text><text x="420" y="78" class="kg-map-label">Black Sea</text><text x="600" y="330" class="kg-map-label kg-small" transform="rotate(-38 600 330)">Euphrates</text><text x="455" y="400" class="kg-map-label kg-small">Nile</text></svg>`;

function mapGame(c) {
  const deck = shuffle(locations).slice(0, 6);
  let i = 0,
    misses = 0;
  function draw() {
    const q = deck[i];
    let solved = false;
    c.step(i, deck.length);
    const choices = shuffle([q, ...shuffle(locations.filter((p) => p !== q)).slice(0, 3)]);
    c.view(
      heading(`Place ${i + 1} of ${deck.length}`, q.prompt) +
        `<div class="bible-map">${MAP_SVG}${locations
          .map((place) => {
            const { x, y } = bibleMapPoint(place.lon, place.lat);
            return `<button class="map-pin" style="left:${x}%;top:${y}%" data-do="pin" data-place="${esc(place.name)}" aria-label="Map pin"><span></span></button>`;
          })
          .join("")}</div><p class="bible-small">Tap the right pin on the map, or choose a name below.</p><div class="bible-map-key">${choices.map((place) => button(esc(place.name), "pin", `data-place="${esc(place.name)}" class="kg-place"`)).join("")}</div><div id="map-next" class="kg-next"></div>`,
    );
    c.on("pin", (b) => {
      if (solved) return;
      if (b.dataset.place !== q.name) {
        misses++;
        b.classList.add("is-wrong");
        if (b.classList.contains("map-pin")) {
          b.querySelector("span").textContent = b.dataset.place;
          b.setAttribute("aria-label", b.dataset.place);
        } else b.disabled = true;
        c.say(`That’s ${b.dataset.place}. Try again.`, "retry");
        return;
      }
      solved = true;
      c.stage().querySelectorAll(`[data-place="${CSS.escape(q.name)}"]`).forEach((x) => {
        x.classList.add("is-right");
        if (x.classList.contains("map-pin")) x.querySelector("span").textContent = q.name;
      });
      c.stage().querySelectorAll(".kg-place").forEach((x) => (x.disabled = true));
      c.say(`Yes, ${q.name}! ${q.ref}`, "good");
      c.stage().querySelector("#map-next").innerHTML = primary(i === deck.length - 1 ? "See my score" : "Next place", "next");
      c.on("next", () => {
        if (++i === deck.length) c.end(Math.max(25, 100 - misses * 10), "You found six places in the Bible world.");
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
    color = "#2e1a47";
  function render() {
    active = false;
    remaining = 60;
    strokes = [];
    c.step(index, deck.length);
    c.view(
      heading(`Round ${index + 1} of ${deck.length}`, drawing ? "Pass the device to the drawer" : "Pass the device to the actor") +
        `<p>Only the ${drawing ? "drawer" : "actor"} should look now. Everyone else, close your eyes!</p>${button("Show the secret story", "reveal", 'class="kg-btn kg-btn-soft"')}<div class="bible-secret" id="party-secret" hidden><small>Your secret story</small><strong>${esc(deck[index].answer)}</strong>${note(deck[index].ref)}${primary("Hide it and start the timer", "ready")}</div><div id="party-action"></div>`,
    );
    c.say("");
    c.on("reveal", (b) => {
      b.remove();
      c.stage().querySelector("#party-secret").hidden = false;
      c.on("ready", () => {
        c.stage().querySelector("#party-secret").hidden = true;
        active = true;
        c.stage().querySelector("#party-action").innerHTML =
          `<div class="kg-timer"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17"/><circle id="timer-ring" cx="20" cy="20" r="17" pathLength="100"/></svg><p id="party-clock" class="bible-party-clock">60</p></div>${drawing ? '<p>Draw with your finger or a mouse. No letters or numbers!</p><canvas id="bible-drawing" width="700" height="420" aria-label="Drawing pad"></canvas><div class="bible-draw-tools"><span class="kg-swatches" role="group" aria-label="Pen colour">' + ["#2e1a47", "#6b3fa0", "#e8506a", "#2f9e6b", "#2e7fd1", "#f2a91d"].map((col, k) => `<button type="button" class="kg-swatch" data-color="${col}" style="--swatch:${col}" aria-label="Pen colour ${k + 1}" aria-pressed="${k === 0}"></button>`).join("") + "</span>" + button("Undo", "undo") + button("Clear", "clear") + "</div>" : "<p>Act it out without talking. Your team shouts their guesses.</p>"}<div class="bible-party-buttons">${primary("We guessed it!", "correct")}${button("Skip and show the answer", "pass")}</div>`;
        if (drawing) bindCanvas();
        c.on("correct", () => end(true));
        c.on("pass", () => end(false));
      });
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
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      stroke.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      if (stroke.points.length === 1) ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y);
      ctx.stroke();
    }
  }
  function bindCanvas() {
    const canvas = c.stage().querySelector("canvas");
    const point = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * 700) / r.width, y: ((e.clientY - r.top) * 420) / r.height };
    };
    canvas.onpointerdown = (e) => {
      if (c.paused) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      current = { color, points: [point(e)], pointer: e.pointerId };
      strokes.push(current);
      paint();
    };
    canvas.onpointermove = (e) => {
      if (c.paused || !current || current.pointer !== e.pointerId) return;
      current.points.push(point(e));
      paint();
    };
    canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => {
      current = null;
    };
    c.stage().querySelectorAll(".kg-swatch").forEach((s) => {
      s.onclick = () => {
        color = s.dataset.color;
        c.stage().querySelectorAll(".kg-swatch").forEach((x) => x.setAttribute("aria-pressed", String(x === s)));
      };
    });
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
      heading(success ? "Your team got it!" : "The secret story was", deck[index].answer) +
        note(deck[index].ref) +
        primary(index === deck.length - 1 ? "See our score" : "Next player", "next"),
    );
    c.say(success ? "Well played!" : "Time for the next player.", success ? "good" : null);
    c.on("next", () => {
      if (++index === deck.length) c.end((correct / deck.length) * 100, `Your group guessed ${correct} of ${deck.length} stories.`);
      else render();
    });
  }
  c.timer((dt) => {
    if (!active) return;
    remaining = Math.max(0, remaining - dt);
    const el = c.stage().querySelector("#party-clock");
    if (el) el.textContent = String(Math.ceil(remaining));
    const ring = c.stage().querySelector("#timer-ring");
    if (ring) ring.style.strokeDashoffset = String(100 - (remaining / 60) * 100);
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
