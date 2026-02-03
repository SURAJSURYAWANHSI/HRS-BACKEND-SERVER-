/**
 * Notification Sound Service
 * Provides different sounds for different notification types
 * Uses Web Audio API for optimized, low-latency playback
 */

export type NotificationSoundType =
    | 'message'
    | 'video_call'
    | 'job_update'
    | 'qc_alert'
    | 'stage_complete'
    | 'priority_high'
    | 'announcement'
    | 'success'
    | 'error'
    | 'warning';

interface SoundConfig {
    frequency: number;
    duration: number;
    type: OscillatorType;
    pattern?: number[];  // For multi-tone sounds
    volume?: number;
}

// Sound configurations for each notification type
const SOUND_CONFIGS: Record<NotificationSoundType, SoundConfig> = {
    message: { frequency: 880, duration: 0.15, type: 'sine', pattern: [1, 0.5, 1], volume: 0.3 },
    video_call: { frequency: 440, duration: 0.3, type: 'sine', pattern: [1, 0.2, 1, 0.2, 1], volume: 0.5 },
    job_update: { frequency: 523, duration: 0.2, type: 'triangle', volume: 0.3 },
    qc_alert: { frequency: 659, duration: 0.25, type: 'sawtooth', pattern: [1, 0.1, 1], volume: 0.4 },
    stage_complete: { frequency: 784, duration: 0.3, type: 'sine', pattern: [1, 0.15, 1.2, 0.15, 1.5], volume: 0.35 },
    priority_high: { frequency: 988, duration: 0.2, type: 'square', pattern: [1, 0.1, 1, 0.1, 1], volume: 0.4 },
    announcement: { frequency: 698, duration: 0.35, type: 'sine', pattern: [1, 0.2, 1.3], volume: 0.35 },
    success: { frequency: 880, duration: 0.15, type: 'sine', pattern: [1, 0.1, 1.5], volume: 0.25 },
    error: { frequency: 220, duration: 0.3, type: 'sawtooth', pattern: [1, 0.15, 0.8], volume: 0.4 },
    warning: { frequency: 440, duration: 0.25, type: 'triangle', pattern: [1, 0.1, 1], volume: 0.35 }
};

class NotificationSoundService {
    private audioContext: AudioContext | null = null;
    private isEnabled: boolean = true;
    private volume: number = 0.5;

    constructor() {
        // Lazy init to comply with browser autoplay policies
        this.initContext();
    }

    private initContext() {
        if (typeof window !== 'undefined' && !this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not available');
            }
        }
    }

    private async ensureContext() {
        this.initContext();
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Play a notification sound
     */
    async play(type: NotificationSoundType): Promise<void> {
        if (!this.isEnabled || !this.audioContext) return;

        await this.ensureContext();

        const config = SOUND_CONFIGS[type];
        if (!config) return;

        const { frequency, duration, type: oscType, pattern, volume = 0.3 } = config;

        if (pattern && pattern.length > 1) {
            await this.playPattern(frequency, duration, oscType, pattern, volume);
        } else {
            await this.playTone(frequency, duration, oscType, volume);
        }
    }

    private async playTone(
        frequency: number,
        duration: number,
        type: OscillatorType,
        volume: number
    ): Promise<void> {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Smooth envelope to avoid clicks
        const now = this.audioContext.currentTime;
        const finalVolume = volume * this.volume;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(finalVolume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    private async playPattern(
        baseFrequency: number,
        baseDuration: number,
        type: OscillatorType,
        pattern: number[],
        volume: number
    ): Promise<void> {
        for (let i = 0; i < pattern.length; i++) {
            const freq = baseFrequency * pattern[i];
            await this.playTone(freq, baseDuration, type, volume);
            await this.delay(baseDuration * 1000 * 0.5);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Play a ringtone for incoming calls (loops until stopped)
     */
    // Track active ringtone stopper
    private currentRingtoneStopper: (() => void) | null = null;

    /**
     * Play a ringtone for incoming calls (loops until stopped)
     */
    playRingtone() {
        if (this.currentRingtoneStopper) {
            this.currentRingtoneStopper(); // Stop existing
        }

        let isPlaying = true;
        const playLoop = async () => {
            while (isPlaying) {
                await this.play('video_call'); // Use video_call sound as ringtone
                await this.delay(1500);
            }
        };

        playLoop();

        this.currentRingtoneStopper = () => { isPlaying = false; };
        return { stop: this.currentRingtoneStopper };
    }

    /**
     * Stop currently playing ringtone
     */
    stop() {
        if (this.currentRingtoneStopper) {
            this.currentRingtoneStopper();
            this.currentRingtoneStopper = null;
        }
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    setVolume(vol: number) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    isAudioEnabled(): boolean {
        return this.isEnabled;
    }

    getVolume(): number {
        return this.volume;
    }
}

// Singleton instance
export const notificationSound = new NotificationSoundService();
