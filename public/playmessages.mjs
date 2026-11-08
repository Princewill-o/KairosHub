import { interactionsFor } from "./playmessages/interactions.mjs";
import { discover, discovered } from "./playmessages/engine.mjs";
import { mountCutscene } from "./playmessages/video.mjs";
import { series } from "./playmessages/content.mjs";
import {
  advance,
  choose,
  chosen,
  endingFor,
  graceFor,
} from "./playmessages/engine.mjs";
import { storyStorage } from "./playmessages/storage.mjs";
import { accounts } from "./accounts.mjs";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const time = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
const url = (s, start = 0) =>
  `https://www.youtube.com/watch?v=${s.video}&t=${start}s`;
const art = (s, panel = 0, cls = "") =>
  `<div class="pm-art ${cls}" role="img" aria-label="Illustrated scene from ${esc(s.title)}, chapter ${panel + 1}" style="--scene:${panel};background-image:url('/playmessages/art/${s.id}.webp')"></div>`;
const source = (s) =>
  `<a href="${url(s)}" target="_blank" rel="noopener">${esc(s.message)} · David Antwi &nearr;</a>`;
const transcripts = new Map();
async function transcript(s) {
  if (!transcripts.has(s.video))
    transcripts.set(
      s.video,
      fetch(`/playmessages/transcripts/${s.video}.txt`)
        .then((r) => {
          if (!r.ok) throw Error("unavailable");
          return r.text();
        })
        .catch((e) => {
          transcripts.delete(s.video);
          throw e;
        }),
    );
  return transcripts.get(s.video);
}
function cues(text) {
  return [
    ...text.matchAll(
      /\[(\d+:\d+(?::\d+)?)\]\s*([\s\S]*?)(?=\[\d+:\d+(?::\d+)?\]|$)/g,
    ),
  ].map((m) => ({
    at: m[1].split(":").reduce((a, b) => a * 60 + Number(b), 0),
    text: m[2].trim(),
  }));
}
export function mountPlayMessages(root, id = "") {
  let dead = false,
    renderId = 0,
    cutscene = null,
    cutsceneCanAdvance = false;
  const store = storyStorage(
    accounts.progressKey("kairos-playmessages-v1"),
    series,
  );
  const s = series.find((x) => x.id === id);
  if (s) document.documentElement.classList.add("story-playing");
  const status = () =>
    `<p class="pm-save" role="status">${store.saved ? "PlayMessages progress saved on this device, for this player." : "Browser storage unavailable. PlayMessages progress lasts for this visit only."} These stories do not sync to the family dashboard.</p>`;
  const btn = (label, action, cls = "") =>
    `<button type="button" class="pm-button ${cls}" data-action="${action}">${label}</button>`;
  function library() {
    const all = Object.values(store.all()),
      completed = all.filter((r) => r.endings.length).length,
      grace = all.reduce((a, r) => a + r.best, 0);
    root.innerHTML = `<section class="pm-library"><header class="pm-hero"><div><span class="pm-kicker">A CHOICE-DRIVEN STORY COLLECTION</span><h1>Play<span>Messages</span></h1><p>Step into a story. Meet its people.<br>Choose what happens next.</p><p class="pm-hero-detail">10 different messages from David Antwi. Ten original casts. Three chapters each, with sermon cutscenes and endings shaped by you.</p><a class="pm-button pm-gold" href="#messages/${series.find((x) => store.get(x.id).run.events.length && store.get(x.id).run.stage !== "ending")?.id || series[0].id}">Enter a story <span aria-hidden="true">→</span></a></div>${art(series[0], 0, "pm-hero-art")}</header>
  <div class="pm-shelf-top"><div><span class="pm-kicker">CHOOSE YOUR NEXT CHAPTER</span><h2>Stories to live through</h2></div><span>${completed} / 10 completed · ${grace} Grace</span></div>
  <div class="pm-tools"><label>Find a story<input type="search" id="pm-search" placeholder="Search title, theme or message"></label><label>Show<select id="pm-filter"><option value="all">All stories</option><option value="continue">In progress</option><option value="complete">Completed</option><option value="new">Not started</option></select></label></div><div class="pm-grid"></div>
  <details class="pm-about"><summary>How PlayMessages works</summary><p>Play as a different lead in each story. Read the scene, choose a response, then decide whether to follow through. People respond to what you do. Each chapter connects to a 75-second excerpt of its source message. Snippets start automatically at the turning point. Read captions or continue without waiting.</p><p>Tap choices or use number keys 1–3. Enter continues a scene. Escape pauses. Use Journal for your decisions and dialogue. Your place saves automatically for the current player on this browser.</p><p>These are original contemporary fictional stories inspired by message themes, not Bible events or quotations from the preacher. Grace is a game progress reward; it does not measure salvation, God’s favour or another person’s faith. Replay to explore three conclusions. Rewards retain your best result per story.</p><p>Source channel: <a href="https://www.youtube.com/@davidantwi" target="_blank" rel="noopener">David Antwi / Kharis Church &nearr;</a>. Automatic English captions may contain errors. Full transcripts are included with the project owner’s permission. Video availability and embedding are controlled by YouTube.</p></details>${status()}</section>`;
    const draw = () => {
      const q = root.querySelector("#pm-search").value.trim().toLowerCase(),
        filter = root.querySelector("#pm-filter").value;
      const list = series.filter((s) => {
        const rec = store.get(s.id),
          done = rec.endings.length > 0,
          started = rec.run.events.length > 0;
        return (
          [s.title, s.tag, s.message, s.cast]
            .join(" ")
            .toLowerCase()
            .includes(q) &&
          (filter === "all" ||
            (filter === "complete" && done) ||
            (filter === "continue" && started && rec.run.stage !== "ending") ||
            (filter === "new" && !started && !done))
        );
      });
      root.querySelector(".pm-grid").innerHTML = list.length
        ? list
            .map((s, i) => {
              const r = store.get(s.id);
              return `<a class="pm-card" href="#messages/${s.id}" style="--story-color:${s.color}">${art(s)}<div class="pm-card-body"><span class="pm-kicker">${esc(s.tag)} · 3 chapters</span><h3>${esc(s.title)}</h3><p>${esc(s.premise)}</p><small>PLAY AS ${esc(s.lead.toUpperCase())} · ${esc(s.cast)}</small><span class="pm-card-source">Based on ${esc(s.message)}</span><span class="pm-card-foot"><b>${r.run.stage === "ending" ? "View conclusion" : r.run.events.length ? `Resume chapter ${r.run.episode + 1}` : "Start story"} →</b><span>${r.endings.length}/3 endings</span></span></div></a>`;
            })
            .join("")
        : '<p class="pm-empty">No stories match. Try another search or choose All stories.</p>';
    };
    root.querySelector("#pm-search").oninput = draw;
    root.querySelector("#pm-filter").onchange = draw;
    draw();
  }
  function modal(title, body) {
    root.querySelector("dialog")?.remove();
    const d = document.createElement("dialog");
    d.className = "pm-modal";
    d.innerHTML = `<header><h2>${esc(title)}</h2><button class="pm-button" autofocus data-close>Close</button></header><div class="pm-modal-body">${body}</div>`;
    root.append(d);
    d.querySelector("[data-close]").onclick = () => d.close();
    d.addEventListener("close", () => d.remove());
    d.showModal();
    return d;
  }
  function journal() {
    const r = store.get(s.id).run;
    modal(
      "Your story journal",
      `<p>Original game dialogue · ${esc(s.title)}. Your decisions and the people’s responses are recorded here.</p>${
        r.decisions.length
          ? r.decisions
              .map((d) => {
                const e = s.episodes[d.episode],
                  c = e.choices[d.choice];
                return `<article><h3>Chapter ${d.episode + 1}: ${esc(e.title)}</h3><p>${esc(e.opening)}</p><p><b>You chose:</b> ${esc(c.label)}</p><p>${esc(c.reply)} ${esc(c.consequence)}</p><p><b>Follow-through:</b> ${d.acted === null ? "Not decided yet." : d.acted ? esc(c.action) : "Left unresolved."}</p>${d.acted ? `<p>${esc(c.resolution)}</p>` : ""}<p><b>Read:</b> ${esc(e.reading)}</p><p>${esc(e.clip.note)}</p></article>`;
              })
              .join("")
          : "<p>Your first decision will appear here.</p>"
      }<h3>Scene discoveries</h3>${r.discoveries
        .map((d) => {
          const scene = interactionsFor(s.id)[d.episode];
          return `<p><b>Chapter ${d.episode + 1} · ${esc(d.target === "item" ? scene.item : scene.person)}</b><br>${esc(d.target === "item" ? scene.detail : d.approach === "listen" ? scene.listen : scene.share)}</p>`;
        })
        .join(
          "",
        )}<h3>Message behind this story</h3><p>${source(s)}</p><p><a href="/playmessages/transcripts/${s.video}.txt" target="_blank" rel="noopener">Open full sermon transcript &nearr;</a></p><p>Automatically transcribed captions may contain errors. The fictional dialogue above is written for Kairos and is not a preacher quotation.</p>`,
    );
  }
  async function showTranscript() {
    const d = modal(
      "Sermon transcript",
      `<p>Automatic English captions · ${esc(s.message)}. Captions may contain errors.</p><p>${source(s)}</p><p class="pm-transcript-status" role="status">Loading transcript…</p><div class="pm-transcript"></div>`,
    );
    try {
      const text = await transcript(s);
      if (!d.isConnected) return;
      d.querySelector(".pm-transcript-status").textContent =
        "Full transcript · published with permission";
      d.querySelector(".pm-transcript").textContent = text;
    } catch {
      if (d.isConnected)
        d.querySelector(".pm-transcript-status").innerHTML =
          `Transcript could not load. Reconnect and try again, or ${source(s)}.`;
    }
  }
  function render(focus = false) {
    if (dead) return;
    cutscene?.dispose();
    cutscene = null;
    renderId++;
    const token = renderId,
      r = store.get(s.id).run,
      e = s.episodes[r.episode],
      c = chosen(r, s),
      d = r.decisions.find((d) => d.episode === r.episode),
      ending = r.stage === "ending",
      scene = interactionsFor(s.id)[r.episode];
    let body = "";
    if (r.stage === "opening")
      body = `<span class="pm-speaker">${esc(e.place)}</span><h2>${esc(e.title)}</h2><p>${esc(e.opening)}</p><div class="pm-interactions"><button data-interaction="talk"><span>${discovered(r, "talk") ? "Conversation recorded" : "Talk"}</span><b>${esc(scene.person)}</b></button><button data-interaction="item"><span>${discovered(r, "item") ? "In your journal" : "Inspect & keep"}</span><b>${esc(scene.item)}</b></button></div><p class="pm-explore-hint">Talk and inspect the scene before choosing what happens next. ${[discovered(r, "talk"), discovered(r, "item")].filter(Boolean).length}/2 discoveries</p><button class="pm-button pm-gold" data-action="next" ${!discovered(r, "talk") || !discovered(r, "item") ? "disabled" : ""}>Choose your response →</button>`;
    if (r.stage === "choice")
      body = `<span class="pm-speaker">YOUR RESPONSE</span><h2>${esc(e.question)}</h2><div class="pm-choices">${e.choices.map((c, i) => `<button type="button" data-choice="${i}"><kbd>${i + 1}</kbd><span>${esc(c.label)}</span><b aria-hidden="true">→</b></button>`).join("")}</div>`;
    if (r.stage === "consequence")
      body = `<span class="pm-speaker">${esc(e.speaker)} · YOUR CHOICE CHANGED THE CONVERSATION</span><p class="pm-you-chose">You chose: ${esc(c.label)}</p><h2>A different turn</h2><p>${esc(c.reply)}</p>${discovered(r, "item") ? `<aside class="pm-memory"><b>You remember: ${esc(scene.item)}</b>${esc(scene.detail)}</aside>` : ""}<p>${esc(c.consequence)}</p>${btn("Continue to the message →", "next", "pm-gold")}`;
    if (r.stage === "clip")
      body = `<span class="pm-speaker">MESSAGE CUTSCENE · ${time(e.clip.start)}–${time(e.clip.end)}</span><h2>${esc(s.message)}</h2><div class="pm-video-slot"></div><p class="pm-video-status" role="status">Starting the message…</p><div class="pm-video-links">${btn("Play / enable sound", "video")}${btn("Transcript", "transcript")}</div><p class="pm-clip-note">${esc(e.clip.note)}</p><details class="pm-clip-captions"><summary>Read captions for this snippet</summary><p class="pm-captions" role="status">Loading automatic captions…</p></details><p class="pm-reading">Read alongside: ${esc(e.reading)}</p><p class="pm-cutscene-hint">The story continues automatically when this excerpt finishes.</p><div class="pm-video-recovery" hidden>${btn("Continue to story →", "next", "pm-gold")}</div>`;
    if (r.stage === "action")
      body = `<span class="pm-speaker">BACK IN THE STORY · FOLLOW THROUGH</span><h2>What will you do now?</h2><p>${esc(c.consequence)}</p><div class="pm-choices"><button data-choice="0"><kbd>1</kbd><span>${esc(c.action)}</span><b aria-hidden="true">→</b></button><button data-choice="1"><kbd>2</kbd><span>Leave this unresolved for now.</span><b aria-hidden="true">→</b></button></div>`;
    if (r.stage === "resolution")
      body = `<span class="pm-speaker">${d.acted ? "AN ACTION, NOT JUST AN ANSWER" : "AN UNFINISHED CONVERSATION"}</span><h2>${d.acted ? "You followed through." : "You decide to step away."}</h2><p>${esc(d.acted ? c.resolution : `You leave the conversation without taking the next step. ${c.consequence} The people involved will remember that the matter was left open.`)}</p>${btn("Complete chapter →", "next", "pm-gold")}`;
    if (r.stage === "chapter")
      body = `<span class="pm-speaker">CHAPTER ${r.episode + 1} COMPLETE</span><h2>${esc(e.title)}</h2><p><b>You chose:</b> ${esc(c.label)}</p><p><b>You ${d.acted ? "followed through" : "left the matter unresolved"}.</b> ${esc(d.acted ? c.resolution : c.consequence)}</p><p class="pm-reading">Take it further: ${esc(e.reading)}</p>${btn(r.episode === 2 ? "See your conclusion →" : "Enter the next chapter →", "next", "pm-gold")}`;
    if (ending) {
      const end = endingFor(r, s),
        rec = store.get(s.id);
      body = `<span class="pm-speaker">YOUR CONCLUSION</span><h2>${esc(end.title)}</h2><p>${esc(end.text)}</p><p class="pm-epilogue">${r.discoveries.filter((d) => d.target === "talk" && d.approach === "listen").length >= 2 ? "You made room for other people’s perspectives. Your journal carries the conversations you listened to." : "The people you spoke with heard your concerns. Your journal keeps their responses and the evidence you collected."}</p><div class="pm-ending-stats"><b>${graceFor(r)} Grace</b><span>${r.actions}/3 follow-through actions · ${rec.endings.length}/3 conclusions discovered</span></div><p class="pm-fine">Grace is a game reward, not a measure of salvation or God’s favour. Replays keep your highest reward for this story.</p><div class="pm-row">${btn("Replay with different choices", "restart", "pm-gold")}<a class="pm-button" href="#messages">Choose another story →</a>${btn("Review your decisions", "journal")}</div><details class="pm-endings"><summary>Your discovered conclusions</summary>${rec.endings.map((t) => `<p><b>${esc(t)}</b> — ${esc(s.endings.find((e) => e.title === t).text)}</p>`).join("")}</details><p>${source(s)}</p>`;
    }
    root.innerHTML = `<section class="pm-player" data-stage="${r.stage}"><div class="pm-player-top"><a href="#messages">← All stories</a><span>${esc(s.title)} · ${ending ? "Conclusion" : `Chapter ${r.episode + 1} / 3`}</span><div>${btn("How to play", "help")}${btn("Expand", "fullscreen")}${btn("Journal", "journal")}${btn("Pause", "pause")}</div></div><div class="pm-chapter-progress" aria-label="Chapter progress">${s.episodes.map((ep, i) => `<span class="${i <= r.episode ? "is-current" : ""}" aria-current="${i === r.episode ? "step" : "false"}">${i + 1}<span>${esc(ep.title)}</span></span>`).join("")}</div>
  <div class="pm-run-stats"><span>${graceFor(r)} Grace this run</span><span>${r.decisions.length + r.decisions.filter((d) => d.acted !== null).length} / 6 decisions</span></div><div class="pm-stage">${art(s, ending ? 2 : r.episode, "pm-stage-art")}<div class="pm-scene-label"><span>PLAYING AS ${esc(s.lead.toUpperCase())}</span><span>${esc(e.place)}</span></div><div class="pm-dialogue" tabindex="-1">${body}</div></div>${status()}</section>`;
    root
      .querySelectorAll("[data-interaction]")
      .forEach((b) => (b.onclick = () => interact(b.dataset.interaction)));
    if (r.stage === "clip") startVideo(token);
    root.querySelectorAll("[data-choice]").forEach(
      (b) =>
        (b.onclick = () => {
          store.set(
            s.id,
            choose(store.get(s.id).run, s, Number(b.dataset.choice)),
          );
          render(true);
        }),
    );
    root
      .querySelectorAll("[data-action]")
      .forEach((b) => (b.onclick = () => action(b.dataset.action)));
    if (r.stage === "clip")
      transcript(s)
        .then((text) => {
          if (dead || token !== renderId) return;
          const selected = cues(text).filter(
            (c) => c.at >= e.clip.start && c.at < e.clip.end,
          );
          const el = root.querySelector(".pm-captions");
          if (el)
            el.textContent =
              selected.map((c) => `[${time(c.at)}] ${c.text}`).join("\n\n") ||
              "No caption cues in this range. Open the full transcript or source video.";
        })
        .catch(() => {
          const el = root.querySelector(".pm-captions");
          if (token === renderId && el)
            el.textContent =
              "Captions could not load. Reconnect and use Read full transcript or Watch on YouTube.";
        });
    if (focus) {
      root.querySelector(".pm-dialogue").focus({ preventScroll: true });
      root
        .querySelector(".pm-dialogue")
        .scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  }
  function startVideo(token = renderId) {
    cutsceneCanAdvance = false;
    cutscene?.dispose();
    const r = store.get(s.id).run,
      e = s.episodes[r.episode],
      slot = root.querySelector(".pm-video-slot");
    if (!slot) return;
    cutscene = mountCutscene(slot, {
      video: s.video,
      title: s.message,
      start: e.clip.start,
      end: e.clip.end,
      onStatus: (text) => {
        if (!dead && token === renderId) {
          const el = root.querySelector(".pm-video-status");
          if (el) el.textContent = text;
        }
      },
      onFailure: () => {
        cutsceneCanAdvance = true;
        if (!dead && token === renderId) {
          const recovery = root.querySelector(".pm-video-recovery");
          if (recovery) recovery.hidden = false;
        }
      },
      onEnd: () => {
        cutsceneCanAdvance = true;
        if (!dead && token === renderId && store.get(s.id).run.stage === "clip")
          action("next");
      },
    });
  }
  function stopVideo() {
    cutscene?.dispose();
    cutscene = null;
    const slot = root.querySelector(".pm-video-slot");
    if (slot)
      slot.innerHTML =
        "<p>Message paused. Use Play / enable sound to start again.</p>";
  }
  function interact(target) {
    const r = store.get(s.id).run,
      scene = interactionsFor(s.id)[r.episode],
      existing = discovered(r, target);
    if (target === "item") {
      const d = modal(
        scene.item,
        `<p>${esc(scene.detail)}</p>${btn(existing ? "Back to scene" : "Keep in journal", "keep", "pm-gold")}`,
      );
      d.querySelector("[data-action=keep]").onclick = () => {
        d.close();
        if (!existing) {
          store.set(s.id, discover(r, s, "item"));
          render();
        }
      };
    } else {
      if (existing) {
        modal(
          scene.person,
          `<p>${esc(existing.approach === "listen" ? scene.listen : scene.share)}</p>`,
        );
        return;
      }
      const d = modal(
        "Talk to " + scene.person,
        `<p>${esc(scene.person)} turns towards you. How will you begin?</p><div class="pm-choices"><button data-approach="listen">Hear their perspective.</button><button data-approach="share">Share what is worrying you.</button></div>`,
      );
      d.querySelectorAll("[data-approach]").forEach(
        (b) =>
          (b.onclick = () => {
            const approach = b.dataset.approach;
            d.close();
            store.set(s.id, discover(r, s, "talk", approach));
            render();
            modal(
              scene.person,
              `<p>${esc(approach === "listen" ? scene.listen : scene.share)}</p><p class="pm-reading">Conversation saved in your journal.</p>`,
            );
          }),
      );
    }
  }
  function action(name) {
    if (name === "next") {
      const r = store.get(s.id).run;
      if (r.stage === "clip" && !cutsceneCanAdvance) return;
      if (
        r.stage === "opening" &&
        (!discovered(r, "talk") || !discovered(r, "item"))
      )
        return;
      store.set(s.id, advance(store.get(s.id).run, s));
      render(true);
    }
    if (name === "journal") journal();
    if (name === "transcript") showTranscript();
    if (name === "video") {
      if (cutscene) cutscene.play();
      else startVideo();
    }
    if (name === "fullscreen") {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
    if (name === "help")
      modal(
        "How to play",
        `<p>You play ${esc(s.lead)} in ${esc(s.title)}. Talk to the person in each scene and inspect the object, then choose a response. Then choose whether to follow through: both decisions shape your conclusion.</p><p>Use number keys 1–3 for choices, Enter to continue and Escape to pause. Sermon snippets play automatically. If your browser blocks sound, choose Play / enable sound. Read captions or continue without video at any time.</p><p>Open Journal to revisit dialogue and choices. Progress saves automatically for this player on this browser. Complete all three chapters for a conclusion, then replay to explore another route.</p>`,
      );
    if (name === "pause") {
      stopVideo();
      modal(
        "Story paused",
        `<p>Your place is held. Close this window to continue. Any playing sermon snippet has stopped; you can start it again.</p><div class="pm-row"><a class="pm-button" href="#messages">Save and return to stories</a>${btn("Restart this story", "restart")}</div>`,
      );
      root.querySelector('dialog [data-action="restart"]').onclick = () =>
        action("restart");
    }
    if (name === "restart") {
      const d = modal(
        "Replay this story?",
        `<p>A new run replaces your current chapter position. Your discovered conclusions and best Grace reward stay saved.</p>${btn("Start a new run", "confirm", "pm-gold")}`,
      );
      d.querySelector("[data-action=confirm]").onclick = () => {
        d.close();
        store.restart(s.id);
        render(true);
      };
    }
  }
  const keyboard = (e) => {
    if (
      !s ||
      dead ||
      root.querySelector("dialog")?.open ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
    )
      return;
    if (e.key === "Escape") {
      e.preventDefault();
      action("pause");
    } else if (/^[123]$/.test(e.key)) {
      const b = root.querySelector(`[data-choice="${Number(e.key) - 1}"]`);
      if (b) {
        e.preventDefault();
        b.click();
      }
    } else if (
      e.key === "Enter" &&
      (e.target === document.body ||
        e.target.classList?.contains("pm-dialogue"))
    ) {
      const b = root.querySelector("[data-action=next]");
      if (b) {
        e.preventDefault();
        b.click();
      }
    }
  };
  const visibility = () => {
    if (document.hidden) stopVideo();
  };
  if (s) {
    render();
    document.addEventListener("keydown", keyboard);
    document.addEventListener("visibilitychange", visibility);
  } else if (id) {
    root.innerHTML =
      '<section class="pm-library"><h1>Story not found</h1><a href="#messages">Return to PlayMessages</a></section>';
  } else library();
  return {
    dispose() {
      dead = true;
      cutscene?.dispose();
      document.documentElement.classList.remove("story-playing");
      if (document.fullscreenElement)
        document.exitFullscreen?.().catch(() => {});
      renderId++;
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("visibilitychange", visibility);
      root.querySelectorAll("dialog").forEach((d) => d.remove());
      root.querySelector("iframe")?.remove();
    },
  };
}
