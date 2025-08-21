import { IParticleConfigOptions } from './interface';
import { Vec2 } from './math';
import { Component } from './game';
import { Collider } from './collision';
/**
 * Represents a single particle's properties
 */
export declare class Particle {
    private life;
    private maxLife;
    private texture;
    private rapid;
    private options;
    private datas;
    private emitter;
    position: Vec2;
    collider: Collider;
    /**
     * Creates a new particle instance
     * @param rapid - The Rapid renderer instance
     * @param options - Particle configuration options
     */
    constructor(emitter: ParticleEmitter, options: IParticleConfigOptions);
    private processAttribute;
    private updateDamping;
    private updateDelta;
    private getDelta;
    updateOffset(): void;
    /**
     * Updates particle state
     * @param deltaTime - Time in seconds since last update
     * @returns Whether the particle is still active
     */
    update(deltaTime: number): boolean;
    /**
     * Renders the particle at a given position.
     */
    render(): void;
    private initializePosition;
}
/**
 * Particle emitter for creating and managing particle systems
 */
export declare class ParticleEmitter extends Component {
    particles: Particle[];
    options: IParticleConfigOptions;
    private emitting;
    private emitTimer;
    private emitRate;
    private emitTime;
    private emitTimeCounter;
    localSpace: boolean;
    /**
     * Creates a new particle emitter
     * @param rapid - The Rapid renderer instance
     * @param options - Emitter configuration options
     */
    constructor(options: IParticleConfigOptions);
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
    onUpdate(deltaTime: number): void;
    /**
     * Renders all particles
     */
    onRender(): void;
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
