import { accounts } from "./accounts.mjs";
import {
  avatarDefaults,
  avatarOptions,
  normalizeAvatar,
  createAvatarStore,
  avatarSvg,
} from "./avatar.mjs";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function mountCharacterStudio(root, { onChange = () => {} } = {}) {
  const store = createAvatarStore(accounts.active()?.id || "guest");
  let value = store.get(),
    tab = "look",
    pose = "wave";
  const inGrace=new URLSearchParams(location.search).get('grace')==='1';
  let previewFrame=null;
  const updatePreview=()=>previewFrame?.contentWindow?.postMessage({type:'kairos-character:preview',appearance:value,pose},location.origin);
  const previewReady=event=>{if(event.origin===location.origin&&event.source===previewFrame?.contentWindow&&event.data?.type==='kairos-character:ready')updatePreview();};
  window.addEventListener('message',previewReady);
  const sections = {
    look: [
      ["skin", "Skin tone"],
      ["frame", "Body"],
      ["build", "Build"],
      ["hair", "Hair style"],
      ["hairColor", "Hair colour"],
      ["eyes", "Eyes"],
      ["face", "Face details"],
    ],
    clothes: [
      ["outfit", "Top style"],
      ["top", "Top colour"],
      ["trousers", "Trousers"],
      ["legs", "Trouser colour"],
      ["shoe", "Shoes"],
    ],
    extras: [
      ["hat", "Headwear"],
      ["glasses", "Glasses"],
      ["scarf", "Scarf"],
      ["backpack", "Backpack"],
    ],
  };
  function save() {
    store.set(value);
    if(new URLSearchParams(location.search).get('grace')==='1')parent.postMessage({type:'kairos-grace:appearance',appearance:value},location.origin);
    onChange(value);
    preview();
    summary();
    root.querySelector(".cs-save").textContent = store.saved
      ? "Your custom character is saved on this device."
      : "Storage is unavailable. Your look stays for this visit.";
  }
  function preview() {
    if(inGrace){if(!previewFrame){previewFrame=document.createElement('iframe');previewFrame.title='Your animated Kairos explorer in 3D';previewFrame.src='/world/character.html';previewFrame.onload=updatePreview;root.querySelector('.cs-avatar').replaceChildren(previewFrame);}else updatePreview();}
    else root.querySelector(".cs-avatar").innerHTML = avatarSvg(value, pose, {
      label: "Your customized low-poly character",
    });
    root
      .querySelectorAll("[data-option]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(value[b.dataset.field] === b.dataset.option),
        ),
      );
    root
      .querySelectorAll("[data-toggle]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(value[b.dataset.toggle])),
      );
  }
  const HINT = { look: "Start with your body: skin tone, build, hair and face.", clothes: "Pick a top, trousers and shoes, and their colours.", extras: "Finish with a hat, glasses, a scarf or a backpack.", skins: "Or skip the builder and wear a ready-made skin. Pick “My own look” to go back." };
  let skins = null, skinCat = "All";
  const order = ["look", "clothes", "extras", "skins"];
  function summary() {
    const el = root.querySelector(".cs-summary"); if (!el) return;
    const name = (k) => avatarOptions[k]?.find((o) => o.value === value[k])?.label ?? "";
    el.innerHTML = value.skin64 ? `<b>Wearing:</b> ${/^\/skins\//.test(value.skin64) ? "skin pack · " + esc(value.skin64.slice(7, -4).replace(/-/g, " ")) : "your uploaded skin"}` : `<b>Wearing:</b> ${esc(name("hair"))} hair · ${esc(name("outfit"))} · ${esc(name("trousers"))} · ${esc(name("shoe"))}`;
  }
  function stepNav() {
    const i = order.indexOf(tab);
    return `<div class="cs-stepnav">${i > 0 ? `<button type="button" data-go="${order[i - 1]}">← Back</button>` : "<span></span>"}${i < order.length - 1 ? `<button type="button" class="cs-next" data-go="${order[i + 1]}">Next →</button>` : `<a class="cs-next" href="#bible">Done</a>`}</div>`;
  }
  function skinsPanel() {
    const panel = root.querySelector(".cs-controls");
    if (!skins) { panel.innerHTML = `<p class="cs-hint">${HINT.skins}</p><p>Loading skins…</p>`; fetch("/skins/index.json").then((r) => r.json()).then((list) => { skins = list; if (tab === "skins") controls(); }).catch(() => { skins = []; if (tab === "skins") controls(); }); return; }
    const cats = ["All", ...new Set(skins.map((e) => e.category))];
    panel.innerHTML = `<p class="cs-hint">${HINT.skins}</p><button type="button" class="cs-option cs-own" aria-pressed="${!value.skin64}">My own look (built in steps 1–3)</button><div class="cs-options cs-skincats">${cats.map((c) => `<button type="button" class="cs-option" data-skincat="${esc(c)}" aria-pressed="${c === skinCat}">${esc(c)}</button>`).join("")}</div><div class="cs-skingrid">${skins.filter((e) => skinCat === "All" || e.category === skinCat).map((e) => `<button type="button" data-skinfile="${e.file}" aria-pressed="${value.skin64 === e.file}" title="${esc(e.name)}"><span class="cs-skinface" style="background-image:url(${e.file})"></span><span>${esc(e.name)}</span></button>`).join("")}</div>${stepNav()}`;
    panel.querySelector(".cs-own").onclick = () => { const { skin64, ...rest } = value; value = normalizeAvatar(rest); try { localStorage.removeItem("kairos-skin-choice"); } catch {} save(); controls(); };
    panel.querySelectorAll("[data-skincat]").forEach((b) => (b.onclick = () => { skinCat = b.dataset.skincat; controls(); }));
    panel.querySelectorAll("[data-skinfile]").forEach((b) => (b.onclick = () => { value = normalizeAvatar({ ...value, skin64: b.dataset.skinfile }); try { localStorage.removeItem("kairos-skin-choice"); } catch {} save(); controls(); }));
    bindNav(panel);
  }
  function bindNav(panel) {
    panel.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => root.querySelector(`[data-tab="${b.dataset.go}"]`)?.click()));
  }
  function controls() {
    summary();
    if (tab === "skins") return skinsPanel();
    root.querySelector(".cs-controls").innerHTML = `<p class="cs-hint">${HINT[tab]}</p>` + sections[tab]
      .map(
        ([key, label]) =>
          `<fieldset><legend>${label}</legend>${typeof avatarDefaults[key] === "boolean" ? `<button class="cs-toggle" data-toggle="${key}" aria-pressed="${value[key]}">${label} <span>${value[key] ? "On" : "Off"}</span></button>` : `<div class="cs-options" role="group" aria-label="${label}">${avatarOptions[key].map((o) => `<button type="button" data-field="${key}" data-option="${o.value}" aria-pressed="${value[key] === o.value}" ${o.value.startsWith("#") ? `class="cs-swatch" style="--swatch:${o.value}" aria-label="${label}: ${o.label}" title="${o.label}"` : 'class="cs-option"'}>${o.value.startsWith("#") ? `<span class="kg-visually-hidden">${o.label}</span>` : esc(o.label)}</button>`).join("")}</div>`}</fieldset>`,
      )
      .join("") + stepNav();
    bindNav(root.querySelector(".cs-controls"));
    root.querySelectorAll("[data-option]").forEach(
      (b) =>
        (b.onclick = () => {
          value = normalizeAvatar({
            ...value,
            [b.dataset.field]: b.dataset.option,
          });
          save();
        }),
    );
    root.querySelectorAll("[data-toggle]").forEach(
      (b) =>
        (b.onclick = () => {
          value[b.dataset.toggle] = !value[b.dataset.toggle];
          save();
          controls();
        }),
    );
  }
  root.innerHTML = `<section class="character-studio"><a class="kg-back" href="#bible">Games</a><header><span class="cs-eyebrow">CHARACTER STUDIO</span><h1>Make this explorer yours.</h1><p>Shape a new look, choose an outfit and make it your own. Your character joins you throughout the platform.</p></header><div class="cs-layout"><aside class="cs-preview"><span class="cs-preview-label">YOUR EXPLORER</span><div class="cs-avatar"></div><p class="cs-summary" aria-live="polite"></p><div class="cs-pose" role="group" aria-label="Preview pose">${["wave", "cheer", "read", "think"].map((p) => `<button data-pose="${p}" aria-pressed="${p === pose}">${p[0].toUpperCase() + p.slice(1)}</button>`).join("")}</div><div class="cs-actions"><button id="cs-shuffle">Shuffle look</button><button id="cs-reset">Reset look</button></div><div class="cs-skin"><label class="cs-skin-upload">Use a Minecraft skin<input id="cs-skin-file" type="file" accept="image/png" /></label><button id="cs-skin-clear" type="button" hidden>Remove skin</button><p id="cs-skin-note" class="cs-skin-note">Any standard 64×64 (or classic 64×32) Minecraft skin PNG dresses your 3D character.</p></div><a class="pm-button pm-gold" href="#bible">Play with this look →</a></aside><div class="cs-panel"><nav class="cs-tabs" role="tablist" aria-label="Customize character">${[
    ["look", "1 · Body & face"],
    ["clothes", "2 · Clothes"],
    ["extras", "3 · Extras"],
    ["skins", "4 · Skin pack"],
  ]
    .map(
      ([id, label]) =>
        `<button role="tab" id="cs-tab-${id}" data-tab="${id}" aria-controls="cs-panel" aria-selected="${id === tab}">${label}</button>`,
    )
    .join(
      "",
    )}</nav><div id="cs-panel" role="tabpanel" aria-labelledby="cs-tab-look" class="cs-controls"></div></div></div><p class="cs-save" role="status">Changes save automatically for this player on this device.</p></section>`;
  root.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        root
          .querySelectorAll("[data-tab]")
          .forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        root.querySelector("#cs-panel").setAttribute("aria-labelledby", b.id);
        controls();
      }),
  );
  root.querySelectorAll("[data-pose]").forEach(
    (b) =>
      (b.onclick = () => {
        pose = b.dataset.pose;
        root
          .querySelectorAll("[data-pose]")
          .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        preview();
      }),
  );
  // Minecraft skins: checked for size, kept as a small data URL on this device.
  const skinNote = root.querySelector("#cs-skin-note"), skinClear = root.querySelector("#cs-skin-clear");
  const showSkin = () => { skinClear.hidden = !value.skin64; if (value.skin64) skinNote.textContent = "Wearing your Minecraft skin in 3D. Colours below still shape the 2D badge."; };
  showSkin();
  root.querySelector("#cs-skin-file").onchange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== "image/png" || file.size > 28000) { skinNote.textContent = "Choose a PNG skin under 28 KB."; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width !== 64 || (img.height !== 64 && img.height !== 32)) { skinNote.textContent = "That image is not a Minecraft skin (64×64 or 64×32)."; return; }
        value = normalizeAvatar({ ...value, skin64: reader.result });
        save(); showSkin();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  skinClear.onclick = () => { const { skin64, ...rest } = value; value = normalizeAvatar(rest); save(); showSkin(); skinNote.textContent = "Back to your painted look."; };
  root.querySelector("#cs-shuffle").onclick = () => {
    value = Object.fromEntries(
      Object.entries(avatarOptions).map(([key, options]) => [
        key,
        options[Math.floor(Math.random() * options.length)].value,
      ]),
    );
    for (const key of ["glasses", "scarf", "backpack"])
      value[key] = Math.random() > 0.5;
    value = normalizeAvatar(value);
    controls();
    save();
  };
  root.querySelector("#cs-reset").onclick = () => {
    value = { ...avatarDefaults };
    controls();
    save();
  };
  controls();
  preview();
  return { dispose() {window.removeEventListener('message',previewReady);previewFrame?.remove();} };
}
