// Calm background music for the demo video, synthesized from scratch (no samples, no licence questions).
// 80 bpm, C major: Cmaj9 – Am9 – Fmaj7 – G6, two bars each. Layers: a soft pad, a felt-piano arpeggio and a round
// bass note per bar; a small Schroeder reverb; fades at both ends. Written as 16-bit stereo WAV.
import { writeFileSync } from "node:fs";

const SR = 44100;
const BEAT = 60 / 80;
const BAR = 4 * BEAT;
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Chords as [bass, voicing], two bars each.
const CHORDS: [number, number[]][] = [
  [36, [60, 64, 67, 71, 74]], // Cmaj9
  [45, [57, 60, 64, 67, 71]], // Am9
  [41, [57, 60, 64, 65, 69]], // Fmaj7
  [43, [55, 59, 62, 64, 69]], // G6/9
];

export function demoMusic(seconds: number, file: string) {
  const n = Math.ceil(seconds * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const add = (start: number, len: number, pan: number, voice: (t: number) => number) => {
    const s0 = Math.floor(start * SR);
    const s1 = Math.min(n, s0 + Math.floor(len * SR));
    const gl = Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = Math.max(0, s0); i < s1; i++) {
      const v = voice((i - s0) / SR);
      L[i] += v * gl;
      R[i] += v * gr;
    }
  };

  const span = 2 * BAR;
  for (let c = 0, t = 0; t < seconds; c++, t += span) {
    const [bass, notes] = CHORDS[c % CHORDS.length];
    // Pad: slow swell, a few soft harmonics, two slightly detuned voices.
    for (const m of notes) {
      const f = mtof(m);
      const len = span + 1.6;
      add(t, len, (m % 5) / 5 - 0.4, (x) => {
        const env = Math.min(1, x / 1.4) * Math.min(1, Math.max(0, (len - x) / 1.6));
        let v = 0;
        for (let k = 1; k <= 4; k++) v += (Math.sin(2 * Math.PI * f * k * x) + Math.sin(2 * Math.PI * f * 1.003 * k * x)) / Math.pow(k, 1.8);
        return 0.018 * env * v;
      });
    }
    // Bass: one round note per bar.
    for (let b = 0; b < 2; b++) {
      const f = mtof(bass);
      add(t + b * BAR, BAR + 0.5, 0, (x) => 0.13 * Math.exp(-x * 1.1) * Math.min(1, x / 0.02) * (Math.sin(2 * Math.PI * f * x) + 0.25 * Math.sin(4 * Math.PI * f * x)));
    }
    // Felt-piano arpeggio in eighth notes, an octave up, after the first chord.
    if (t >= span) {
      const order = [0, 2, 1, 3, 2, 4, 3, 1];
      for (let e = 0; e < 16; e++) {
        const m = notes[order[e % 8]] + 12;
        const f = mtof(m);
        const vel = 0.055 * (e % 4 === 0 ? 1 : 0.75) * (0.85 + 0.3 * rnd());
        add(t + e * (BEAT / 2), 1.8, e % 2 ? 0.35 : -0.35, (x) => {
          const a = Math.min(1, x / 0.006);
          return vel * a * (Math.exp(-x * 2.6) * Math.sin(2 * Math.PI * f * x) + 0.3 * Math.exp(-x * 5) * Math.sin(4 * Math.PI * f * x) + 0.08 * Math.exp(-x * 8) * Math.sin(6 * Math.PI * f * x));
        });
      }
    }
  }

  // Schroeder reverb: four combs into two all-passes, a little different per side for width.
  const reverb = (x: Float32Array, spread: number) => {
    const out = new Float32Array(x.length);
    for (const d0 of [1557, 1617, 1491, 1422]) {
      const d = d0 + spread;
      const buf = new Float32Array(d);
      let p = 0;
      for (let i = 0; i < x.length; i++) {
        const y = buf[p];
        buf[p] = x[i] + y * 0.8;
        out[i] += y * 0.25;
        p = (p + 1) % d;
      }
    }
    for (const d0 of [225, 556]) {
      const d = d0 + spread;
      const buf = new Float32Array(d);
      let p = 0;
      for (let i = 0; i < out.length; i++) {
        const b = buf[p];
        const y = -0.5 * out[i] + b;
        buf[p] = out[i] + 0.5 * y;
        out[i] = y;
        p = (p + 1) % d;
      }
    }
    return out;
  };
  const wl = reverb(L, 0);
  const wr = reverb(R, 23);
  let peak = 1e-9;
  for (let i = 0; i < n; i++) {
    L[i] = 0.78 * L[i] + 0.32 * wl[i];
    R[i] = 0.78 * R[i] + 0.32 * wr[i];
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  // Normalize, then fade in over 1.5 s and out over 3 s.
  const pcm = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const fade = Math.min(1, t / 1.5) * Math.min(1, (seconds - t) / 3);
    const g = (0.7 / peak) * Math.max(0, fade);
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4);
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  writeFileSync(file, Buffer.concat([header, pcm]));
}
