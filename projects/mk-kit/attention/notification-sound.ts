import { inject, Injectable, InjectionToken } from '@angular/core';

/** One selectable alert sound. `url: null` = the synthesised chime. */
export interface MkSoundPreset {
  id: string;
  label: string;
  url: string | null;
}

/** Options for {@link MkNotificationSound}. */
export interface MkNotificationSoundConfig {
  /** Selectable sounds; the ids `custom` and `none` are reserved. Default: the chime only. */
  presets?: MkSoundPreset[];
  /** localStorage key for the on/off preference — a function so it can vary per tenant / user. */
  storageKey?: () => string;
  /** Output gain for file presets (0–1). Default `0.8`. */
  volume?: number;
}

export const MK_NOTIFICATION_SOUND_CONFIG = new InjectionToken<MkNotificationSoundConfig>('MK_NOTIFICATION_SOUND_CONFIG');

/** Register presets / storage key for {@link MkNotificationSound}. Optional. */
export function provideMkNotificationSound(config: MkNotificationSoundConfig) {
  return { provide: MK_NOTIFICATION_SOUND_CONFIG, useValue: config };
}

/** The always-available synthesised sound. */
export const MK_CHIME_PRESET: MkSoundPreset = { id: 'chime', label: 'Chime', url: null };

/**
 * Alert sounds for incoming work (orders, messages, tickets) with the
 * browser's autoplay rules handled: an `AudioContext` stays suspended until a
 * user gesture, so a sound fired by a WebSocket message would be silent. The
 * context is unlocked when the user enables sound (a click) and lazily on the
 * first interaction anywhere in the app. The default sound is synthesised
 * (a short C–E–G chime) — nothing to ship, no CORS, lowest latency; file
 * presets are fetched and decoded once and fall back to the chime when they
 * fail. The on/off preference lives in localStorage under a configurable key.
 *
 * ```ts
 * provideMkNotificationSound({ presets: [MK_CHIME_PRESET, { id: 'ding', label: 'Ding', url: '/assets/ding.wav' }] })
 * sound.primeOnFirstInteraction();          // at app start
 * sound.play(settings.newOrderSound);       // on an event, honours the device mute
 * sound.preview('ding');                    // settings page test button
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkNotificationSound {
  private readonly config = inject(MK_NOTIFICATION_SOUND_CONFIG, { optional: true }) ?? {};
  private ctx: AudioContext | null = null;
  private gesturePrimed = false;
  /** Decoded file presets by url; null = fetch/decode failed. */
  private readonly buffers = new Map<string, AudioBuffer | null>();

  /** The selectable presets (always includes the chime). */
  get presets(): MkSoundPreset[] {
    const list = this.config.presets ?? [];
    return list.some((p) => p.id === MK_CHIME_PRESET.id) ? list : [MK_CHIME_PRESET, ...list];
  }

  private storageKey(): string {
    return this.config.storageKey?.() ?? 'mk-notification-sound';
  }

  /** Whether the device has sound on. */
  isEnabled(): boolean {
    return this.read() === 'true';
  }

  /** Whether the user ever answered the "enable sound?" question on this device. */
  hasBeenAsked(): boolean {
    return this.read() !== null;
  }

  /** Persist the preference; call from a click so audio unlocks at once. */
  setEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(this.storageKey(), String(enabled));
    } catch {
      /* storage unavailable — non-fatal */
    }
    if (enabled) this.unlock();
  }

  /** Arm a one-time listener so the first pointer/key interaction unlocks audio. */
  primeOnFirstInteraction(): void {
    if (this.gesturePrimed || typeof document === 'undefined') return;
    this.gesturePrimed = true;
    const handler = () => {
      this.unlock();
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('keydown', handler);
    };
    document.addEventListener('pointerdown', handler);
    document.addEventListener('keydown', handler);
  }

  /** The default chime, if the device has sound on. */
  chime(): void {
    this.play(MK_CHIME_PRESET.id);
  }

  /**
   * Play the sound configured for an event: a preset id, `custom` (with
   * `customUrl`) or `none` (silent). Unknown ids and failed loads fall back
   * to the chime. Honours the device mute.
   */
  play(soundId: string, customUrl?: string | null): void {
    if (!this.isEnabled()) return;
    this.playById(soundId, customUrl);
  }

  /** Same as `play()` but ignores the device mute — for settings test buttons. */
  preview(soundId: string, customUrl?: string | null): void {
    this.playById(soundId, customUrl);
  }

  private playById(soundId: string, customUrl?: string | null): void {
    if (soundId === 'none') return;
    const url =
      soundId === 'custom' ? customUrl || null : (this.presets.find((p) => p.id === soundId)?.url ?? null);
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const play = () => (url ? void this.playUrl(ctx, url) : this.playChime(ctx));
    if (ctx.state === 'suspended') ctx.resume().then(play).catch(() => undefined);
    else play();
  }

  private async playUrl(ctx: AudioContext, url: string): Promise<void> {
    let buffer = this.buffers.get(url);
    if (buffer === undefined) {
      try {
        const res = await fetch(url);
        buffer = await ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        buffer = null;
      }
      this.buffers.set(url, buffer);
    }
    if (!buffer) {
      // A missing asset must not mean a missed event — chime instead.
      this.playChime(ctx);
      return;
    }
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = this.config.volume ?? 0.8;
      gain.connect(ctx.destination);
      source.connect(gain);
      source.start();
    } catch {
      /* audio is best-effort */
    }
  }

  /** Ascending C5–E5–G5 chime (~0.75 s) with a bell-like timbre. */
  private playChime(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    for (const note of [
      { freq: 523.25, at: 0 },
      { freq: 659.25, at: 0.13 },
      { freq: 783.99, at: 0.26 },
    ]) {
      this.scheduleNote(ctx, master, note.freq, now + note.at, 0.5);
    }
  }

  private scheduleNote(ctx: AudioContext, destination: AudioNode, freq: number, start: number, duration: number): void {
    try {
      const env = ctx.createGain();
      env.connect(destination);
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(0.25, start + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      const fundamental = ctx.createOscillator();
      fundamental.type = 'sine';
      fundamental.frequency.value = freq;
      fundamental.connect(env);
      fundamental.start(start);
      fundamental.stop(start + duration);
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.value = 0.35;
      harmonicGain.connect(env);
      const harmonic = ctx.createOscillator();
      harmonic.type = 'sine';
      harmonic.frequency.value = freq * 2;
      harmonic.connect(harmonicGain);
      harmonic.start(start);
      harmonic.stop(start + duration);
    } catch {
      /* audio is best-effort */
    }
  }

  private unlock(): void {
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const AC = w.AudioContext || w.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    return this.ctx;
  }

  private read(): string | null {
    try {
      return localStorage.getItem(this.storageKey());
    } catch {
      return null;
    }
  }
}
