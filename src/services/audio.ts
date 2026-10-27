/**
 * Dedicated Audio Engine for Nigul Bird.
 * Features:
 * 1. Guaranteed synchronous initialization with unified audio graph.
 * 2. Signature "Nigul" voice engine playing the authentic voice recording with zero-latency buffers and fallbacks.
 * 3. Immediate, responsive arcade sound effects (jump, score, hit, level complete, game over).
 * 4. Synthesized chiptune background music loop.
 * 5. Global user-gesture audio unlocker.
 */

import { GameSettings } from '../types/game';

type MusicTheme = 'classic' | 'retro' | 'synthwave' | 'intense' | 'boss';

const VOICE_RECORDING_URL = '/assets/aistudio/ElevenLabs_2026-10-26T20_43_31_Meher_-_Soothing_Assamese_Friend_eleven_v4_e90272fc.mp3';

export class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;

  // Master gain nodes (guaranteed initialized together)
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;

  // Real voice recording buffer & sources
  private voiceAudioBuffer: AudioBuffer | null = null;
  private isPreloadingVoice = false;
  private activeVoiceSources: AudioBufferSourceNode[] = [];

  // Music sequencer state
  private musicIntervalId: number | null = null;
  private currentTheme: MusicTheme = 'classic';
  private musicStep = 0;
  private isMusicPlaying = false;
  private activeMusicOscillators: OscillatorNode[] = [];

  // Settings cache
  private settings: GameSettings;

  // Speech synthesis re-trigger limiter
  private lastSpeechTime = 0;

  private constructor(settings: GameSettings) {
    this.settings = settings;
    // Eagerly fetch and cache the voice recording array buffer
    this.preloadVoiceBuffer();
  }

  static getInstance(settings: GameSettings): AudioManager {
    if (!this.instance) {
      this.instance = new AudioManager(settings);
    } else {
      this.instance.updateSettings(settings);
    }
    return this.instance;
  }

  /**
   * Ensures AudioContext and ALL gain nodes (master, music, sfx, voice)
   * are created and wired together in one synchronous pass.
   */
  public ensureContextAndGraph(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }

    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.settings.musicEnabled ? this.settings.musicVolume * 0.45 : 0;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.settings.sfxEnabled ? this.settings.sfxVolume * 0.8 : 0;
      this.sfxGain.connect(this.masterGain);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = this.settings.voiceEnabled ? this.settings.voiceVolume * 1.0 : 0;
      this.voiceGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Public hook for first user interaction (touch/click/key) to unlock audio.
   */
  public unlockAudio(): void {
    const ctx = this.ensureContextAndGraph();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!this.voiceAudioBuffer && !this.isPreloadingVoice) {
      this.preloadVoiceBuffer();
    }
  }

  /**
   * Preload and decode the voice recording into an AudioBuffer for zero-latency playback.
   */
  public async preloadVoiceBuffer(): Promise<void> {
    if (this.voiceAudioBuffer || this.isPreloadingVoice) return;
    this.isPreloadingVoice = true;

    try {
      const response = await fetch(VOICE_RECORDING_URL);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      const ctx = this.ensureContextAndGraph();

      // Callback-based decode for 100% cross-browser reliability
      ctx.decodeAudioData(
        arrayBuffer.slice(0),
        (decoded) => {
          this.voiceAudioBuffer = decoded;
          this.isPreloadingVoice = false;
        },
        (err) => {
          console.warn('decodeAudioData error, fallback available:', err);
          this.isPreloadingVoice = false;
        }
      );
    } catch (e) {
      console.warn('Voice recording preload error:', e);
      this.isPreloadingVoice = false;
    }
  }

  private stopActiveVoiceSources(): void {
    for (const src of this.activeVoiceSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // already stopped
      }
    }
    this.activeVoiceSources = [];
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    if (!this.ctx || !this.masterGain) return;

    if (this.musicGain) {
      this.musicGain.gain.value = settings.musicEnabled ? settings.musicVolume * 0.45 : 0;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = settings.sfxEnabled ? settings.sfxVolume * 0.8 : 0;
    }
    if (this.voiceGain) {
      this.voiceGain.gain.value = settings.voiceEnabled ? settings.voiceVolume * 1.0 : 0;
    }

    if (!settings.musicEnabled && this.isMusicPlaying) {
      this.pauseMusic();
    }
  }

  // --------------------------------------------------------------------------
  // SIGNATURE "NIGUL" VOICE PLAYBACK
  // --------------------------------------------------------------------------
  /**
   * Plays the signature "Nigul" voice effect.
   * Plays the uploaded authentic voice recording with zero latency.
   */
  playNigulVoice(): void {
    if (!this.settings.voiceEnabled) return;
    const ctx = this.ensureContextAndGraph();

    if (this.settings.voiceMode === 'speech' && 'speechSynthesis' in window) {
      this.playSpeechSynthesisNigul();
      return;
    }

    if (this.settings.voiceMode === 'procedural') {
      this.playProceduralNigul();
      return;
    }

    // Default: 'recording' (Authentic uploaded voice recording)
    if (this.voiceAudioBuffer && this.voiceGain) {
      try {
        this.stopActiveVoiceSources();

        const source = ctx.createBufferSource();
        source.buffer = this.voiceAudioBuffer;
        source.connect(this.voiceGain);
        source.start(0);

        this.activeVoiceSources.push(source);
        source.onended = () => {
          this.activeVoiceSources = this.activeVoiceSources.filter((s) => s !== source);
        };
        return;
      } catch (err) {
        console.warn('Buffer playback issue, falling back to audio element:', err);
      }
    }

    // Fallback: HTML5 Audio instance
    try {
      const audioEl = new Audio(VOICE_RECORDING_URL);
      audioEl.volume = Math.min(1, Math.max(0, this.settings.voiceVolume));
      audioEl.play().catch(() => {
        this.playProceduralNigul();
      });
    } catch {
      this.playProceduralNigul();
    }
  }

  /**
   * Procedural formant voice synthesizer for "Nigul" (100% offline fallback).
   */
  private playProceduralNigul(): void {
    const ctx = this.ensureContextAndGraph();
    if (!this.voiceGain) return;

    const now = ctx.currentTime;
    const duration = 0.28;

    // Master voice envelope
    const voiceEnvelope = ctx.createGain();
    voiceEnvelope.gain.setValueAtTime(0, now);
    voiceEnvelope.gain.linearRampToValueAtTime(1.0, now + 0.03);
    voiceEnvelope.gain.setValueAtTime(0.85, now + 0.12);
    voiceEnvelope.gain.linearRampToValueAtTime(0.35, now + 0.14);
    voiceEnvelope.gain.linearRampToValueAtTime(0.95, now + 0.17);
    voiceEnvelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
    voiceEnvelope.connect(this.voiceGain);

    // Glottal pulse oscillator
    const glottal = ctx.createOscillator();
    glottal.type = 'sawtooth';
    glottal.frequency.setValueAtTime(220, now);
    glottal.frequency.linearRampToValueAtTime(285, now + 0.1);
    glottal.frequency.linearRampToValueAtTime(195, now + duration);

    // Formant 1
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 4.5;
    f1.frequency.setValueAtTime(320, now);
    f1.frequency.linearRampToValueAtTime(290, now + 0.12);
    f1.frequency.linearRampToValueAtTime(460, now + 0.2);

    // Formant 2
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 5.5;
    f2.frequency.setValueAtTime(2100, now);
    f2.frequency.linearRampToValueAtTime(2350, now + 0.12);
    f2.frequency.linearRampToValueAtTime(1150, now + 0.22);

    // Formant 3
    const f3 = ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.Q.value = 6.0;
    f3.frequency.setValueAtTime(2900, now);
    f3.frequency.linearRampToValueAtTime(2700, now + 0.22);

    const formantMix = ctx.createGain();
    formantMix.gain.value = 0.5;

    glottal.connect(f1);
    glottal.connect(f2);
    glottal.connect(f3);

    f1.connect(formantMix);
    f2.connect(formantMix);
    f3.connect(formantMix);
    formantMix.connect(voiceEnvelope);

    glottal.start(now);
    glottal.stop(now + duration);
  }

  /**
   * Browser Speech Synthesis fallback for "Nigul"
   */
  private playSpeechSynthesisNigul(): void {
    const now = Date.now();
    if (now - this.lastSpeechTime < 180) return;
    this.lastSpeechTime = now;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Nigul!');
      utterance.rate = 1.35;
      utterance.pitch = 1.25;
      utterance.volume = this.settings.voiceVolume;
      window.speechSynthesis.speak(utterance);
    } catch {
      this.playProceduralNigul();
    }
  }

  // --------------------------------------------------------------------------
  // SOUND EFFECTS (SFX)
  // --------------------------------------------------------------------------

  /**
   * Wing flap / Jump sound (Synchronous, instant response)
   */
  playJumpSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContextAndGraph();
    if (!this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.12);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Score Point sound (retro crystal chime)
   */
  playScoreSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContextAndGraph();
    if (!this.sfxGain) return;

    const now = ctx.currentTime;

    // Note 1: B5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Note 2: E6 (crystal ring)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);
    gain2.gain.setValueAtTime(0.35, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);
  }

  /**
   * Collision / Hit sound
   */
  playHitSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContextAndGraph();
    if (!this.sfxGain) return;

    const now = ctx.currentTime;

    // Noise blast
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.22), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);

    // Sub-thud
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(160, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.22);
    thudGain.gain.setValueAtTime(0.6, now);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(now);
    thud.stop(now + 0.22);
  }

  /**
   * Level Complete Fanfare
   */
  playLevelCompleteSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContextAndGraph();
    if (!this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.45, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + (idx === 3 ? 0.45 : 0.18));
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + (idx === 3 ? 0.45 : 0.18));
    });
  }

  /**
   * Game Over sound (melancholy arcade jingle)
   */
  playGameOverSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContextAndGraph();
    if (!this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23]; // A4, Ab4, G4, F4
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.005, start + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  /**
   * Snappy UI button click
   */
  playClickSound(): void {
    if (!this.settings.sfxEnabled) return;
    const ctx = this.ensureContextAndGraph();
    if (!this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // --------------------------------------------------------------------------
  // NOSTALGIC CHIPTUNE BACKGROUND MUSIC ENGINE
  // --------------------------------------------------------------------------

  startMusic(theme: MusicTheme = 'classic'): void {
    this.currentTheme = theme;
    if (!this.settings.musicEnabled) return;

    this.ensureContextAndGraph();

    if (this.isMusicPlaying) {
      return;
    }

    this.isMusicPlaying = true;
    this.musicStep = 0;
    this.runSequencerStep();
  }

  pauseMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      window.clearTimeout(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.stopActiveMusicOscillators();
  }

  resumeMusic(): void {
    if (!this.settings.musicEnabled) return;
    if (!this.isMusicPlaying) {
      this.ensureContextAndGraph();
      this.isMusicPlaying = true;
      this.runSequencerStep();
    }
  }

  switchMusicTheme(theme: MusicTheme): void {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;
    if (this.isMusicPlaying) {
      this.musicStep = 0;
    }
  }

  private stopActiveMusicOscillators(): void {
    this.activeMusicOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped
      }
    });
    this.activeMusicOscillators = [];
  }

  private runSequencerStep = (): void => {
    if (!this.isMusicPlaying || !this.settings.musicEnabled || !this.ctx || !this.musicGain) {
      this.isMusicPlaying = false;
      return;
    }

    const tempoMs = this.getThemeTempo(this.currentTheme);
    const now = this.ctx.currentTime;
    const step = this.musicStep % 16;

    this.playThemeStep(this.currentTheme, step, now, tempoMs / 1000);

    this.musicStep++;
    this.musicIntervalId = window.setTimeout(this.runSequencerStep, tempoMs);
  };

  private getThemeTempo(theme: MusicTheme): number {
    switch (theme) {
      case 'classic':
        return 145;
      case 'retro':
        return 135;
      case 'synthwave':
        return 125;
      case 'intense':
        return 110;
      case 'boss':
        return 98;
    }
  }

  private playThemeStep(theme: MusicTheme, step: number, now: number, stepDuration: number): void {
    if (!this.ctx || !this.musicGain) return;

    // Melody scale definitions
    const C4 = 261.63,
      D4 = 293.66,
      E4 = 329.63,
      F4 = 349.23,
      G4 = 392.0,
      A4 = 440.0,
      B4 = 493.88;
    const C5 = 523.25,
      D5 = 587.33,
      E5 = 659.25,
      F5 = 698.46,
      G5 = 783.99,
      A5 = 880.0,
      B5 = 987.77;
    const C3 = 130.81,
      D3 = 146.83,
      E3 = 164.81,
      F3 = 174.61,
      G3 = 196.0,
      A3 = 220.0;

    let leadFreq = 0;
    let bassFreq = 0;
    let playKick = false;
    let playHihat = false;

    if (theme === 'classic') {
      const leadMelody = [C5, 0, E5, G5, 0, E5, D5, 0, C5, 0, A4, 0, G4, A4, C5, 0];
      const bassMelody = [C3, C3, G3, G3, A3, A3, F3, F3, C3, C3, G3, G3, A3, A3, F3, G3];
      leadFreq = leadMelody[step];
      bassFreq = bassMelody[step];
      playKick = step % 4 === 0;
      playHihat = step % 2 === 1;
    } else if (theme === 'retro') {
      const leadMelody = [E5, 0, G5, A5, 0, G5, E5, D5, E5, 0, C5, 0, D5, E5, D5, 0];
      const bassMelody = [A3, A3, A3, A3, F3, F3, F3, F3, C3, C3, C3, C3, G3, G3, G3, G3];
      leadFreq = leadMelody[step];
      bassFreq = bassMelody[step];
      playKick = step % 4 === 0 || step === 10;
      playHihat = true;
    } else if (theme === 'synthwave') {
      const synthArp = [A4, C5, E5, A5, G4, B4, D5, G5, F4, A4, C5, F5, E4, G4, B4, E5];
      const bassMelody = [A3, A3, 0, A3, G3, G3, 0, G3, F3, F3, 0, F3, E3, E3, 0, E3];
      leadFreq = synthArp[step];
      bassFreq = bassMelody[step];
      playKick = step % 4 === 0;
      playHihat = step % 2 === 0;
    } else if (theme === 'intense') {
      const leadMelody = [D5, F5, A5, F5, D5, F5, A5, 0, C5, E5, G5, E5, C5, E5, G5, 0];
      const bassMelody = [D3, D3, D3, D3, D3, D3, D3, D3, C3, C3, C3, C3, C3, C3, C3, C3];
      leadFreq = leadMelody[step];
      bassFreq = bassMelody[step];
      playKick = step % 2 === 0;
      playHihat = true;
    } else {
      const leadMelody = [A5, 0, E5, 0, A5, C5 * 2, B4 * 2, A5, G5, 0, D5, 0, G5, B5, A5, 0];
      const bassMelody = [A3, A3, A3, A3, F3, F3, F3, F3, D3, D3, D3, D3, E3, E3, E3, E3];
      leadFreq = leadMelody[step];
      bassFreq = bassMelody[step];
      playKick = step % 4 === 0 || step === 6 || step === 14;
      playHihat = true;
    }

    if (leadFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = theme === 'synthwave' ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(leadFreq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + stepDuration * 0.85);
      this.activeMusicOscillators.push(osc);
    }

    if (bassFreq > 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.95);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration * 0.95);
      this.activeMusicOscillators.push(bassOsc);
    }

    if (playKick) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(110, now);
      kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      kickGain.gain.setValueAtTime(0.25, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);

      kickOsc.start(now);
      kickOsc.stop(now + 0.08);
      this.activeMusicOscillators.push(kickOsc);
    }

    if (playHihat) {
      const hihatNoise = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.02), this.ctx.sampleRate);
      const data = hihatNoise.getChannelData(0);
      for (let i = 0; i < hihatNoise.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = hihatNoise;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      source.start(now);
    }

    if (this.activeMusicOscillators.length > 20) {
      this.activeMusicOscillators = this.activeMusicOscillators.slice(-10);
    }
  }
}
