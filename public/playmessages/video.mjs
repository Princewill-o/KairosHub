// Official YouTube IFrame API; no video download or credit-backed service.
let ready;
function youtube() {
  if (globalThis.YT?.Player) return Promise.resolve(globalThis.YT);
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    const existing = globalThis.onYouTubeIframeAPIReady;
    globalThis.onYouTubeIframeAPIReady = () => {
      existing?.();
      resolve(globalThis.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      ready = null;
      script.remove();
      reject(Error("Player unavailable"));
    };
    document.head.append(script);
  });
  return ready;
}
export function mountCutscene(
  slot,
  {
    video,
    title,
    start,
    end,
    onEnd = () => {},
    onStatus = () => {},
    onFailure = () => {},
  },
) {
  let dead = false,
    player = null,
    finished = false,
    mutedFallback = false;
  const iframe = document.createElement("iframe");
  iframe.title = title;
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = false;
  iframe.tabIndex = -1;
  iframe.style.pointerEvents = "none";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.src = `https://www.youtube-nocookie.com/embed/${video}?start=${start}&end=${end}&autoplay=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&cc_load_policy=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}`;
  slot.replaceChildren(iframe);
  const finish = () => {
    if (dead || finished) return;
    finished = true;
    try {
      player?.pauseVideo();
    } catch {}
    onStatus("Message complete. Returning to your story…");
    onEnd();
  };
  const boundary = setInterval(() => {
    if (dead || finished || !player) return;
    try {
      if (
        player.getPlayerState() === 1 &&
        player.getCurrentTime() >= end - 0.15
      )
        finish();
    } catch {}
  }, 500);
  onStatus("Starting the message…");
  youtube()
    .then((YT) => {
      if (dead || !iframe.isConnected) return;
      player = new YT.Player(iframe, {
        events: {
          onReady: (e) => {
            if (!dead) e.target.playVideo();
          },
          onStateChange: (e) => {
            if (dead) return;
            if (e.data === 1)
              onStatus(
                mutedFallback
                  ? "Playing automatically without sound. Tap Enable sound."
                  : "Playing sermon excerpt.",
              );
            if (e.data === 0) finish();
          },
          onAutoplayBlocked: (e) => {
            if (dead) return;
            if (!mutedFallback) {
              mutedFallback = true;
              e.target.mute();
              e.target.playVideo();
              onStatus(
                "Playing automatically without sound. Tap Enable sound.",
              );
            } else
              onStatus("Your browser needs a tap. Select Play / enable sound.");
          },
          onError: () => {
            if (!dead) {
              onFailure();
              onStatus(
                "This excerpt could not play. You can read its captions and continue.",
              );
            }
          },
        },
      });
    })
    .catch(() => {
      if (!dead) {
        onFailure();
        onStatus(
          "The player could not load. You can read the captions and continue.",
        );
      }
    });
  const timeout = setTimeout(() => {
    if (!dead && !player) {
      onFailure();
      onStatus(
        "The player is taking longer to load. You can read the captions and continue.",
      );
    }
  }, 12000);
  return {
    play() {
      if (player) {
        player.unMute();
        player.playVideo();
        onStatus("Playing sermon excerpt.");
      } else iframe.focus();
    },
    dispose() {
      dead = true;
      clearTimeout(timeout);
      clearInterval(boundary);
      try {
        player?.destroy();
      } catch {}
      iframe.remove();
    },
  };
}
