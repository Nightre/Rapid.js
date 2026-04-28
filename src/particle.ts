import { Color } from "./color";
import { Vec2 } from "./math";
import { Rapid } from "./render";
import { Texture } from "./texture";
import { isPlainObject, Random } from "./utils";

export type ParticleAttributeTypes = number | Vec2 | Color;

/**
 * Describes an animated attribute: it transitions from `start` to `end`
 * over the particle's lifetime, optionally with a per-second damping factor.
 */
export interface ParticleAttribute<T extends ParticleAttributeTypes> {
    /** Starting value (scalar, range tuple, or fixed value). */
    start?: T | [T, T];
    /** Ending value. Defaults to `start` if omitted (no change over time). */
    end?: T | [T, T];
    /**
     * Multiplicative damping applied each second.
     * e.g. 0.9 means the value is multiplied by 0.9^deltaTime every frame.
     */
    damping?: number;
    /**
     * Explicit per-second delta override. If omitted it is derived from
     * start/end/lifetime automatically.
     */
    delta?: T;
}

/** Internal resolved state of one animated attribute. */
export interface ParticleAttributeData<T extends ParticleAttributeTypes> {
    value: T;
    delta?: T;
    damping?: number;
}

export enum ParticleShape {
    POINT = "point",
    CIRCLE = "circle",
    RECT = "rect",
}

export interface IParticleAnimation {
    /** Directional speed along the rotation axis (pixels/sec). */
    speed?: ParticleAttribute<number> | number;
    /** Rotation angle in radians. */
    rotation?: ParticleAttribute<number> | number;
    /** Uniform scale. */
    scale?: ParticleAttribute<number> | number;
    /** Tint color (0-255 components, uses engine Color class). */
    color?: ParticleAttribute<Color> | Color;
    /** Additive velocity vector (pixels/sec). */
    velocity?: ParticleAttribute<Vec2> | Vec2;
    /** Acceleration vector added to velocity each second (pixels/sec²). */
    acceleration?: ParticleAttribute<Vec2> | Vec2;
}

export interface IParticleOptions {
    /** Texture(s) to pick from. Pass a weighted tuple `[Texture, weight][]` for weighted random. */
    texture: Texture | Texture[] | [Texture, number][];
    /** Particle lifetime in seconds, or a [min, max] range. */
    life: number | [number, number];
    /** Animation / per-attribute configuration. */
    animation: IParticleAnimation;
    /** Emit shape. */
    emitShape?: ParticleShape;
    /** Radius used when emitShape === CIRCLE. */
    emitRadius?: number;
    /** Dimensions used when emitShape === RECT. */
    emitRect?: { width: number; height: number };
    /** Maximum simultaneous particles (default: unlimited). */
    maxParticles?: number;
    /** Particles emitted per second (continuous) or per interval (when emitTime > 0). */
    emitRate?: number;
    /**
     * If > 0, particles are emitted in bursts every `emitTime` seconds
     * rather than continuously.
     */
    emitTime?: number;
    /** Whether particles are positioned relative to the emitter (default: true). */
    localSpace?: boolean;
    /** World-space position of the emitter (used when localSpace is false). */
    position?: Vec2;
}

const DEFAULT_EMIT_RATE = 10;
const DEFAULT_EMIT_TIME = 0;
const DEFAULT_LOCAL_SPACE = true;

export class Particle {
    private life: number = 0;
    private maxLife: number;

    private texture!: Texture;
    private options: IParticleOptions;
    private position: Vec2;
    private datas: Record<string, ParticleAttributeData<any>> = {};

    private rapid: Rapid;

    constructor(rapid: Rapid, options: IParticleOptions) {
        this.rapid = rapid;
        this.options = options;

        if (options.texture instanceof Texture) {
            this.texture = options.texture;
        } else if (
            options.texture instanceof Array &&
            options.texture[0] instanceof Array
        ) {
            this.texture = Random.pickWeight(options.texture as [Texture, number][]);
        } else if (options.texture instanceof Array) {
            this.texture = Random.pick(options.texture as Texture[]);
        }

        this.maxLife = Random.scalarOrRange(options.life as any, 1) as number;

        this.datas = {
            speed:        this.processAttribute(options.animation.speed,        0)!,
            rotation:     this.processAttribute(options.animation.rotation,     0)!,
            scale:        this.processAttribute(options.animation.scale,        1)!,
            color:        this.processAttribute(options.animation.color,        Color.White.clone())!,
            velocity:     this.processAttribute(options.animation.velocity,     Vec2.ZERO)!,
            acceleration: this.processAttribute(options.animation.acceleration, Vec2.ZERO)!,
        };

        this.position = Vec2.ZERO;
        this.initializePosition();
    }

    private processAttribute<T extends ParticleAttributeTypes>(
        attribute: ParticleAttribute<T> | T | undefined,
        defaultData: T,
    ): ParticleAttributeData<T> {
        if (attribute === undefined || attribute === null) {
            return { value: defaultData };
        }
        if (isPlainObject(attribute)) {
            const attr = attribute as ParticleAttribute<T>;
            const start = Random.scalarOrRange(attr.start, defaultData) as T;
            const end   = Random.scalarOrRange(attr.end ?? attr.start, defaultData) as T;
            return {
                delta:   attr.delta ?? this.getDelta(start, end, this.maxLife),
                value:   start,
                damping: attr.damping,
            };
        } else {
            return this.processAttribute({ start: attribute as T }, defaultData);
        }
    }

    private updateDamping(deltaTime: number) {
        for (const att of Object.values(this.datas)) {
            if (att.damping !== undefined) {
                const timeBasedDamping = Math.pow(att.damping, deltaTime);
                if (typeof att.value === "number") {
                    att.value *= timeBasedDamping;
                } else {
                    att.value = (att.value as Vec2 | Color).multiply(timeBasedDamping);
                }
            }
        }
    }

    private updateDelta(deltaTime: number) {
        const datas = this.datas;

        for (const att of Object.values(datas)) {
            if (att.delta !== undefined) {
                if (typeof att.value === "number") {
                    att.value += deltaTime * (att.delta as number);
                } else {
                    att.value = (att.value as Vec2 | Color).add(
                        (att.delta as Vec2 | Color).multiply(deltaTime) as any,
                    );
                }
            }
        }

        (datas.color.value as Color).clamp();

        // acceleration → velocity → position
        datas.velocity.value = (datas.velocity.value as Vec2).add(
            (datas.acceleration.value as Vec2).multiply(deltaTime) as any
        );
        const direction   = Vec2.fromAngle(datas.rotation.value as number);
        const speedOffset = direction.multiply((datas.speed.value as number) * deltaTime);
        this.position = this.position
            .add(speedOffset)
            .add((datas.velocity.value as Vec2).multiply(deltaTime));
    }

    private getDelta<T extends ParticleAttributeTypes>(start: T, end: T, lifeTime: number): T {
        if (typeof start === "number" && typeof end === "number") {
            return ((end - start) / lifeTime) as T;
        } else if (start instanceof Vec2 && end instanceof Vec2) {
            return end.subtract(start).divide(lifeTime) as T;
        } else if (start instanceof Color && end instanceof Color) {
            return end.subtract(start).divide(lifeTime) as T;
        }
        return start as T;
    }

    /**
     * Updates particle state.
     * @param deltaTime - Seconds elapsed since last frame
     * @returns `true` while the particle is alive, `false` when it should be removed
     */
    update(deltaTime: number): boolean {
        this.life += deltaTime;
        if (this.life >= this.maxLife) return false;
        this.updateDamping(deltaTime);
        this.updateDelta(deltaTime);
        return true;
    }

    /**
     * Renders the particle using the Rapid engine's matrixStack + drawSprite.
     * The emitter is responsible for calling save/restore around a batch of particles.
     */
    render() {
        const ms    = this.rapid.matrixStack;
        const scale = this.datas.scale.value as number;
        const rot   = this.datas.rotation.value as number;
        const color = this.datas.color.value as Color;

        ms.save();
        ms.translate(this.position.x, this.position.y);
        if (rot !== 0) ms.rotate(rot);
        if (scale !== 1) ms.scale(scale, scale);

        this.rapid.drawSprite(this.texture, color);

        ms.restore();
    }

    private initializePosition() {
        switch (this.options.emitShape) {
            case ParticleShape.CIRCLE: {
                const angle  = Math.random() * Math.PI * 2;
                const radius = (this.options.emitRadius ?? 0) * Math.sqrt(Math.random());
                this.position = new Vec2(Math.cos(angle) * radius, Math.sin(angle) * radius);
                break;
            }
            case ParticleShape.RECT: {
                this.position = new Vec2(
                    (Math.random() - 0.5) * (this.options.emitRect?.width  ?? 0),
                    (Math.random() - 0.5) * (this.options.emitRect?.height ?? 0),
                );
                break;
            }
            case ParticleShape.POINT:
            default:
                this.position = Vec2.ZERO;
                break;
        }

        // In world-space mode offset by emitter position at spawn time
        if (!this.options.localSpace && this.options.position) {
            this.position = this.position.add(this.options.position);
        }
    }
}

/**
 * Creates and manages a pool of Particle instances.
 *
 * @example
 * ```ts
 * const emitter = new ParticleEmitter(rapid, { ... });
 * emitter.start();
 *
 * // inside your game loop:
 * emitter.update(dt);
 * emitter.render();
 * ```
 */
export class ParticleEmitter {
    private particles: Particle[] = [];
    private options: IParticleOptions;
    private emitting: boolean = false;
    private emitTimer: number = 0;
    private emitRate: number = DEFAULT_EMIT_RATE;
    private emitTime: number = DEFAULT_EMIT_TIME;
    private emitTimeCounter: number = 0;

    /** Whether spawned particles are positioned in local emitter space (default: true). */
    localSpace: boolean = DEFAULT_LOCAL_SPACE;
    /** World position of the emitter. Used for both local-space transform and world-space spawn offset. */
    position: Vec2 = Vec2.ZERO;

    private rapid: Rapid;

    /**
     * Creates a new particle emitter.
     * @param rapid   - The Rapid renderer instance
     * @param options - Emitter configuration options
     */
    constructor(rapid: Rapid, options: IParticleOptions) {
        this.rapid    = rapid;
        this.options  = options;
        this.emitRate = options.emitRate  !== undefined ? options.emitRate  : DEFAULT_EMIT_RATE;
        this.emitTime = options.emitTime  !== undefined ? options.emitTime  : DEFAULT_EMIT_TIME;
        this.localSpace = options.localSpace !== undefined ? options.localSpace : DEFAULT_LOCAL_SPACE;
        this.position = options.position ?? Vec2.ZERO;
    }

    /** Replaces the emitter's texture at runtime. */
    setTexture(texture: Texture) {
        this.options.texture = texture;
    }

    /**
     * Creates a new emitter sharing the same options object.
     * Particle state is NOT copied.
     */
    clone(): ParticleEmitter {
        return new ParticleEmitter(this.rapid, { ...this.options });
    }

    /** Sets particles-per-second emission rate (continuous mode). */
    setEmitRate(rate: number) {
        this.emitRate = rate;
    }

    /** Sets the burst interval in seconds (0 = continuous). */
    setEmitTime(time: number) {
        this.emitTime = time;
    }

    /** Starts continuous particle emission. */
    start() {
        this.emitting       = true;
        this.emitTimeCounter = 0;
    }

    /** Stops new particle emission; existing particles finish their lifecycle. */
    stop() {
        this.emitting = false;
    }

    /** Removes all particles and resets timers. */
    clear() {
        this.particles       = [];
        this.emitTimeCounter = 0;
    }

    /**
     * Spawns `count` particles immediately.
     * Respects `maxParticles` if set.
     */
    emit(count: number) {
        const max    = this.options.maxParticles ?? Infinity;
        const actual = Math.min(count, max - this.particles.length);
        for (let i = 0; i < actual; i++) {
            this.particles.push(new Particle(this.rapid, { ...this.options }));
        }
    }

    /**
     * Updates the emitter and all live particles.
     * @param deltaTime - Seconds elapsed since last frame
     */
    update(deltaTime: number) {
        if (this.emitting && this.emitRate > 0) {
            if (this.emitTime > 0) {
                // Burst Mode
                this.emitTimeCounter += deltaTime;
                if (this.emitTimeCounter >= this.emitTime) {
                    const intervals = Math.floor(this.emitTimeCounter / this.emitTime);
                    this.emit(this.emitRate * intervals);
                    this.emitTimeCounter -= intervals * this.emitTime;
                }
            } else {
                // Continuous mode
                this.emitTimer += deltaTime;
                const count = Math.floor(this.emitTimer * this.emitRate);
                if (count > 0) {
                    this.emit(count);
                    this.emitTimer -= count / this.emitRate;
                }
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(deltaTime)) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Renders all live particles.
     * In local-space mode the emitter's own transform is applied around the batch.
     */
    render() {
        const ms = this.rapid.matrixStack;

        if (this.localSpace) {
            ms.save();
            ms.translate(this.position.x, this.position.y);
        }

        for (const particle of this.particles) {
            particle.render();
        }

        if (this.localSpace) {
            ms.restore();
        }
    }

    /** Returns the current number of live particles. */
    getParticleCount(): number {
        return this.particles.length;
    }

    /** Returns `true` if the emitter is running or still has live particles. */
    isActive(): boolean {
        return this.emitting || this.particles.length > 0;
    }

    /**
     * Convenience: emit `emitRate` particles in one shot (fire-and-forget burst).
     */
    oneShot() {
        this.emit(this.emitRate);
    }
}