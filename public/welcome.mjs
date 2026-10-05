// Front door: who's playing, age check, and account set-up for players, parents and children.
import { accounts, AGE, bandFor, canSelfRegister, checkEmails, checkName } from "./accounts.mjs";
import { guide, CHARACTERS } from "./bible/mascot.mjs";
import {mountTutorial} from './tutorial.mjs';

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const dove = '<img class="wl-dove" src="assets/brand/dove-badge.svg" alt="" width="64" height="64">';

/**
 * Mount the welcome flow.
 * @param {HTMLElement} app
 * @param {{onDone: (player) => void}} opts called when a player is ready to play
 */
export function mountWelcome(app, { onDone }) {
  const state = { step: "who", mode: "self", age: 12, parentId: null, childAge: 8, draft: {}, history: [] };
  document.documentElement.dataset.audience = "welcome";

  const shell = (inner, { back = true } = {}) => {
    app.innerHTML = `<main class="wl"><header class="wl-top">${back && state.history.length ? '<button type="button" class="wl-back" data-act="back">Back</button>' : "<span></span>"}<span class="wl-brand">${dove}<span>Kairos<b>Games</b></span></span><span></span></header><section class="wl-card" aria-live="polite">${inner}</section><p class="wl-small">KairosGames keeps children’s details to a first name or nickname. Grown-ups manage accounts for players under 16.</p></main>`;
    app.querySelector('[data-act="back"]')?.addEventListener("click", back_);
    const h = app.querySelector("h1");
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  };
  const go = (step) => {
    state.history.push(state.step);
    state.step = step;
    render();
  };
  function back_() {
    state.step = state.history.pop() || "who";
    render();
  }
  const errorBox = (msg) => `<p class="wl-error" role="alert">${esc(msg)}</p>`;

  function who() {
    const players = accounts.players();
    shell(
      `<h1>Who’s playing?</h1>
      ${
        players.length
          ? `<div class="wl-profiles" role="list">${players
              .map(
                (p) =>
                  `<button type="button" class="wl-profile" role="listitem" data-player="${p.id}"><span class="wl-profile-art">${guide("wave", { character: p.character, bust: true, age: p.band === "adult" ? "adult" : "kid" })}</span><strong>${esc(p.name)}</strong><small>${p.band === "adult" ? "KairosGames" : "KairosGames Kids"}</small></button>`,
              )
              .join("")}</div><p class="wl-or">or set up someone new</p>`
          : `<p class="wl-lead">Bible games for the whole family. Tell us who’s here and we’ll set things up.</p>`
      }
      <div class="wl-choices">
        <button type="button" class="wl-choice" data-act="self"><span class="wl-choice-art">${guide("cheer", { character: "ama", age: "kid" })}</span><strong>I’m playing</strong><small>Set up your player</small></button>
        <button type="button" class="wl-choice" data-act="parent"><span class="wl-choice-art">${guide("wave", { character: "theo", age: "adult" })}</span><strong>I’m a parent or guardian</strong><small>Set up your family</small></button>
      </div>`,
      { back: false },
    );
    app.querySelectorAll("[data-player]").forEach((b) =>
      b.addEventListener("click", () => {
        accounts.setActive(b.dataset.player);
        onDone(accounts.active());
      }),
    );
    app.querySelector('[data-act="self"]').onclick = () => {
      state.mode = "self";
      go("age");
    };
    app.querySelector('[data-act="parent"]').onclick = () => {
      state.mode = "parent";
      state.age = Math.max(state.age, 30);
      go("age");
    };
  }

  function ageStep() {
    const forChild = state.mode === "child";
    const value = forChild ? state.childAge : state.age;
    const title = forChild ? "How old is your child?" : state.mode === "parent" ? "How old are you?" : "How old are you?";
    shell(
      `<h1>${title}</h1><p class="wl-lead">${forChild ? "This sets the right games and look for them." : "Scroll to your age, then press continue."}</p>
      <div class="wl-age-readout" aria-hidden="true"><b id="age-value">${value}</b><span>years old</span></div>
      <div class="wl-age">
        <button type="button" class="wl-age-step" data-step="-1" aria-label="One year younger">&minus;</button>
        <div class="wl-age-bar" id="age-bar" role="slider" tabindex="0" aria-label="${forChild ? "Child’s age" : "Your age"}" aria-valuemin="${AGE.min}" aria-valuemax="${AGE.max}" aria-valuenow="${value}" aria-valuetext="${value} years old">
          <div class="wl-age-track">${Array.from({ length: AGE.max - AGE.min + 1 }, (_, i) => `<button type="button" tabindex="-1" data-age="${AGE.min + i}">${AGE.min + i}</button>`).join("")}</div>
        </div>
        <button type="button" class="wl-age-step" data-step="1" aria-label="One year older">+</button>
      </div>
      <button type="button" class="wl-btn" data-act="next" id="age-next">Continue</button>`,
    );
    const bar = app.querySelector("#age-bar"),
      out = app.querySelector("#age-value");
    let current = value,
      target = null,
      settle = 0;
    const cell = () => bar.querySelector("[data-age]").getBoundingClientRect().width;
    const show = (n) => {
      current = Math.max(AGE.min, Math.min(AGE.max, n));
      out.textContent = current;
      bar.setAttribute("aria-valuenow", current);
      bar.setAttribute("aria-valuetext", `${current} years old`);
      bar.querySelectorAll("[data-age]").forEach((b) => b.classList.toggle("on", Number(b.dataset.age) === current));
    };
    const scrollTo = (n, smooth = true) => {
      show(n);
      target = current;
      clearTimeout(settle);
      settle = setTimeout(() => (target = null), 700);
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      bar.scrollTo({ left: (current - AGE.min) * cell(), behavior: smooth && !reduce ? "smooth" : "auto" });
    };
    bar.addEventListener("scroll", () => {
      const at = AGE.min + Math.round(bar.scrollLeft / cell());
      if (target !== null) {
        if (at === target) target = null;
        return;
      }
      show(at);
    });
    bar.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key];
      if (e.key === "Home") scrollTo(AGE.min);
      else if (e.key === "End") scrollTo(AGE.max);
      else if (d) scrollTo(current + d);
      else return;
      e.preventDefault();
    });
    bar.querySelectorAll("[data-age]").forEach((b) => (b.onclick = () => scrollTo(Number(b.dataset.age))));
    app.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => scrollTo(current + Number(b.dataset.step))));
    requestAnimationFrame(() => scrollTo(value, false));
    app.querySelector("#age-next").onclick = () => {
      if (forChild) {
        state.childAge = current;
        return go("child");
      }
      state.age = current;
      if (state.mode === "parent") return go(current >= AGE.adult ? "parentForm" : "tooYoungParent");
      go(canSelfRegister(current) ? "selfForm" : "guardian");
    };
  }

  function guardian() {
    shell(
      `<div class="wl-hero-art">${guide("encourage", { age: "kid" })}</div><h1>Let’s get a grown-up</h1>
      <p class="wl-lead">Players under ${AGE.self} need a parent or guardian to set up their account. Ask them to come and help you. It only takes a minute.</p>
      <div class="wl-actions"><button type="button" class="wl-btn" data-act="here">My parent or guardian is here</button><button type="button" class="wl-btn wl-btn-ghost" data-act="home">Not now</button></div>`,
    );
    app.querySelector('[data-act="here"]').onclick = () => {
      state.childAge = state.age;
      state.mode = "parent";
      state.age = 30;
      go("age");
    };
    app.querySelector('[data-act="home"]').onclick = () => {
      state.history = [];
      state.step = "who";
      render();
    };
  }

  function tooYoungParent() {
    shell(
      `<h1>You need to be 18 or over</h1><p class="wl-lead">Family accounts are set up by a parent or guardian aged 18 or over. If you’re a player, go back and choose “I’m playing”.</p>
      <div class="wl-actions"><button type="button" class="wl-btn" data-act="home">Start again</button></div>`,
    );
    app.querySelector('[data-act="home"]').onclick = () => {
      state.history = [];
      state.step = "who";
      render();
    };
  }

  const field = (id, label, type = "text", value = "", extra = "") =>
    `<label class="wl-field" for="${id}"><span>${label}</span><input id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${extra}></label>`;

  function selfForm(error = "") {
    const d = state.draft;
    shell(
      `<h1>Create your account</h1><p class="wl-lead">You’ll play on <b>${bandFor(state.age) === "adult" ? "KairosGames" : "KairosGames Kids"}</b>.</p>${error ? errorBox(error) : ""}
      <form class="wl-form" novalidate>
        ${field("name", "First name or nickname", "text", d.name, 'autocomplete="given-name" maxlength="20" required')}
        ${field("email", "Email address", "email", d.email, 'autocomplete="email" required')}
        ${field("emailConfirm", "Type your email again", "email", d.emailConfirm, 'autocomplete="off" required')}
        <label class="wl-check"><input type="checkbox" name="agreed" ${d.agreed ? "checked" : ""}> <span>I agree to the KairosGames terms and privacy notice.</span></label>
        <button class="wl-btn">Continue</button>
      </form>`,
    );
    app.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      Object.assign(state.draft, { name: f.get("name"), email: f.get("email"), emailConfirm: f.get("emailConfirm"), agreed: f.get("agreed") === "on" });
      const n = checkName(state.draft.name),
        m = checkEmails(state.draft.email, state.draft.emailConfirm);
      if (!n.ok) return selfForm(n.error);
      if (!m.ok) return selfForm(m.error);
      if (!state.draft.agreed) return selfForm("Please agree to the terms to continue.");
      state.pickFor = "self";
      go("character");
    };
  }

  function parentForm(error = "") {
    const d = state.draft;
    shell(
      `<h1>Set up your family</h1><p class="wl-lead">Use your email for the grown-up profile. Your child needs only a nickname and age for their player profile.</p>${error ? errorBox(error) : ""}
      <details class="wl-parent-guidance"><summary>Before your child starts playing</summary><p>Play together for the first few rounds and choose an appropriate break time. Use a nickname that does not reveal your child’s full name, school or location.</p><p>Charades and Pictionary are played with people beside you. Online rooms include messages from other players: supervise these games and share room codes only with people you know.</p><p>This version saves profiles on this device. Its grown-up question is a shared-device check, not identity verification or a secure parental account. Verified online accounts are not connected yet.</p></details>
      <form class="wl-form" novalidate>
        ${field("name", "Your first name", "text", d.pname, 'autocomplete="given-name" maxlength="20" required')}
        ${field("email", "Your email address", "email", d.pemail, 'autocomplete="email" required')}
        ${field("emailConfirm", "Type your email again", "email", d.pemailConfirm, 'autocomplete="off" required')}
        <label class="wl-check"><input type="checkbox" name="consent" ${d.consent ? "checked" : ""}> <span>I am the parent or legal guardian, and I give consent for my child to use KairosGames Kids.</span></label>
        <button class="wl-btn">Continue</button>
      </form>`,
    );
    app.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      Object.assign(state.draft, { pname: f.get("name"), pemail: f.get("email"), pemailConfirm: f.get("emailConfirm"), consent: f.get("consent") === "on" });
      try {
        const parent = accounts.signUpParent({ name: state.draft.pname, age: state.age, email: state.draft.pemail, emailConfirm: state.draft.pemailConfirm, consent: state.draft.consent });
        state.parentId = parent.id;
        state.mode = "child";
        go("age");
      } catch (err) {
        parentForm(err.message);
      }
    };
  }

  function childForm(error = "") {
    shell(
      `<h1>Add your child</h1><p class="wl-lead">${state.childAge} years old · plays on <b>${bandFor(state.childAge) === "adult" ? "KairosGames" : "KairosGames Kids"}</b></p>${error ? errorBox(error) : ""}
      <form class="wl-form" novalidate>
        ${field("name", "Child’s first name or nickname", "text", state.draft.cname, 'autocomplete="off" maxlength="20" required')}
        <p class="wl-hint">No surnames, photos or email addresses are needed for children.</p>
        <button class="wl-btn">Choose their character</button>
      </form>`,
    );
    app.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      state.draft.cname = new FormData(e.currentTarget).get("name");
      const n = checkName(state.draft.cname);
      if (!n.ok) return childForm(n.error);
      state.pickFor = "child";
      go("character");
    };
  }

  function characterStep() {
    const age = state.pickFor === "child" ? state.childAge : state.age;
    const look = bandFor(age) === "adult" ? "adult" : "kid";
    let chosen = state.draft.character || "kai";
    shell(
      `<h1>${state.pickFor === "child" ? "Pick their character" : "Pick your character"}</h1><p class="wl-lead">You can change this later.</p>
      <div class="wl-chars" role="radiogroup" aria-label="Characters">${CHARACTERS.map((c) => `<button type="button" role="radio" class="wl-char" data-char="${c.id}" aria-checked="${c.id === chosen}" tabindex="${c.id === chosen ? 0 : -1}"><span class="wl-char-art">${guide("wave", { character: c.id, age: look })}</span><strong>${esc(c.name)}</strong></button>`).join("")}</div>
      <button type="button" class="wl-btn" data-act="create">${state.pickFor === "child" ? "Create their account" : "Create my account"}</button><div id="char-error"></div>`,
    );
    const cards = [...app.querySelectorAll("[data-char]")];
    const pick = (b, focus) => {
      chosen = b.dataset.char;
      cards.forEach((x) => {
        x.setAttribute("aria-checked", String(x === b));
        x.tabIndex = x === b ? 0 : -1;
      });
      if (focus) b.focus();
    };
    cards.forEach((b, i) => {
      b.onclick = () => pick(b);
      b.onkeydown = (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        pick(cards[(i + d + cards.length) % cards.length], true);
      };
    });
    app.querySelector('[data-act="create"]').onclick = () => {
      state.draft.character = chosen;
      try {
        if (state.pickFor === "child") {
          const child = accounts.addChild(state.parentId, { name: state.draft.cname, age: state.childAge, character: chosen });
          state.lastChild = child;
          go("familyDone");
        } else {
          const me = accounts.signUpSelf({ name: state.draft.name, age: state.age, email: state.draft.email, emailConfirm: state.draft.emailConfirm, agreed: state.draft.agreed, character: chosen });
          mountTutorial(app,{onDone:()=>onDone(me)});
        }
      } catch (err) {
        app.querySelector("#char-error").innerHTML = errorBox(err.message);
      }
    };
  }

  function familyDone() {
    const child = state.lastChild;
    shell(
      `<div class="wl-hero-art">${guide("cheer", { character: child.character, age: child.band === "adult" ? "adult" : "kid" })}</div>
      <h1>${esc(child.name)} is ready to play</h1><p class="wl-lead">Hand the device to ${esc(child.name)}. To come back to this screen later, choose “Switch player” in My journey.</p>
      <div class="wl-actions">
        <button type="button" class="wl-btn" data-act="start">Start ${child.band === "adult" ? "KairosGames" : "KairosGames Kids"} as ${esc(child.name)}</button>
        <button type="button" class="wl-btn wl-btn-ghost" data-act="another">Add another child</button>
        <button type="button" class="wl-btn wl-btn-ghost" data-act="me">Play KairosGames myself</button>
      </div>`,
      { back: false },
    );
    app.querySelector('[data-act="start"]').onclick = () => {
      accounts.setActive(child.id);
      mountTutorial(app,{onDone:()=>onDone(accounts.active())});
    };
    app.querySelector('[data-act="another"]').onclick = () => {
      state.draft.cname = "";
      state.draft.character = "kai";
      state.mode = "child";
      state.childAge = 8;
      go("age");
    };
    app.querySelector('[data-act="me"]').onclick = () => {const player=accounts.playAsParent(state.parentId);mountTutorial(app,{onDone:()=>onDone(player)});};
  }

  function render() {
    ({ who, age: ageStep, guardian, tooYoungParent, selfForm, parentForm, child: childForm, character: characterStep, familyDone })[state.step]();
  }
  render();
}

/**
 * A simple grown-up check before leaving a child's profile.
 * @returns {Promise<boolean>}
 */
export function grownUpCheck(host) {
  return new Promise((resolve) => {
    const a = 3 + Math.floor(Math.random() * 7),
      b = 4 + Math.floor(Math.random() * 6);
    const dlg = document.createElement("dialog");
    dlg.className = "wl-gate";
    dlg.innerHTML = `<form method="dialog"><h2>Grown-ups only</h2><p>Ask a parent or guardian to answer: what is ${a} × ${b}?</p><label for="gate-answer" class="wl-field"><span>Answer</span><input id="gate-answer" inputmode="numeric" autocomplete="off" required></label><p class="wl-error" role="alert" hidden>That’s not right. Ask a grown-up to try again.</p><div class="wl-actions"><button class="wl-btn" value="check">Continue</button><button class="wl-btn wl-btn-ghost" value="cancel" formnovalidate>Cancel</button></div></form>`;
    host.append(dlg);
    const done = (ok) => {
      dlg.close();
      dlg.remove();
      resolve(ok);
    };
    dlg.querySelector("form").onsubmit = (e) => {
      if (e.submitter?.value === "cancel") return done(false);
      e.preventDefault();
      if (Number(dlg.querySelector("input").value) === a * b) done(true);
      else dlg.querySelector(".wl-error").hidden = false;
    };
    dlg.addEventListener("cancel", () => done(false));
    dlg.showModal();
  });
}
