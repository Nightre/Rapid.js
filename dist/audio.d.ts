import { default as EventEmitter } from 'eventemitter3';
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
export declare class AudioPlayer extends EventEmitter<AudioPlayerEvents> {
    element: HTMLAudioElement;
    source: AudioNode | null;
    gainNode: GainNode;
    private audioContext;
    /**
     * Creates an instance of Audio.
     * @param audioElement - The HTMLAudioElement to manage.
     * @param audioContext - The Web Audio API context.
     */
    constructor(audioElement: HTMLAudioElement, audioContext: AudioContext);
    /**
     * Handles the 'ended' event when audio playback completes.
     */
    private handleEnded;
    /**
     * Plays the audio with optional looping.
     * @param loop - Whether the audio should loop (default: false).
     */
    play(loop?: boolean): Promise<void>;
    /**
     * Pauses the audio.
     */
    pause(): void;
    /**
     * Stops the audio and resets playback position.
     */
    stop(): void;
    /**
     * Sets the volume for the audio.
     * @param volume - Volume level (0.0 to 1.0).
     */
    setVolume(volume: number): void;
    /**
     * Cleans up resources associated with the audio.
     */
    destroy(): void;
}
/**
 * AudioManager class for managing game audio, including background music (BGM) and sound effects (SFX).
 * Delegates audio-specific responsibilities to AudioPlayer instances.
 */
declare class AudioManager {
    audioContext: AudioContext;
    constructor();
    destroy(): void;
}
export default AudioManager;
