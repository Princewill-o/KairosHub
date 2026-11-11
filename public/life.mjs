// Kairos Life — offline single-player Christian life. Online quick play (#world) keeps friends and no ageing.
import * as L from "./life-engine.mjs";
import { series } from "./playmessages/content.mjs";
import { mountCutscene } from "./playmessages/video.mjs";

const STORE = "kairos-life-v1";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (n) => (n < 0 ? "-£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB");
const BOOKS = { "Genesis": "GEN", "Psalm": "PSA", "Psalms": "PSA", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Ephesians": "EPH", "Philippians": "PHP", "Colossians": "COL", "1 Timothy": "1TI", "2 Timothy": "2TI", "Hebrews": "HEB", "James": "JAS", "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN" };

let memory = null;
const load = () => { try { return L.restore(localStorage.getItem(STORE)); } catch { return memory; } };
const save = (s) => { memory = s; try { localStorage.setItem(STORE, L.serialise(s)); return true; } catch { return false; } };

async function kjvLines(reading, signal) {
  const m = /^(.+?) (\d+):(\d+)(?:[–-](\d+))?/.exec(reading.replace(/ · KJV$/, ""));
  const code = m && BOOKS[m[1]];
  if (!code) throw Error("unknown book");
  const res = await fetch(`/api/scripture/${code}/${m[2]}?version=KJV`, { signal });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || "unavailable");
  const from = +m[3], to = +(m[4] || m[3]);
  const text = (p) => (typeof p === "string" ? p : p?.text ?? (p?.content || []).map(text).join(" "));
  return (data.chapter?.content || []).filter((p) => p.type === "verse" && p.number >= from && p.number <= to).map((p) => ({ n: p.number, t: text(p).trim() }));
}

const STAT = (label, value, cls = "") => `<div class="life-stat ${cls}"><span>${label}</span><b>${value}</b><i style="--v:${Math.max(0, Math.min(100, value))}%"></i></div>`;
const AVATAR = { baby: "B", child: "C", teen: "T", "young-adult": "Y", adult: "A", elder: "E" };

export function mountLife(root) {
  let s = load(), rng = L.makeRng(Date.now() ^ 0x5eed), cutscene = null, dead = false, ctl = new AbortController();
  const commit = (next) => { s = next; if (!save(s)) s.notice = (s.notice ? s.notice + " " : "") + "Storage is blocked; this life lasts until you close the page."; render(); };
  root.classList.add("life-root");

  function start() {
    const d = L.randomDetails(rng);
    root.innerHTML = `<section class="life-start">
      <p class="life-eyebrow">OFFLINE PLAY · SINGLE PLAYER</p>
      <h1>Kairos Life</h1>
      <p class="life-lede">Live a whole life, from your first breath to eternity. Every year brings new choices about health, faith, friends, money, work and your mind. Walk closely with Jesus, or drift. Share the gospel, follow people up and bring them to church. Plant a branch. One day the year runs out.</p>
      <div class="life-modes">
        <article class="on"><h2>Offline life</h2><p>Ageing, family, temptations, judgement. Saved on this device. Works without internet (the sermon clip and live KJV text need a connection).</p></article>
        <article><h2>Online quick play</h2><p>The full Kairos World, friends and talking online, with no ageing. <a href="#world">Enter Kairos World →</a></p></article>
      </div>
      ${s && s.alive ? `<button class="life-primary" id="life-continue">Continue as ${esc(s.name.first)} (age ${s.age})</button>` : ""}
      <form class="life-form" id="life-form">
        <h2>Start a new life</h2>
        <div class="life-grid">
          <label>First name<input name="first" value="${esc(d.first)}" required maxlength="20"></label>
          <label>Surname<input name="last" value="${esc(d.last)}" required maxlength="20"></label>
          <label>Sex<select name="sex"><option value="male" ${d.sex === "male" ? "selected" : ""}>Male</option><option value="female" ${d.sex === "female" ? "selected" : ""}>Female</option></select></label>
          <label>Born in<select name="city">${L.CITIES.map((c) => `<option value="${c.id}" ${c.id === d.city ? "selected" : ""}>${c.name}</option>`).join("")}</select></label>
          <label class="life-check"><input type="checkbox" name="christianHome" ${d.christianHome ? "checked" : ""}> Born into a Christian home</label>
        </div>
        <p class="life-error" role="alert" hidden></p>
        <div class="life-row"><button type="button" class="life-ghost" id="life-random">Random details</button><button class="life-primary">Be born</button></div>
      </form>
    </section>`;
    root.querySelector("#life-continue")?.addEventListener("click", render);
    const f = root.querySelector("#life-form");
    root.querySelector("#life-random").onclick = () => { const r = L.randomDetails(rng); for (const k of ["first", "last", "sex", "city"]) f.elements[k].value = r[k]; f.elements.christianHome.checked = r.christianHome; };
    f.oninput = () => (f.querySelector(".life-error").hidden = true);
    f.onsubmit = (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      if (!v.first.trim() || !v.last.trim()) { const er = f.querySelector(".life-error"); er.textContent = "Enter a first name and surname."; er.hidden = false; return; }
      if (s?.alive && !confirm("Start a new life? Your current life will be replaced.")) return;
      commit(L.newLife({ first: v.first.trim(), last: v.last.trim(), sex: v.sex, city: v.city, christianHome: !!v.christianHome }, rng));
    };
  }

  function render() {
    if (dead) return;
    cutscene?.dispose(); cutscene = null;
    if (!s) return start();
    if (!s.alive) return ending();
    const st = L.stageFor(s.age), f = s.faith;
    const acts = L.availableActions(s);
    const groups = ["faith", "ministry", "health", "relationships", "work", "money"].map((g) => [g, acts.filter((a) => a.category === g)]).filter(([, a]) => a.length);
    const living = s.family.filter((p) => p.alive);
    const contacts = s.contacts.filter((c) => c.stage !== "cooled");
    root.innerHTML = `<section class="life-play">
      <header class="life-hero">
        <div class="life-avatar stage-${st.id}" aria-hidden="true">${AVATAR[st.id]}</div>
        <div><p class="life-eyebrow">${st.label.toUpperCase()} · ${esc(L.cityName(s.city))}${s.job ? " · " + esc(s.job.title) : ""}</p><h1>${esc(s.name.first)} ${esc(s.name.last)}, ${s.age}</h1>
        <p>${s.saved ? `Following Jesus since age ${s.savedAge}` : "Not yet trusting Christ"}${s.partner ? ` · ${s.partner.married ? "Married to" : "Seeing"} ${esc(s.partner.name)}` : ""}${s.car ? ` · ${esc(s.car.name)}` : ""}${s.branch ? ` · Planted ${esc(L.cityName(s.branch.city))} (${s.branch.members})` : ""}</p></div>
        <a class="life-ghost" href="#world">Quick play</a>
      </header>
      ${f.drift >= 3 ? `<p class="life-warning" role="status">You're drifting from God (${f.drift} years cold). It's never too late to return.</p>` : ""}
      ${s.notice ? `<p class="life-notice" role="status">${esc(s.notice)}</p>` : ""}
      <div class="life-stats">${STAT("Health", s.health, s.health < 40 ? "low" : "")}${STAT("Happiness", s.happiness)}${STAT("Smarts", s.smarts)}${STAT("Walk with God", f.walk, "faith")}${STAT("Witness", f.witness, "faith")}${STAT("Fruit", f.fruit, "faith")}<div class="life-stat money"><span>Money</span><b>${money(s.money)}</b></div></div>
      ${s.pending ? decision() : `<button class="life-age" id="life-age">Age up: +1 year</button>`}
      <div class="life-cols">
        <section class="life-panel"><h2>This year <small>${4 - s.year.acts} of 4 left</small></h2>
          ${groups.map(([g, a]) => `<h3>${g[0].toUpperCase() + g.slice(1)}</h3><div class="life-actions">${a.map((x) => `<button data-act="${x.id}" ${x.disabled ? `disabled title="${esc(x.reason)}"` : ""}>${esc(x.label)}</button>`).join("")}</div>`).join("")}
          <h3>Sunday</h3><div class="life-actions"><button id="life-service" ${s.pending || s.year.acts >= 4 ? "disabled" : ""}>2pm Sunday service</button></div>
        </section>
        <section class="life-panel"><h2>Follow-up <small>${contacts.length} people</small></h2>
          ${contacts.length ? `<ul class="life-contacts">${contacts.map((c) => { const i = L.FOLLOW_UP.findIndex((x) => x.id === c.stage), next = L.FOLLOW_UP[i + 1]; return `<li><b>${esc(c.name)}</b><span>${L.FOLLOW_UP[i].label}</span><ol class="life-steps">${L.FOLLOW_UP.map((x, j) => `<li class="${j <= i ? "done" : ""}" title="${x.label}"></li>`).join("")}</ol>${next ? `<button data-follow="${c.id}">${next.id === "attended" ? "Bring to Sunday service" : esc(next.hint)}</button>` : ""}</li>`; }).join("")}</ul>` : `<p class="life-muted">${s.age >= 16 ? (s.saved ? "Share Jesus with someone to start a follow-up journey." : "Follow-up begins once you know Jesus yourself.") : "Follow-up opens at 16."}</p>`}
          <h2>Family</h2><ul class="life-family">${living.map((p) => `<li>${esc(p.name)} <small>${p.relation}, ${p.age}</small></li>`).join("") || "<li>No living family</li>"}</ul>
        </section>
      </div>
      <section class="life-panel"><h2>Your story</h2><ol class="life-log" reversed>${s.log.slice(-30).reverse().map((e) => `<li class="k-${e.kind}"><b>${e.age}</b> ${esc(e.text)}</li>`).join("")}</ol>
      <div class="life-row"><button class="life-ghost" id="life-menu">Menu / new life</button></div></section>
    </section>`;
    root.querySelector("#life-age")?.addEventListener("click", () => { commit(L.ageUp({ ...s, notice: null }, rng)); root.querySelector(".life-decision button, #life-age")?.focus(); });
    root.querySelectorAll("[data-choice]").forEach((b) => (b.onclick = () => commit(L.choose(s, +b.dataset.choice, rng))));
    root.querySelectorAll("[data-act]").forEach((b) => (b.onclick = () => commit(L.act(s, b.dataset.act, rng))));
    root.querySelectorAll("[data-follow]").forEach((b) => (b.onclick = () => { const c = s.contacts.find((x) => x.id === b.dataset.follow); if (c?.stage === "pickup") return service(); commit(L.followUp(s, b.dataset.follow, rng)); }));
    root.querySelector("#life-service")?.addEventListener("click", service);
    root.querySelector("#life-menu").onclick = start;
  }

  function decision() {
    const p = s.pending;
    return `<section class="life-decision cat-${p.category}" aria-labelledby="life-dq"><p class="life-eyebrow">${p.category === "temptation" ? "TEMPTATION" : p.category.toUpperCase()} · AGE ${s.age}</p><h2 id="life-dq">${esc(p.title)}</h2><p>${esc(p.text)}</p><div class="life-choices">${p.options.map((o, i) => `<button data-choice="${i}">${esc(o.label)}</button>`).join("")}</div></section>`;
  }

  function service() {
    const svc = L.sundayService(s, series, rng);
    const pickups = svc.guests;
    root.innerHTML = `<section class="life-service">
      <p class="life-eyebrow">SUNDAY · 2:00PM · KHARIS CHURCH ${esc(L.cityName(s.city).toUpperCase())}</p>
      <h1>${pickups.length ? `You picked up ${esc(pickups.join(" and "))}` : "Sunday service"}</h1>
      ${pickups.length ? `<p class="life-drive" aria-hidden="true"><span class="car"></span></p>` : ""}
      <p class="life-muted">${svc.attendance} people in the room. The hall is packed.</p>
      <div class="life-screen" aria-live="polite"><p class="life-screen-ref">${esc(svc.reading)}</p><div class="life-screen-text">Loading the scripture…</div></div>
      <div class="life-pulpit"><div class="life-video" id="life-video"></div><p class="life-video-status" role="status">Starting the message…</p><button class="life-ghost" id="life-sound">Play / enable sound</button></div>
      <p class="life-muted">Message: <b>${esc(svc.clip.title)}</b> · David Antwi · 1-minute excerpt · <a href="https://www.youtube.com/watch?v=${esc(svc.clip.video)}&t=${svc.clip.start}s" target="_blank" rel="noopener noreferrer">Watch the full sermon</a></p>
      <p class="life-announce"><b>Announcement:</b> ${esc(svc.announcement)}</p>
      <div class="life-row"><button class="life-primary" id="life-done">Finish service</button></div>
    </section>`;
    const status = root.querySelector(".life-video-status");
    cutscene = mountCutscene(root.querySelector("#life-video"), { video: svc.clip.video, title: svc.clip.title, start: svc.clip.start, end: svc.clip.end, onEnd: () => (status.textContent = "The message has finished."), onStatus: (t) => (status.textContent = t.replace(/You can read (its|the) captions and continue\./, "Open the full sermon link below, or finish the service.")), onFailure: () => {} });
    root.querySelector("#life-sound").onclick = () => cutscene?.play();
    const box = root.querySelector(".life-screen-text");
    kjvLines(svc.reading, ctl.signal).then((v) => { if (!dead) box.innerHTML = v.length ? v.map((x) => `<span><sup>${x.n}</sup>${esc(x.t)}</span>`).join(" ") : "Turn in your Bible to this passage."; }).catch(() => { if (!dead) box.textContent = "Offline: open your Bible to this passage."; });
    root.querySelector("#life-done").onclick = () => commit(L.attendService(s, svc, rng));
  }

  function ending() {
    const e = s.ending, heaven = e.destination === "heaven";
    root.innerHTML = `<section class="life-ending ${heaven ? "heaven" : "hell"}">
      <p class="life-eyebrow">${esc(s.name.first)} ${esc(s.name.last)} · ${s.age} years · ${esc(s.cause)}</p>
      <h1>${esc(e.title)}</h1><p class="life-lede">${esc(e.text)}</p>
      <ul class="life-verses">${e.verses.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>
      ${e.rewards ? `<p>Witness ${e.rewards.witness} · Fruit ${e.rewards.fruit} · People who came to faith ${e.rewards.people}${e.rewards.branch ? ` · Branch in ${esc(e.rewards.branch)}` : ""}</p>` : ""}
      ${e.reflection ? `<p class="life-reflect">${esc(e.reflection)}</p>` : ""}
      <div class="life-row"><button class="life-primary" id="life-new">Live another life</button></div>
    </section>`;
    root.querySelector("#life-new").onclick = () => { s = null; start(); };
  }

  render();
  return { dispose() { dead = true; ctl.abort(); cutscene?.dispose(); root.classList.remove("life-root"); } };
}
