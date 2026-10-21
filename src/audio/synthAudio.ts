/**
 * Cozy Procedural Web Audio Synth Engine
 * Creates zero-dependency, rich procedural audio:
 * - Engine hum with RPM dynamics
 * - Snow plow crunching/swishing filter noise
 * - Pentatonic combo chime scales that climb with streaks
 * - Shimmering upgrade fanfares
 * - Cozy generative winter synth chords
 */

class SynthAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine synth nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Snow crunch continuous noise nodes
  private crunchNoiseNode: AudioBufferSourceNode | null = null;
  private crunchFilter: BiquadFilterNode | null = null;
  private crunchGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Music generative loop
  private musicTimer: number | null = null;
  private currentChordIndex = 0;
  private isMusicPlaying = false;

  constructor() {
    // Initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.createNoiseBuffer();
      this.initEngineSynth();
      this.initCrunchSynth();
      this.startAmbientMusic();
    } catch {
      // Audio not supported or blocked
    }
  }

  public unlock() {
    this.initContext();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    // Pinkish/soft noise for natural snow crunch
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = data[i];
      data[i] *= 3.5; // boost volume
    }
    this.noiseBuffer = buffer;
  }

  private initEngineSynth() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(38, this.ctx.currentTime);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(19, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
  }

  private initCrunchSynth() {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    this.crunchGain = this.ctx.createGain();
    this.crunchGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.crunchFilter = this.ctx.createBiquadFilter();
    this.crunchFilter.type = 'bandpass';
    this.crunchFilter.frequency.setValueAtTime(900, this.ctx.currentTime);
    this.crunchFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.crunchNoiseNode = this.ctx.createBufferSource();
    this.crunchNoiseNode.buffer = this.noiseBuffer;
    this.crunchNoiseNode.loop = true;

    this.crunchNoiseNode.connect(this.crunchFilter);
    this.crunchFilter.connect(this.crunchGain);
    this.crunchGain.connect(this.sfxGain);

    this.crunchNoiseNode.start();
  }

  /**
   * Called every frame to adjust engine pitch & snow crunch intensity
   */
  public updateVehicleAudio(speedNorm: number, isClearingSnow: boolean, isBoosting: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Engine sound modulation
    if (this.engineOsc && this.engineGain && this.engineFilter) {
      const baseFreq = 36 + speedNorm * 52 + (isBoosting ? 28 : 0);
      const filterFreq = 120 + speedNorm * 260 + (isBoosting ? 200 : 0);
      const targetGain = 0.08 + speedNorm * 0.14 + (isBoosting ? 0.08 : 0);

      this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.06);
      if (this.engineSubOsc) {
        this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.06);
      }
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.06);
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
    }

    // Snow crunching modulation
    if (this.crunchGain && this.crunchFilter) {
      const crunchTargetGain = isClearingSnow ? Math.min(0.28, 0.06 + speedNorm * 0.22) : 0;
      const crunchFreq = 700 + speedNorm * 800;
      this.crunchGain.gain.setTargetAtTime(crunchTargetGain, now, 0.04);
      this.crunchFilter.frequency.setTargetAtTime(crunchFreq, now, 0.05);
    }
  }

  /**
   * Pentatonic combo chime - steps up with multiplier!
   */
  public playComboChime(multiplier: number, streak: number) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Pentatonic scale frequencies in Eb major (cozy winter feel: Eb, F, G, Bb, C)
    const scale = [
      155.56, 174.61, 196.00, 233.08, 261.63, // Eb3 to C4
      311.13, 349.23, 392.00, 466.16, 523.25, // Eb4 to C5
      622.25, 698.46, 783.99, 932.33, 1046.50, // Eb5 to C6
      1244.51 // Eb6
    ];

    const stepIndex = Math.min(scale.length - 1, Math.floor((streak % 12) + (multiplier - 1) * 2));
    const freq = scale[stepIndex];

    // Bell-like FM / dual oscillator chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.002, now); // subtle detuned overtone

    const volume = Math.min(0.24, 0.12 + multiplier * 0.02);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.48);
    osc2.stop(now + 0.48);
  }

  /**
   * Snow drift plow impact (deep snow burst)
   */
  public playDriftPlow() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Star / Secret item collected chime
   */
  public playPickup() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    [783.99, 1046.50].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      if (this.sfxGain) gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.38);
    });
  }

  /**
   * Vehicle upgrade bought fanfare
   */
  public playUpgradeFanfare() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [311.13, 392.00, 466.16, 622.25, 783.99]; // Eb major 7/9 arpeggio

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + i * 0.065;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      if (this.sfxGain) gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  /**
   * Boost activated whoosh
   */
  public playBoost() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * Bump snowman / fence
   */
  public playSoftBump() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    if (this.sfxGain) gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Generative Cozy Winter Chords (Smooth electric-piano / warm synth pad)
   * Cycles gently in the background with no external files
   */
  private startAmbientMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Cozy winter progressions in Eb major: Ebmaj7 -> Cm7 -> Fm7 -> Bb7sus4
    const chords = [
      [155.56, 233.08, 311.13, 392.00, 466.16], // Ebmaj9
      [130.81, 196.00, 261.63, 311.13, 392.00], // Cm7
      [174.61, 261.63, 349.23, 415.30, 523.25], // Fm7
      [116.54, 233.08, 349.23, 466.16, 523.25], // Bb9sus
    ];

    const playNextChord = () => {
      if (!this.ctx || this.isMuted) {
        this.musicTimer = window.setTimeout(playNextChord, 4800);
        return;
      }

      const chord = chords[this.currentChordIndex];
      this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;
      const now = this.ctx.currentTime;
      const duration = 4.6;

      chord.forEach((freq, noteIdx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Warm soft sine-triangle hybrid
        osc.type = noteIdx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);

        // Soft slow envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 1.2);
        gain.gain.setTargetAtTime(0.001, now + duration - 1.2, 0.7);

        osc.connect(filter);
        filter.connect(gain);
        if (this.musicGain) gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + duration);
      });

      this.musicTimer = window.setTimeout(playNextChord, 4600);
    };

    playNextChord();
  }

  public stopAll() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.isMusicPlaying = false;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.crunchGain && this.ctx) {
      this.crunchGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }
}

export const synthAudio = new SynthAudioEngine();
