import {installScriptureReader} from './scripture.mjs';
import { arcade } from './library/app.mjs';
import { mobileTabs } from './library/mobile.mjs';
import { multiplayer } from "./multiplayer.mjs";
import { freshRound } from "./random.mjs";
import { games, verses } from "./content.mjs";
import { freshProgress, recordCompletion } from "./learning-engine.mjs";
import { launchGame } from "./games.mjs";
import { mountBible } from "./bible/games.mjs";
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
function header(view = "home") {
  return `<header class="topbar"><a class="brand" href="#bible" aria-label="KairosGames home"><span>KairosGames</span></a><nav class="retro-nav" aria-label="Main navigation"><a class="nav ${view === "home" || view === "bible" ? "active" : ""}" href="#bible">Games</a><a class="nav ${view === "multiplayer" ? "active" : ""}" href="#multiplayer">Play together</a><a class="nav ${view === "collection" ? "active" : ""}" href="#journey">My journey</a></nav><div class="top-tools"><span class="streak">${icon("Star")} ${progress.streak} day streak</span><select id="mode" aria-label="Difficulty mode" ${view === "play" ? "disabled" : ""}><option value="seeker" ${mode === "seeker" ? "selected" : ""}>Seeker / Kids</option><option value="growth" ${mode === "growth" ? "selected" : ""}>Growth</option></select><button class="theme-toggle" aria-label="Switch theme">${theme === "dark" ? "Light" : "Dark"}</button><button class="sound-toggle" aria-label="${sound ? "Mute" : "Enable"} sound" aria-pressed="${sound}">${icon("Sound")}</button></div></header>`;
}
function bindHeader() {
  document.querySelector('#app').insertAdjacentHTML('beforeend',mobileTabs());
  document.querySelector("#mode").onchange = (e) => {
    mode = e.target.value;
    save();
  };
  document.querySelector(".sound-toggle").onclick = (e) => {
    sound = !sound;
    save();
    e.currentTarget.setAttribute("aria-pressed", sound);
    e.currentTarget.setAttribute(
      "aria-label",
      sound ? "Mute sound" : "Enable sound",
    );
    if (sound) chime(true);
  };
  document.documentElement.dataset.theme=theme;
  document.querySelector(".theme-toggle").onclick = (e) => { theme = theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = theme; e.currentTarget.textContent=theme==='dark'?'Light':'Dark';save(); };
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
function collection() {
  stop();
  document.querySelector("#app").innerHTML =
    `${header("collection")}<main class="collection"><span class="eyebrow">ONE SMALL STEP AT A TIME</span><h1>Your journey is growing.</h1><div class="stat-grid"><article>${icon("Star")}<b>${progress.streak}</b><span>day streak</span></article><article>${icon("Flag")}<b>${Object.keys(progress.games).length}/${games.length}</b><span>games explored</span></article><article>${icon("Books")}<b>${progress.mastered.length}</b><span>verses mastered</span></article><article>${icon("Plant")}<b>${Math.round((Object.values(progress.garden).reduce((a, b) => a + b, 0) / 27) * 100)}%</b><span>garden grown</span></article></div><section class="journal-section"><h2>Verses I know</h2><p class="muted">Earn a verse here with a perfect Growth reconstruction or a perfect final Psalm pass.</p>${
      progress.mastered.length
        ? progress.mastered
            .map((id) => verses.find((v) => v.id === id))
            .filter(Boolean)
            .map(
              (v) =>
                `<blockquote>${v.text}<cite>${v.reference} · ${v.translation}</cite></blockquote>`,
            )
            .join("")
        : '<div class="empty-state">Every familiar verse starts with a first attempt.<br><a href="#play/verse">Try Verse Rebuild →</a></div>'
    }</section><section class="journal-section"><h2>Little reflections</h2><p class="muted">Private notes saved in this browser after you play.</p>${
      progress.journal.length
        ? progress.journal
            .slice()
            .reverse()
            .map(
              (j) =>
                `<article class="journal-entry"><small>${escapeHtml(j.day)} · ${escapeHtml(j.title)}</small><p>${escapeHtml(j.text)}</p></article>`,
            )
            .join("")
        : '<div class="empty-state">Your reflections will appear here.</div>'
    }</section>${footer()}</main>`;
  bindHeader();
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
  else if(hash==="profile") home("profile");
  else if(hash==="classics") location.replace("#bible");
  else if (hash === "journey") collection();
  else home();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});

installScriptureReader(document.querySelector("#app"));
