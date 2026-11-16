// Synthesised game sounds via the Web Audio API (no audio files needed).
// The AudioContext is created lazily and resumed on demand, because browsers
// only allow audio to start after a user gesture.

export type SoundName = "select" | "move" | "capture" | "check" | "win" | "lose" | "draw";

const KEY = "xiangqi-muted";
let ctx: AudioContext | null = null;
let muted = false;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    muted = localStorage.getItem(KEY) === "1";
  } catch {}
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}

/** Call from a user gesture (click/tap) to unlock audio early. */
export const unlockAudio = () => {
  getCtx();
};

export const isMuted = () => {
  load();
  return muted;
};

export const setMuted = (m: boolean) => {
  load();
  muted = m;
  try {
    localStorage.setItem(KEY, m ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
};

export const subscribeMuted = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** A short pitched blip with an exponential decay envelope. */
function tone(
  ac: AudioContext,
  t: number,
  freq: number,
  dur: number,
  gain: number,
  type: OscillatorType = "sine",
  endFreq?: number,
) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** A burst of filtered noise, used for the wooden "clack". */
function noise(ac: AudioContext, t: number, dur: number, gain: number, freq: number) {
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 1.2;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(t);
}

export function playSound(name: SoundName) {
  load();
  if (muted) return;
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  switch (name) {
    case "select":
      tone(ac, t, 880, 0.06, 0.08, "triangle");
      break;
    case "move":
      noise(ac, t, 0.05, 0.35, 1800);
      tone(ac, t, 220, 0.09, 0.25, "sine", 120);
      break;
    case "capture":
      noise(ac, t, 0.09, 0.6, 1200);
      tone(ac, t, 160, 0.16, 0.4, "sine", 70);
      tone(ac, t + 0.07, 260, 0.1, 0.15, "triangle", 130);
      break;
    case "check":
      tone(ac, t, 660, 0.12, 0.18, "square");
      tone(ac, t + 0.13, 880, 0.18, 0.18, "square");
      break;
    case "win":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(ac, t + i * 0.12, f, 0.3, 0.2, "triangle"),
      );
      break;
    case "lose":
      [392, 349.23, 311.13, 261.63].forEach((f, i) =>
        tone(ac, t + i * 0.16, f, 0.35, 0.2, "sawtooth"),
      );
      break;
    case "draw":
      tone(ac, t, 440, 0.25, 0.18, "triangle");
      tone(ac, t + 0.2, 440, 0.35, 0.18, "triangle");
      break;
  }
}
