// Player accounts for this device. Front-end only: no passwords are collected or stored.
// The host platform can listen for the "kairos:account" window event to create real accounts,
// send verification emails and record parental consent on its own servers.
export const AGE = { min: 4, max: 99, self: 16, adult: 18 };
const STORE = "kairos-accounts-v1";

export const bandFor = (age) => (Number(age) >= AGE.adult ? "adult" : "kids");
export const canSelfRegister = (age) => Number(age) >= AGE.self;

const normalEmail = (v) => String(v ?? "").trim().toLowerCase();
export function checkEmails(email, confirm) {
  const a = normalEmail(email),
    b = normalEmail(confirm);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a)) return { ok: false, error: "Enter a valid email address." };
  if (a !== b) return { ok: false, error: "The two email addresses don’t match." };
  return { ok: true, email: a };
}
export function checkName(name) {
  const v = String(name ?? "").trim();
  if (!v) return { ok: false, error: "Enter a first name or nickname." };
  if (v.length > 20) return { ok: false, error: "Use 20 characters or fewer." };
  if (!/^[\p{L}][\p{L} '\-.]*$/u.test(v)) return { ok: false, error: "Use letters only, like a first name or nickname." };
  return { ok: true, name: v };
}
const checkAge = (age) => {
  const n = Math.round(Number(age));
  if (!Number.isFinite(n) || n < AGE.min || n > AGE.max) throw Error("Choose an age between 4 and 99.");
  return n;
};
const id = (prefix) =>
  prefix + "-" + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));

export function createAccounts(storage = globalThis.localStorage) {
  let data = { parents: [], players: [], active: null };
  let saved = true;
  try {
    const raw = JSON.parse(storage?.getItem(STORE) || "null");
    if (raw && Array.isArray(raw.players) && Array.isArray(raw.parents)) data = { ...data, ...raw };
  } catch {
    saved = false;
  }
  const persist = () => {
    try {
      storage.setItem(STORE, JSON.stringify(data));
      saved = true;
    } catch {
      saved = false;
    }
  };
  const announce = (type, record) => {
    try {
      globalThis.dispatchEvent?.(new CustomEvent("kairos:account", { detail: { type, record: { ...record } } }));
    } catch {}
  };
  // The first player on a device inherits progress made before accounts existed.
  const adoptLegacyProgress = (playerId) => {
    if (data.players.length !== 1) return;
    for (const key of ["kairos-bible-v1", "kairos-bible-meta-v1"])
      try {
        const old = storage.getItem(key);
        if (old && !storage.getItem(`${key}:${playerId}`)) storage.setItem(`${key}:${playerId}`, old);
      } catch {}
  };
  const addPlayer = (player) => {
    data.players.push(player);
    data.active = player.id;
    adoptLegacyProgress(player.id);
    persist();
    announce("player", player);
    return player;
  };

  return {
    get saved() {
      return saved;
    },
    players: () => data.players.map((p) => ({ ...p })),
    parents: () => data.parents.map((p) => ({ ...p })),
    active() {
      const p = data.players.find((x) => x.id === data.active);
      return p ? { ...p } : null;
    },
    setActive(playerId) {
      if (!data.players.some((p) => p.id === playerId)) return false;
      data.active = playerId;
      persist();
      return true;
    },
    signOut() {
      data.active = null;
      persist();
    },
    update(playerId, changes) {
      const p = data.players.find((x) => x.id === playerId);
      if (!p) return null;
      if (changes.character) p.character = String(changes.character);
      persist();
      return { ...p };
    },
    progressKey(base) {
      return data.active ? `${base}:${data.active}` : base;
    },
    /** Players aged 16+ create their own account. */
    signUpSelf({ name, age, email, emailConfirm, agreed, character = "kai" }) {
      const n = checkAge(age);
      if (!canSelfRegister(n)) throw Error("Players under 16 need a parent or guardian to set up their account.");
      const nm = checkName(name);
      if (!nm.ok) throw Error(nm.error);
      const em = checkEmails(email, emailConfirm);
      if (!em.ok) throw Error(em.error);
      if (!agreed) throw Error("Please agree to the terms to continue.");
      return addPlayer({ id: id("p"), name: nm.name, age: n, band: bandFor(n), email: em.email, character, parentId: null, createdAt: new Date().toISOString() });
    },
    /** A parent or guardian (18+) sets up the family account. */
    signUpParent({ name, age, email, emailConfirm, consent }) {
      const n = checkAge(age);
      if (n < AGE.adult) throw Error("You need to be 18 or over to set up a family account.");
      const nm = checkName(name);
      if (!nm.ok) throw Error(nm.error);
      const em = checkEmails(email, emailConfirm);
      if (!em.ok) throw Error(em.error);
      if (!consent) throw Error("Please confirm you are the parent or guardian and give consent.");
      const existing = data.parents.find((p) => p.email === em.email);
      if (existing) return { ...existing };
      const parent = { id: id("g"), name: nm.name, age: n, email: em.email, consentAt: new Date().toISOString() };
      data.parents.push(parent);
      persist();
      announce("parent", parent);
      return { ...parent };
    },
    /** A child profile under a parent. Children never give an email address. */
    addChild(parentId, { name, age, character = "kai" }) {
      if (!data.parents.some((p) => p.id === parentId)) throw Error("Set up the parent account first.");
      const nm = checkName(name);
      if (!nm.ok) throw Error(nm.error);
      const n = checkAge(age);
      return addPlayer({ id: id("p"), name: nm.name, age: n, band: bandFor(n), character, parentId, createdAt: new Date().toISOString() });
    },
    /** The parent's own player profile on the 18+ platform (created once). */
    playAsParent(parentId) {
      const parent = data.parents.find((p) => p.id === parentId);
      if (!parent) throw Error("Set up the parent account first.");
      const mine = data.players.find((p) => p.guardianOf === parentId);
      if (mine) {
        data.active = mine.id;
        persist();
        return { ...mine };
      }
      return addPlayer({ id: id("p"), name: parent.name, age: parent.age, band: "adult", email: parent.email, character: "theo", parentId: null, guardianOf: parentId, createdAt: new Date().toISOString() });
    },
    childrenOf: (parentId) => data.players.filter((p) => p.parentId === parentId).map((p) => ({ ...p })),
  };
}

/** One shared instance for the app. */
export const accounts = createAccounts();
