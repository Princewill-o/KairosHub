import { lowPolyBlockSVG, lowPolyIslandSVG, lowPolyLabelSVG, lowPolyPlanSVG, lowPolyRouteSVG, lowPolySeaSVG } from "./lowpoly-map.mjs";
import {
  graceGames,
  gameBuildings,
  graceIslands,
  gracePlaces,
  graceStories,
  graceChallenges,
} from "./grace-catalog.mjs";
import { bibleGames } from "./bible/content.mjs";
import { avatarSvg } from "./avatar.mjs";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const post = (action, value) =>
  parent.postMessage(
    { type: "kairos-grace:action", action, value },
    location.origin,
  );
const cards = () =>
  graceGames
    .map(
      (g) =>
        `<a class="grace-site-card" href="#${g.route}"><img src="/assets/games/${g.id}.svg" alt=""><span><strong>${esc(g.name)}</strong><small>${esc(bibleGames.find((b) => b.id === g.id)?.description || "Enter a Bible game")}</small></span><b aria-hidden="true">→</b></a>`,
    )
    .join("");
export function mountGracePage(root, page) {
  let dead = false,
    controller = new AbortController();
  root.innerHTML = `<main class="grace-page"><header class="grace-page-head"><p>THE KAIROS WORLD WEB</p><h1>${{ home: "A little grace. A world to explore.", atlas: "Your world, connected.", social: "There’s a place for you here.", adventures: "Step into the story.", help: "Welcome to Kairos World.", scripture: "Open the Word." }[page]}</h1><span>${{ home: "Play, discover and gather — without leaving your world.", atlas: "Five familiar islands. Every game has a front door.", social: "Welcome to the Social House. Start a conversation or play together.", adventures: "Four Bible worlds to explore and twelve Scripture challenges. Your journey continues where you left it.", help: "Your controls, destinations and Grace apps in one place.", scripture: "Read Scripture alongside your adventures. KJV and NKJV only." }[page]}</span></header><div class="grace-page-content"></div></main>`;
  const area = root.querySelector(".grace-page-content");
  if (page === "help") {
    area.innerHTML =
      '<div class="grace-help-grid"><section><h2>Move and explore</h2><p>Use WASD or arrow keys to walk. Press Space to jump. On a phone, drag the joystick and tap Jump. Zoom with the wheel or − / + controls.</p></section><section><h2>Enter a game</h2><p>Open World atlas, choose LTBS and select Visit building. At its door, press E or tap the entrance prompt. The game opens inside Grace.</p></section><section><h2>Use Grace</h2><p>Choose Games, PlayMessages, Scripture, Character or My journey from the app menu. Close Grace with × or Escape to resume exploring.</p></section><section><h2>Travel between islands</h2><p>Enter a station and board an open train door to choose a Grace Line destination. The World atlas can also take you directly to an island or building entrance.</p></section><section><h2>Meet your neighbours</h2><p>Approach a resident and press F or tap Preach / talk. The Social House also has local conversations and same-screen group games.</p></section><section><h2>Make it yours</h2><p>The Character studio shows your actual 3D explorer. Choose hair, face details, clothes and colours. Your look, games and story progress save for this player on this device.</p></section></div>';
  } else if (page === "home") {
    area.innerHTML = `<section class="grace-feature"><div><span>PLAYMESSAGES · 10 STORIES</span><h2>Your next choice changes the story.</h2><p>Meet a different cast, explore a message and follow your decisions to a conclusion.</p><a href="#messages">Enter the story collection →</a></div><div class="grace-feature-art" role="img" aria-label="An illustrated PlayMessages scene"></div></section><div class="grace-quick-links"><a href="#atlas"><b>01</b> World atlas <small>Find your next destination</small></a><a href="#social"><b>02</b> Social House <small>Conversations & games together</small></a><a href="#character"><b>03</b> Your explorer <small>Build a look of your own</small></a><a href="#journey"><b>04</b> My journey <small>Progress saved on this device</small></a><a href="/#life" target="_top"><b>05</b> Kairos Life <small>Offline mode: be born, grow old, eternity</small></a></div><h2>Find your game</h2><p>Walk into its building on LTBS, or open it here.</p><section class="grace-site-grid">${cards()}</section>`;
  } else if (page === "atlas") {
    let selected = new URLSearchParams(location.search).get("island") || "city";
    function draw() {
      const island =
        graceIslands.find((i) => i.id === selected) || graceIslands[0];
      const places = gracePlaces.filter((p) => p.mapId === island.id);
      area.innerHTML = `<div class="grace-atlas"><svg viewBox="0 0 780 430" role="group" aria-label="Kairos World islands">${lowPolySeaSVG(780, 430, "ga")}${lowPolyRouteSVG("M112 150Q175 190 278 315Q350 225 440 118Q533 82 643 115Q681 205 605 305Q440 363 278 315")}${graceIslands.map((i, k) => `<g role="button" tabindex="0" data-island="${i.id}" aria-label="${i.name}" transform="translate(${i.x} ${i.y})" style="cursor:pointer">${lowPolyIslandSVG({ id: i.id, colour: i.colour, seed: k + 3, active: i.id === island.id })}</g>${lowPolyLabelSVG(i.x, i.y + 74, i.name, { active: i.id === island.id })}`).join("")}</svg><p>GRACE LINE · Train stations connect the islands. Select a destination to travel directly.</p></div><section class="grace-destination"><div><p class="grace-kicker">DESTINATION GUIDE</p><h2>${island.name}</h2><p>${island.description}</p><button class="grace-primary" data-visit="island:${island.id}">Travel to ${island.name} →</button></div><div class="grace-local-plan"><svg viewBox="0 0 520 460" role="img" aria-label="${island.name} building positions">${lowPolyPlanSVG(520, 460, island.colour)}<path d="M250 420V320M150 40V330H360V40" stroke="#120c18" stroke-width="22" fill="none" stroke-linejoin="round"/><path d="M250 420V320M150 40V330H360V40" stroke="#ebe1c9" stroke-width="15" fill="none" stroke-linejoin="round"/>${island.id === "scripture-island" ? `${lowPolyBlockSVG(170, 60, 180, 60, "#6b3fa0", "PlayMessages Theatre")}${gameBuildings.map((b, i) => lowPolyBlockSVG(b.x * 10, b.y * 10, 40, 30, b.colour, String(i + 1))).join("")}` : `${places.map((p) => lowPolyBlockSVG(p.x * 10 - 35, p.y * 10 - 35, 70, 35, "#745185", esc(p.name))).join("")}`}${lowPolyBlockSVG(200, 340, 90, 30, "#2a1d44", "STATION")}</svg></div></section><div class="grace-place-list">${places.map((p, i) => `<article><b>${island.id === "scripture-island" && p.game ? i + 1 : "→"}</b><div><h3>${esc(p.name)}</h3><span>${p.game ? "A real building on LTBS" : "A Kairos World destination"}</span></div><a href="#${p.route}">Open</a><button data-visit="${p.id}">Visit building</button></article>`).join("")}</div>`;
      area.querySelectorAll("[data-island]").forEach((el) => {
        const pick = () => {
          selected = el.dataset.island;
          draw();
        };
        el.onclick = pick;
        el.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick();
          }
        };
      });
      area
        .querySelectorAll("[data-visit]")
        .forEach((el) => (el.onclick = () => post("visit", el.dataset.visit)));
    }
    draw();
  } else if (page === "adventures") {
    area.innerHTML = `<div class="grace-story-grid">${graceStories.map((story) => `<article><img src="/world3d/story-${story.id}-preview.png" alt="An imagined setting for ${story.name}’s story"><div><small>6 CHAPTERS · EXPLORE IN 3D</small><h2>${story.name}</h2><p>${story.theme}</p><button class="grace-primary" data-story="${story.id}">Enter story world →</button></div></article>`).join("")}</div><h2>Scripture trail</h2><p>Short challenges to play right here in Grace.</p><div class="grace-challenge-grid">${graceChallenges.map((c, i) => `<button data-challenge="${c.id}"><b>${String(i + 1).padStart(2, "0")}</b><span>${c.title}</span><small>Open challenge →</small></button>`).join("")}</div>`;
    area
      .querySelectorAll("[data-story]")
      .forEach((b) => (b.onclick = () => post("story", b.dataset.story)));
    area
      .querySelectorAll("[data-challenge]")
      .forEach(
        (b) => (b.onclick = () => post("challenge", b.dataset.challenge)),
      );
  } else if (page === "social") {
    const people = [
      {
        name: "Nia",
        role: "Welcome team",
        colour: "#7954a5",
        opening: "Hey, welcome in. There’s always room at the table.",
        question: "How can I help someone feel included?",
        reply:
          "Learn their name, ask a question, and listen. Invite them to join you without putting them under pressure.",
      },
      {
        name: "Eli",
        role: "Games host",
        colour: "#407c73",
        opening: "Fancy a game with someone beside you?",
        question: "What can we play together?",
        reply:
          "Try Bible Charades or Pictionary. One person acts or draws, and the others guess. You can share this screen.",
      },
      {
        name: "Ama",
        role: "Prayer circle",
        colour: "#b37b43",
        opening: "You don’t have to carry every concern on your own.",
        question: "How do I begin a prayer?",
        reply:
          "Speak honestly to God. Thank Him, say what is on your heart and make time to listen. You can read Philippians 4:6–7 in Scripture.",
      },
    ];
    area.innerHTML = `<div class="grace-social-note">A local fellowship space with story characters. Games together use this screen; live chat and online presence are not connected.</div><div class="grace-social-cast">${people.map((p, i) => `<section><div class="grace-person" style="--person:${p.colour}">${avatarSvg({ skin: ["#a6734d", "#e9c09a", "#482e25"][i], hair: ["braids", "swoop", "puffs"][i], top: p.colour, outfit: ["jacket", "hoodie", "tunic"][i] }, "wave", { label: p.name })}</div><small>${p.role}</small><h2>${p.name}</h2><p data-dialogue="${i}">${p.opening}</p><button data-talk="${i}">${p.question}</button></section>`).join("")}</div><div class="grace-quick-links"><a href="#bible/charades">Bible Charades <small>Act a story with your friends</small></a><a href="#bible/pictionary">Bible Pictionary <small>Draw and guess together</small></a><a href="#scripture">Read Scripture <small>Make space for the Word</small></a><a href="#atlas">Visit the lodge <small>Find the Social House on the map</small></a></div>`;
    area.querySelectorAll("[data-talk]").forEach(
      (el) =>
        (el.onclick = () => {
          const i = Number(el.dataset.talk);
          area.querySelector(`[data-dialogue="${i}"]`).textContent =
            people[i].reply;
          el.textContent = "Conversation heard";
          el.disabled = true;
        }),
    );
  } else if (page === "scripture") {
    area.innerHTML = `<form class="grace-scripture"><label>Book<select name="book"><option value="JHN">John</option><option value="PSA">Psalms</option><option value="GEN">Genesis</option><option value="ROM">Romans</option></select></label><label>Chapter<input name="chapter" type="number" min="1" max="150" value="3" required></label><label>Version<select name="version"><option>KJV</option><option>NKJV</option></select></label><button class="grace-primary">Read chapter</button></form><p class="grace-reader-status" role="status">Choose a chapter to begin.</p><article class="grace-verses"></article>`;
    const form = area.querySelector("form"),
      status = area.querySelector('[role="status"]'),
      verses = area.querySelector("article");
    const text = (part) =>
      typeof part === "string"
        ? part
        : (part?.text ?? (part?.content || []).map(text).join(" "));
    form.onsubmit = async (event) => {
      event.preventDefault();
      const book = form.book.value,
        chapter = Number(form.chapter.value);
      verses.replaceChildren();
      if (form.version.value === "NKJV") {
        status.textContent =
          "NKJV in-app access is not configured. Open the publisher reader for this version.";
        verses.innerHTML = `<a href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(book + " " + chapter)}&version=NKJV" target="_blank" rel="noopener noreferrer">Read NKJV on Bible Gateway →</a>`;
        return;
      }
      status.textContent = "Opening KJV…";
      try {
        const response = await fetch(
          `/api/scripture/${encodeURIComponent(book)}/${chapter}?version=KJV`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok)
          throw Error(data.error || "The chapter could not load.");
        if (dead) return;
        const lines = (data.chapter?.content || []).filter(
          (p) => p.type === "verse",
        );
        status.textContent = `${data.book?.name || book} ${chapter} · KJV`;
        verses.innerHTML = lines
          .map(
            (v) =>
              `<p><sup>${v.number}</sup> ${esc((v.content || []).map(text).join(" "))}</p>`,
          )
          .join("");
      } catch (e) {
        if (!dead) status.textContent = e.message + " Please try again.";
      }
    };
    fetch("/api/scripture/books?version=KJV", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!dead && data.books?.length)
          form.book.innerHTML = data.books
            .map(
              (b) =>
                `<option value="${esc(b.id)}" ${b.id === "JHN" ? "selected" : ""}>${esc(b.name)}</option>`,
            )
            .join("");
      })
      .catch(() => {});
  }
  return {
    dispose() {
      dead = true;
      controller.abort();
    },
  };
}
