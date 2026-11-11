"use client";
/**
 * A playlist you can rotate: public-domain hymn tunes and original Kairos
 * pieces, synthesised live with WebAudio (no downloads, nothing copied).
 * The player is a singleton so it keeps playing as you move around.
 */
export interface Track { id: string; title: string; artist: string; bpm: number; colour: string; notes: string }
// Notes: NAME+octave:beats, "r" for rest. Hymn tunes are public domain.
export const TRACKS: Track[] = [
  { id: "joyful", title: "Joyful, Joyful", artist: "Hymn to Joy (Beethoven, 1824)", bpm: 112, colour: "#f2c84b", notes: "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2 D4 D4 E4 C4 D4 E4:.5 F4:.5 E4 C4 D4 E4:.5 F4:.5 E4 D4 C4 D4 G3:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:.5 C4:2" },
  { id: "amazing", title: "Amazing Grace", artist: "New Britain (1835)", bpm: 84, colour: "#5fd3e6", notes: "D4 G4:2 B4:.5 G4:.5 B4:2 A4 G4:2 E4 D4:2 D4 G4:2 B4:.5 G4:.5 B4:2 A4 D5:3 r B4 D5:1.5 B4:.5 D5:.5 B4:.5 G4:2 D4 E4:1.5 G4:.5 G4:.5 E4:.5 D4:2 D4 G4:2 B4:.5 G4:.5 B4:2 A4 G4:3" },
  { id: "doxology", title: "Praise God, from Whom All Blessings Flow", artist: "Old Hundredth (1551)", bpm: 76, colour: "#3fcf7a", notes: "G4:2 G4 F#4 E4 D4 G4 A4 B4:2 B4:2 B4 B4 A4 G4 C5 B4 A4:2 G4:2 A4 B4 A4 G4 E4 F#4 G4:2 D5:2 B4 G4 A4 C5 B4 A4 G4:3" },
  { id: "holy", title: "Holy, Holy, Holy", artist: "Nicaea (1861)", bpm: 80, colour: "#7a5ce6", notes: "D4 D4 F#4 F#4 A4:2 A4:2 B4:2 B4 B4 A4:2 F#4:2 A4 A4 A4 A4 D5:3 A4 F#4 F#4 G4 G4 E4:3 r D4 D4 F#4 F#4 A4:2 A4:2 B4:2 B4 B4 A4:2 F#4:2 A4 A4 D5 C#5 B4 A4 G4 F#4 E4 D4:3" },
  { id: "jesus-loves", title: "Jesus Loves Me", artist: "Bradbury (1862)", bpm: 100, colour: "#e2556b", notes: "C5 A4 A4 G4 A4 C5 C5:2 D5 D5 F5 D5 D5 C5:2 C5 A4 A4 G4 A4 C5 C5:2 D5 D5 C5 F4 A4 G4:2 C5:2 A4 C5 D5:2 F5:2 C5:2 A4 F4 A4 G4:2 C5:2 A4 C5 D5 D5 C5 F4 A4 G4 F4:3" },
  { id: "kairos", title: "Kairos (Morning in London)", artist: "Kairos original", bpm: 104, colour: "#f08b2e", notes: "C4 E4 G4 C5:2 B4 G4 A4:2 E4 G4 F4:2 r E4 D4 C4:2 E4 G4 C5 D5:2 C5 B4 A4:2 G4 E4 G4:3 r A4 C5 D5 E5:2 D5 C5 A4:2 G4 A4 C5:3" },
  { id: "sabbath", title: "Sabbath (Still Waters)", artist: "Kairos original", bpm: 66, colour: "#43a2e6", notes: "E4:2 G4 A4:3 G4 E4:2 D4:4 r C4:2 D4 E4:3 G4 A4:2 G4:4 r E4:2 G4 C5:3 B4 A4:2 G4:2 E4:2 D4 E4:2 C4:4" },
];
const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function parse(notes: string): { midi: number | null; beats: number }[] {
  return notes.trim().split(/\s+/).map((tok) => {
    const [n, b] = tok.split(":");
    const beats = b ? Number(b) : 1;
    if (n === "r") return { midi: null, beats };
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    if (!m) return { midi: null, beats };
    return { midi: 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0), beats };
  });
}
export const trackSeconds = (t: Track) => (parse(t.notes).reduce((s, n) => s + n.beats, 0) * 60) / t.bpm * 2; // played twice

type Listener = (s: PlayerState) => void;
export interface PlayerState { index: number; playing: boolean; shuffle: boolean; repeat: boolean; started: number; elapsed: number; order: number[] }

class Player {
  ctx: AudioContext | null = null;
  bus: GainNode | null = null;
  timer = 0;
  s: PlayerState = { index: 0, playing: false, shuffle: false, repeat: false, started: 0, elapsed: 0, order: TRACKS.map((_, i) => i) };
  listeners = new Set<Listener>();
  on(l: Listener) { this.listeners.add(l); l(this.s); return () => { this.listeners.delete(l); }; }
  emit() {
    for (const l of this.listeners) l({ ...this.s });
    window.dispatchEvent(new CustomEvent("kairos-playlist", { detail: { playing: this.s.playing } }));
  }
  get track() { return TRACKS[this.s.order[this.s.index]]; }
  stopVoices() {
    if (this.bus && this.ctx) { const b = this.bus; b.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); setTimeout(() => b.disconnect(), 400); }
    this.bus = null; clearTimeout(this.timer);
  }
  play() {
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    this.stopVoices();
    const ctx = this.ctx, t = this.track, beat = 60 / t.bpm;
    const bus = ctx.createGain(); bus.gain.value = 0.22; bus.connect(ctx.destination); this.bus = bus;
    const f = (m: number) => 440 * 2 ** ((m - 69) / 12);
    const voice = (m: number, at: number, dur: number, type: OscillatorType, lvl: number) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f(m);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(lvl, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g).connect(bus); o.start(at); o.stop(at + dur + 0.05);
    };
    let at = ctx.currentTime + 0.1;
    const notes = parse(t.notes);
    for (let pass = 0; pass < 2; pass++) {
      let beatPos = 0;
      for (const n of notes) {
        if (n.midi != null) {
          voice(n.midi, at, n.beats * beat * 0.95, "triangle", 0.5);
          voice(n.midi + 12, at, n.beats * beat * 0.5, "sine", 0.08);
          // A soft bass on strong beats, an octave and a fifth below the tune.
          if (Math.abs(beatPos % 2) < 0.01) voice(n.midi - 24, at, beat * 1.8, "sine", 0.28);
        }
        at += n.beats * beat; beatPos += n.beats;
      }
    }
    this.s = { ...this.s, playing: true, started: Date.now() - 0, elapsed: 0 };
    this.timer = window.setTimeout(() => this.ended(), (at - ctx.currentTime) * 1000);
    this.emit();
  }
  ended() { if (this.s.repeat) this.play(); else this.next(); }
  pause() { this.stopVoices(); this.s = { ...this.s, playing: false }; this.emit(); }
  toggle() { if (this.s.playing) this.pause(); else this.play(); }
  next() { this.s = { ...this.s, index: (this.s.index + 1) % TRACKS.length }; this.play(); }
  prev() { this.s = { ...this.s, index: (this.s.index - 1 + TRACKS.length) % TRACKS.length }; this.play(); }
  pick(trackIndex: number) { this.s = { ...this.s, index: Math.max(0, this.s.order.indexOf(trackIndex)) }; this.play(); }
  setShuffle(on: boolean) {
    const cur = this.s.order[this.s.index];
    const order = on ? [cur, ...TRACKS.map((_, i) => i).filter((i) => i !== cur).sort(() => Math.random() - 0.5)] : TRACKS.map((_, i) => i);
    this.s = { ...this.s, shuffle: on, order, index: order.indexOf(cur) }; this.emit();
  }
  setRepeat(on: boolean) { this.s = { ...this.s, repeat: on }; this.emit(); }
}
export const PLAYER: Player = ((globalThis as { __kairosPlayer?: Player }).__kairosPlayer ??= new Player());
