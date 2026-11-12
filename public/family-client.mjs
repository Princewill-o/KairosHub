import { accounts } from "./accounts.mjs";
import { bibleGames } from "./bible/content.mjs";
import { bibleStreak } from "./learning-engine.mjs";
const OUTBOX = "kairos-family-outbox-v1";
let pending = [];
try {
  const raw = JSON.parse(localStorage.getItem(OUTBOX) || "[]");
  if (Array.isArray(raw))
    pending = raw.filter(
      (e) =>
        e &&
        /^[a-f0-9-]{36}$/.test(e.childId) &&
        /^[a-f0-9-]{36}$/.test(e.eventId) &&
        bibleGames.some((g) => g.id === e.gameId) &&
        Number.isInteger(e.score) &&
        e.score >= 0 &&
        e.score <= 100 &&
        Number.isFinite(e.at),
    );
} catch {}
const snapshots = new Map(),
  statuses = new Map(),
  locks = new Map();
function snapshotFor(id) {
  if (!snapshots.has(id)) {
    try {
      const data = JSON.parse(
        localStorage.getItem(`kairos-family-snapshot-v1:${id}`) || "null",
      );
      if (
        data?.records &&
        typeof data.records === "object" &&
        !Array.isArray(data.records)
      )
        snapshots.set(id, data);
    } catch {}
  }
  return snapshots.get(id);
}
function persist() {
  try {
    localStorage.setItem(OUTBOX, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}
function status(id, text) {
  statuses.set(id, text);
  globalThis.dispatchEvent?.(
    new CustomEvent("kairos:sync", { detail: { id, text } }),
  );
}
export const syncStatus = () =>
  statuses.get(accounts.active()?.id) ||
  (accounts.active()?.cloud
    ? "Connecting family progress…"
    : "Progress saved on this device.");
export async function familyApi(path = "", body) {
  const response = await fetch("/api/family" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(
      Error(data.error || "Unable to connect. Please retry."),
      { status: response.status, data },
    );
  return data;
}
export function cloudProgress(id = accounts.active()?.id) {
  const data = snapshotFor(id);
  if (!data) return null;
  const records = structuredClone(data.records || {});
  let meta = structuredClone(data.meta || {});
  for (const e of pending.filter((e) => e.childId === id)) {
    const p = records[e.gameId] || {};
    records[e.gameId] = {
      runs: (p.runs || 0) + 1,
      best: Math.max(p.best || 0, e.score),
      last: new Date(e.at).toISOString().slice(0, 10),
    };
    meta = bibleStreak(meta, new Date(e.at).toISOString().slice(0, 10));
  }
  return { records, meta };
}
function cache(id, data) {
  snapshots.set(id, data);
  try {
    localStorage.setItem(
      `kairos-family-snapshot-v1:${id}`,
      JSON.stringify(data),
    );
    localStorage.setItem(
      `kairos-bible-v1:${id}`,
      JSON.stringify(cloudProgress(id).records),
    );
    localStorage.setItem(
      `kairos-bible-meta-v1:${id}`,
      JSON.stringify(data.meta),
    );
  } catch {}
}
export async function flushProgress(id = accounts.active()?.id) {
  if (!id) return;
  if (locks.has(id)) return locks.get(id);
  const job = (async () => {
    try {
      for (let event; (event = pending.find((e) => e.childId === id)); ) {
        const data = await familyApi(`/children/${id}/progress`, event);
        pending = pending.filter(
          (e) => !(e.childId === id && e.eventId === event.eventId),
        );
        persist();
        cache(id, data);
      }
      status(id, "Progress saved to your family account.");
    } catch (error) {
      status(
        id,
        error.status === 401 || error.status === 403
          ? "Family session locked. Ask your parent to sign in; results are waiting to sync."
          : "Connection unavailable. Results are waiting to sync.",
      );
    }
  })();
  locks.set(id, job);
  try {
    await job;
  } finally {
    locks.delete(id);
  }
}
export async function loadCloudProgress(child) {
  if (!child?.cloud) return;
  await flushProgress(child.id);
  try {
    const data = await familyApi(`/children/${child.id}/progress`);
    cache(child.id, data);
    if (pending.some((e) => e.childId === child.id))
      status(child.id, "Results are waiting to sync.");
    else status(child.id, "Progress saved to your family account.");
    return data;
  } catch {
    status(
      child.id,
      "Offline progress is available on this device. Reconnect to sync.",
    );
  }
}
export function queueCompletion({ id: gameId, score }) {
  const child = accounts.active();
  if (!child?.cloud) return;
  if (!snapshotFor(child.id)) {
    let records = {};
    try {
      records = JSON.parse(
        localStorage.getItem(`kairos-bible-v1:${child.id}`) || "{}",
      );
    } catch {}
    // The game has already written this completion; keep the baseline without this run.
    const r = records[gameId];
    if (r) {
      r.runs = Math.max(0, (r.runs || 1) - 1);
      if (!r.runs) delete records[gameId];
    }
    snapshots.set(child.id, { records, meta: {} });
  }
  pending.push({
    childId: child.id,
    eventId: crypto.randomUUID(),
    gameId,
    score,
    at: Date.now(),
  });
  const saved = persist();
  status(
    child.id,
    saved
      ? "Result saved on this device. Syncing…"
      : "Result kept for this visit. Keep this page open to sync.",
  );
  void flushProgress(child.id);
}
export async function restoreFamily() {
  try {
    const session = await familyApi("/session");
    if (session.role === "child") {
      const current = accounts.active();
      if (!current || current.cloud) accounts.importCloudChild(session.child);
      await loadCloudProgress({ ...session.child, cloud: true });
    }
  } catch {}
}
globalThis.addEventListener?.("online", () => {
  if (accounts.active()?.cloud) void loadCloudProgress(accounts.active());
});
globalThis.addEventListener?.("kairos:bible-complete", (e) =>
  queueCompletion(e.detail),
);
