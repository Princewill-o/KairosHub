// Kairos account: sign in, create an account, and confirm your email with the 6-digit
// code we send. Uses the family backend (/api/family) so the same login opens the
// family dashboard, Kharis branch sync and progress across devices.
import { familyApi } from "./family-client.mjs";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function mountAccount(root, { mode = "signin", query = "" } = {}) {
  let dead = false;
  const q = new URLSearchParams(query);
  const page = (inner) => {
    if (dead) return;
    root.innerHTML = `<main class="acc-page"><a class="acc-back" href="#landing">‹ Kairos home</a><section class="acc-card"><img class="acc-logo" src="/brand/kairos-life-wordmark-game.png" alt="Kairos Life">${inner}</section><p class="acc-verse">“The LORD bless thee, and keep thee.” <b>Numbers 6:24</b></p></main>`;
  };
  const say = (text, good = false) => { const el = root.querySelector("[data-acc-msg]"); if (el) { el.textContent = text; el.className = good ? "acc-msg good" : "acc-msg"; el.focus(); } };

  function signedIn(parent, welcome = false) {
    page(`<p class="acc-eyebrow">${welcome ? "WELCOME TO THE FAMILY" : "SIGNED IN"}</p><h1>${welcome ? `You're in, ${esc(parent.name)}. Be blessed!` : `Hi ${esc(parent.name)}`}</h1>
      <p>${welcome ? "Your email is confirmed and a welcome email is on its way." : "Your progress, family profiles and Kharis branch sync to this account."}</p>
      <div class="acc-actions"><a class="acc-btn acc-gold" href="#world">Enter Kairos World</a><a class="acc-btn" href="#family">Family dashboard</a><button class="acc-btn acc-soft" id="acc-out">Sign out</button></div>`);
    root.querySelector("#acc-out").onclick = async () => { try { await familyApi("/logout", {}); } catch { /* already out */ } form("signin", "You're signed out."); };
  }

  function verify(email, prefill = "", note = "") {
    page(`<p class="acc-eyebrow">CHECK YOUR INBOX</p><h1>Enter your code</h1>
      <p>We sent a 6-digit code to <b>${esc(email)}</b>. It works for 15 minutes.</p>
      <form id="acc-verify"><label>Verification code<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}" required value="${esc(prefill)}" class="acc-code"></label>
      <p data-acc-msg class="acc-msg" tabindex="-1" role="alert">${esc(note)}</p>
      <button class="acc-btn acc-gold" type="submit">Verify and sign in</button></form>
      <p class="acc-small">No email? Check spam, or <button class="acc-link" id="acc-resend">send a new code</button>. <button class="acc-link" id="acc-other">Use another email</button></p>`);
    const f = root.querySelector("#acc-verify");
    f.onsubmit = async (e) => {
      e.preventDefault();
      const b = f.querySelector("[type=submit]"); b.disabled = true;
      try { const r = await familyApi("/verify", { email, code: new FormData(f).get("code") }); signedIn(r.parent, true); }
      catch (err) { say(err.message); } finally { b.disabled = false; }
    };
    root.querySelector("#acc-resend").onclick = async (e) => {
      e.target.disabled = true;
      try { await familyApi("/resend", { email }); say("A new code is on its way (one per minute).", true); } catch (err) { say(err.message); }
      setTimeout(() => { if (!dead) e.target.disabled = false; }, 60000);
    };
    root.querySelector("#acc-other").onclick = () => form("signup");
    if (prefill.length === 6) f.requestSubmit();
  }

  function form(which, note = "") {
    const up = which === "signup";
    page(`<p class="acc-eyebrow">${up ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</p><h1>${up ? "Join Kairos Life" : "Sign in"}</h1>
      <div class="acc-tabs" role="tablist"><button role="tab" aria-selected="${!up}" data-tab="signin">Sign in</button><button role="tab" aria-selected="${up}" data-tab="signup">Create account</button></div>
      <form id="acc-form">
        ${up ? `<label>First name<input name="name" maxlength="20" autocomplete="given-name" required></label><label>Age<input name="age" type="number" min="18" max="99" required></label>` : ""}
        <label>Email<input name="email" type="email" autocomplete="username" required></label>
        <label>Password<input name="password" type="password" minlength="12" maxlength="128" autocomplete="${up ? "new-password" : "current-password"}" required></label>
        ${up ? `<label>Confirm password<input name="confirm" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></label>
        <label class="acc-check"><input name="consent" type="checkbox" required> I'm 18 or over. If I add children, I'm their parent or guardian and consent to saving their nicknames, ages and game progress.</label>` : ""}
        <p data-acc-msg class="acc-msg" tabindex="-1" role="alert">${esc(note)}</p>
        <button class="acc-btn acc-gold" type="submit">${up ? "Create account" : "Sign in"}</button>
      </form>
      <p class="acc-small">${up ? "We'll email you a 6-digit code to confirm it's you. Under 18? Ask a parent to add you from their family dashboard." : "Passwords are at least 12 characters."}</p>`);
    root.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => form(b.dataset.tab)));
    const f = root.querySelector("#acc-form");
    f.onsubmit = async (e) => {
      e.preventDefault();
      const d = new FormData(f), b = f.querySelector("[type=submit]");
      if (up && d.get("password") !== d.get("confirm")) return say("The passwords don't match.");
      b.disabled = true;
      const email = String(d.get("email"));
      try {
        const r = await familyApi(up ? "/signup" : "/login", { email, password: d.get("password"), ...(up ? { name: d.get("name"), age: Number(d.get("age")), consent: d.get("consent") === "on" } : {}) });
        if (r.verify) verify(r.email || email);
        else signedIn(r.parent, up);
      } catch (err) {
        if (err.data?.verify) verify(err.data.email || email, "", err.message);
        else say(err.message);
      } finally { b.disabled = false; }
    };
  }

  if (mode === "verify" && q.get("email")) verify(q.get("email"), (q.get("code") || "").replace(/\D/g, "").slice(0, 6));
  else if (mode === "signup") form("signup");
  else {
    page('<p role="status">Checking your account…</p>');
    familyApi("").then((r) => signedIn(r.parent)).catch(() => form("signin"));
  }
  return { dispose() { dead = true; } };
}
