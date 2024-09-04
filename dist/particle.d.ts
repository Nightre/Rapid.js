import { EmitterOptions, ParticleOptions } from "./interface";
export declare class Particle {
    options: Required<ParticleOptions>;
    constructor(options: ParticleOptions);
    update(deltaTime: number): void;
    isAlive(): boolean;
}
export declare class ParticleEmitter {
    particles: Particle[];
    options: EmitterOptions;
    emissionTimer: number;
    constructor(options: EmitterOptions);
    update(deltaTime: number): void;
}
