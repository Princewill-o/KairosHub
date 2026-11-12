"use client";

export type MusicScene = "city" | "nature" | "home" | "study" | "station" | "journey" | "arcade" | "quiet" | "university" | "work" | "shop" | "church" | "ltbs" | "prison" | "town";

/**
 * Original arrangements, synthesised live (no audio files). Each theme is a 16-step
 * melody per bar (null = rest) over a four-chord loop, with a warm detuned pad, a
 * picked arpeggio, soft bass, and light percussion where it suits the place. A small
 * generated reverb glues it together.
 */
type Theme = { bpm: number; root: number; chords: number[]; minor?: number[]; melody: (number | null)[]; arp?: boolean; drums?: "soft" | "groove" | "shaker"; brightness: number; pad: number; lead: OscillatorType };
const _ = null;
const THEMES: Record<MusicScene, Theme> = {
  city: { bpm: 92, root: 48, chords: [0, 9, 5, 7], minor: [9], melody: [16, _, 19, 21, _, 19, 16, _, 14, _, 16, 19, _, 16, 14, _], arp: true, drums: "groove", brightness: 2400, pad: 0.03, lead: "triangle" },
  nature: { bpm: 70, root: 50, chords: [0, 5, 9, 7], minor: [9], melody: [19, _, _, 21, 24, _, 21, _, 19, _, 16, _, 14, _, _, _], arp: true, brightness: 1700, pad: 0.04, lead: "sine" },
  home: { bpm: 74, root: 48, chords: [0, 4, 5, 7], minor: [4], melody: [16, _, 19, _, 14, _, 12, _, 16, _, 21, 19, _, 16, _, _], arp: true, drums: "soft", brightness: 1500, pad: 0.035, lead: "sine" },
  study: { bpm: 64, root: 53, chords: [0, 5, 9, 5], minor: [9], melody: [12, _, _, _, 19, _, _, _, 16, _, 14, _, _, _, _, _], brightness: 1200, pad: 0.035, lead: "sine" },
  station: { bpm: 96, root: 46, chords: [0, 5, 7, 5], melody: [12, 14, _, 19, _, 16, 21, _, 19, _, 16, _, 14, _, 12, _], arp: true, drums: "shaker", brightness: 1900, pad: 0.025, lead: "triangle" },
  journey: { bpm: 100, root: 48, chords: [0, 7, 9, 5], minor: [9], melody: [12, _, 16, 19, 24, _, 21, _, 19, _, 16, _, 19, _, _, _], arp: true, drums: "groove", brightness: 2100, pad: 0.03, lead: "triangle" },
  arcade: { bpm: 118, root: 48, chords: [0, 5, 9, 7], minor: [9], melody: [12, 19, 24, 19, 16, 21, 19, 14, 12, _, 24, _, 21, 19, 16, _], arp: true, drums: "groove", brightness: 3000, pad: 0.02, lead: "square" },
  quiet: { bpm: 58, root: 50, chords: [0, 5, 0, 7], melody: [12, _, _, _, 14, _, _, _, 19, _, _, 16, _, _, _, _], brightness: 1000, pad: 0.04, lead: "sine" },
  university: { bpm: 80, root: 55, chords: [0, 5, 9, 7], minor: [9], melody: [19, _, 16, _, 14, 12, _, _, 16, _, 19, 21, _, 24, _, _], arp: true, drums: "soft", brightness: 1900, pad: 0.03, lead: "triangle" },
  work: { bpm: 86, root: 50, chords: [0, 9, 5, 7], minor: [9], melody: [12, _, 16, 19, _, 16, 14, _, 19, _, 21, _, 19, _, _, _], arp: true, drums: "shaker", brightness: 1700, pad: 0.03, lead: "triangle" },
  shop: { bpm: 98, root: 53, chords: [0, 5, 7, 0], melody: [16, 19, _, 21, 19, _, 12, 14, 16, _, 19, _, _, _, _, _], arp: true, drums: "groove", brightness: 2300, pad: 0.025, lead: "triangle" },
  // House of God: a slow I–V–vi–IV worship progression, pad-led with a gentle hymn-like line.
  church: { bpm: 66, root: 48, chords: [0, 7, 9, 5], minor: [9], melody: [16, _, _, _, 19, _, 21, _, 19, _, _, _, 16, _, 14, _], brightness: 1500, pad: 0.06, lead: "sine" },
  // LTBS world: an adventurous modal theme with a striding bass.
  ltbs: { bpm: 104, root: 50, chords: [0, 10, 5, 7], minor: [0], melody: [12, _, 15, 17, 19, _, 17, 15, 12, _, 10, _, 12, _, _, _], arp: true, drums: "groove", brightness: 2200, pad: 0.03, lead: "triangle" },
  // HMP Thames: sparse and low, a minor drone with a lonely line.
  prison: { bpm: 60, root: 45, chords: [0, 0, 8, 7], minor: [0, 8], melody: [12, _, _, _, _, _, 15, _, _, _, 14, _, _, _, _, _], drums: "soft", brightness: 900, pad: 0.04, lead: "sine" },
  // A UK branch town: bright, folky, walking pace.
  town: { bpm: 88, root: 52, chords: [0, 5, 7, 5], melody: [12, _, 14, 16, _, 19, _, 16, 14, _, 12, _, 7, _, _, _], arp: true, drums: "shaker", brightness: 2000, pad: 0.03, lead: "triangle" },
};
export const SCENE_LABELS: Record<MusicScene, string> = { city: "City grooves", nature: "Highland air", home: "Home comforts", study: "Quiet focus", station: "Platform pulse", journey: "Window seat", arcade: "Playtime", quiet: "A moment of calm", university: "Next chapter", work: "Finding your rhythm", shop: "Afternoon browse", church: "In His presence", ltbs: "Into the story", prison: "Behind the walls", town: "High street stroll" };

export function createMusic() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  // Gentle glue: a soft compressor and a short generated reverb.
  const comp = context.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.3;
  const reverb = context.createConvolver();
  const len = Math.floor(context.sampleRate * 2.2), ir = context.createBuffer(2, len, context.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  reverb.buffer = ir;
  const wet = context.createGain(); wet.gain.value = 0.28;
  master.connect(comp).connect(context.destination);
  master.connect(reverb).connect(wet).connect(context.destination);
  const noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

  let scene: MusicScene = "city";
  let bus: GainNode | null = null;
  let step = 0, next = 0, volume = 0.25, enabled = true, closed = false;
  const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12);

  const voice = (note: number, at: number, duration: number, level: number, type: OscillatorType, detune = 0, attack = 0.02) => {
    if (!bus) return;
    const osc = context.createOscillator(), gain = context.createGain(), filter = context.createBiquadFilter();
    osc.type = type; osc.frequency.value = frequency(note); osc.detune.value = detune;
    filter.type = "lowpass"; filter.frequency.value = THEMES[scene].brightness;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(filter).connect(gain).connect(bus);
    osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
    osc.start(at); osc.stop(at + duration + 0.05);
  };
  const hit = (at: number, kind: "kick" | "hat" | "shaker", level: number) => {
    if (!bus) return;
    if (kind === "kick") {
      const osc = context.createOscillator(), gain = context.createGain();
      osc.frequency.setValueAtTime(110, at); osc.frequency.exponentialRampToValueAtTime(40, at + 0.18);
      gain.gain.setValueAtTime(level, at); gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
      osc.connect(gain).connect(bus); osc.start(at); osc.stop(at + 0.3);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      return;
    }
    const src = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    src.buffer = noise; filter.type = "highpass"; filter.frequency.value = kind === "hat" ? 7000 : 4500;
    const len = kind === "hat" ? 0.05 : 0.09;
    gain.gain.setValueAtTime(level, at); gain.gain.exponentialRampToValueAtTime(0.0001, at + len);
    src.connect(filter).connect(gain).connect(bus); src.start(at, Math.random() * 0.5, len + 0.02);
    src.onended = () => { src.disconnect(); filter.disconnect(); gain.disconnect(); };
  };

  const change = (value: MusicScene) => {
    scene = value;
    if (bus) {
      const previous = bus;
      previous.gain.cancelScheduledValues(context.currentTime);
      previous.gain.setTargetAtTime(0, context.currentTime, 0.4);
      window.setTimeout(() => previous.disconnect(), 3000);
    }
    bus = context.createGain();
    bus.gain.setValueAtTime(0, context.currentTime);
    bus.gain.linearRampToValueAtTime(1, context.currentTime + 1.8);
    bus.connect(master);
    step = 0; next = context.currentTime + 0.05;
  };
  change(scene);

  const timer = window.setInterval(() => {
    if (closed || context.state !== "running" || !enabled) return;
    if (next < context.currentTime) next = context.currentTime + 0.05;
    const t = THEMES[scene];
    const sixteenth = 60 / t.bpm / 4;
    while (next < context.currentTime + 0.3) {
      const s = step % 16, bar = Math.floor(step / 16);
      const chord = t.chords[bar % t.chords.length];
      const third = t.minor?.includes(chord) ? 3 : 4;
      const tones = [0, third, 7];
      if (s === 0) {
        // Warm pad: two detuned voices per chord tone, and a bass note.
        for (const iv of [...tones, 12]) { voice(t.root + chord + iv, next, sixteenth * 17, t.pad, "triangle", -6, 0.4); voice(t.root + chord + iv, next, sixteenth * 17, t.pad * 0.7, "sine", 7, 0.5); }
        voice(t.root + chord - 12, next, sixteenth * 7, 0.08, "sine");
      }
      if (s === 8) voice(t.root + chord - 12 + (t.drums === "groove" ? 7 : 0), next, sixteenth * 6, 0.06, "sine");
      // Picked arpeggio up the chord, every other sixteenth.
      if (t.arp && s % 2 === 0) voice(t.root + chord + 12 + [0, third, 7, 12][(s / 2) % 4], next, sixteenth * 3, 0.018, "triangle");
      // Melody, with every fourth bar answered an octave lower for variety.
      const m = t.melody[s];
      if (m !== null && m !== undefined) {
        const n = t.root + m + (bar % 4 === 3 ? -12 : 0);
        voice(n, next, sixteenth * 5, 0.055, t.lead === "square" ? "square" : t.lead, 0, 0.015);
        voice(n + 12, next + sixteenth, sixteenth * 3, 0.01, "sine");
      }
      if (t.drums === "groove") { if (s % 8 === 0) hit(next, "kick", 0.22); if (s % 4 === 2) hit(next, "hat", 0.05); }
      if (t.drums === "shaker" && s % 2 === 1) hit(next, "shaker", s % 4 === 3 ? 0.05 : 0.025);
      if (t.drums === "soft" && s === 0) hit(next, "kick", 0.1);
      next += sixteenth;
      step++;
    }
  }, 100);

  return {
    scene: change,
    volume(value: number) {
      volume = Math.max(0, Math.min(1, value));
      master.gain.setTargetAtTime(enabled ? volume * 0.65 : 0, context.currentTime, 0.15);
    },
    async active(value: boolean) {
      enabled = value;
      if (closed) return;
      if (value) {
        await context.resume();
        if (closed || !enabled) return;
        next = Math.max(next, context.currentTime + 0.05);
      }
      master.gain.setTargetAtTime(value ? volume * 0.65 : 0, context.currentTime, 0.15);
    },
    suspend() { if (!closed) void context.suspend().catch(() => {}); },
    dispose() {
      closed = true;
      clearInterval(timer);
      void context.close().catch(() => {});
    },
  };
}
