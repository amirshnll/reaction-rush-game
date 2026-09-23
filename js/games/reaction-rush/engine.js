import { GAME_DURATION_MS } from '../../shared/settings.js';

export class ReactionEngine {
  constructor(callbacks) { this.cb = callbacks; this.running = false; this.paused = false; this.timeout = 0; this.frame = 0; }
  start() { this.stop(); this.running = true; this.score = 0; this.combo = 0; this.reactions = []; this.startAt = performance.now(); this.deadline = this.startAt + GAME_DURATION_MS; this.tick(); this.schedule(true); this.cb.onState(this.state()); }
  state() { return { score: this.score, combo: this.combo, average: this.reactions.length ? Math.round(this.reactions.reduce((a, b) => a + b, 0) / this.reactions.length) : null }; }
  schedule(immediate = false) { if (!this.running || this.paused) return; this.visible = false; this.cb.onTarget(false); const difficulty = Math.min(700, this.score * 18); const delay = immediate ? 0 : Math.max(350, 700 + Math.random() * 1800 - difficulty); this.timeout = setTimeout(() => { if (this.running && !this.paused) { this.visible = true; this.shownAt = performance.now(); this.cb.onTarget(true); } }, delay); }
  miss() { if (!this.running || this.paused) return; this.combo = 0; this.cb.onEarly(this.state()); this.finish(); }
  hit() { if (!this.running || this.paused) return; if (!this.visible) { this.miss(); return; } const ms = Math.round(performance.now() - this.shownAt); this.visible = false; this.reactions.push(ms); this.combo += 1; this.score += 1 + Math.floor(this.combo / 3); this.cb.onHit(ms, this.state()); this.schedule(); }
  togglePause() { if (!this.running) return false; this.paused = !this.paused; if (this.paused) { clearTimeout(this.timeout); this.pausedAt = performance.now(); this.cb.onTarget(false); } else { this.deadline += performance.now() - this.pausedAt; this.schedule(); this.tick(); } return this.paused; }
  tick() { cancelAnimationFrame(this.frame); const loop = () => { if (!this.running || this.paused) return; const remaining = Math.max(0, this.deadline - performance.now()); this.cb.onTime(remaining); if (!remaining) return this.finish(); this.frame = requestAnimationFrame(loop); }; this.frame = requestAnimationFrame(loop); }
  finish() { this.running = false; clearTimeout(this.timeout); cancelAnimationFrame(this.frame); this.visible = false; this.cb.onTarget(false); this.cb.onFinish({ ...this.state(), reactions: this.reactions }); }
  stop() { this.running = false; clearTimeout(this.timeout); cancelAnimationFrame(this.frame); }
}
