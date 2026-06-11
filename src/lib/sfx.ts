// src/lib/sfx.ts
// All sounds synthesized, no external files, fully offline

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return ctx;
}

function tone(freq: number, durationMs: number, type: OscillatorType, gainPeak: number) {
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') {
      ac.resume();
    }
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak, ac.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + durationMs / 1000);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + durationMs / 1000 + 0.01);
  } catch (err) {
    // Silent fail if AudioContext is blocked
    console.debug('SFX blocked or failed:', err);
  }
}

export const sfx = {
  windowOpen:  () => tone(800,  40,  'sine',     0.06),
  windowClose: () => tone(400,  60,  'sine',     0.05),
  minimize:    () => tone(300,  30,  'sine',     0.04),
  tick:        () => tone(1200, 15,  'sine',     0.03),
  alert:       () => tone(120,  80,  'sawtooth', 0.08),
  startup: () => {
    tone(220, 120, 'sine', 0.07);
    setTimeout(() => tone(330, 120, 'sine', 0.06), 130);
  },

  play(action: keyof Omit<typeof sfx, 'play'>) {
    const enabled = localStorage.getItem('kuro_sound') !== 'false';
    if (!enabled) return;
    try {
      this[action]();
    } catch {
      // AudioContext blocked before user gesture — silent fail
    }
  }
};
