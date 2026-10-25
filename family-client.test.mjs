import test from "node:test";
import assert from "node:assert/strict";
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, String(v)),
};
const { accounts } = await import("./public/accounts.mjs");
const {
  loadCloudProgress,
  queueCompletion,
  flushProgress,
  cloudProgress,
  syncStatus,
} = await import("./public/family-client.mjs");
const child = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Ama",
  age: 9,
  character: "ama",
  cloud: true,
};
test("offline results retry with the same event ID and remain isolated by child", async () => {
  accounts.importCloudChild(child);
  const snapshot = { records: {}, meta: {} };
  globalThis.fetch = async () => Response.json(snapshot);
  await loadCloudProgress(child);
  const attempts = [];
  globalThis.fetch = async (_url, options) => {
    attempts.push(JSON.parse(options.body));
    throw Error("offline");
  };
  queueCompletion({ id: "quiz", score: 80 });
  await flushProgress(child.id);
  assert.equal(cloudProgress(child.id).records.quiz.runs, 1);
  assert.match(syncStatus(), /waiting to sync/);
  assert.equal(JSON.parse(memory.get("kairos-family-outbox-v1")).length, 1);
  assert.equal(cloudProgress("another-child"), null);
  globalThis.fetch = async (_url, options) => {
    const event = JSON.parse(options.body);
    attempts.push(event);
    return Response.json({
      records: { quiz: { runs: 1, best: 80 } },
      meta: { streak: 1 },
    });
  };
  await flushProgress(child.id);
  assert.equal(attempts[0].eventId, attempts.at(-1).eventId);
  assert.equal(cloudProgress(child.id).records.quiz.runs, 1);
  assert.match(syncStatus(), /saved to your family/);
  assert.equal(JSON.parse(memory.get("kairos-family-outbox-v1")).length, 0);
});
test("a completion arriving during a save is drained without losing its result", async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let count = 0;
  globalThis.fetch = async () => {
    count++;
    if (count === 1) await gate;
    return Response.json({
      records: { quiz: { runs: count + 1, best: 90 } },
      meta: { streak: 1 },
    });
  };
  queueCompletion({ id: "quiz", score: 90 });
  queueCompletion({ id: "quiz", score: 70 });
  release();
  await flushProgress(child.id);
  assert.equal(count, 2);
  assert.equal(cloudProgress(child.id).records.quiz.runs, 3);
  assert.equal(JSON.parse(memory.get("kairos-family-outbox-v1")).length, 0);
});
test("storage denial still keeps a result in memory for retry", async () => {
  const original = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => {
    throw Error("denied");
  };
  globalThis.fetch = async () => {
    throw Error("offline");
  };
  queueCompletion({ id: "memory", score: 60 });
  await flushProgress(child.id);
  assert.equal(cloudProgress(child.id).records.memory.runs, 1);
  globalThis.fetch = async () =>
    Response.json({
      records: { quiz: { runs: 3, best: 90 }, memory: { runs: 1, best: 60 } },
      meta: { streak: 1 },
    });
  await flushProgress(child.id);
  assert.equal(cloudProgress(child.id).records.memory.runs, 1);
  globalThis.localStorage.setItem = original;
});

test("offline reload restores the server baseline and pending results without counting twice", async () => {
  const second = { ...child, id: "22222222-2222-4222-8222-222222222222" };
  accounts.importCloudChild(second);
  globalThis.fetch = async () =>
    Response.json({
      records: { quiz: { runs: 1, best: 80 } },
      meta: { streak: 1 },
    });
  await loadCloudProgress(second);
  globalThis.fetch = async () => {
    throw Error("offline");
  };
  queueCompletion({ id: "quiz", score: 70 });
  await flushProgress(second.id);
  const reloaded = await import("./public/family-client.mjs?reload-test");
  assert.equal(reloaded.cloudProgress(second.id)?.records.quiz.runs, 2);
});
