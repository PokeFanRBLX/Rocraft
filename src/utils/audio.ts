/**
 * Web Audio API synthesizer for Rocraft
 * Provides retro Minecraft & Roblox sound effects without external audio asset dependencies.
 */

import {
  saveAudioTrackToStorage,
  loadAudioTrackFromStorage,
  removeAudioTrackFromStorage
} from './audioStorage';

export interface SoundtrackInfo {
  id: string;
  name: string;
  isCustom: boolean;
  duration?: number;
}

/**
 * Web Audio API synthesizer for Rocraft
 * Provides retro Minecraft & Roblox sound effects without external audio asset dependencies,
 * plus a full-featured in-game Boombox / Soundtrack engine (synthesized Chill Lofi Boom Bap & custom uploads).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Music state
  private musicVolume: number = 0.5;
  private isMusicPlaying: boolean = false;
  private musicGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private vinylGain: GainNode | null = null;
  private vinylNode: AudioBufferSourceNode | null = null;

  // Custom audio playback
  private customAudio: HTMLAudioElement | null = null;
  private customSourceNode: MediaElementAudioSourceNode | null = null;
  private customTrackName: string | null = null;
  private isCustomTrackActive: boolean = false;

  // Synthesized Lofi Boom Bap Scheduler
  private schedulerTimer: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private readonly tempoBpm: number = 84;
  private listeners: Set<() => void> = new Set();
  private storageChecked: boolean = false;

  constructor() {
    // Attempt restoring custom track from storage once environment is ready
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.initStorage();
      }, 500);
    }
  }

  private async initStorage() {
    if (this.storageChecked) return;
    this.storageChecked = true;
    try {
      const stored = await loadAudioTrackFromStorage();
      if (stored) {
        this.setCustomAudio(stored.blobUrl, stored.name, false);
      }
    } catch (e) {
      console.warn('Could not restore soundtrack from storage', e);
    }
  }

  private notifyStateChange() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  }

  public subscribeMusicState(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.setupMusicNodes();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupMusicNodes() {
    if (!this.ctx) return;

    this.musicGain = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;

    this.musicGain.gain.setValueAtTime(
      this.isMuted ? 0 : this.musicVolume,
      this.ctx.currentTime
    );

    this.musicGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(
        muted ? 0 : this.musicVolume,
        this.ctx.currentTime
      );
    }
    if (this.customAudio) {
      this.customAudio.muted = muted;
    }
    this.notifyStateChange();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Block break sound (Minecraft style crunchy pop)
   */
  public playBreakBlock() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  /**
   * Block place sound (Minecraft style thud)
   */
  public playPlaceBlock() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  /**
   * Wobbly Life boingy spring jump sound
   */
  public playWobbleJump() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Fun bouncy spring pitch bend
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
    osc.frequency.linearRampToValueAtTime(360, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Wobbly Life jelly landing squash sound
   */
  public playWobbleLand(impactForce: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Squishy downward-wobble pitch bend
    osc.type = 'sine';
    const startFreq = 260 + Math.min(impactForce * 60, 150);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.15);

    const volume = Math.min(0.15 + impactForce * 0.12, 0.35);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Wobbly footstep squish/pop sound
   */
  public playWobbleStep(pitchMult: number = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const base = 220 * pitchMult;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.5, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Standard jump sound
   */
  public playJump() {
    this.playWobbleJump();
  }

  /**
   * Classic Roblox "OOF" sound recreation!
   */
  public playOof() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Two oscillators tuned to create the iconic "OOF" vocal formants
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    // Characteristic downward pitch bend of Roblox oof
    osc1.frequency.setValueAtTime(420, now);
    osc1.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    osc2.frequency.setValueAtTime(425, now);
    osc2.frequency.exponentialRampToValueAtTime(265, now + 0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  }

  /**
   * Gravity Coil boing sound
   */
  public playGravityBoing() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.28);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Trampoline spring bounce
   */
  public playBounce() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Speed pad zoom sound
   */
  public playSpeedBoost() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Roblox sword swing swoosh
   */
  public playSwordSlash() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /**
   * Sword hit sound (flesh / clank)
   */
  public playSwordHit() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Rocket launcher shoot
   */
  public playRocketLaunch() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Explosion sound (TNT & Rockets)
   */
  public playExplosion() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  /**
   * Checkpoint chime (green pad reached)
   */
  public playCheckpoint() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  /**
   * Victory fanfare (stage completion / obby win)
   */
  public playVictory() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.1 }, // C5
      { f: 659.25, d: 0.1 }, // E5
      { f: 783.99, d: 0.1 }, // G5
      { f: 1046.5, d: 0.35 } // C6
    ];

    let t = now;
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + n.d);

      t += n.d * 0.8;
    });
  }

  /**
   * Health restore sparkle chime
   */
  public playHeal() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.05;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  /**
   * Super powerup rising tone
   */
  public playPowerup() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Owner GUI & Rank fanfare
   */
  public playOwnerFanfare() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.045;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  // ================= BOOMBOX & SOUNDTRACK ENGINE ================= //

  public isMusicActive(): boolean {
    return this.isMusicPlaying;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : this.musicVolume,
        now + 0.05
      );
    }
    this.notifyStateChange();
  }

  public getCurrentTrackInfo(): SoundtrackInfo {
    if (this.isCustomTrackActive && this.customTrackName) {
      return {
        id: 'custom',
        name: this.customTrackName,
        isCustom: true,
        duration: this.customAudio ? this.customAudio.duration : undefined
      };
    }
    return {
      id: 'lofi_track_1',
      name: 'Track 1: Chill Lofi Boom Bap (84 BPM)',
      isCustom: false
    };
  }

  public async startMusic() {
    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    this.isMusicPlaying = true;

    if (this.isCustomTrackActive && this.customAudio) {
      try {
        await this.customAudio.play();
      } catch (err) {
        console.warn('Playback blocked or pending interaction', err);
      }
    } else {
      this.startSynthesizedSoundtrack();
    }

    this.notifyStateChange();
  }

  public pauseMusic() {
    this.isMusicPlaying = false;
    if (this.customAudio) {
      this.customAudio.pause();
    }
    this.stopSynthesizedSoundtrack();
    this.notifyStateChange();
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.pauseMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public setCustomAudio(url: string, trackName: string, autoPlay: boolean = true) {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.src = '';
    }

    this.stopSynthesizedSoundtrack();
    this.isCustomTrackActive = true;
    this.customTrackName = trackName;

    const audio = new Audio(url);
    audio.loop = true;
    audio.crossOrigin = 'anonymous';

    const ctx = this.getContext();
    if (ctx && this.musicGain) {
      try {
        if (!this.customSourceNode) {
          this.customSourceNode = ctx.createMediaElementSource(audio);
          this.customSourceNode.connect(this.musicGain);
        }
      } catch (e) {
        // Fallback direct audio output if source creation issues arise
        audio.volume = this.isMuted ? 0 : this.musicVolume;
      }
    }

    this.customAudio = audio;

    if (autoPlay || this.isMusicPlaying) {
      this.isMusicPlaying = true;
      audio.play().catch(() => {});
    }

    this.notifyStateChange();
  }

  public async loadCustomTrackFile(file: File): Promise<string> {
    const { name, blobUrl } = await saveAudioTrackToStorage(file);
    this.setCustomAudio(blobUrl, name, true);
    return name;
  }

  public async resetToSynthesizedTrack() {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }
    this.isCustomTrackActive = false;
    this.customTrackName = null;
    await removeAudioTrackFromStorage();

    if (this.isMusicPlaying) {
      this.startSynthesizedSoundtrack();
    }
    this.notifyStateChange();
  }

  public getFrequencyData(targetArray: Uint8Array): void {
    if (this.analyser && this.isMusicPlaying) {
      this.analyser.getByteFrequencyData(targetArray);
    } else {
      targetArray.fill(0);
    }
  }

  // ================= SYNTHESIZED SOUNDTRACK ENGINE (Track 1) ================= //

  private startSynthesizedSoundtrack() {
    this.stopSynthesizedSoundtrack();
    const ctx = this.getContext();
    if (!ctx) return;

    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;
    this.startVinylNoise();

    // Lookahead scheduler loop (runs every 40ms to schedule audio notes ahead of time)
    const scheduleAheadTime = 0.15;
    const stepDuration = 60 / (this.tempoBpm * 4); // 16th note step = ~0.1785s

    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying || this.isCustomTrackActive) {
        return;
      }

      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
        this.scheduleStep(this.currentStep, this.nextStepTime);
        // Advance step
        this.currentStep = (this.currentStep + 1) % 64; // 4 measures of 16 steps
        this.nextStepTime += stepDuration;
      }
    }, 35);
  }

  private stopSynthesizedSoundtrack() {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.stopVinylNoise();
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const measureStep = step % 16;
    const barIndex = Math.floor(step / 16); // 0, 1, 2, 3

    // 1. DRUMS (Boom Bap swing rhythm)
    const isSwingStep = measureStep % 2 === 1;
    const swingOffset = isSwingStep ? 0.022 : 0;
    const drumTime = time + swingOffset;

    // Kick: Beat 1 (step 0), Beat 2.5 (step 6), Beat 3.5 (step 10)
    if (measureStep === 0 || measureStep === 6 || measureStep === 10) {
      const punch = measureStep === 0 ? 0.45 : 0.35;
      this.synthKick(drumTime, punch);
    }

    // Snare: Beat 2 (step 4) & Beat 4 (step 12)
    if (measureStep === 4 || measureStep === 12) {
      this.synthSnare(drumTime, 0.4);
    }

    // Closed Hi-Hat on even 16ths, ghost on odd 16ths
    if (measureStep % 2 === 0) {
      const isAccent = measureStep === 0 || measureStep === 8;
      this.synthHiHat(drumTime, isAccent ? 0.22 : 0.15, false);
    } else if (measureStep === 7 || measureStep === 15) {
      this.synthHiHat(drumTime, 0.09, false); // subtle ghost hat
    }

    // Open Hi-Hat on step 14 before bar transitions
    if (measureStep === 14 && (barIndex === 1 || barIndex === 3)) {
      this.synthHiHat(drumTime, 0.2, true);
    }

    // 2. CHORDS & BASS (Lofi Rhodes Electric Piano)
    // Chords struck on step 0 of each bar, with a syncopated restrike on step 10
    const chordProgressions = [
      {
        bass: 73.42, // D2
        chord: [146.83, 174.61, 220.0, 261.63, 329.63] // Dm9: D3, F3, A3, C4, E4
      },
      {
        bass: 49.0, // G1
        chord: [98.0, 174.61, 246.94, 329.63] // G13: G2, F3, B3, E4
      },
      {
        bass: 65.41, // C2
        chord: [130.81, 164.81, 196.0, 246.94, 293.66] // Cmaj9: C3, E3, G3, B3, D4
      },
      {
        bass: 55.0, // A1
        chord: [110.0, 196.0, 261.63, 329.63, 493.88] // Am9: A2, G3, C4, E4, B4
      }
    ];

    const currentBar = chordProgressions[barIndex];

    if (measureStep === 0) {
      // Sub Bass hit
      this.synthSubBass(time, currentBar.bass, 2.2);
      // Main chord stroke
      this.synthRhodesChord(time, currentBar.chord, 2.4, 0.28);
    } else if (measureStep === 10) {
      // Syncopated light chord restrike
      this.synthRhodesChord(time, currentBar.chord, 1.0, 0.16);
    }

    // 3. MELODIC SYNTH BELLS / LEAD (chill improvisational riffs)
    const melodyMap: Record<number, { f: number; d: number }> = {
      // Bar 0
      4: { f: 440.0, d: 0.3 },   // A4
      8: { f: 523.25, d: 0.25 }, // C5
      12: { f: 587.33, d: 0.4 }, // D5
      // Bar 1
      20: { f: 659.25, d: 0.35 }, // E5
      26: { f: 587.33, d: 0.25 }, // D5
      28: { f: 493.88, d: 0.5 },  // B4
      // Bar 2
      36: { f: 523.25, d: 0.3 },  // C5
      40: { f: 659.25, d: 0.25 }, // E5
      44: { f: 783.99, d: 0.45 }, // G5
      // Bar 3
      52: { f: 659.25, d: 0.3 },  // E5
      56: { f: 523.25, d: 0.25 }, // C5
      60: { f: 440.0, d: 0.5 }   // A4
    };

    if (melodyMap[step]) {
      const note = melodyMap[step];
      this.synthMelodyLead(time, note.f, note.d, 0.18);
    }
  }

  // --- Synthesizer Instruments ---

  private synthKick(time: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  private synthSnare(time: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(185, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);
    oscGain.gain.setValueAtTime(gainVal * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.12);

    // Noise snap
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.value = 1.6;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gainVal * 0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.18);
  }

  private synthHiHat(time: number, gainVal: number, isOpen: boolean) {
    if (!this.ctx || !this.musicGain) return;

    const dur = isOpen ? 0.25 : 0.045;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + dur);
  }

  private synthSubBass(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Smooth envelope with mild sidechain dip at attack
    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.38, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private synthRhodesChord(time: number, frequencies: number[], duration: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;

    // Filter to give warm, buttery vintage Rhodes vibe
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, time);
    filter.Q.value = 1.0;

    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0.01, time);
    chordGain.gain.linearRampToValueAtTime(gainVal, time + 0.03);
    chordGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    filter.connect(chordGain);
    chordGain.connect(this.musicGain);

    frequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Gentle chorus detune
      const detune = (idx % 2 === 0 ? 3 : -3);
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq + detune * 0.1, time);

      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.2, time);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(filter);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    });
  }

  private synthMelodyLead(time: number, freq: number, duration: number, gainVal: number) {
    if (!this.ctx || !this.musicGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.exponentialRampToValueAtTime(700, time + duration);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private startVinylNoise() {
    if (!this.ctx || !this.musicGain || this.vinylNode) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Soft pink noise with occasional pops
      const pop = Math.random() < 0.001 ? (Math.random() * 0.4) : 0;
      data[i] = (Math.random() * 2 - 1) * 0.02 + pop;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start();
    this.vinylNode = noise;
    this.vinylGain = gain;
  }

  private stopVinylNoise() {
    if (this.vinylNode) {
      try {
        this.vinylNode.stop();
        this.vinylNode.disconnect();
      } catch {}
      this.vinylNode = null;
    }
    this.vinylGain = null;
  }
}

export const soundEngine = new SoundEngine();
