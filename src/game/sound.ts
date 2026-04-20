// Offline procedural sound design via Web Audio API.
// No assets, no network. Tiny + satisfying.

let ctx: AudioContext | null = null;
let compressor: DynamicsCompressorNode | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!AC) return null;
    ctx = new AC();
    // Master compressor: maximises perceived loudness on mobile speakers.
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 6;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;
    compressor.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Returns the node all sounds should route into (compressor → destination).
function getDest(): AudioNode {
  const c = getCtx()!;
  return compressor ?? c.destination;
}

export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem("flow:muted", v ? "1" : "0");
  } catch {}
}

export function isMuted() {
  try {
    const stored = localStorage.getItem("flow:muted");
    if (stored !== null) muted = stored === "1";
  } catch {}
  return muted;
}

export function initAudio() {
  // Call from a user gesture once.
  isMuted();
  getCtx();
}

function tone(freq: number, dur = 0.12, type: OscillatorType = "sine", gain = 0.28) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g).connect(getDest());
  const t = c.currentTime;
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// A short, bright "tick" when a dot is added to the chain.
// Pitch rises with chain length for a satisfying scale-up feel.
export function playConnect(chainLength: number) {
  const base = 320;
  const f = base + Math.min(chainLength, 16) * 55;
  tone(f, 0.07, "triangle", 0.22);
}

// Soft pop when dots clear.
export function playClear(count: number) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const n = Math.min(count, 8);
  for (let i = 0; i < n; i++) {
    setTimeout(() => tone(520 + i * 45, 0.09, "sine", 0.28), i * 28);
  }
}

// Triumphant chord on loop close (rare = special).
export function playLoop() {
  if (muted) return;
  [392, 523, 659, 784].forEach((f, i) =>
    setTimeout(() => tone(f, 0.22, "triangle", 0.26), i * 50)
  );
}

// Level-up arpeggio.
export function playLevelUp() {
  if (muted) return;
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => tone(f, 0.16, "triangle", 0.28), i * 70)
  );
}

// Failure / reset.
export function playFail() {
  if (muted) return;
  [330, 247].forEach((f, i) =>
    setTimeout(() => tone(f, 0.22, "sawtooth", 0.2), i * 90)
  );
}
