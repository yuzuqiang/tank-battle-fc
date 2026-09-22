/** WebAudio synthesized SFX — no copyrighted samples. */
export class AudioSys {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private beep(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.08, slide = 0) {
    if (this.muted) return;
    const ctx = this.ensure();
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  shoot() { this.beep(880, 0.06, 'square', 0.06, -400); }
  explode() {
    this.beep(120, 0.25, 'sawtooth', 0.1, -80);
    this.beep(60, 0.3, 'square', 0.08, -40);
  }
  hitBrick() { this.beep(200, 0.05, 'triangle', 0.05); }
  hitSteel() { this.beep(400, 0.04, 'square', 0.04); }
  powerup() { this.beep(523, 0.08); setTimeout(() => this.beep(659, 0.08), 80); setTimeout(() => this.beep(784, 0.12), 160); }
  pickup() { this.beep(880, 0.1, 'square', 0.07, 200); }
  freeze() { this.beep(300, 0.4, 'sine', 0.06, -150); }
  life() { this.beep(440, 0.1); setTimeout(() => this.beep(660, 0.1), 100); setTimeout(() => this.beep(880, 0.15), 200); }
  gameOver() { this.beep(200, 0.3, 'sawtooth', 0.1, -100); setTimeout(() => this.beep(100, 0.5, 'sawtooth', 0.1, -50), 300); }
  stageStart() { this.beep(330, 0.1); setTimeout(() => this.beep(440, 0.1), 120); setTimeout(() => this.beep(550, 0.2), 240); }
  pause() { this.beep(500, 0.08, 'triangle', 0.05); }
  moveTick() { /* soft optional rumble omitted to avoid noise */ }
}
