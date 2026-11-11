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
  function controls() {
    root.querySelector(".cs-controls").innerHTML = sections[tab]
      .map(
        ([key, label]) =>
          `<fieldset><legend>${label}</legend>${typeof avatarDefaults[key] === "boolean" ? `<button class="cs-toggle" data-toggle="${key}" aria-pressed="${value[key]}">${label} <span>${value[key] ? "On" : "Off"}</span></button>` : `<div class="cs-options" role="group" aria-label="${label}">${avatarOptions[key].map((o) => `<button type="button" data-field="${key}" data-option="${o.value}" aria-pressed="${value[key] === o.value}" ${o.value.startsWith("#") ? `class="cs-swatch" style="--swatch:${o.value}" aria-label="${label}: ${o.label}" title="${o.label}"` : 'class="cs-option"'}>${o.value.startsWith("#") ? `<span class="kg-visually-hidden">${o.label}</span>` : esc(o.label)}</button>`).join("")}</div>`}</fieldset>`,
      )
      .join("");
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
  root.innerHTML = `<section class="character-studio"><a class="kg-back" href="#bible">Games</a><header><span class="cs-eyebrow">CHARACTER STUDIO</span><h1>Make this explorer yours.</h1><p>Shape a new look, choose an outfit and make it your own. Your character joins you throughout the platform.</p></header><div class="cs-layout"><aside class="cs-preview"><span class="cs-preview-label">YOUR EXPLORER</span><div class="cs-avatar"></div><div class="cs-pose" role="group" aria-label="Preview pose">${["wave", "cheer", "read", "think"].map((p) => `<button data-pose="${p}" aria-pressed="${p === pose}">${p[0].toUpperCase() + p.slice(1)}</button>`).join("")}</div><div class="cs-actions"><button id="cs-shuffle">Shuffle look</button><button id="cs-reset">Reset look</button></div><a class="pm-button pm-gold" href="#bible">Play with this look →</a></aside><div class="cs-panel"><nav class="cs-tabs" role="tablist" aria-label="Customize character">${[
    ["look", "Appearance"],
    ["clothes", "Clothes"],
    ["extras", "Extras"],
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
