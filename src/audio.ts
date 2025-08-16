// src/audio.ts

import EventEmitter from "eventemitter3";

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
export class AudioPlayer extends EventEmitter<AudioPlayerEvents> {
    private audioContext: AudioContext | null;
    private audioBuffer: AudioBuffer | null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private gainNode: GainNode | null;

    private _volume: number = 1;
    private _loop: boolean = false;
    private _isPlaying: boolean = false;

    constructor(audioContext: AudioContext, audioBuffer: AudioBuffer) {
        super();
        this.audioContext = audioContext;
        this.audioBuffer = audioBuffer;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
    }

    /**
     * Plays the audio. If already playing, it will stop the current playback and start over.
     */
    play(): void {
        if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
            console.warn("Cannot play audio on a destroyed AudioPlayer.");
            return;
        }

        if (this._isPlaying) {
            this.stop();
        }

        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.loop = this._loop;
        this.sourceNode.connect(this.gainNode);

        this.sourceNode.onended = () => {
            // Check if onended was called due to stop() on a destroyed player
            if (!this._isPlaying) return;

            this._isPlaying = false;
            this.sourceNode = null;
            this.emit('ended');
        };

        this.sourceNode.start(0);
        this._isPlaying = true;
    }

    /**
     * Stops the audio playback immediately.
     */
    stop(): void {
        if (this.sourceNode) {
            this.sourceNode.stop();
            // onended will be called automatically, which will clear the node
        }
        this._isPlaying = false;
    }

    /**
     * Gets the volume of the audio, from 0.0 to 1.0.
     */
    get volume(): number {
        return this._volume;
    }

    /**
     * Sets the volume of the audio.
     * @param value - The volume, from 0.0 (silent) to 1.0 (full).
     */
    set volume(value: number) {
        this._volume = Math.max(0, Math.min(1, value)); // Clamp value between 0 and 1
        if (this.gainNode && this.audioContext) {
            // Use setTargetAtTime for a smoother volume change
            this.gainNode.gain.setTargetAtTime(this._volume, this.audioContext.currentTime, 0.01);
        }
    }

    /**
     * Gets whether the audio will loop.
     */
    get loop(): boolean {
        return this._loop;
    }

    /**
     * Sets whether the audio should loop.
     * Can be changed while the audio is playing.
     */
    set loop(value: boolean) {
        this._loop = value;
        if (this.sourceNode) {
            this.sourceNode.loop = value;
        }
    }

    /**
     * Gets whether the audio is currently playing.
     */
    get isPlaying(): boolean {
        return this._isPlaying;
    }

    /**
     * Stops playback, disconnects audio nodes, and removes all event listeners.
     * This makes the AudioPlayer instance unusable.
     */
    destroy() {
        // 1. Stop any active playback.
        this.stop();

        // 2. Disconnect the gain node from the audio graph to free it up.
        if (this.gainNode) {
            this.gainNode.disconnect();
        }

        // 3. Remove all event listeners to prevent memory leaks.
        this.removeAllListeners();

        // 4. Nullify references to Web Audio API objects to help the garbage collector.
        // This effectively makes the player instance unusable.
        this.audioBuffer = null;
        this.audioContext = null;
        this.gainNode = null;
        this.sourceNode = null;
    }
}

/**
 * Manages loading, decoding, and caching of audio assets.
 * This is analogous to your TextureCache.
 */
export class AudioManager {
    private audioContext: AudioContext | null;
    private cache: Map<string, AudioBuffer> = new Map();

    constructor() {
        try {
            // Create the AudioContext. It's best to create it once.
            // The 'any' cast is for older browser compatibility (webkitAudioContext).
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
            this.audioContext = null;
        }
    }

    /**
     * Creates an AudioPlayer from a URL.
     * It fetches, decodes, and caches the audio data. If the URL is already cached,
     * it skips the network request and uses the cached data.
     *
     * @param url - The URL of the audio file.
     * @returns A Promise that resolves to a new AudioPlayer instance.
     */
    async audioFromUrl(url: string): Promise<AudioPlayer> {
        if (!this.audioContext) {
            throw new Error("AudioContext is not available. Cannot process audio.");
        }
        
        // 1. Check if the raw audio data is in the cache
        let cachedBuffer = this.cache.get(url);

        if (!cachedBuffer) {
            // 2. If not, fetch and decode it
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio from ${url}: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            // Use a try-catch for decodeAudioData as it can fail on corrupt files
            try {
                cachedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            } catch (error) {
                 throw new Error(`Failed to decode audio from ${url}: ${error}`);
            }

            // 3. Store the decoded data in the cache
            this.cache.set(url, cachedBuffer);
        }

        // 4. Create and return a new player instance with the (now-cached) audio data.
        return new AudioPlayer(this.audioContext, cachedBuffer);
    }

    /**
     * Destroys the AudioManager, clears the audio cache, and closes the AudioContext.
     * This releases all associated audio resources. After calling this, the AudioManager
     * and any AudioPlayers created by it will be unusable.
     */
    destroy() {
        // 1. Clear the cache of all decoded AudioBuffer data.
        this.cache.clear();

        // 2. Close the AudioContext to release system audio resources.
        // This is an irreversible action.
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(err => {
                // Log error if closing fails, but don't prevent further cleanup.
                console.error("Error closing AudioContext:", err);
            });
        }
        
        // 3. Nullify references to make the manager unusable.
        this.audioContext = null;
    }
}

export default AudioManager;