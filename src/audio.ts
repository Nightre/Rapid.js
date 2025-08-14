import { ISound } from "./interface";
import EventEmitter from "eventemitter3";

/**
 * Events emitted by AudioPlayer.
 */
interface AudioPlayerEvents {
  ended: () => void;
}

/**
 * Audio class for managing individual audio elements.
 * Encapsulates an HTMLAudioElement and its Web Audio API nodes.
 */
export class AudioPlayer extends EventEmitter<AudioPlayerEvents> {
    public element: HTMLAudioElement;
    public source: AudioNode | null;
    public gainNode: GainNode;
    private audioContext: AudioContext;

    /**
     * Creates an instance of Audio.
     * @param audioElement - The HTMLAudioElement to manage.
     * @param audioContext - The Web Audio API context.
     */
    constructor(audioElement: HTMLAudioElement, audioContext: AudioContext) {
        super();
        this.element = audioElement;
        this.audioContext = audioContext;
        this.source = null;
        this.gainNode = this.audioContext.createGain();
        this.element.addEventListener('ended', this.handleEnded.bind(this));
    }

    /**
     * Handles the 'ended' event when audio playback completes.
     */
    private handleEnded(): void {
        this.emit('ended');
    }

    /**
     * Plays the audio with optional looping.
     * @param loop - Whether the audio should loop (default: false).
     */
    async play(loop: boolean = false): Promise<void> {
        try {
            this.element.loop = loop;
            this.source = this.audioContext.createMediaElementSource(this.element);
            this.source.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            await this.element.play();
        } catch (error) {
            console.error(`Error playing audio:`, error);
        }
    }

    /**
     * Pauses the audio.
     */
    pause(): void {
        this.element.pause();
    }

    /**
     * Stops the audio and resets playback position.
     */
    stop(): void {
        this.element.pause();
        this.element.currentTime = 0;
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
    }

    /**
     * Sets the volume for the audio.
     * @param volume - Volume level (0.0 to 1.0).
     */
    setVolume(volume: number): void {
        this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * Cleans up resources associated with the audio.
     */
    destroy(): void {
        this.stop();
        this.gainNode.disconnect();
        this.element.removeEventListener('ended', this.handleEnded.bind(this));
        this.removeAllListeners();
    }
}

/**
 * AudioManager class for managing game audio, including background music (BGM) and sound effects (SFX).
 * Delegates audio-specific responsibilities to AudioPlayer instances.
 */
class AudioManager {
  audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  destroy(): void {
    this.audioContext.close();
  }
}

export default AudioManager;