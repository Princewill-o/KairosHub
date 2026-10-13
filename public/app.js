import {installScriptureReader} from './scripture.mjs';
import {installColorMode} from './color-mode.mjs';
import {mountLanding} from './landing.mjs';
import { arcade } from './library/app.mjs';
import { mobileTabs } from './library/mobile.mjs';
import { multiplayer } from "./multiplayer.mjs";
import { freshRound } from "./random.mjs";
import { games, verses } from "./content.mjs";
import { freshProgress, recordCompletion } from "./learning-engine.mjs";
import { launchGame } from "./games.mjs";
import { mountBible, readBibleProgress, readBibleMeta } from "./bible/games.mjs";
import { bibleGames } from "./bible/content.mjs";
import { bibleStars } from "./learning-engine.mjs";
import { kai, CHARACTERS, currentCharacter, chooseCharacter } from "./bible/mascot.mjs";
import { accounts } from "./accounts.mjs";
import { mountWelcome, grownUpCheck } from "./welcome.mjs";
const icon = (name, cls = "") =>
  `<img class="icon ${cls}" src="assets/icons/${name}.png" alt="">`;
const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const STORE = "kairos-learning-v2";
let progress = freshProgress(),
  mode = "seeker",
  sound = false,
  theme = "light",
  run = null,
  activeModule = null,
  clock = null,
  storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "null");
  if (saved?.progress && typeof saved.progress.games === "object") {
    progress = { ...freshProgress(), ...saved.progress };
    progress.mastered = Array.isArray(progress.mastered)
      ? progress.mastered
      : [];
    progress.journal = Array.isArray(progress.journal) ? progress.journal : [];
  }
  mode = saved?.mode === "growth" ? "growth" : "seeker";
  sound = !!saved?.sound;
  theme = saved?.theme === "dark" ? "dark" : "light";
} catch {
  storageAvailable = false;
}
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ progress, mode, sound, theme }));
  } catch {
    storageAvailable = false;
  }
}
let audio;
function chime(ok) {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.connect(g);
    g.connect(audio.destination);
    o.type = "sine";
    o.frequency.value = ok ? 660 : 220;
    g.gain.setValueAtTime(0.055, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);
    o.start();
    o.stop(audio.currentTime + 0.3);
  } catch {}
}
function stop() {
  clearInterval(clock);
  clock = null;
  activeModule?.dispose?.();
  activeModule = null;
  run = null;
}
function isKids() {
  return accounts.active()?.band !== "adult";
}
function applyAudience() {
  const p = accounts.active();
  document.documentElement.dataset.audience = p ? (p.band === "adult" ? "adult" : "kids") : "welcome";
  document.title = p?.band === "adult" ? "KairosGames — Bible games" : "KairosGames Kids — Bible games for kids";
}
function welcome() {
  stop();
  const app = document.querySelector("#app");
  mountWelcome(app, {
    onDone: () => {
      applyAudience();
      if (location.hash === "#bible") route();
      else location.hash = "#bible";
    },
  });
}
function currentStreak() {
  const meta = readBibleMeta();
  if (!meta.lastDay) return 0;
  const gap = Math.round((Date.parse(new Date().toLocaleDateString("en-CA")) - Date.parse(meta.lastDay)) / 86400000);
  return gap <= 1 ? Number(meta.streak) || 0 : 0;
}
function streakLabel() {
  const n = currentStreak();
  return n ? `${n}-day streak` : "Start a streak";
}
function header(view = "home") {
  const nav = [["bible", "#bible", "Games"], ["multiplayer", "#multiplayer", "Play together"], ["collection", "#journey", "My journey"]];
  return `<header class="topbar"><a class="brand" href="#bible" aria-label="${isKids() ? "KairosGames Kids" : "KairosGames"} home"><img class="brand-mark" src="assets/brand/dove-badge.svg" alt="" width="48" height="48"><span>Kairos<b>Games</b>${isKids() ? '<i class="kids-tag">Kids</i>' : ""}</span></a><nav class="retro-nav" aria-label="Main navigation">${nav.map(([id, href, label]) => `<a class="nav ${view === id || (id === "bible" && (view === "home" || view === "play")) ? "active" : ""}" href="${href}" ${view === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav><div class="top-tools"><span class="streak" id="streak-pill">${icon("Star")} <span>${streakLabel()}</span></span><a class="player-chip" href="#journey" aria-label="${escapeHtml(accounts.active()?.name || "")}, my journey">${kai("wave", { bust: true })}<span>${escapeHtml(accounts.active()?.name || "")}</span></a><details class="header-settings"><summary>Settings</summary><div class="header-settings-panel"><button type="button" class="theme-toggle" aria-label="Switch to ${theme === "dark" ? "light" : "dark"} mode">${theme === "dark" ? "Use light mode" : "Use dark mode"}</button><button type="button" class="sound-toggle" aria-label="${sound ? "Turn sound off" : "Turn sound on"}" aria-pressed="${sound}">${icon("Sound")}<span class="sound-label">Sound ${sound ? "on" : "off"}</span></button><button type="button" class="logout-button" id="logout-top">Log out</button></div></details></div></header>`;
}
async function logOut() {
  if (isKids() && !(await grownUpCheck(document.body))) return;
  accounts.signOut();
  location.hash = "#welcome";
}
function bindHeader() {
  document.querySelector('#app').insertAdjacentHTML('beforeend',mobileTabs());
  const settings = document.querySelector(".header-settings");
  settings?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      settings.open = false;
      settings.querySelector("summary").focus();
    }
  });
  settings?.addEventListener("focusout", (e) => {
    if (!settings.contains(e.relatedTarget)) settings.open = false;
  });
  const top = document.querySelector("#logout-top");
  if (top) top.onclick = logOut;
  const modeSelect = document.querySelector("#mode");
  if (modeSelect)
    modeSelect.onchange = (e) => {
      mode = e.target.value;
      save();
    };
  document.querySelector(".sound-toggle").onclick = (e) => {
    sound = !sound;
    save();
    e.currentTarget.setAttribute("aria-pressed", sound);
    e.currentTarget.setAttribute(
      "aria-label",
      sound ? "Turn sound off" : "Turn sound on",
    );
    e.currentTarget.querySelector(".sound-label").textContent = `Sound ${sound ? "on" : "off"}`;
    if (sound) chime(true);
  };
  document.documentElement.dataset.theme=theme;
  const themeButton = document.querySelector(".theme-toggle");
  if (themeButton) themeButton.onclick = (e) => { theme = theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = theme; e.currentTarget.textContent=theme==='dark'?'Use light mode':'Use dark mode'; e.currentTarget.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`); save(); };
}
function footer() {
  return `<footer><span>Rooted in Scripture. Made for curious hearts.</span><span>${storageAvailable ? "Progress saved on this device." : "Storage unavailable — progress lasts for this visit."}</span></footer>`;
}
function world() {
  return `<div class="world" aria-label="A pixel-art garden village"><div class="river"></div><div class="path"></div>${[
    [-1, 6],
    [16, -12],
    [72, -9],
    [84, 18],
    [6, 54],
    [77, 62],
  ]
    .map(
      ([x, y]) =>
        `<img class="tree pixel" style="left:${x}%;top:${y}%" src="assets/fantasy/Oak_Tree.png" alt="">`,
    )
    .join(
      "",
    )}<img class="cottage pixel" src="assets/fantasy/House_1_Wood_Base_Blue.png" alt=""><img class="traveller pixel" src="assets/fantasy/player.png" alt=""><img class="sheep pixel" src="assets/fantasy/sheep.png" alt=""><img class="chicken pixel" src="assets/fantasy/chicken.png" alt=""><span class="world-label">A little place to grow.</span></div>`;
}

function classics() {
  stop();
  document.querySelector("#app").innerHTML =
    `${header()}<main><section class="play-welcome"><div><span class="eyebrow">CHOOSE YOUR NEXT ADVENTURE</span><h1>A little play. <em>A bigger story.</em></h1><p>Explore a new meadow, discover a fresh question, or gather your friends.</p></div><button class="secondary" id="surprise">Surprise me →</button></section><section class="featured-games" aria-label="New games"><a class="feature-card feature-meadow" href="#play/shepherd"><div class="feature-scene">${world()}</div><div class="feature-copy"><span class="eyebrow">NEW · 2D ADVENTURE</span><h2>Shepherd’s Meadow</h2><p>WASD / arrows to explore. Bring every sheep home.</p><span class="feature-cta">Enter the meadow →</span></div></a><a class="feature-card feature-scrolls" href="#play/scrolls"><div class="feature-art">${icon("Papyrus")}${icon("Books")}</div><div class="feature-copy"><span class="eyebrow">NEW · 2D ADVENTURE</span><h2>Scroll Quest</h2><p>A new map. Six scrolls. Fresh Bible discoveries.</p><span class="feature-cta">Start your quest →</span></div></a><a class="feature-card feature-party" href="#multiplayer"><div class="feature-art">${icon("Players")}</div><div class="feature-copy"><span class="eyebrow">NEW · 2–8 PLAYERS ONLINE</span><h2>Guess the Chapter</h2><p>Describe the story. Keep the chapter secret.</p><span class="feature-cta">Create or join a room →</span></div></a></section><section class="library"><div class="section-heading"><div><span class="eyebrow">PICK A PATH</span><h2>What will you discover today?</h2></div><span class="count">${Object.keys(progress.games).length} / ${games.length} solo games explored</span></div><div class="game-grid">${games.filter(g=>!["shepherd","scrolls"].includes(g.id))
      .map((g, i) => {
        const played = progress.games[g.id];
        return `<a class="game-card ${g.color}" href="#play/${g.id}"><div class="card-art">${icon(g.icon)}<span class="card-number">${String(i + 1).padStart(2, "0")}</span>${played ? `<span class="progress-ring" style="--progress:${played.best}%" aria-label="Best score ${played.best} percent"><b>${played.best}</b></span>` : ""}</div><div class="card-copy"><span class="tag">${g.tag}</span><h3>${g.title}</h3><p>${g.goal}</p><div class="card-bottom"><span>${played ? "Play again" : "Start exploring"}</span><span class="round-arrow">→</span></div></div></a>`;
      })
      .join("")}</div></section>${footer()}</main>`;
  bindHeader();
  document.querySelector("#surprise").onclick = () => {location.hash="play/"+freshRound("surprise-game",games,1)[0].id;};
}
function home(view='home') {
 stop();
 document.querySelector('#app').innerHTML=`${header("bible")}<main id="bible-root"></main>`;
 bindHeader();
 activeModule=mountBible(document.querySelector('#bible-root'));
}
function characterPage() {
  stop();
  let chosen = currentCharacter();
  document.querySelector("#app").innerHTML =
    `${header("collection")}<main class="kg-picker"><a href="#bible" class="kg-back">Games</a><header class="kg-picker-head"><h1>Choose your character</h1><p>Your character joins you in every game, cheers when you get it right and helps when you get stuck. You can change it at any time.</p></header><div class="kg-picker-layout"><section class="kg-picker-stage" aria-live="polite"><div id="picker-preview" class="kg-picker-preview"></div><h2 id="picker-name"></h2><p id="picker-about"></p><a class="kg-btn kg-btn-gold" href="#bible" id="picker-go">Play with ${escapeHtml(chosen.name)}</a></section><div class="kg-picker-grid" role="radiogroup" aria-label="Characters">${CHARACTERS.map(
      (c) => `<button type="button" role="radio" class="kg-picker-card" data-character="${c.id}" aria-checked="${c.id === chosen.id}" tabindex="${c.id === chosen.id ? 0 : -1}" style="--card-tint:${c.top}"><span class="kg-picker-art">${kai("wave", { character: c.id })}</span><strong>${escapeHtml(c.name)}</strong></button>`,
    ).join("")}</div></div><p class="kg-picker-status" id="picker-status" role="status"></p>${footer()}</main>`;
  bindHeader();
  const show = (c, celebrate) => {
    document.querySelector("#picker-preview").innerHTML = kai(celebrate ? "cheer" : "wave", { character: c.id, label: `${c.name}, your character` });
    document.querySelector("#picker-name").textContent = c.name;
    document.querySelector("#picker-about").textContent = c.about;
    document.querySelector("#picker-go").textContent = `Play with ${c.name}`;
  };
  const cards = [...document.querySelectorAll(".kg-picker-card")];
  const pick = (card, focus = false) => {
    const c = CHARACTERS.find((x) => x.id === card.dataset.character);
    chosen = c;
    cards.forEach((b) => {
      b.setAttribute("aria-checked", String(b === card));
      b.tabIndex = b === card ? 0 : -1;
    });
    if (focus) card.focus();
    const saved = chooseCharacter(c.id);
    show(c, true);
    document.querySelector("#picker-status").textContent = saved
      ? `${c.name} will join you in every game.`
      : `${c.name} will join you until you close the page, because storage is turned off.`;
  };
  cards.forEach((card, i) => {
    card.onclick = () => pick(card);
    card.onkeydown = (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      pick(cards[(i + step + cards.length) % cards.length], true);
    };
  });
  show(chosen, false);
}
function collection() {
  stop();
  const records = readBibleProgress();
  const played = bibleGames.filter((g) => records[g.id]?.runs);
  const stars = bibleGames.reduce((n, g) => n + bibleStars(records[g.id]), 0);
  const rounds = bibleGames.reduce((n, g) => n + (Number(records[g.id]?.runs) || 0), 0);
  const streak = currentStreak();
  const starImgs = (n) => [0, 1, 2].map((i) => `<img src="assets/ui/yellow-star-filled.png" alt="" class="${i < n ? "on" : "off"}">`).join("");
  const next = bibleGames.filter((g) => !records[g.id]?.runs).slice(0, 3);
  document.querySelector("#app").innerHTML =
    `${header("collection")}<main class="collection kg-journey"><header class="kg-journey-head"><div><h1>${escapeHtml(accounts.active()?.name || "My")}’s journey</h1><p>Every game you finish earns stars. Come back each day to grow your streak.</p></div>${kai(played.length ? "cheer" : "wave", { cls: "kg-journey-kai" })}</header><a class="kg-my-character" href="#character">${kai("wave", { bust: true })}<span><small>Your character</small><strong>${escapeHtml(currentCharacter().name)}</strong></span><span class="kg-my-character-cta">Change</span></a><div class="kg-account-actions"><button type="button" class="kg-switch-player" id="switch-player">Switch player</button><button type="button" class="kg-switch-player kg-logout" id="logout-journey">Log out</button></div><div class="stat-grid"><article>${icon("Star")}<b>${stars}<small>/${bibleGames.length * 3}</small></b><span>stars earned</span></article><article>${icon("Flag")}<b>${played.length}<small>/${bibleGames.length}</small></b><span>games played</span></article><article>${icon("Clock")}<b>${streak}</b><span>day${streak === 1 ? "" : "s"} in a row</span></article><article>${icon("trophy")}<b>${rounds}</b><span>games finished</span></article></div>${
      played.length
        ? `<section class="journal-section"><h2>Games I’ve played</h2><div class="kg-journey-grid">${played
            .map((g) => `<a class="kg-journey-card" href="#bible/${g.id}" style="--game-tint:${g.color}"><img class="kg-icon" src="assets/icons/${g.icon}.png" alt=""><span><strong>${escapeHtml(g.title)}</strong><small>Best ${Number(records[g.id].best) || 0}% · played ${Number(records[g.id].runs) || 0} time${Number(records[g.id].runs) === 1 ? "" : "s"}</small></span><span class="kg-stars small" role="img" aria-label="${bibleStars(records[g.id])} of 3 stars">${starImgs(bibleStars(records[g.id]))}</span></a>`)
            .join("")}</div></section>`
        : `<div class="empty-state kg-empty-journey">${kai("read", { cls: "kg-empty-kai" })}<p>Your journey starts with your first game.</p><a class="kg-btn kg-btn-gold" href="#bible">Choose a game</a></div>`
    }${
      next.length && played.length
        ? `<section class="journal-section"><h2>Try something new</h2><div class="kg-journey-grid">${next.map((g) => `<a class="kg-journey-card is-new" href="#bible/${g.id}" style="--game-tint:${g.color}"><img class="kg-icon" src="assets/icons/${g.icon}.png" alt=""><span><strong>${escapeHtml(g.title)}</strong><small>${escapeHtml(g.tag)}</small></span></a>`).join("")}</div></section>`
        : ""
    }${
      progress.journal.length
        ? `<section class="journal-section"><h2>My reflections</h2>${progress.journal
            .slice()
            .reverse()
            .map((j) => `<article class="journal-entry"><small>${escapeHtml(j.day)} · ${escapeHtml(j.title)}</small><p>${escapeHtml(j.text)}</p></article>`)
            .join("")}</section>`
        : ""
    }${footer()}</main>`;
  bindHeader();
  document.querySelector("#switch-player").onclick = logOut;
  document.querySelector("#logout-journey").onclick = logOut;
}
function play(id) {
  stop();
  const g = games.find((x) => x.id === id);
  if (!g) {
    home();
    return;
  }
  run = { id, seconds: 0, paused: false, done: false };
  document.querySelector("#app").innerHTML =
    `${header("play")}<main class="play-main"><div class="play-top"><a href="#" class="back-link">← Library</a><span class="eyebrow">${g.tag} · ${mode === "growth" ? "GROWTH MODE" : "SEEKER / KIDS"}</span><button class="secondary small" id="pause">Pause</button></div><section class="play-shell ${g.color}"><div class="play-heading">${icon(g.icon)}<div><h1>${g.title}</h1><p>${g.goal}</p></div><div class="game-score"><span id="run-score">Let’s begin</span><small id="elapsed">${mode === "growth" ? "0:00 elapsed" : "Take your time"}</small></div></div><div class="timer-track" ${mode === "seeker" ? "hidden" : ""}><i id="elapsed-bar"></i></div><div id="stage"></div><div class="feedback" id="feedback" role="status" aria-live="polite">${mode === "growth" ? "A little challenge. Learning matters more than speed." : "No timer. Explore, try, and try again."}</div><div class="pause-cover" hidden><h2>A moment to breathe.</h2><p>Your game is paused.</p><button class="primary" id="resume">Keep exploring</button></div></section>${footer()}</main>`;
  bindHeader();
  const ctx = {
    mode,
    get elapsed() {
      return run?.seconds || 0;
    },
    get progress() {
      return progress;
    },
    stage: document.querySelector("#stage"),
    icon,
    escape: escapeHtml,
    feedback: (message, ok = null) => {
      const el = document.querySelector("#feedback");
      if (!el) return;
      el.textContent = message;
      el.className =
        "feedback " + (ok === true ? "good" : ok === false ? "retry" : "");
      if (ok !== null) chime(ok);
    },
    hud: (text) => {
      const el = document.querySelector("#run-score");
      if (el) el.textContent = text;
    },
    saveGarden: (garden) => {
      progress.garden = garden;
      save();
    },
    complete: (result) => complete(g, result),
  };
  activeModule = launchGame(id, ctx);
  const pause = () => {
    if (!run || run.done) return;
    run.paused = !run.paused;
    document.querySelector(".pause-cover").hidden = !run.paused;
    document.querySelector("#stage").inert = run.paused;
    document.querySelector("#pause").textContent = run.paused
      ? "Resume"
      : "Pause";
    document.querySelector("#stage").classList.toggle("paused", run.paused);
    activeModule?.pause?.(run.paused);
    if (run.paused) document.querySelector("#resume").focus();
  };
  document.querySelector("#pause").onclick = pause;
  document.querySelector("#resume").onclick = pause;
  clock = setInterval(() => {
    if (!run || run.paused || run.done || document.hidden) return;
    run.seconds++;
    if (mode === "growth") {
      document.querySelector("#elapsed").textContent =
        `${Math.floor(run.seconds / 60)}:${String(run.seconds % 60).padStart(2, "0")} elapsed`;
      document.querySelector("#elapsed-bar").style.width =
        Math.min(100, (run.seconds / 180) * 100) + "%";
    }
    activeModule?.tick?.();
  }, 1000);
}
function complete(
  g,
  { score = 100, covered = [], mastered = [], details = "" },
) {
  if (!run || run.done) return;
  run.done = true;
  clearInterval(clock);
  activeModule?.dispose?.();
  score = Math.round(Math.max(0, Math.min(100, score)));
  const day = new Date().toLocaleDateString("en-CA");
  progress = recordCompletion(progress, g.id, score, mastered, day);
  save();
  const next =
    games[(games.findIndex((x) => x.id === g.id) + 1) % games.length];
  document.querySelector("#pause").hidden = true;
  document.querySelector(".timer-track").hidden = true;
  document.querySelector("#feedback").hidden = true;
  document.querySelector("#stage").innerHTML =
    `<div class="result"><img class="result-star" src="assets/ui/yellow-star-filled.png" alt=""><span class="eyebrow">ANOTHER LITTLE STEP FORWARD</span><h2>Good things take root.</h2><div class="result-score">${score}<small>/ 100</small></div><p>${escapeHtml(details || "You explored, practised, and made room to grow.")}</p><div class="passage-result"><span class="eyebrow">SCRIPTURE EXPLORED</span><p>${escapeHtml(covered.length ? covered.join(" · ") : g.ref)}</p></div><div class="reflect"><h3>Take a moment.</h3><p>${g.reflect}</p><label for="reflection">Your reflection <small>(optional, saved on this device)</small></label><textarea id="reflection" rows="3" maxlength="1200" placeholder="One thought I want to carry with me…"></textarea><button class="secondary small" id="save-note">Save reflection</button><span id="note-status" role="status"></span></div><div class="result-actions"><button class="secondary" id="retry">Play again</button><a class="primary" href="#play/${next.id}">Next game →</a><a class="text-link" href="#">Back to library</a></div></div>`;
  document.querySelector("#run-score").textContent = `${score} points`;
  document.querySelector("#retry").onclick = () => play(g.id);
  document.querySelector("#save-note").onclick = () => {
    const field = document.querySelector("#reflection"),
      text = field.value.trim();
    if (!text) {
      document.querySelector("#note-status").textContent =
        "Write a thought first.";
      return;
    }
    progress.journal.push({ day, title: g.title, text });
    save();
    document.querySelector("#note-status").textContent = storageAvailable
      ? "Reflection saved."
      : "Kept for this visit; browser storage is unavailable.";
    document.querySelector("#save-note").disabled = true;
    field.readOnly = true;
  };
  chime(true);
  document.querySelector(".result h2").setAttribute("tabindex", "-1");
  document.querySelector(".result h2").focus();
}
function party(code="") {
  stop();
  document.querySelector("#app").innerHTML=`${header("multiplayer")}<main class="party-main"><div id="party-root"></div>${footer()}</main>`;
  bindHeader();
  activeModule=multiplayer(document.querySelector("#party-root"),code);
}
function route() {
  const hash = location.hash.slice(1);
  if (!hash || hash === 'landing') {
    stop();
    document.documentElement.dataset.audience = 'landing';
    activeModule = mountLanding(document.querySelector('#app'));
    window.scrollTo(0,0);
    return;
  }
  if (hash === "welcome") {
    welcome();
    window.scrollTo(0, 0);
    return;
  }
  if (!accounts.active()) {
    location.replace("#welcome");
    welcome();
    return;
  }
  applyAudience();
  if(hash.startsWith("unity/")){location.replace('#bible');return;}
  else if (hash === "bible" || hash.startsWith("bible/")) {
    stop();
    document.querySelector("#app").innerHTML = `${header("bible")}<main id="bible-root"></main>`;
    bindHeader();
    activeModule = mountBible(document.querySelector("#bible-root"), hash.slice(6));
  }
  else if (hash==="multiplayer") party();
  else if(/^room\/[A-Z2-9]{6}$/.test(hash)) party(hash.slice(5));
  else if (hash.startsWith("arcade/") || hash.startsWith("play/")) location.replace("#bible");
  else if(hash==="profile") collection();
  else if(hash==="classics") location.replace("#bible");
  else if (hash === "journey") collection();
  else if (hash === "character") characterPage();
  else home();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
window.addEventListener("kairos:feedback", (e) => chime(!!e.detail?.ok));
window.addEventListener("kairos:bible-complete", () => {
  const pill = document.querySelector("#streak-pill span");
  if (pill) pill.textContent = streakLabel();
});
route();
installColorMode(theme,value=>{theme=value;save();});

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});

installScriptureReader(document.querySelector("#app"));
