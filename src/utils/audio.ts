// Synthesized Web Audio Sound Effects - 100% Offline with zero asset dependencies

class SoundController {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a simple tone or frequency sweep
  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, delay: number = 0) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime + delay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio failure
    }
  }

  // Standard UI Click
  public playClick() {
    this.playTone(600, 'sine', 0.05);
  }

  // Soft button tap
  public playTap() {
    this.playTone(400, 'triangle', 0.04);
  }

  // Move / Place Piece
  public playMove() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);
      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // Pop bubble / item match
  public playPop() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  // Eat apple (Snake)
  public playEat() {
    this.playTone(523.25, 'sine', 0.06, 0);
    this.playTone(659.25, 'sine', 0.08, 0.05);
  }

  // Rolling Dice
  public playDice() {
    for (let i = 0; i < 5; i++) {
      const freq = 200 + Math.random() * 250;
      this.playTone(freq, 'triangle', 0.04, i * 0.06);
    }
  }

  // Correct answer / Match found
  public playCorrect() {
    this.playTone(523.25, 'triangle', 0.08, 0); // C5
    this.playTone(659.25, 'triangle', 0.08, 0.08); // E5
    this.playTone(783.99, 'triangle', 0.14, 0.16); // G5
  }

  // Error / Wrong Move / Miss
  public playError() {
    this.playTone(280, 'sawtooth', 0.12, 0);
    this.playTone(210, 'sawtooth', 0.18, 0.08);
  }

  // Hit Whack / Target shot
  public playHit() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  // Shoot arrow / bubble
  public playShoot() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.12);
      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  // Level Win / Match Victory fanfare
  public playWin() {
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, index) => {
      this.playTone(freq, 'triangle', 0.18, index * 0.1);
    });
  }

  // Game Over
  public playGameOver() {
    const notes = [400, 350, 300, 220];
    notes.forEach((freq, index) => {
      this.playTone(freq, 'sawtooth', 0.2, index * 0.12);
    });
  }
}

export const sound = new SoundController();
