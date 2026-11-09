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
  dialog.innerHTML = `<section class="grace-browser"><header class="grace-titlebar"><div><b class="grace-mark">g</b><strong>Grace</strong><span>THE KAIROS WORLD WEB</span></div><button class="grace-close" aria-label="Close Grace and return to world">×</button></header><div class="grace-browser-controls"><button data-nav="back" aria-label="Go back">←</button><button data-nav="forward" aria-label="Go forward">→</button><button data-nav="refresh" aria-label="Refresh page">↻</button><button data-nav="home" aria-label="Grace home">⌂</button><label><span class="grace-lock" aria-hidden="true">◇</span><input readonly aria-label="Grace address" value="grace://home"></label><span class="grace-browser-local">IN WORLD</span></div><div class="grace-browser-body"><nav aria-label="Grace apps">${[
    ["home", "Home"],
    ["bible", "Games"],
    ["adventures", "Bible worlds"],
    ["messages", "PlayMessages"],
    ["atlas", "World atlas"],
    ["social", "Social House"],
    ["scripture", "Scripture"],
    ["character", "Character"],
    ["journey", "My journey"],
  ]
    .map(
      ([route, name]) =>
        `<button data-site="${route}"><i aria-hidden="true">${name.slice(0, 1)}</i><span>${name}</span></button>`,
    )
    .join(
      "",
    )}</nav><iframe title="Grace in-game browser" allow="autoplay; encrypted-media; fullscreen"></iframe></div><footer class="grace-browser-status"><span>Grace · Your platform inside Kairos World</span><span>Progress stays with this device and player</span></footer></section>`;
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
