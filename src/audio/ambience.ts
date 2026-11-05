import { heroProgress } from '../lib/store';
import { stageIndexAt } from '../animation/heroStages';

/**
 * Optional construction ambience, synthesised with Web Audio — no audio
 * files. Off by default; only starts from an explicit user gesture.
 *   · a low filtered rumble (brown noise) with a slow drift
 *   · a faint 55 Hz structural hum
 *   · a metallic FM "ping" each time the hero moves to a new stage
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let reverb: ConvolverNode | null = null;
let unsubscribe: (() => void) | null = null;
let suspendTimer = 0;

const STAGE_PITCH = [392, 349.23, 293.66, 261.63, 220, 196, 174.61];

function impulse(context: AudioContext, seconds: number, decay: number) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
  }
  return buffer;
}

function build() {
  const context = new AudioContext();
  const out = context.createGain();
  out.gain.value = 0;
  out.connect(context.destination);

  const length = context.sampleRate * 4;
  const noise = context.createBuffer(1, length, context.sampleRate);
  const data = noise.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const rumble = context.createBufferSource();
  rumble.buffer = noise;
  rumble.loop = true;
  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 150;
  const rumbleGain = context.createGain();
  rumbleGain.gain.value = 0.9;
  rumble.connect(lowpass).connect(rumbleGain).connect(out);
  rumble.start();

  const drift = context.createOscillator();
  drift.frequency.value = 0.07;
  const driftDepth = context.createGain();
  driftDepth.gain.value = 55;
  drift.connect(driftDepth).connect(lowpass.frequency);
  drift.start();

  [
    [55, 0.045],
    [55.35, 0.045],
    [110.2, 0.012],
  ].forEach(([frequency, gain]) => {
    const osc = context.createOscillator();
    osc.frequency.value = frequency;
    const g = context.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(out);
    osc.start();
  });

  const room = context.createConvolver();
  room.buffer = impulse(context, 3.2, 2.6);
  room.connect(out);

  ctx = context;
  master = out;
  reverb = room;
}

function ping(stage: number) {
  if (!ctx || !master || !reverb) return;
  const t = ctx.currentTime;
  const base = STAGE_PITCH[stage % STAGE_PITCH.length] * 2;
  const carrier = ctx.createOscillator();
  carrier.frequency.value = base;
  const modulator = ctx.createOscillator();
  modulator.frequency.value = base * 3.53; // inharmonic ratio → struck steel
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(base * 2.6, t);
  depth.gain.exponentialRampToValueAtTime(1, t + 1.8);
  modulator.connect(depth).connect(carrier.frequency);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.07, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
  carrier.connect(env);
  env.connect(reverb);
  env.connect(master);

  carrier.start(t);
  modulator.start(t);
  carrier.stop(t + 2.8);
  modulator.stop(t + 2.8);
}

export async function setAmbience(on: boolean) {
  window.clearTimeout(suspendTimer);
  if (on) {
    if (!ctx) build();
    await ctx!.resume();
    master!.gain.cancelScheduledValues(ctx!.currentTime);
    master!.gain.setTargetAtTime(0.16, ctx!.currentTime, 0.8);
    let stage = stageIndexAt(heroProgress.get());
    unsubscribe?.();
    unsubscribe = heroProgress.subscribe((p) => {
      const next = stageIndexAt(p);
      if (next !== stage) {
        stage = next;
        ping(next);
      }
    });
    return;
  }
  unsubscribe?.();
  unsubscribe = null;
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    suspendTimer = window.setTimeout(() => ctx?.suspend(), 1500);
  }
}
