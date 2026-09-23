export class AudioFeedback {
  constructor(enabled = true) { this.enabled = enabled; this.context = null; }
  setEnabled(value) { this.enabled = value; }
  beep(kind = 'hit') {
    if (!this.enabled) return;
    try { const c = this.context ||= new AudioContext(); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = kind === 'hit' ? 640 : 150; g.gain.setValueAtTime(.055, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .09); o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + .09); } catch { }
  }
}
