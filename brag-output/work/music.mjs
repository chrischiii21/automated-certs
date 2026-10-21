// Synthesize the 30s soundtrack: 120 BPM in F major, with SFX in the same key and room.
import fs from 'node:fs';

const SR = 44100, DUR = 30.2, N = Math.ceil(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const fx = { L: new Float32Array(N), R: new Float32Array(N) }; // send to reverb
const BEAT = 0.5, BAR = 2;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(t0, len, fn, gain = 1, pan = 0, send = 0.2) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR);
    L[s0 + i] += v * gl; R[s0 + i] += v * gr;
    fx.L[s0 + i] += v * gl * send; fx.R[s0 + i] += v * gr * send;
  }
}
const env = (t, a, d, len) => (t < a ? t / a : Math.exp(-(t - a) / d)) * (t > len - 0.03 ? Math.max(0, (len - t) / 0.03) : 1);

// voices
const pluck = (m, t0, g = 0.16, pan = 0) => {
  const f = hz(m), len = 0.9;
  add(t0, len, (t) => (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 9)) * env(t, 0.004, 0.22, len), g, pan, 0.35);
};
const bell = (m, t0, g = 0.14, pan = 0) => {
  const f = hz(m), len = 2.2;
  add(t0, len, (t) => (Math.sin(2 * Math.PI * f * t + 0.9 * Math.sin(2 * Math.PI * f * 3.5 * t) * Math.exp(-t * 6))) * env(t, 0.003, 0.55, len), g, pan, 0.5);
};
const pad = (notes, t0, len, g = 0.05) => {
  for (const [k, m] of notes.entries()) {
    const f = hz(m);
    for (const det of [-0.12, 0.12]) {
      const ff = f * Math.pow(2, det / 12);
      add(t0, len, (t) => {
        // soft saw-ish: a few harmonics
        let v = 0; for (let h = 1; h <= 4; h++) v += Math.sin(2 * Math.PI * ff * h * t + k) / (h * h);
        const a = Math.min(1, t / 0.35), r = Math.min(1, (len - t) / 0.4);
        return v * a * r;
      }, g, det > 0 ? 0.45 : -0.45, 0.6);
    }
  }
};
const bass = (m, t0, len, g = 0.2) => {
  const f = hz(m);
  add(t0, len, (t) => (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)) * env(t, 0.005, 0.25, len), g, 0, 0.02);
};
const kick = (t0, g = 0.5) => add(t0, 0.35, (t) => Math.sin(2 * Math.PI * (45 * t + 60 * (1 - Math.exp(-t * 28)) / 28 * 1)) * Math.exp(-t * 9), g, 0, 0.02);
let hp = 0;
const hat = (t0, g = 0.035, pan = 0.25) => add(t0, 0.06, (t) => { const n = rnd(); const v = n - hp; hp = n; return v * Math.exp(-t * 70); }, g, pan, 0.1);
const clap = (t0, g = 0.07) => add(t0, 0.18, (t) => rnd() * (Math.exp(-t * 30) + 0.4 * Math.exp(-Math.max(0, t - 0.012) * 25)), g, 0, 0.4);
let lp = 0;
const tick = (t0, g = 0.05, pan = 0) => add(t0, 0.03, (t) => { lp += 0.5 * (rnd() - lp); return lp * Math.exp(-t * 180); }, g, pan, 0.15);
const whoosh = (tEnd, len = 0.7, g = 0.06) => {
  let y = 0;
  add(tEnd - len, len, (t) => { const x = t / len; const c = 0.02 + 0.25 * x * x; y += c * (rnd() - y); return y * Math.pow(x, 2) * (1 - Math.pow(x, 12)); }, g, 0, 0.5);
};

// harmony: Fmaj7 · Am7 · B♭maj7 · C
const CH = [
  { root: 41, pad: [57, 60, 64, 65], arp: [65, 69, 72, 76] },
  { root: 45, pad: [55, 60, 64, 67], arp: [64, 69, 72, 76] },
  { root: 46, pad: [57, 62, 65, 69], arp: [62, 65, 69, 74] },
  { root: 48, pad: [55, 60, 64, 67], arp: [64, 67, 72, 79] },
];
const BARS = 13; // 0–26s; the outro chord rings from 26
for (let b = 0; b < BARS; b++) {
  const c = CH[b % 4], t0 = b * BAR;
  pad(c.pad, t0, BAR + 0.15, b < 2 ? 0.035 : 0.045);
  // arpeggio: eighths, quiet in the hook
  for (let i = 0; i < 8; i++) pluck(c.arp[[0, 1, 2, 3, 2, 1, 2, 3][i]] + (i >= 4 && b % 2 ? 0 : 0), t0 + i * BEAT / 2, b < 2 ? 0.07 : 0.1, i % 2 ? 0.3 : -0.3);
  if (b >= 2) {
    for (let i = 0; i < 8; i++) bass(c.root - 12 + (i % 2 ? 12 : 0), t0 + i * BEAT / 2, 0.22, i % 2 ? 0.12 : 0.2);
    for (let k = 0; k < 4; k++) {
      kick(t0 + k * BEAT, 0.45);
      hat(t0 + k * BEAT + BEAT / 2, 0.03, k % 2 ? 0.25 : -0.25);
    }
    clap(t0 + BEAT, 0.05); clap(t0 + 3 * BEAT, 0.05);
  }
}
// hook bar 2 builds into the reveal
for (let i = 0; i < 4; i++) hat(3 + i * 0.25, 0.02 + i * 0.006);

// outro: Fmaj9, rung once, let it bloom
kick(26, 0.5);
bass(29, 26, 3.8, 0.22);
pad([53, 57, 60, 64, 67], 26, 4.1, 0.055);
[65, 69, 72, 76, 79].forEach((m, i) => bell(m, 26 + i * 0.09, 0.09, (i - 2) * 0.2));
[84, 81, 79, 77].forEach((m, i) => pluck(m, 27 + i * 0.25, 0.05, 0.3));

// ── SFX, in F major and under the music ──
const typeTimes = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((i + 1) / n) * (b - a));
typeTimes(0.3, 1.15, 19).forEach((t, i) => tick(t, 0.045, i % 2 ? 0.15 : -0.15));
typeTimes(16.6, 17.75, 14).forEach((t, i) => tick(t, 0.045, i % 2 ? 0.15 : -0.15));
tick(1.38, 0.09); tick(18.0, 0.09);
// denial: a low muted minor second
add(1.95, 0.6, (t) => (Math.sin(2 * Math.PI * hz(52) * t) + Math.sin(2 * Math.PI * hz(53) * t)) * env(t, 0.005, 0.12, 0.6), 0.14, 0, 0.3);
// logo pop
bell(77, 4.1, 0.08); bell(72, 4.1, 0.06);
// whooshes into each scene
[4, 8, 12, 16, 22, 26].forEach((t) => whoosh(t, 0.6, 0.05));
// auto-styled sparkle
[84, 88, 91].forEach((m, i) => bell(m, 10.2 + i * 0.06, 0.04, 0.4));
// rows pop in on a rising scale
[65, 67, 69, 70, 72, 74, 76, 77, 79, 81].forEach((m, i) => pluck(m + 12, 12.65 + i * 0.13, 0.035, 0.35));
bell(81, 14.0, 0.05, -0.3);
// verified: bright arpeggio
[72, 76, 79, 84].forEach((m, i) => bell(m, 18.6 + i * 0.07, 0.08, (i - 1.5) * 0.2));
// the link types itself in the outro, then Enter
typeTimes(27.25, 28.35, 29).forEach((t, i) => tick(t, 0.04, i % 2 ? 0.15 : -0.15));
tick(28.55, 0.08); bell(84, 28.6, 0.05);
// bulk done
[77, 81, 84].forEach((m, i) => bell(m, 24.35 + i * 0.07, 0.06, 0.2));

// ── reverb: a small Schroeder room ──
function reverb(x, combs, aps) {
  const y = new Float32Array(N);
  for (const [d, g] of combs) { const buf = new Float32Array(d); let p = 0, lpz = 0;
    for (let i = 0; i < N; i++) { const o = buf[p]; lpz = o * 0.7 + lpz * 0.3; buf[p] = x[i] + lpz * g; y[i] += o * 0.25; p = (p + 1) % d; } }
  for (const d of aps) { const buf = new Float32Array(d); let p = 0;
    for (let i = 0; i < N; i++) { const b = buf[p], v = y[i]; const o = -v + b; buf[p] = v + b * 0.5; y[i] = o; p = (p + 1) % d; } }
  return y;
}
const rl = reverb(fx.L, [[1557, 0.82], [1617, 0.81], [1491, 0.83], [1422, 0.82]], [225, 556]);
const rr = reverb(fx.R, [[1580, 0.82], [1640, 0.81], [1514, 0.83], [1445, 0.82]], [248, 579]);

// mix, gentle saturation, fade the tail
const out = Buffer.alloc(44 + N * 4);
let peak = 0;
for (let i = 0; i < N; i++) { peak = Math.max(peak, Math.abs(L[i] + rl[i] * 0.5), Math.abs(R[i] + rr[i] * 0.5)); }
const norm = 0.9 / peak;
for (let i = 0; i < N; i++) {
  const t = i / SR, fade = t > 29.3 ? Math.max(0, (DUR - 0.2 - t) / 0.7) : 1;
  const l = Math.tanh((L[i] + rl[i] * 0.5) * norm * 1.1) * fade, r = Math.tanh((R[i] + rr[i] * 0.5) * norm * 1.1) * fade;
  out.writeInt16LE(Math.round(l * 30000), 44 + i * 4); out.writeInt16LE(Math.round(r * 30000), 46 + i * 4);
}
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
fs.writeFileSync('music.wav', out);
console.log('music.wav', DUR + 's');
