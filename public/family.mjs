import { accounts } from "./accounts.mjs";
import { familyApi, loadCloudProgress } from "./family-client.mjs";
import { bibleGames } from "./bible/content.mjs";
import { kai, CHARACTERS } from "./bible/mascot.mjs";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const date = (n) =>
  n
    ? new Date(n).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : "No games yet";
const badge = (g) =>
  `<img src="assets/games/${g.id}.svg" alt="" width="64" height="64">`;
const stat = (value, label) =>
  `<article class="family-stat"><strong>${value}</strong><span>${label}</span></article>`;
export function mountFamily(root, { signup: initialSignup = false } = {}) {
  let dead = false,
    signup = initialSignup,
    dashboard = null,
    selected = null;
  const frame = (html) => {
    if (dead) return;
    root.innerHTML = `<main class="family-page"><header class="family-top"><a class="brand" href="#bible"><img class="brand-mark" src="assets/brand/dove-badge.svg" alt=""><span>Kairos<b>Games</b></span></a><a class="kg-btn kg-btn-soft" href="#welcome">Players</a></header>${html}<p class="family-foot">Children use a first name or nickname. Family progress is private to your account. Scores show game practice, not a formal assessment.</p></main>`;
  };
  const message = (error) => {
    const el = root.querySelector("[data-family-message]");
    if (el) {
      el.textContent = error;
      el.focus();
    }
  };
  function auth(note = "") {
    frame(
      `<section class="family-auth"><span class="family-eyebrow">A LITTLE PLAY. A LIFETIME OF GROWTH.</span><h1>${signup ? "Bring your family together." : "Your family’s little victories."}</h1><p>See what they’re learning, celebrate their stars, and pick up where they left off on another device.</p><div class="family-auth-tabs"><button class="kg-btn ${!signup ? "" : "kg-btn-soft"}" data-auth="login">Sign in</button><button class="kg-btn ${signup ? "" : "kg-btn-soft"}" data-auth="signup">Create family account</button></div><form id="family-auth-form">${signup ? '<label>Your first name<input name="name" maxlength="20" autocomplete="given-name" required></label><label>Your age<input name="age" type="number" min="18" max="99" required></label>' : ""}<label>Your email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" minlength="12" maxlength="128" autocomplete="${signup ? "new-password" : "current-password"}" required></label>${signup ? '<label>Confirm password<input name="confirm" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></label><label class="family-consent"><input name="consent" type="checkbox" required> I am the parent or guardian, aged 18 or over. I consent to storing my children’s nicknames, ages and game results to track their progress.</label>' : ""}<p role="alert" tabindex="-1" data-family-message>${esc(note)}</p><button class="kg-btn kg-btn-gold" type="submit">${signup ? "Create account" : "Open parent dashboard"}</button></form><p class="family-foot">Use a unique password with at least 12 characters. Keep it safe: email verification and password recovery are not connected yet.</p><a class="kg-link" href="#welcome">Continue with device-only profiles</a></section>`,
    );
    root.querySelectorAll("[data-auth]").forEach(
      (b) =>
        (b.onclick = () => {
          signup = b.dataset.auth === "signup";
          auth();
        }),
    );
    root.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target),
        button = e.target.querySelector("[type=submit]");
      if (signup && f.get("password") !== f.get("confirm"))
        return message("The passwords don’t match.");
      button.disabled = true;
      try {
        await familyApi(signup ? "/signup" : "/login", {
          email: f.get("email"),
          password: f.get("password"),
          ...(signup
            ? {
                name: f.get("name"),
                age: Number(f.get("age")),
                consent: f.get("consent") === "on",
              }
            : {}),
        });
        await load();
      } catch (error) {
        message(error.message);
      } finally {
        button.disabled = false;
      }
    };
  }
  function detail(child) {
    const recent = child.recent || [];
    return `<section class="family-detail"><div class="family-section-title"><div><span class="family-eyebrow">CHILD’S LEARNING JOURNEY</span><h2>${esc(child.name)}’s progress</h2></div><button class="kg-btn kg-btn-gold" data-play="${child.id}">Play as ${esc(child.name)}</button></div><div class="family-stats">${stat(child.summary.stars, "stars collected")}${stat(child.summary.rounds, "games finished")}${stat(child.summary.games + " / " + bibleGames.length, "games explored")}${stat(child.summary.streak, "day streak · UTC")}</div><h3>Skills taking root</h3><div class="family-skills">${[
      "Knowledge",
      "Puzzles",
      "Explore",
      "Together",
    ]
      .map((category) => {
        const games = bibleGames.filter((g) => g.category === category),
          earned = games.reduce(
            (n, g) =>
              n +
              (child.records[g.id]
                ? child.records[g.id].best >= 90
                  ? 3
                  : child.records[g.id].best >= 60
                    ? 2
                    : 1
                : 0),
            0,
          );
        return `<div><span>${category}<b>${earned} / ${games.length * 3} stars</b></span><progress value="${earned}" max="${games.length * 3}" aria-label="${category} stars"></progress></div>`;
      })
      .join(
        "",
      )}</div><h3>Game-by-game progress</h3><div class="family-game-grid">${bibleGames
      .map((g) => {
        const r = child.records[g.id];
        return `<article class="family-game">${badge(g)}<div><strong>${esc(g.title)}</strong><small>${r ? `Best ${r.best}% · ${r.runs} finished` : "Ready to discover"}</small><progress max="100" value="${r?.best || 0}" aria-label="${esc(g.title)} best score"></progress></div></article>`;
      })
      .join(
        "",
      )}</div><h3>Recent activity</h3>${recent.length ? `<ol class="family-activity">${recent.map((r) => `<li><span>${esc(bibleGames.find((g) => g.id === r.game_id)?.title || r.game_id)}<small>${date(r.completed_at)}</small></span><b>${r.score}%</b></li>`).join("")}</ol>` : '<p class="family-empty">Their first adventure will appear here. Choose “Play as ' + esc(child.name) + "” to get started.</p>"}</section>`;
  }
  function show() {
    const children = dashboard.children,
      child = children.find((c) => c.id === selected) || children[0];
    frame(
      `<section class="family-heading"><div><span class="family-eyebrow">PARENT DASHBOARD</span><h1>A little more growth, every day.</h1><p>Welcome, ${esc(dashboard.parent.name)}. Here’s how your explorers are getting on.</p></div><div class="family-tools"><button class="kg-btn kg-btn-soft" id="family-refresh">Refresh progress</button><button class="kg-link" id="family-logout">Sign out</button></div></section><p role="status" tabindex="-1" data-family-message></p><div class="family-stats">${stat(children.length, "young explorers")}${stat(
        children.reduce((n, c) => n + c.summary.rounds, 0),
        "games completed",
      )}${stat(
        children.reduce((n, c) => n + c.summary.stars, 0),
        "stars earned",
      )}</div><div class="family-layout"><aside class="family-sidebar"><h2>Your explorers</h2>${children.map((c) => `<button class="family-child ${c.id === child?.id ? "selected" : ""}" data-child="${c.id}" aria-pressed="${c.id === child?.id}">${kai("wave", { character: c.character, bust: true })}<span><strong>${esc(c.name)}</strong><small>Age ${c.age} · ${c.summary.stars} stars</small><small>${date(c.summary.lastPlayed)}</small></span></button>`).join("")}<details ${children.length ? "" : "open"}><summary>Add a child</summary><form id="family-child-form"><label>First name or nickname<input name="name" maxlength="20" required></label><label>Age<input name="age" type="number" min="4" max="17" required></label><label>Guide character<select name="character">${CHARACTERS.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</select></label><button class="kg-btn kg-btn-gold" type="submit">Add explorer</button></form></details><p class="family-foot">Starting play locks this dashboard. Sign in again with your password to return.</p></aside>${child ? detail(child) : `<section class="family-detail family-empty">${kai("wave", { cls: "family-empty-guide" })}<h2>Their story starts here.</h2><p>Add your first explorer to start saving their progress across devices. No child email address needed.</p></section>`}</div>`,
    );
    root.querySelector("#family-refresh").onclick = load;
    root.querySelector("#family-logout").onclick = async () => {
      try {
        await familyApi("/logout", {});
        accounts.signOut();
        auth();
      } catch (e) {
        message(e.message);
      }
    };
    root.querySelectorAll("[data-child]").forEach(
      (b) =>
        (b.onclick = () => {
          selected = b.dataset.child;
          show();
        }),
    );
    root.querySelectorAll("[data-play]").forEach(
      (b) =>
        (b.onclick = async () => {
          b.disabled = true;
          try {
            const { child } = await familyApi("/play", {
              childId: b.dataset.play,
            });
            accounts.importCloudChild(child);
            await loadCloudProgress({ ...child, cloud: true });
            if (!dead) location.hash = "#journey";
          } catch (e) {
            message(e.message);
            b.disabled = false;
          }
        }),
    );
    root.querySelector("#family-child-form").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target),
        button = e.target.querySelector("button");
      button.disabled = true;
      try {
        const { child } = await familyApi("/children", {
          name: f.get("name"),
          age: Number(f.get("age")),
          character: f.get("character"),
        });
        selected = child.id;
        await load();
      } catch (error) {
        message(error.message);
        button.disabled = false;
      }
    };
  }
  async function load() {
    try {
      dashboard = await familyApi();
      if (!dead) show();
    } catch (e) {
      if (dead) return;
      if (e.status === 401 || e.status === 403)
        auth(
          e.status === 403
            ? "Ask your parent to sign in to open this dashboard."
            : "",
        );
      else {
        frame(
          `<section class="family-auth"><h1>Let’s reconnect.</h1><p role="alert">${esc(e.message)}</p><button class="kg-btn" id="family-retry">Try again</button><a class="kg-link" href="#welcome">Back to players</a></section>`,
        );
        root.querySelector("#family-retry").onclick = load;
      }
    }
  }
  frame('<p role="status">Opening your family dashboard…</p>');
  void load();
  return {
    dispose() {
      dead = true;
    },
  };
}
