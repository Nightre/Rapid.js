import Rapid from "./render";
import { IParticleOptions, ITransformOptions } from "./interface";
import { Vec2 } from "./math";
/**
 * Particle emitter for creating and managing particle systems
 */
export declare class ParticleEmitter {
    private rapid;
    private particles;
    private options;
    private emitting;
    private emitTimer;
    private emitRate;
    private emitTime;
    private emitTimeCounter;
    localSpace: boolean;
    position: Vec2;
    /**
     * Creates a new particle emitter
     * @param rapid - The Rapid renderer instance
     * @param options - Emitter configuration options
     */
    constructor(rapid: Rapid, options: IParticleOptions);
    /**
     * Gets the transform options
     */
    getTransform(): ITransformOptions;
    /**
     * Sets particle emission rate.
     * In continuous mode (`emitTime`=0), this is particles per second.
     * In burst mode (`emitTime`>0), this is particles per burst.
     * @param rate - The emission rate.
     */
    setEmitRate(rate: number): void;
    /**
     * Sets time interval between emissions. Set to 0 for continuous emission.
     * @param time - Time interval in seconds
     */
    setEmitTime(time: number): void;
    /**
     * Starts emitting particles
     */
    start(): void;
    /**
     * Stops emitting new particles but allows existing ones to complete their lifecycle
     */
    stop(): void;
    /**
     * Clears all particles and resets the emitter
     */
    clear(): void;
    /**
     * Emits a specified number of particles immediately.
     * @param count - Number of particles to emit
     */
    emit(count: number): void;
    /**
     * Updates particle emitter state
     * @param deltaTime - Time in seconds since last update
     */
    update(deltaTime: number): void;
    /**
     * Renders all particles
     */
    render(): void;
    /**
     * Gets current particle count
     */
    getParticleCount(): number;
    /**
     * Checks if the particle emitter is active (has particles or is emitting)
     */
    isActive(): boolean;
    /**
     * Triggers a single burst of particles, regardless of whether the emitter is running.
     * The number of particles is determined by `emitRate`.
     */
    oneShot(): void;
}
