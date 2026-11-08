import { freshRun, restoreRun, endingFor, graceFor } from "./engine.mjs";
const memory = new Map();
export function storyStorage(key, catalog, storage) {
  if (arguments.length < 3)
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  let saved = false,
    data = memory.get(key) || {};
  try {
    const raw = JSON.parse(storage?.getItem(key) || "null");
    if (raw && typeof raw === "object" && !Array.isArray(raw)) data = raw;
  } catch {}
  const normal = (id) => {
    const s = catalog.find((s) => s.id === id),
      raw = data[id];
    return {
      run: restoreRun(raw?.run, s),
      endings: Array.isArray(raw?.endings)
        ? [
            ...new Set(
              raw.endings.filter((t) => s.endings.some((e) => e.title === t)),
            ),
          ]
        : [],
      best: Number.isFinite(raw?.best)
        ? Math.min(110, Math.max(0, raw.best))
        : 0,
    };
  };
  const persist = () => {
    memory.set(key, data);
    try {
      storage.setItem(key, JSON.stringify(data));
      saved = true;
    } catch {
      saved = false;
    }
  };
  data = Object.fromEntries(catalog.map((s) => [s.id, normal(s.id)]));
  persist();
  return {
    get saved() {
      return saved;
    },
    get(id) {
      return data[id];
    },
    set(id, run) {
      const s = catalog.find((s) => s.id === id);
      if (!s) return;
      const r = restoreRun(run, s),
        prev = data[id];
      data[id] = { ...prev, run: r };
      if (r.stage === "ending") {
        data[id].endings = [
          ...new Set([...prev.endings, endingFor(r, s).title]),
        ];
        data[id].best = Math.max(prev.best, graceFor(r));
      }
      persist();
    },
    restart(id) {
      this.set(id, freshRun());
    },
    all() {
      return data;
    },
  };
}
