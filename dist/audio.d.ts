import { default as EventEmitter } from 'eventemitter3';
/**
 * Events emitted by AudioPlayer.
 */
interface AudioPlayerEvents {
    ended: () => void;
}
/**
 * Represents a single, playable audio instance.
 * Created by the AudioManager.
 */
export declare class AudioPlayer extends EventEmitter<AudioPlayerEvents> {
    private audioContext;
    private audioBuffer;
    private sourceNode;
    private gainNode;
    private _volume;
    private _loop;
    private _isPlaying;
    constructor(audioContext: AudioContext, audioBuffer: AudioBuffer);
    /**
     * Plays the audio. If already playing, it will stop the current playback and start over.
     */
    play(): void;
    /**
     * Stops the audio playback immediately.
     */
    stop(): void;
    /**
     * Gets the volume of the audio, from 0.0 to 1.0.
     */
    get volume(): number;
    /**
     * Sets the volume of the audio.
     * @param value - The volume, from 0.0 (silent) to 1.0 (full).
     */
    set volume(value: number);
    /**
     * Gets whether the audio will loop.
     */
    get loop(): boolean;
    /**
     * Sets whether the audio should loop.
     * Can be changed while the audio is playing.
     */
    set loop(value: boolean);
    /**
     * Gets whether the audio is currently playing.
     */
    get isPlaying(): boolean;
    /**
     * Stops playback, disconnects audio nodes, and removes all event listeners.
     * This makes the AudioPlayer instance unusable.
     */
    destroy(): void;
}
/**
 * Manages loading, decoding, and caching of audio assets.
 * This is analogous to your TextureCache.
 */
export declare class AudioManager {
    private audioContext;
    private cache;
    constructor();
    /**
     * Creates an AudioPlayer from a URL.
     * It fetches, decodes, and caches the audio data. If the URL is already cached,
     * it skips the network request and uses the cached data.
     *
     * @param url - The URL of the audio file.
     * @returns A Promise that resolves to a new AudioPlayer instance.
     */
    audioFromUrl(url: string): Promise<AudioPlayer>;
    /**
     * Destroys the AudioManager, clears the audio cache, and closes the AudioContext.
     * This releases all associated audio resources. After calling this, the AudioManager
     * and any AudioPlayers created by it will be unusable.
     */
    destroy(): void;
}
export default AudioManager;
