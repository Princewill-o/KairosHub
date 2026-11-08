// Deterministic story rules. Saved events are replayed; saved scores are never trusted.
export const freshRun = () => ({
  version: 1,
  episode: 0,
  stage: "opening",
  events: [],
  decisions: [],
  score: 0,
  actions: 0,
  discoveries: [],
});
const stages = [
  "opening",
  "choice",
  "consequence",
  "clip",
  "action",
  "resolution",
  "chapter",
];
function step(run, series, event) {
  if (!run || run.stage === "ending") return run;
  const e = series.episodes[run.episode];
  if (!e) return run;
  const r = {
    ...run,
    decisions: [...run.decisions],
    events: [...run.events, event],
  };
  if (event.type === "interact") {
    if (
      run.stage !== "opening" ||
      !["talk", "item"].includes(event.target) ||
      discovered(run, event.target)
    )
      return run;
    if (
      event.target === "talk" &&
      !["listen", "share"].includes(event.approach)
    )
      return run;
    r.discoveries = [
      ...run.discoveries,
      {
        episode: run.episode,
        target: event.target,
        ...(event.target === "talk" ? { approach: event.approach } : {}),
      },
    ];
  } else if (event.type === "next") {
    if (["choice", "action"].includes(run.stage)) return run;
    if (run.stage === "chapter") {
      if (run.episode === series.episodes.length - 1) r.stage = "ending";
      else {
        r.episode++;
        r.stage = "opening";
      }
    } else r.stage = stages[stages.indexOf(run.stage) + 1];
  } else if (event.type === "choice") {
    if (run.stage === "choice") {
      if (!Number.isInteger(event.index) || !e.choices[event.index]) return run;
      r.decisions.push({
        episode: run.episode,
        choice: event.index,
        acted: null,
      });
      r.score += 2 - event.index;
      r.stage = "consequence";
    } else if (run.stage === "action") {
      if (![0, 1].includes(event.index)) return run;
      const last = r.decisions.at(-1);
      r.decisions[r.decisions.length - 1] = {
        ...last,
        acted: event.index === 0,
      };
      if (event.index === 0) {
        r.score += 2;
        r.actions++;
      }
      r.stage = "resolution";
    } else return run;
  } else return run;
  return r;
}
export const advance = (r, s) => step(r, s, { type: "next" });
export const choose = (r, s, index) => step(r, s, { type: "choice", index });
export const discovered = (r, target, episode = r.episode) =>
  r.discoveries?.find((d) => d.episode === episode && d.target === target);
export const discover = (r, s, target, approach) =>
  step(r, s, {
    type: "interact",
    target,
    ...(target === "talk" ? { approach } : {}),
  });
export function restoreRun(raw, s) {
  if (
    raw?.version !== 1 ||
    !Array.isArray(raw.events) ||
    raw.events.length > 60
  )
    return freshRun();
  let r = freshRun();
  for (const e of raw.events) {
    if (!e || !["next", "choice", "interact"].includes(e.type))
      return freshRun();
    const n = step(r, s, {
      type: e.type,
      ...(e.type === "choice" ? { index: e.index } : {}),
      ...(e.type === "interact"
        ? {
            target: e.target,
            ...(e.target === "talk" ? { approach: e.approach } : {}),
          }
        : {}),
    });
    if (n === r) return freshRun();
    r = n;
  }
  return r;
}
export const endingFor = (r, s) =>
  s.endings[r.score >= 9 ? 0 : r.score >= 3 ? 1 : 2];
export const graceFor = (r) =>
  (r.stage === "ending" ? 50 : 10 * r.episode) + r.score * 5;
export const chosen = (r, s) =>
  s.episodes[r.episode].choices[
    r.decisions.find((d) => d.episode === r.episode)?.choice ?? 0
  ];
