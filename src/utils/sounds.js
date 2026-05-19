let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, duration, type = "sine", gain = 0.08) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g);
    g.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start();
    osc.stop(ac.currentTime + duration);
  } catch {
    /* audio not available */
  }
}

export function playMoveSound() {
  tone(440, 0.08);
}

export function playCaptureSound() {
  tone(220, 0.12, "square", 0.1);
}

export function playCheckSound() {
  tone(660, 0.15);
  setTimeout(() => tone(880, 0.15), 80);
}

export function playGameEndSound() {
  tone(523, 0.2);
  setTimeout(() => tone(392, 0.3), 150);
}
