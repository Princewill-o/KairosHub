import { graceRoute, graceStories, graceChallenges } from "./grace-catalog.mjs";
import { createAvatarStore } from "./avatar.mjs";
export function mountGraceBrowser(
  dialog,
  { world, profile, appearance, send },
) {
  let history = [],
    index = -1,
    current = "home",
    disposed = false;
  const apps = [
    ["home", "Home"],
    ["bible", "Games"],
    ["adventures", "Bible worlds"],
    ["messages", "PlayMessages"],
    ["atlas", "World atlas"],
    ["social", "Social House"],
    ["scripture", "Scripture"],
    ["character", "Character"],
    ["journey", "My journey"],
  ];
  const chevron = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // Safari-style window: traffic lights, unified toolbar, centred smart search
  // field, favourites bar. Same controls and data attributes as before.
  dialog.innerHTML = `<section class="grace-browser safari"><header class="safari-toolbar"><div class="safari-lights"><button class="grace-close safari-light red" aria-label="Close Grace and return to world"></button><span class="safari-light yellow" aria-hidden="true"></span><span class="safari-light green" aria-hidden="true"></span></div><div class="safari-nav"><button data-nav="back" aria-label="Go back">${chevron("M15 5l-7 7 7 7")}</button><button data-nav="forward" aria-label="Go forward">${chevron("M9 5l7 7-7 7")}</button></div><label class="safari-field"><span class="grace-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg></span><input readonly aria-label="Grace address" value="grace://home"><button data-nav="refresh" aria-label="Refresh page">${chevron("M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5")}</button></label><div class="safari-actions"><button data-nav="home" aria-label="Grace home">${chevron("M4 11l8-7 8 7M6 10v10h12V10")}</button><span class="safari-brand"><b class="grace-mark">g</b>Grace</span></div></header><nav class="safari-favourites" aria-label="Grace apps">${apps
    .map(
      ([route, name]) =>
        `<button data-site="${route}"><i aria-hidden="true">${name.slice(0, 1)}</i><span>${name}</span></button>`,
    )
    .join("")}</nav><div class="grace-browser-body"><iframe title="Grace in-game browser" allow="autoplay; encrypted-media; fullscreen"></iframe></div></section>`;
  const frame = dialog.querySelector("iframe"),
    address = dialog.querySelector("input");
  function update() {
    if (disposed || !dialog.open) return;
    try {
      current = graceRoute(frame.contentWindow.location.hash.slice(1));
      if (history[index] !== current) {
        history = history.slice(0, index + 1);
        history.push(current);
        index++;
      }
      address.value = "grace://" + current.replace(/^bible/, "games");
      dialog
        .querySelectorAll("[data-site]")
        .forEach((b) =>
          b.setAttribute(
            "aria-current",
            String(current.split("/")[0] === b.dataset.site),
          ),
        );
      updateButtons();
    } catch {}
  }
  function go(route, push = true) {
    current = graceRoute(route);
    if (push) {
      history = history.slice(0, index + 1);
      history.push(current);
      index++;
    }
    address.value = "grace://" + current.replace(/^bible/, "games");
    frame.src =
      "/?grace=1&island=" +
      encodeURIComponent(dialog.dataset.island || "city") +
      "#" +
      current;
    updateButtons();
  }
  function updateButtons() {
    dialog.querySelector('[data-nav="back"]').disabled = index < 1;
    dialog.querySelector('[data-nav="forward"]').disabled =
      index >= history.length - 1;
  }
  const close = () => dialog.close();
  dialog.querySelector(".grace-close").onclick = close;
  dialog
    .querySelectorAll("[data-site]")
    .forEach((b) => (b.onclick = () => go(b.dataset.site)));
  dialog.querySelector('[data-nav="back"]').onclick = () => {
    if (index > 0) go(history[--index], false);
  };
  dialog.querySelector('[data-nav="forward"]').onclick = () => {
    if (index < history.length - 1) go(history[++index], false);
  };
  dialog.querySelector('[data-nav="home"]').onclick = () => go("home");
  dialog.querySelector('[data-nav="refresh"]').onclick = () =>
    go(current, false);
  frame.onload = () => {
    if (!dialog.open) return;
    update();
    try {
      frame.contentWindow.addEventListener("hashchange", update);
    } catch {}
  };
  const onClose = () => {
    frame.src = "about:blank";
    world.inert = false;
    send({ type: "kairos-world:grace-state", open: false });
    send({ type: "kairos-world:appearance", appearance: appearance() });
    world.focus();
  };
  dialog.addEventListener("close", onClose);
  const listener = (event) => {
    if (
      event.origin !== location.origin ||
      event.source !== frame.contentWindow
    )
      return;
    if (event.data?.type === "kairos-grace:appearance") {
      const a = createAvatarStore(profile.id).set(event.data.appearance);
      send({ type: "kairos-world:appearance", appearance: a });
    }
    if (event.data?.type !== "kairos-grace:action") return;
    const { action, value } = event.data;
    if (action === "world") close();
    if (action === "visit") {
      send({
        type: "kairos-world:visit",
        destination: String(value).slice(0, 100),
      });
      close();
    }
    if (action === "story" && graceStories.some((s) => s.id === value)) {
      send({ type: "kairos-world:story", story: value });
      close();
    }
    if (action === "challenge" && graceChallenges.some((s) => s.id === value)) {
      send({ type: "kairos-world:challenge", challenge: value });
      close();
    }
  };
  window.addEventListener("message", listener);
  return {
    open(route = "home") {
      if (!dialog.open) {
        world.inert = true;
        dialog.showModal();
      }
      send({ type: "kairos-world:grace-state", open: true });
      go(route);
    },
    dispose() {
      disposed = true;
      window.removeEventListener("message", listener);
      dialog.removeEventListener("close", onClose);
      if (dialog.open) dialog.close();
      frame.src = "about:blank";
    },
  };
}
