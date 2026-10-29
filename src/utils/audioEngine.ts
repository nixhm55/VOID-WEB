import { Track } from '../types/void';

/**
 * Built-in Web Audio API Ambient Preview Engine.
 * Provides an authentic, local, zero-dependency spatial pad synthesis preview
 * when playback is toggled in the VOID Hero or Library UI, plus live spectral
 * data for the waveform visualizer.
 */
class VoidAmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private isPlaying = false;
  private volume = 0.72;
  private isMuted = false;
  private freqBuffer: Uint8Array<ArrayBuffer> | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 680;
      this.filterNode.Q.value = 1.8;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;
      this.freqBuffer = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startTrack(track: Track): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.filterNode || !this.masterGain) {
      this.isPlaying = true;
      return;
    }

    this.stopOscillators();

    const now = ctx.currentTime;
    const baseFreq = track.eclipseConfig.baseFreqHz;
    const ratios = track.eclipseConfig.chordRatios;

    ratios.forEach((ratio, index) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = index === 0 ? 'sine' : index % 2 === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);
      osc.detune.setValueAtTime((index - 1.5) * 6, now);

      const layerLevel = index === 0 ? 0.16 : 0.06 / index;
      oscGain.gain.setValueAtTime(layerLevel, now);

      osc.connect(oscGain);
      oscGain.connect(this.filterNode!);
      osc.start(now);
      this.oscillators.push(osc);
    });

    // Slow breathing filter modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, now);
    lfoGain.gain.setValueAtTime(220, now);
    lfo.connect(lfoGain);
    lfoGain.connect(this.filterNode.frequency);
    lfo.start(now);
    this.lfo = lfo;

    const targetGain = this.isMuted ? 0.0001 : Math.max(0.0001, this.volume * 0.28);
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(targetGain, now + 0.65);

    this.isPlaying = true;
  }

  public pause(): void {
    this.isPlaying = false;
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    window.setTimeout(() => {
      if (!this.isPlaying) {
        this.stopOscillators();
      }
    }, 380);
  }

  public setVolume(nextVolume: number, muted = false): void {
    this.volume = Math.max(0, Math.min(1, nextVolume));
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const targetGain = this.isMuted ? 0.0001 : Math.max(0.0001, this.volume * 0.28);
    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  public sampleWaveform(barCount: number, timeSeconds: number, active: boolean): number[] {
    const values: number[] = [];
    if (active && this.analyser && this.freqBuffer) {
      this.analyser.getByteFrequencyData(this.freqBuffer);
    }

    for (let i = 0; i < barCount; i++) {
      const normalizedIndex = i / (barCount - 1);
      // Bell-shaped envelope centered slightly left of middle matching the reference card
      const centerDist = Math.abs(normalizedIndex - 0.44);
      const envelope = Math.exp(-Math.pow(centerDist * 2.55, 2));

      const waveA = Math.sin(i * 0.65 + timeSeconds * (active ? 4.2 : 1.1));
      const waveB = Math.cos(i * 1.15 - timeSeconds * (active ? 2.9 : 0.7));
      const waveC = Math.sin(i * 0.28 + timeSeconds * (active ? 1.8 : 0.45));

      let audioBoost = 0;
      if (active && this.freqBuffer) {
        const binIndex = Math.min(
          this.freqBuffer.length - 1,
          Math.floor(normalizedIndex * (this.freqBuffer.length * 0.65))
        );
        audioBoost = (this.freqBuffer[binIndex] / 255) * 0.35;
      }

      const raw =
        (0.32 + 0.28 * Math.abs(waveA) + 0.22 * Math.abs(waveB) + 0.18 * Math.abs(waveC) + audioBoost) *
        envelope;
      values.push(Math.max(0.06, Math.min(0.98, raw)));
    }
    return values;
  }

  private stopOscillators(): void {
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already-stopped oscillator errors
      }
    });
    this.oscillators = [];
    if (this.lfo) {
      try {
        this.lfo.stop();
        this.lfo.disconnect();
      } catch {
        // Ignore
      }
      this.lfo = null;
    }
  }
}

export const voidAmbientEngine = new VoidAmbientEngine();
