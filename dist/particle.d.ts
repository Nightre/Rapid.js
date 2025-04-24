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
     * Sets particle emission rate
     * @param rate - Particles per second
     */
    setEmitRate(rate: number): void;
    /**
     * Sets time interval between emissions
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
     * Emits specified number of particles
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
    oneShot(): void;
}
