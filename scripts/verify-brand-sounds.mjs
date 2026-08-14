#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Conferência da identidade sonora
//
//   node scripts/verify-brand-sounds.mjs
//
// Analisa os buffers gerados por generate-brand-sounds.mjs antes da codificação
// e verifica, por sinal e não por ouvido:
//
//   · cada nota da melodia soa na hora certa e na afinação certa — a magnitude
//     na frequência esperada tem que superar a dos semitons vizinhos, o que
//     descarta tanto ausência de nota quanto nota desafinada;
//   · nível de pico dentro do teto, sem clipping;
//   · sem offset DC (come headroom e estala em alto-falante pequeno);
//   · o som começa imediatamente, sem silêncio na frente.
// ─────────────────────────────────────────────────────────────────────────────

import { N, SOUNDS, SR } from "./generate-brand-sounds.mjs";

const SEMITONE = 2 ** (1 / 12);
const WINDOW = 0.15; // s — resolução ~6,7 Hz, suficiente até o registro grave

/**
 * Magnitude numa frequência exata. A janela de Hann derruba os lóbulos
 * laterais: sem ela, uma nota forte "vaza" para o semitom vizinho e o teste
 * de afinação passaria mesmo desafinado.
 */
function goertzel(buf, freq, startSec) {
  const start = Math.floor(startSec * SR);
  const end = Math.min(start + Math.floor(WINDOW * SR), buf.length);
  const n = end - start;
  if (n <= 0) return 0;

  const k = 2 * Math.cos((2 * Math.PI * freq) / SR);
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    const s0 = buf[start + i] * w + k * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return Math.sqrt(Math.abs(s1 * s1 + s2 * s2 - k * s1 * s2)) / (n / 2);
}

/** [instante em segundos, frequência] de cada nota, conforme o gerador. */
const EXPECTED = {
  "order-confirmed": [
    [0.0, N.D5],
    [0.155, N.A5],
    [0.31, N.G5],
    [0.465, N.B5],
  ],
  "order-arrived": [
    [0.0, N.D5],
    [0.14, N.A5],
    [0.28, N.G5],
    [0.42, N.B5],
    [0.6, N.D6],
  ],
  "step-preparing": [
    [0.0, N.D5],
    [0.15, N.A5],
  ],
  "step-ready": [
    [0.0, N.G5],
    [0.15, N.B5],
  ],
  "step-on-the-way": [
    [0.0, N.A5],
    [0.15, N.D6],
  ],
  "new-order": [
    [0.0, N.D6],
    [0.125, N.A6],
    [0.25, N.G6],
    // segunda passagem da frase
    [0.52, N.D6],
    [0.645, N.A6],
  ],
  success: [
    [0.0, N.G5],
    [0.09, N.B5],
  ],
  "new-job": [
    [0.0, N.D4],
    [0.16, N.A4],
    [0.32, N.G4],
    [0.48, N.B4],
  ],
  "cart-add": [[0.0, N.D5]],
  error: [
    [0.0, N.G4],
    [0.17, N.Eb4],
  ],
};

const NAMES = Object.fromEntries(Object.entries(N).map(([k, v]) => [v, k]));

let failures = 0;

function check(label, ok, detail) {
  if (!ok) failures++;
  console.log(`   ${ok ? "ok   " : "FALHA"} ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("");

for (const [name, build] of Object.entries(SOUNDS)) {
  const buf = build();
  const secs = buf.length / SR;

  let peak = 0;
  let sum = 0;
  let dc = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i];
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
    dc += v;
  }
  const rms = Math.sqrt(sum / buf.length);
  dc /= buf.length;

  console.log(
    `${name}  ${secs.toFixed(2)}s  pico ${peak.toFixed(3)}  ` +
      `rms ${(20 * Math.log10(rms)).toFixed(1)} dBFS`,
  );

  check("sem clipping", peak <= 0.95, `pico ${peak.toFixed(3)}`);
  check("sem offset DC", Math.abs(dc) < 0.005, `dc ${dc.toFixed(5)}`);
  check("começa sem silêncio", Math.abs(buf[Math.floor(0.01 * SR)]) > 0.001);

  let worstRatio = Infinity;
  let worstNote = "";
  for (const [at, freq] of EXPECTED[name] ?? []) {
    const mag = goertzel(buf, freq, at);
    const neighbour = Math.max(
      goertzel(buf, freq * SEMITONE, at),
      goertzel(buf, freq / SEMITONE, at),
    );
    const ratio = neighbour > 0 ? mag / neighbour : Infinity;
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstNote = `${NAMES[freq] ?? freq.toFixed(0)} em ${at.toFixed(3)}s`;
    }
  }

  check(
    `melodia afinada e no tempo (${(EXPECTED[name] ?? []).length} notas)`,
    worstRatio > 1.6,
    `pior: ${worstNote} a ${worstRatio.toFixed(1)}x do semitom vizinho`,
  );

  console.log("");
}

if (failures) {
  console.error(`${failures} verificação(ões) falharam.`);
  process.exit(1);
}
console.log("Todas as verificações passaram.");
