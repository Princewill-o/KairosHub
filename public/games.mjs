import { shuffleWith } from "./random.mjs";
import {createReplayDecks} from "./bible/replay.mjs";
import {accounts} from "./accounts.mjs";
const freshRound=createReplayDecks({playerId:()=>accounts.active()?.id});
import { armorAlternates, fruitAlternates } from "./extra-content.mjs";
import { adventureGame } from "./adventure.mjs";
import {
  verses,
  prayers as prayerBank,
  arcs as arcBank,
  parables as parableBank,
  timeline,
  armor as armorBank,
  wisdom,
  cities,
  journey as journeyBank,
  fruits,
} from "./content.mjs";
import {
  tokenize,
  gradeOrder,
  scoreRun,
  shuffle,
  gardenGrowth,
  psalmBlanks,
} from "./learning-engine.mjs";
const $ = (c, s) => c.stage.querySelector(s);
const all = (c, s) => [...c.stage.querySelectorAll(s)];
const listen = (c, s, fn) =>
  all(c, s).forEach((el) =>
    el.addEventListener("click", () => fn(el.dataset, el)),
  );
const instruction = (title, text) =>
  `<div class="instruction"><h2>${title}</h2><p>${text}</p></div>`;
const button = (text, id, primary = true) =>
  `<button class="${primary ? "primary" : "secondary"}" id="${id}">${text}</button>`;
const choices = (items, attr = "answer") =>
  `<div class="choices">${shuffleWith(items.map((text, id) => ({text,id}))).map(({text,id}, i) => `<button class="choice" data-${attr}="${id}"><span class="choice-letter">${String.fromCharCode(65 + i)}</span><span>${text}</span></button>`).join("")}</div>`;
function picker(c, pool, render) {
  const items = freshRound("passages-" + pool.length, pool, 3);
  c.stage.innerHTML =
    instruction(
      "Choose a passage",
      "A fresh selection each visit. Choose one, or draw another selection.",
    ) +
    `<div class="passage-picker">${items.map((v, i) => `<button class="choice" data-passage="${i}">${c.icon("Papyrus")}<span><strong>${v.reference}</strong><small>${v.translation} · ${v.text.split(" ").length} words</small></span><span>→</span></button>`).join("")}</div><div class="game-actions">${button("Another selection", "redraw-passages", false)}</div>`;
  listen(c, "[data-passage]", (d) => render(items[+d.passage]));
  $(c, "#redraw-passages").onclick = () => picker(c, pool, render);
}
function verseGame(c) {
  let mistakes = 0;
  picker(c, verses, start);
  function start(v) {
    const expected = tokenize(v.text, c.mode),
      tokens = expected.map((text, id) => ({ id, text }));
    if (c.mode === "growth")
      tokens.push(
        { id: tokens.length, text: "always" },
        { id: tokens.length + 1, text: "never" },
      );
    let slots = expected.map(() => null),
      locked = [],
      selected = null;
    let order = shuffle(tokens);
    function place(id, at) {
      if (locked[at] || slots[at] !== null) return;
      const prev = slots.indexOf(id);
      if (prev >= 0) slots[prev] = null;
      slots[at] = id;
      selected = null;
      render();
    }
    function render() {
      c.stage.innerHTML =
        instruction(
          v.reference + ` <small>${v.translation}</small>`,
          c.mode === "seeker"
            ? "Tap a phrase to add it. Tap a filled slot to return it, or drag a phrase into a slot."
            : "Rebuild the exact verse. Two extra words do not belong. Select a word, then a slot, or drag it.",
        ) +
        `<div class="rebuild-slots" aria-label="Verse slots">${slots.map((id, i) => `<button class="word-slot ${locked[i] ? "locked" : ""}" data-slot="${i}" ${locked[i] ? "disabled" : ""} aria-label="Slot ${i + 1}${id !== null ? ": " + c.escape(tokens[id].text) : ", empty"}">${id !== null ? c.escape(tokens[id].text) : `<span>${i + 1}</span>`}</button>`).join("")}</div><div class="word-tray" aria-label="Shuffled word tray">${order
          .filter((t) => !slots.includes(t.id))
          .map(
            (t) =>
              `<button class="word-tile ${selected === t.id ? "selected" : ""}" draggable="true" data-token="${t.id}">${c.escape(t.text)}</button>`,
          )
          .join(
            "",
          )}</div><div class="game-actions">${button("Check my verse", "check")}${button("Hear the reference", "hint", false)}</div>`;
      c.hud(
        `${slots.filter((x) => x !== null).length} / ${expected.length} placed`,
      );
      listen(c, "[data-token]", (d) => {
        const id = +d.token;
        const at = slots.indexOf(null);
        if (at >= 0) place(id, at);
        else {
          selected = id;
          render();
        }
      });
      listen(c, "[data-slot]", (d) => {
        const i = +d.slot;
        if (selected !== null) place(selected, i);
        else {
          slots[i] = null;
          render();
        }
      });
      all(c, "[data-token]").forEach(
        (el) =>
          (el.ondragstart = (e) =>
            e.dataTransfer.setData("text/plain", el.dataset.token)),
      );
      all(c, "[data-slot]").forEach((el) => {
        el.ondragover = (e) => e.preventDefault();
        el.ondrop = (e) => {
          e.preventDefault();
          const id = Number(e.dataTransfer.getData("text/plain"));
          if (Number.isInteger(id) && tokens[id]) place(id, +el.dataset.slot);
        };
      });
      $(c, "#hint").onclick = () =>
        c.feedback(
          `The passage is ${v.reference}, ${v.translation}. Read it in your Bible, then try again.`,
        );
      $(c, "#check").onclick = () => {
        if (slots.includes(null)) {
          c.feedback("Fill every slot before checking.", false);
          return;
        }
        locked = gradeOrder(
          expected,
          slots.map((id) => tokens[id]?.text),
        );
        if (locked.every(Boolean)) {
          const score = scoreRun(mistakes, c.elapsed, c.mode);
          c.stage.innerHTML =
            instruction(
              "Words to carry with you",
              v.reference + ` · ${v.translation}`,
            ) +
            `<blockquote>${v.text}</blockquote><p class="center muted">The full passage, exactly as it appears in the KJV.</p><div class="game-actions">${button("Reflect & finish", "finish")}</div>`;
          $(c, "#finish").onclick = () =>
            c.complete({
              score,
              covered: [v.reference + " · " + v.translation],
              mastered: c.mode === "growth" && mistakes === 0 ? [v.id] : [],
              details: "You rebuilt the passage, one word at a time.",
            });
          c.feedback("Your verse is in order.", true);
        } else {
          const wrong = locked.filter((x) => !x).length;
          mistakes += wrong;
          slots = slots.map((x, i) => (locked[i] ? x : null));
          render();
          c.feedback(
            `${wrong} ${wrong === 1 ? "tile needs" : "tiles need"} another look. The correct tiles stay golden.`,
            false,
          );
        }
      };
    }
    render();
  }
  return {};
}
function prayerGame(c) {
  const prayers = freshRound("prayer-scenarios", prayerBank, 3);
  let index = 0,
    selected = null,
    placed = {},
    deck = shuffle([0, 1, 2, 3]),
    done = false;
  const categories = [
    "Adoration",
    "Confession",
    "Thanksgiving",
    "Supplication",
  ];
  function place(i, cat) {
    if (done || placed[cat] !== undefined) return;
    const line = prayers[index].lines[i];
    if (line[0] !== cat) {
      c.feedback(
        `That line is ${line[0].toLowerCase()}. Give it another home — no points lost.`,
        false,
      );
      $(c, `[data-quadrant="${cat}"]`).classList.add("shake");
      return;
    }
    placed[cat] = i;
    selected = null;
    render();
    c.feedback(
      `${cat}: ${["praising who God is", "acknowledging where we fall short", "giving thanks for his gifts", "asking for help"][categories.indexOf(cat)]}.`,
      true,
    );
  }
  function render() {
    const scenario = prayers[index];
    done = Object.keys(placed).length === 4;
    c.hud(`Prayer ${index + 1} / ${prayers.length}`);
    c.stage.innerHTML =
      instruction(
        "Find a place for each line",
        "Choose a prayer line, then its compass point. You can also drag it into place.",
      ) +
      `<div class="compass"><div class="scenario-center">${c.icon("Heart")}<span class="eyebrow">A MOMENT TO PRAY</span><p>${scenario.scenario}</p></div>${categories.map((cat, i) => `<button class="quadrant q${i} ${placed[cat] !== undefined ? "filled" : ""}" data-quadrant="${cat}"><span class="compass-letter">${cat[0]}</span><strong>${cat}</strong><small>${placed[cat] !== undefined ? scenario.lines[placed[cat]][1] : ["Praise God’s character", "Be honest before God", "Notice his gifts", "Ask for help"][i]}</small></button>`).join("")}</div>${
        done
          ? `<div class="prayer-readback"><h3>A prayer, brought together.</h3><p>${categories.map((cat) => scenario.lines[placed[cat]][1]).join(" ")}</p><div class="game-actions">${button("Read prayer aloud", "speak", false)}${button(index === prayers.length - 1 ? "Reflect & finish" : "Next scenario", "next")}</div></div>`
          : `<div class="prayer-tray">${deck
              .filter((i) => !Object.values(placed).includes(i))
              .map(
                (i) =>
                  `<button class="prayer-line ${selected === i ? "selected" : ""}" data-line="${i}" draggable="true">${scenario.lines[i][1]}</button>`,
              )
              .join("")}</div>`
      }`;
    listen(c, "[data-line]", (d) => {
      selected = +d.line;
      render();
    });
    listen(c, "[data-quadrant]", (d) => {
      if (selected === null)
        c.feedback("Choose a prayer line from the tray first.");
      else place(selected, d.quadrant);
    });
    all(c, "[data-line]").forEach(
      (el) =>
        (el.ondragstart = (e) =>
          e.dataTransfer.setData("text/plain", el.dataset.line)),
    );
    all(c, "[data-quadrant]").forEach((el) => {
      el.ondragover = (e) => e.preventDefault();
      el.ondrop = (e) => {
        e.preventDefault();
        const i = Number(e.dataTransfer.getData("text/plain"));
        if (i >= 0 && i < 4) place(i, el.dataset.quadrant);
      };
    });
    if (done) {
      $(c, "#speak").onclick = () => {
        if (!("speechSynthesis" in window)) {
          c.feedback("Read the complete prayer above at your own pace.");
          return;
        }
        speechSynthesis.cancel();
        speechSynthesis.speak(
          new SpeechSynthesisUtterance(
            categories.map((cat) => scenario.lines[placed[cat]][1]).join(" "),
          ),
        );
      };
      $(c, "#next").onclick = () => {
        window.speechSynthesis?.cancel();
        if (++index === prayers.length)
          c.complete({
            score: 100,
            covered: ["Matthew 6:9–13"],
            details:
              "You practised ACTS: Adoration, Confession, Thanksgiving, and Supplication. These prayer lines are original examples, not Bible quotations.",
          });
        else {
          placed = {};
          selected = null;
          deck = shuffle([0, 1, 2, 3]);
          render();
        }
      };
    }
  }
  render();
  return {
    pause: (paused) => {
      if (paused) window.speechSynthesis?.pause();
      else window.speechSynthesis?.resume();
    },
    dispose: () => window.speechSynthesis?.cancel(),
  };
}
function sandalsGame(c) {
 const arcs=shuffle(arcBank);
  let arc,
    index = 0,
    canonCount = 0;
  function chooseArc() {
    c.stage.innerHTML =
      instruction(
        "Whose story will you enter?",
        "Explore what Scripture records, and clearly marked imagined alternatives.",
      ) +
      `<div class="arc-picker">${arcs.map((a, i) => `<button class="arc-card" data-arc="${i}"><span class="portrait"><img src="assets/fantasy/player.png" alt=""></span><strong>${a.name}</strong><span>${a.title}</span><small>${a.ref}</small></button>`).join("")}</div><p class="center muted fine">The younger son is a character in Jesus’ parable. Pixel scenes are imaginative illustrations, not historical reconstructions.</p>`;
    listen(c, "[data-arc]", (d) => {
      arc = arcs[+d.arc];
      render();
    });
  }
  function background() {
    return `<div class="story-land"><img class="story-tree" src="assets/fantasy/Oak_Tree.png" alt=""><img class="story-house" src="assets/fantasy/House_1_Wood_Base_Blue.png" alt=""><img class="story-person" src="assets/fantasy/player.png" alt=""></div>`;
  }
  function render() {
    const s = arc.scenes[index];
    c.hud(`Scene ${index + 1} / ${arc.scenes.length}`);
    c.stage.innerHTML = `<div class="story-scene">${background()}<div class="story-chip">${arc.name} · ${s.reference}</div><div class="narration"><span class="eyebrow">${s.setting}</span><p>${s.text}</p>${choices(s.choices)}</div></div>`;
    listen(c, "[data-answer]", (d) => {
      if (+d.answer === s.canon) {
        canonCount++;
        canonOutcome();
      } else diverge();
    });
  }
  function canonOutcome() {
    const s = arc.scenes[index];
    c.stage.innerHTML = `<div class="story-scene">${background()}<div class="story-chip canon-chip">Scripture’s path · ${s.reference}</div><div class="narration"><span class="eyebrow">WHAT SCRIPTURE RECORDS</span><p>${s.outcome}</p>${button(index + 1 === arc.scenes.length ? "Reflect on this story" : "Continue the story", "continue")}</div></div>`;
    c.feedback(s.reference + " — the biblical account.", true);
    $(c, "#continue").onclick = () => {
      if (++index === arc.scenes.length)
        c.complete({
          score: Math.round((canonCount / arc.scenes.length) * 100),
          covered: [arc.ref],
          details: `Canon fidelity: ${canonCount} of ${arc.scenes.length} choices followed the recorded story. Exploring a contrast can help us understand the actual account.`,
        });
      else render();
    };
  }
  function diverge() {
    const s = arc.scenes[index];
    c.stage.innerHTML = `<div class="story-scene divergent">${background()}<div class="divergence-banner">Timeline Diverging: ${s.divergence}</div><div class="noncanon">Non-Canon Branch</div><div class="narration"><span class="eyebrow">AN IMAGINED ALTERNATIVE</span><p>${s.alternate}</p>${button("Continue this branch", "branch")}</div></div>`;
    c.feedback("This branch is fictional and is not presented as Scripture.");
    $(c, "#branch").onclick = () => {
      const modal = document.createElement("dialog");
      modal.className = "return-dialog";
      modal.innerHTML = `<span class="eyebrow">BACK TO THE SOURCE</span><h2>A different path.</h2><p>This isn’t how the story unfolds in Scripture. Want to see what actually happened?</p><p id="flavor" hidden>The contrast invites us to notice the choices in the actual account. Now let’s return to the text.</p><div class="game-actions">${button("Return to Scripture", "return")}${button("See where this leads", "flavor-button", false)}</div>`;
      c.stage.append(modal);
      modal.showModal();
      const back = () => {
        modal.close();
        modal.remove();
        canonOutcome();
      };
      modal.querySelector("#return").onclick = back;
      modal.querySelector("#flavor-button").onclick = (e) => {
        modal.querySelector("#flavor").hidden = false;
        e.currentTarget.hidden = true;
      };
      modal.oncancel = (e) => {
        e.preventDefault();
        back();
      };
    };
  }
  chooseArc();
  return {};
}
function parableGame(c) {
 const parables=freshRound("parable-options",parableBank,3);
  let p = null,
    clues = new Set(),
    mistakes = 0;
  c.stage.innerHTML =
    instruction(
      "A story with something beneath the surface",
      "Pick a parable, notice the details, and connect the clues.",
    ) + choices(parables.map((p) => p.title));
  listen(c, "[data-answer]", (d) => {
    p = parables[+d.answer];
    render();
  });
  function render() {
    c.hud(`${clues.size} / ${p.panels.length} clues`);
    c.stage.innerHTML =
      instruction(
        p.title,
        `${p.reference} · Story summaries, not direct quotations.`,
      ) +
      `<div class="comic-strip">${p.panels.map((panel, i) => `<article class="comic-panel"><div class="comic-art panel-${i}">${c.icon(panel.icon)}<span>${i + 1}</span></div><h3>${panel.title}</h3><p>${panel.text}</p><button class="clue-button ${clues.has(i) ? "found" : ""}" data-clue="${i}" ${clues.has(i) ? "disabled" : ""}>${clues.has(i) ? "Clue collected" : "Inspect: " + panel.clue}</button></article>`).join("")}</div><div class="clue-tray"><strong>Clues collected</strong>${[...clues].map((i) => `<span>${p.panels[i].clue}</span>`).join("") || "<small>Look closely at the story above.</small>"}</div>${clues.size === p.panels.length ? `<h3 class="center">What is the story teaching?</h3>${choices(p.options)}` : '<p class="center muted">Collect every clue to reveal the interpretations.</p>'}`;
    listen(c, "[data-clue]", (d) => {
      clues.add(+d.clue);
      render();
      c.feedback("A detail worth noticing.", true);
    });
    listen(c, "[data-answer]", (d, el) => {
      if (+d.answer !== p.correct) {
        mistakes++;
        el.classList.add("wrong");
        el.disabled = true;
        c.feedback(
          "Look at all the clues together. Try another interpretation.",
          false,
        );
        return;
      }
      c.stage.innerHTML =
        instruction("The clues come together", p.reference) +
        `<div class="interpretation">${p.options[p.correct]}</div><div class="clue-links">${p.panels.map((panel) => `<article><strong>${panel.clue}</strong><p>${panel.meaning}</p></article>`).join("")}</div><div class="game-actions">${button("Reflect & finish", "finish")}</div>`;
      c.feedback("You connected the details to the meaning.", true);
      $(c, "#finish").onclick = () =>
        c.complete({
          score: Math.max(0, 100 - mistakes * 15),
          covered: [p.reference],
          details: "You gathered every clue before choosing an interpretation.",
        });
    });
  }
  return {};
}
function timelineGame(c) {
  let slots = timeline.map(() => null),
    selected = null,
    mistakes = 0;
  const deck = shuffle(timeline.map((_, i) => i));
  function place(id, at) {
    if (id !== at) {
      mistakes++;
      c.feedback("That event belongs elsewhere. Try another marker.", false);
      $(c, `[data-slot="${at}"]`)?.classList.add("shake");
      return;
    }
    slots[at] = id;
    selected = null;
    render();
    c.feedback(`${timeline[id].title} is in place.`, true);
  }
  function render() {
    c.hud(
      `${slots.filter((v) => v !== null).length} / ${timeline.length} connected`,
    );
    const finished = slots.every((v) => v !== null);
    c.stage.innerHTML =
      instruction(
        "One story, many chapters",
        "Select an event, then its numbered place. Or drag a card onto the timeline.",
      ) +
      `<div class="timeline-track">${slots.map((id, i) => `<button class="timeline-slot ${id !== null ? "filled" : ""}" data-slot="${i}" ${id !== null ? "disabled" : ""}><span class="timeline-dot">${i + 1}</span>${id !== null ? c.icon(timeline[id].icon) + "<strong>" + timeline[id].title + "</strong>" : "<span>Place an event</span>"}</button>`).join("")}</div>${
        finished
          ? `<div class="timeline-bridges">${timeline.map((e, i) => `<article style="animation-delay:${i * 0.18}s"><span>${i + 1}</span><div><h3>${e.title}</h3><p>${e.bridge}</p><small>${e.reference}</small></div></article>`).join("")}</div><div class="game-actions">${button("Reflect & finish", "finish")}</div>`
          : `<div class="event-tray">${deck
              .filter((i) => !slots.includes(i))
              .map(
                (i) =>
                  `<button class="event-card ${selected === i ? "selected" : ""}" data-event="${i}" draggable="true">${c.icon(timeline[i].icon)}<strong>${timeline[i].title}</strong></button>`,
              )
              .join("")}</div>`
      }`;
    listen(c, "[data-event]", (d) => {
      selected = +d.event;
      render();
    });
    listen(c, "[data-slot]", (d) => {
      if (selected === null) c.feedback("Choose an event from the tray first.");
      else place(selected, +d.slot);
    });
    all(c, "[data-event]").forEach(
      (el) =>
        (el.ondragstart = (e) =>
          e.dataTransfer.setData("text/plain", el.dataset.event)),
    );
    all(c, "[data-slot]").forEach((el) => {
      el.ondragover = (e) => e.preventDefault();
      el.ondrop = (e) => {
        e.preventDefault();
        const id = Number(e.dataTransfer.getData("text/plain"));
        if (timeline[id]) place(id, +el.dataset.slot);
      };
    });
    if (finished)
      $(c, "#finish").onclick = () =>
        c.complete({
          score: Math.max(0, 100 - mistakes * 3),
          covered: timeline.map((e) => e.reference),
          details:
            "From Creation to the Church, you traced the connections in the larger story.",
        });
  }
  render();
  return {};
}
function armorGame(c) {
  const armor = armorBank.map(a => ({...a,scenario:freshRound("armor-"+a.id,[a.scenario,...armorAlternates[a.id]],1)[0]}));
  let round = 0,
    mistakes = 0,
    equipped = [];
  const deck = shuffle(armor);
  function render() {
    const current = deck[round];
    c.hud(`${equipped.length} / 6 equipped`);
    c.stage.innerHTML =
      instruction(
        "Stand firm, one choice at a time",
        "Several qualities can help in real life. Choose the piece most directly pictured by this scenario.",
      ) +
      `<div class="armor-layout"><div class="armor-character"><div class="armor-aura ${equipped.length === 6 ? "complete" : ""}"></div><img src="assets/fantasy/player.png" alt="A pixel-art character"><div class="equipment">${armor.map((a, i) => `<span class="armor-slot ${equipped.includes(a.id) ? "equipped" : ""}" style="--i:${i}" title="${a.name}">${a.symbol}</span>`).join("")}</div></div><div class="armor-panel"><div class="scenario-card"><span class="eyebrow">EVERYDAY COURAGE · ${round + 1} / 6</span><h3>${current.scenario}</h3></div><div class="armor-options">${armor.map((a, i) => `<button class="armor-option ${equipped.includes(a.id) ? "equipped" : ""}" data-piece="${i}"><span>${a.symbol}</span>${a.name}</button>`).join("")}</div></div></div>`;
    listen(c, "[data-piece]", (d, el) => {
      const chosen = armor[+d.piece];
      if (chosen.id !== current.id) {
        mistakes++;
        c.feedback(
          `Consider ${current.name.toLowerCase()}. ${current.explanation}`,
          false,
        );
        $(c, ".armor-character").classList.remove("fog");
        void $(c, ".armor-character").offsetWidth;
        $(c, ".armor-character").classList.add("fog");
        return;
      }
      equipped.push(current.id);
      all(c, "[data-piece]").forEach((x) => (x.disabled = true));
      el.classList.add("equipped");
      all(c, ".armor-slot")[
        armor.findIndex((x) => x.id === current.id)
      ].classList.add("equipped");
      if (equipped.length === 6) $(c, ".armor-aura").classList.add("complete");
      c.hud(`${equipped.length} / 6 equipped`);
      c.feedback(`${current.reference} — ${current.explanation}`, true);
      const div = document.createElement("div");
      div.className = "game-actions";
      div.innerHTML = button(
        round === 5 ? "Reflect & finish" : "Next situation",
        "next",
      );
      c.stage.append(div);
      $(c, "#next").onclick = () => {
        if (++round === 6)
          c.complete({
            score: Math.max(0, 100 - mistakes * 5),
            covered: ["Ephesians 6:10–18"],
            details:
              "All six pieces equipped. Paul’s armor is a picture of spiritual readiness, not physical violence.",
          });
        else render();
      };
    });
  }
  render();
  return {};
}
function wisdomGame(c) {
  let index = 0,
    correct = 0,
    streak = 0,
    best = 0,
    remaining = 12,
    answered = false;
  const deck = freshRound("wisdom", wisdom, 6);
  function render() {
    answered = false;
    remaining = 12;
    const q = deck[index];
    c.hud(`Saying ${index + 1} / ${deck.length} · ${streak} in a row`);
    c.stage.innerHTML =
      instruction(
        "Does it sound wise — or is it Scripture?",
        "Sort by source and teaching. A non-biblical saying is not automatically false.",
      ) +
      `<div class="wisdom-stage"><div class="wisdom-card" tabindex="0" aria-label="Saying: ${q.text}"><span class="eyebrow">THINK IT THROUGH</span><blockquote>${q.text}</blockquote><small>${c.mode === "growth" ? '<span id="round-time">12</span> seconds' : "Take as long as you need"}</small></div><div class="wisdom-zones"><button class="wisdom-zone biblical" data-sort="true">← Biblical Wisdom<small>Scriptural teaching</small></button><button class="wisdom-zone worldly" data-sort="false">Worldly Wisdom →<small>A cultural saying</small></button></div><p class="center fine muted">Tap a zone, swipe the card, or focus it and use ← / →.</p></div><div id="wisdom-explanation"></div>`;
    listen(c, "[data-sort]", (d) => answer(d.sort === "true"));
    const card = $(c, ".wisdom-card");
    let startX = null;
    card.onpointerdown = (e) => {
      startX = e.clientX;
    };
    card.onpointerup = (e) => {
      if (startX !== null && Math.abs(e.clientX - startX) > 50)
        answer(e.clientX < startX);
      startX = null;
    };
    card.onkeydown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        answer(e.key === "ArrowLeft");
      }
    };
  }
  function answer(value) {
    if (answered) return;
    answered = true;
    const q = deck[index],
      ok = value === q.biblical;
    if (ok) {
      correct++;
      streak++;
      best = Math.max(best, streak);
    } else streak = 0;
    all(c, "[data-sort]").forEach((x) => (x.disabled = true));
    $(c, "#wisdom-explanation").innerHTML =
      `<div class="explanation ${ok ? "good" : "retry"}"><strong>${value === null ? "Time to pause and learn." : ok ? "Well discerned." : "A useful distinction."}</strong><p>${q.explanation}</p><small>${q.reference}</small></div><div class="game-actions">${button(index === deck.length - 1 ? "Reflect & finish" : "Next saying", "next")}</div>`;
    c.feedback(
      ok
        ? "Keep asking what Scripture actually says."
        : "Read the explanation before moving on.",
      ok,
    );
    $(c, "#next").onclick = () => {
      if (++index === deck.length)
        c.complete({
          score: (correct / deck.length) * 100,
          covered: [...new Set(deck.map((x) => x.reference))],
          details: `${correct} of ${deck.length} sayings sorted correctly. Your longest streak was ${best}.`,
        });
      else render();
    };
  }
  render();
  return {
    tick() {
      if (c.mode === "growth" && !answered) {
        remaining--;
        const el = $(c, "#round-time");
        if (el) el.textContent = remaining;
        if (remaining <= 0) answer(null);
      }
    },
  };
}
function journeyGame(c) {
  const journey = journeyBank.map(leg=>({...leg, options:shuffle(leg.options)}));
  let index = 0,
    hints = 0,
    arrived = false,
    zoom = 1;
  const visited = ["Antioch"];
  function render() {
    const leg = journey[index];
    c.hud(`Leg ${index + 1} / ${journey.length}`);
    c.stage.innerHTML =
      instruction(
        "Paul’s first missionary journey",
        "A simplified, approximate map of the eastern Mediterranean. Follow the next stop.",
      ) +
      `<div class="map-toolbar"><span>${Math.round(((visited.length - 1) / journey.length) * 100)}% of the journey</span><div>${button("−", "zoom-out", false)}${button("+", "zoom-in", false)}</div></div><div class="map-viewport"><div class="journey-map" style="width:${zoom * 100}%;height:${zoom * 380}px"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="land" d="M0 0H100V100H87L82 84L87 64L86 42L75 32L65 30L52 39L34 40L19 29L0 34Z"/><path class="island" d="M59 53L70 49L74 52L65 57Z"/>${visited
        .slice(1)
        .map((city, i) => {
          const a = cities[visited[i]],
            b = cities[city];
          return `<path class="route-line" d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"/>`;
        })
        .join(
          "",
        )}</svg><span class="sea-label">MEDITERRANEAN SEA</span>${Object.entries(
        cities,
      )
        .map(
          ([name, [x, y]]) =>
            `<button class="map-pin ${visited.includes(name) ? "visited" : ""} ${leg.options.includes(name) ? "candidate" : ""}" style="left:${x}%;top:${y}%" data-city="${name}" ${!leg.options.includes(name) || arrived ? "disabled" : ""}><i></i><span>${name}</span></button>`,
        )
        .join(
          "",
        )}</div></div><div class="journey-sheet"><span class="eyebrow">${arrived ? "YOU ARRIVED · " + leg.reference : "LEAVING " + leg.from.toUpperCase()}</span><h3>${arrived ? leg.to : leg.text}</h3>${arrived ? `<p>${leg.scene}</p>${button(index === journey.length - 1 ? "Reflect & finish" : "Continue the journey", "next")}` : `<div class="city-options">${leg.options.map((name) => `<button class="secondary" data-city="${name}">${name}</button>`).join("")}</div>${button("A little hint", "hint", false)}`}</div>`;
    listen(c, "[data-city]", (d) => {
      if (arrived) return;
      if (d.city !== leg.to) {
        c.feedback(
          "That is not the next stop. Use the narration or ask for a hint.",
          false,
        );
        return;
      }
      visited.push(leg.to);
      arrived = true;
      render();
      c.feedback(leg.reference + " — " + leg.scene, true);
    });
    $(c, "#zoom-in").onclick = () => {
      zoom = Math.min(2, zoom + 0.25);
      render();
    };
    $(c, "#zoom-out").onclick = () => {
      zoom = Math.max(1, zoom - 0.25);
      render();
    };
    if (arrived)
      $(c, "#next").onclick = () => {
        if (++index === journey.length)
          c.complete({
            score: Math.max(0, 100 - hints * 10),
            covered: journey.map((x) => x.reference),
            details: `You traced four journey legs and used ${hints} hints. Intermediate stops are described in the narration.`,
          });
        else {
          arrived = false;
          render();
        }
      };
    else
      $(c, "#hint").onclick = () => {
        if (!$(c, "#hint").disabled) {
          hints++;
          $(c, "#hint").disabled = true;
          c.feedback(leg.hint);
        }
      };
  }
  render();
  return {};
}
function gardenGame(c) {
  let index = 0,
    selected = null,
    answered = false,
    garden = { ...c.progress.garden };
  const deck = shuffle(fruits.map(f=>{const copy=[...f];copy[2]=freshRound("fruit-"+f[0],[f[2],...fruitAlternates[f[0]]],1)[0];return copy;}));
  function render() {
    const f = deck[index];
    answered = false;
    c.hud(
      `Situation ${index + 1} / 9 · ${Math.round((Object.values(garden).reduce((a, b) => a + b, 0) / 27) * 100)}% grown`,
    );
    c.stage.innerHTML =
      instruction(
        "Small choices. Deep roots.",
        "Pick a fruit, then water its bed. Each plant grows across three visits: sprout, bud, bloom.",
      ) +
      `<div class="scenario-card garden-scenario"><span class="eyebrow">A MOMENT TO GROW</span><h3>${f[2]}</h3></div><div class="garden-grid">${fruits
        .map(([id, name], i) => {
          const stage = garden[id] || 0;
          return `<button class="plant-bed ${selected === id ? "selected" : ""}" data-fruit="${id}" aria-label="${name}, ${["seed", "sprout", "budding", "full bloom"][stage]}"><span class="plant-visual growth-${stage}">${stage === 0 ? '<i class="seed"></i>' : `<img src="assets/icons/Plant.png" alt="">${stage === 3 ? '<span class="bloom">✿</span>' : ""}`}</span><strong>${name}</strong><span class="growth-dots" aria-hidden="true">${[1, 2, 3].map((n) => `<i class="${stage >= n ? "grown" : ""}"></i>`).join("")}</span></button>`;
        })
        .join(
          "",
        )}</div><div class="game-actions">${button("Water this fruit", "water")}</div><div id="garden-next"></div><p class="center fine muted">Galatians 5:22–23 · Several fruits can work together. Here, find the closest match to the highlighted action.</p>`;
    listen(c, "[data-fruit]", (d) => {
      if (answered) return;
      selected = d.fruit;
      all(c, "[data-fruit]").forEach((el) =>
        el.classList.toggle("selected", el.dataset.fruit === selected),
      );
    });
    $(c, "#water").onclick = () => {
      if (!selected) {
        c.feedback("Choose one of the nine plant beds first.");
        return;
      }
      if (selected !== f[0]) {
        c.feedback(
          `For this situation, try ${f[1].toLowerCase()}. ${f[3]}`,
          false,
        );
        return;
      }
      answered = true;
      garden = gardenGrowth(garden, selected, f[0]);
      c.saveGarden(garden);
      render();
      answered = true;
      $(c, "#water").disabled = true;
      all(c, "[data-fruit]").forEach((el) => (el.disabled = true));
      $(c, `[data-fruit="${selected}"]`).classList.add("watered");
      c.feedback(`${f[1]} grows with practice. ${f[3]}`, true);
      $(c, "#garden-next").innerHTML =
        `<div class="game-actions">${button(index === 8 ? "Reflect & finish" : "Next situation", "next")}</div>`;
      $(c, "#next").onclick = () => {
        if (++index === 9)
          c.complete({
            score: 100,
            covered: ["Galatians 5:22–23"],
            details: `Your garden is ${Math.round((Object.values(garden).reduce((a, b) => a + b, 0) / 27) * 100)}% grown. Keep returning to help all nine plants bloom.`,
          });
        else {
          selected = null;
          render();
        }
      };
    };
  }
  render();
  return {};
}
function psalmsGame(c) {
  let v,
    pass = 1,
    blankIndex = 0,
    correct = 0,
    passCorrect = 0,
    passResults = [],
    blanks = [],
    remaining = 10,
    answered = false,
    travelStart = 0,
    travelEnd = 0;
  let recallOrder=[];
  picker(c, verses.filter(v=>v.reference.startsWith("Psalm")), (chosen) => {
    v = chosen;
    const words=v.text.split(" ");
    const keys=words.map((w,i)=>v.keywords.includes(w.toLowerCase().replace(/[^a-z]/g,""))?i:-1).filter(i=>i>=0);
    recallOrder=[...shuffle(keys),...shuffle(words.map((_,i)=>i).filter(i=>!keys.includes(i)))];
    beginPass();
  });
  function beginPass() {
    blanks = recallOrder.slice(0, pass===1?1:pass===2?2:4).sort((a,b)=>a-b);
    blankIndex = 0;
    passCorrect = 0;
    render();
  }
  function render() {
    answered = false;
    remaining = c.mode === "growth" ? Math.max(6, 12 - pass * 2) : 0;
    const words = v.text.split(" "),
      target = blanks[blankIndex];
    const word = words[target];
    const distractors = shuffle(
      ["strength", "river", "silence", "mercy", "morning", "field"].filter(
        (w) => w.toLowerCase() !== word.toLowerCase(),
      ),
    );
    const options = shuffle([word, ...distractors.slice(0, 2)]);
    c.hud(`Pass ${pass} / 3 · Word ${blankIndex + 1} / ${blanks.length}`);
    c.stage.innerHTML =
      instruction(
        v.reference + ` <small>${v.translation}</small>`,
        c.mode === "growth"
          ? "Recall the missing word before it reaches the now marker. Later passes leave more gaps."
          : "Let the verse settle in. Choose each missing word at your own pace.",
      ) +
      `<div class="psalm-band"><div class="now-marker"><span>NOW</span></div><div class="psalm-line" id="psalm-line">${words.map((w, i) => (i === target ? '<span class="blank-word">?</span>' : blanks.includes(i) && i > target ? '<span class="future-blank">___</span>' : `<span>${c.escape(w)}</span>`)).join(" ")}</div></div>${c.mode === "growth" ? `<div class="blank-countdown"><i id="blank-progress"></i><span id="blank-time">${remaining}s</span></div>` : ""}${c.mode === "growth" ? `<form id="recall-form" class="recall-form"><label for="recall">Type the missing word</label><div><input id="recall" autocomplete="off" autocapitalize="off" spellcheck="false" required aria-label="Missing word"><button class="primary">Place word</button></div></form>` : choices(options)}<div id="psalm-answer"></div><p class="center fine muted">Pass 1: a key word · Pass 2: more recall · Pass 3: four missing words</p>`;
    const band = $(c, ".psalm-band"),
      line = $(c, "#psalm-line"),
      blank = $(c, ".blank-word");
    const blankOffset =
      blank.getBoundingClientRect().left - line.getBoundingClientRect().left;
    const lineOffset =
      line.getBoundingClientRect().left - band.getBoundingClientRect().left;
    travelEnd = 24 - lineOffset - blankOffset;
    travelStart =
      Math.max(80, band.clientWidth * 0.55) - lineOffset - blankOffset;
    line.style.transform = `translateX(${c.mode === "growth" ? travelStart : Math.max(35, band.clientWidth * 0.35) - lineOffset - blankOffset}px)`;
    if (c.mode === "growth") {
      $(c, "#recall-form").onsubmit = (e) => {
        e.preventDefault();
        answer($(c, "#recall").value);
      };
      $(c, "#recall").focus();
    } else listen(c, "[data-answer]", (d) => answer(options[+d.answer]));
  }
  const normal = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  function answer(value) {
    if (answered) return;
    answered = true;
    const correctWord = v.text.split(" ")[blanks[blankIndex]],
      ok = normal(value) === normal(correctWord);
    if (ok) {
      correct++;
      passCorrect++;
    }
    all(c, "[data-answer],#recall-form input,#recall-form button").forEach(
      (el) => (el.disabled = true),
    );
    $(c, ".blank-word").textContent = correctWord;
    $(c, ".blank-word").classList.add(ok ? "correct" : "missed");
    $(c, "#psalm-answer").innerHTML =
      `<div class="game-actions">${button(blankIndex + 1 === blanks.length ? "See this pass" : "Next word", "next")}</div>`;
    c.feedback(
      ok
        ? "That word belongs here."
        : `The word is “${correctWord}”. Say the complete line once, then continue.`,
      ok,
    );
    $(c, "#next").onclick = () => {
      if (++blankIndex < blanks.length) render();
      else passSummary();
    };
  }
  function passSummary() {
    passResults.push({ correct: passCorrect, total: blanks.length });
    const accuracy = Math.round((passCorrect / blanks.length) * 100);
    c.stage.innerHTML =
      instruction(
        `Pass ${pass} complete`,
        `${accuracy}% accuracy · ${passCorrect} of ${blanks.length} words recalled`,
      ) +
      `<blockquote>${v.text}<cite>${v.reference} · ${v.translation}</cite></blockquote><div class="pass-dots">${passResults.map((r, i) => `<span>Pass ${i + 1}<strong>${Math.round((r.correct / r.total) * 100)}%</strong></span>`).join("")}</div><div class="game-actions">${button(pass === 3 ? "Reflect & finish" : "Begin next pass", "next")}</div>`;
    $(c, "#next").onclick = () => {
      if (pass === 3)
        c.complete({
          score: (correct / passResults.reduce((n, r) => n + r.total, 0)) * 100,
          covered: [v.reference + " · " + v.translation],
          mastered: passCorrect === blanks.length ? [v.id] : [],
          details:
            passCorrect === blanks.length
              ? "A perfect final pass! This verse is now in “Verses I know”."
              : "Three passes of practice. Come back to help these words become familiar.",
        });
      else {
        pass++;
        beginPass();
      }
    };
  }
  return {
    tick() {
      if (v && c.mode === "growth" && !answered && $(c, "#blank-time")) {
        remaining--;
        $(c, "#blank-time").textContent = remaining + "s";
        const total = Math.max(6, 12 - pass * 2);
        $(c, "#blank-progress").style.width = (remaining / total) * 100 + "%";
        $(c, "#psalm-line").style.transform =
          `translateX(${travelStart + (travelEnd - travelStart) * ((total - remaining) / total)}px)`;
        if (remaining <= 0) answer("");
      }
    },
  };
}
export function launchGame(id, c) {
  return {
    shepherd: (c)=>adventureGame(c,"shepherd"),
    scrolls: (c)=>adventureGame(c,"scrolls"),
    verse: verseGame,
    prayer: prayerGame,
    sandals: sandalsGame,
    parable: parableGame,
    timeline: timelineGame,
    armor: armorGame,
    wisdom: wisdomGame,
    journey: journeyGame,
    garden: gardenGame,
    psalms: psalmsGame,
  }[id](c);
}
