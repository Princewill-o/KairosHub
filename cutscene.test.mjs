import test from "node:test";
import assert from "node:assert/strict";
import { mountCutscene } from "./public/playmessages/video.mjs";
test("cutscene locks seeking and advances exactly once at its fixed end", async () => {
  const old = {
    document: globalThis.document,
    location: globalThis.location,
    YT: globalThis.YT,
  };
  let iframe,
    events,
    ended = 0,
    current = 100,
    paused = 0;
  globalThis.document = {
    createElement: () =>
      (iframe = {
        style: {},
        isConnected: true,
        setAttribute(k, v) {
          this[k] = v;
        },
        remove() {
          this.isConnected = false;
        },
        focus() {},
      }),
  };
  globalThis.location = { origin: "https://example.test" };
  globalThis.YT = {
    Player: class {
      constructor(frame, o) {
        events = o.events;
      }
      playVideo() {}
      unMute() {}
      mute() {}
      getCurrentTime() {
        return current;
      }
      getPlayerState() {
        return 1;
      }
      pauseVideo() {
        paused++;
      }
      destroy() {}
    },
  };
  const cutscene = mountCutscene(
    { replaceChildren() {} },
    {
      video: "WjWDkhQvZtM",
      title: "Test",
      start: 100,
      end: 175,
      onEnd() {
        ended++;
      },
    },
  );
  try {
    await Promise.resolve();
    assert.match(iframe.src, /controls=0/);
    assert.match(iframe.src, /disablekb=1/);
    assert.equal(iframe.tabIndex, -1);
    assert.equal(iframe.style.pointerEvents, "none");
    current = 175;
    await new Promise((resolve) => setTimeout(resolve, 850));
    assert.equal(ended, 1);
    assert.ok(paused);
    events.onStateChange({ data: 0 });
    assert.equal(ended, 1);
    cutscene.dispose();
    events.onStateChange({ data: 0 });
    assert.equal(ended, 1);
  } finally {
    cutscene.dispose();
    for (const [k, v] of Object.entries(old)) {
      if (v === undefined) delete globalThis[k];
      else globalThis[k] = v;
    }
  }
});
