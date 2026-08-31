import { Color } from "./color";
import { Vec2 } from "./math";
import { Rapid } from "./render";
import { Texture } from "./texture";
import { isPlainObject, Random } from "./utils";
import { ArrayType, DynamicArrayBuffer } from "./buffer";
import { CustomGlShader } from "./webgl/glshader";

/**
 * Describes an animated attribute: it transitions from `start` to `end`
 * over the particle's lifetime, optionally with a per-second damping factor.
 */
export interface ParticleAttribute<T = number> {
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
export interface ParticleAttributeData<T = number> {
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
    /** Additive velocity vector (pixels/sec). Use `velocity.delta` to simulate constant acceleration (e.g. gravity). */
    velocity?: ParticleAttribute<Vec2> | Vec2;
}

export interface IParticleOptions {
    /** Texture(s) to pick from. Pass a weighted tuple `[Texture, weight][]` for weighted random. */
    texture: Texture;
    shader: CustomGlShader
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

    origin?: Vec2;
}

const DEFAULT_EMIT_RATE = 10;
const DEFAULT_EMIT_TIME = 0;
const DEFAULT_LOCAL_SPACE = true;

type ParticleAttributeValue = number | Vec2 | Color;

class ParticleAttributeStore {
    readonly components: {
        value: DynamicArrayBuffer;
        delta: DynamicArrayBuffer;
        damping: DynamicArrayBuffer;
    }[];

    constructor(size: number = 1) {
        if (!Number.isInteger(size) || size <= 0) {
            throw new RangeError("ParticleAttributeStore size must be a positive integer");
        }

        this.components = Array.from({ length: size }, () => ({
            value: new DynamicArrayBuffer(ArrayType.Float32),
            delta: new DynamicArrayBuffer(ArrayType.Float32),
            damping: new DynamicArrayBuffer(ArrayType.Float32),
        }));
    }

    getArrayBuffer(): DynamicArrayBuffer[] {
        return this.components.flatMap(({ value, delta, damping }) => [value, delta, damping]);
    }

    update(deltaTime: number): void {
        for (const { value, delta, damping } of this.components) {
            for (let index = 0; index < value.usedElemNum; index++) {
                value.typedArray[index] *= Math.pow(damping.get(index), deltaTime);
                value.typedArray[index] += delta.get(index) * deltaTime;
            }
        }
    }

    get(particleIndex: number, componentIndex: number = 0): number {
        return this.components[componentIndex].value.get(particleIndex);
    }

    private getComponent(value: ParticleAttributeValue, index: number): number {
        if (typeof value === "number") {
            return value;
        }
        if (value instanceof Vec2) {
            return index === 0 ? value.x : value.y;
        }

        switch (index) {
            case 0: return value.r;
            case 1: return value.g;
            case 2: return value.b;
            case 3: return value.a;
            default: return 0;
        }
    }

    private resolveComponent(
        value: ParticleAttributeValue | [ParticleAttributeValue, ParticleAttributeValue] | undefined,
        index: number,
        defaultValue: number,
    ): number {
        if (value === undefined) {
            return defaultValue;
        }
        if (Array.isArray(value)) {
            return Random.float(
                this.getComponent(value[0], index),
                this.getComponent(value[1], index),
            );
        }
        return this.getComponent(value, index);
    }

    create<T extends ParticleAttributeValue>(
        attribute: ParticleAttribute<T> | T | undefined,
        defaultData: T,
        lifeTime: number = 1,
    ): number {
        const attr = isPlainObject(attribute)
            ? attribute as ParticleAttribute<T>
            : undefined;
        const fixedValue = attr === undefined ? attribute as T | undefined : undefined;
        const duration = lifeTime > 0 ? lifeTime : 1;
        let firstValue = 0;

        for (let index = 0; index < this.components.length; index++) {
            const { value, delta, damping } = this.components[index];
            const componentDefault = this.getComponent(defaultData, index);
            const start = fixedValue === undefined
                ? this.resolveComponent(attr?.start, index, componentDefault)
                : this.getComponent(fixedValue, index);
            const end = attr?.end === undefined
                ? start
                : this.resolveComponent(attr.end, index, componentDefault);

            value.push(start);
            delta.push(attr?.delta === undefined
                ? (end - start) / duration
                : this.getComponent(attr.delta, index));
            damping.push(attr?.damping ?? 1);

            if (index === 0) firstValue = start;
        }

        return firstValue;
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
    private options: IParticleOptions;
    private emitting: boolean = false;
    private emitTimer: number = 0;
    private emitRate: number = DEFAULT_EMIT_RATE;
    private emitTime: number = DEFAULT_EMIT_TIME;
    private emitTimeCounter: number = 0;

    /** Whether spawned particles are positioned in local emitter space (default: true). */
    localSpace: boolean = DEFAULT_LOCAL_SPACE;

    private rapid: Rapid;

    x = new DynamicArrayBuffer(ArrayType.Float32)
    y = new DynamicArrayBuffer(ArrayType.Float32)
    scaleX = new DynamicArrayBuffer(ArrayType.Float32)
    scaleY = new DynamicArrayBuffer(ArrayType.Float32)
    rotation = new DynamicArrayBuffer(ArrayType.Float32)
    color = new DynamicArrayBuffer(ArrayType.Uint32)

    animations = {
        speed: new ParticleAttributeStore(),
        rotation: new ParticleAttributeStore(),
        scale: new ParticleAttributeStore(),
        color: new ParticleAttributeStore(4),
        velocity: new ParticleAttributeStore(2),
    }
    count: number = 0

    /**
     * Creates a new particle emitter.
     * @param rapid   - The Rapid renderer instance
     * @param options - Emitter configuration options
     */
    constructor(rapid: Rapid, options: IParticleOptions) {
        this.rapid = rapid;
        this.options = options;
        this.emitRate = options.emitRate !== undefined ? options.emitRate : DEFAULT_EMIT_RATE;
        this.emitTime = options.emitTime !== undefined ? options.emitTime : DEFAULT_EMIT_TIME;
        this.localSpace = options.localSpace !== undefined ? options.localSpace : DEFAULT_LOCAL_SPACE;
    }

    getAllArrayBuffer(): DynamicArrayBuffer[] {
        return [
            this.x,
            this.y,
            this.scaleX,
            this.scaleY,
            this.rotation,
            this.color,
            ...Object.values(this.animations).flatMap(v => v.getArrayBuffer())
        ]
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
        this.emitting = true;
        this.emitTimeCounter = 0;
    }

    /** Stops new particle emission; existing particles finish their lifecycle. */
    stop() {
        this.emitting = false;
    }

    /** Removes all particles and resets timers. */
    clear() {
        for (const data of this.getAllArrayBuffer()) {
            data.clear()
        }
        this.count = 0
        this.emitTimeCounter = 0;
    }

    /**
     * Spawns `count` particles immediately.
     * Respects `maxParticles` if set.
     */
    emit(count: number) {
        const max = this.options.maxParticles ?? Infinity;
        const actual = Math.min(count, max - this.count);
        for (let i = 0; i < actual; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const lifeTime = Random.scalarOrRange(this.options.life, 1)
        switch (this.options.emitShape) {
            case ParticleShape.CIRCLE: {
                const angle = Math.random() * Math.PI * 2;
                const radius = (this.options.emitRadius ?? 0) * Math.sqrt(Math.random());
                this.x.push(Math.cos(angle) * radius)
                this.y.push(Math.sin(angle) * radius)
                break;
            }
            case ParticleShape.RECT: {
                this.x.push((Math.random() - 0.5) * (this.options.emitRect?.width ?? 0))
                this.y.push((Math.random() - 0.5) * (this.options.emitRect?.height ?? 0))
                break;
            }
            case ParticleShape.POINT:
            default:
                this.x.push(0)
                this.y.push(0)
                break;
        }

        const animation = this.options.animation
        const particleAttribute = this.animations

        const s = particleAttribute.scale.create(animation.scale, 1, lifeTime)
        const r = particleAttribute.rotation.create(animation.rotation, 0, lifeTime)
        particleAttribute.speed.create(animation.speed, 0, lifeTime)

        particleAttribute.velocity.create(animation.velocity, Vec2.ZERO, lifeTime)
        particleAttribute.color.create(animation.color, Color.White, lifeTime)

        this.rotation.push(r)
        this.scaleX.push(s)
        this.scaleY.push(s)
        this.color.pushUint32(Color.packColor(
            particleAttribute.color.get(this.count, 0),
            particleAttribute.color.get(this.count, 1),
            particleAttribute.color.get(this.count, 2),
            particleAttribute.color.get(this.count, 3),
            this.rapid.premultipliedAlpha,
        ))

        this.count += 1
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

        const removeIndex = this.updateParticle(deltaTime)
        this.count -= removeIndex.length
        DynamicArrayBuffer.removeAtIndices(removeIndex, this.getAllArrayBuffer())
    }

    updateParticle(deltaTime: number) {
        const removeIndex: number[] = []
        const ani = this.animations

        Object.values(ani).forEach(a => a.update(deltaTime))
        for (let index = 0; index < this.count; index++) {
            const rotation = ani.rotation.get(index);
            const scale = ani.scale.get(index);
            const speed = ani.speed.get(index);

            this.rotation.typedArray[index] = rotation;
            this.scaleX.typedArray[index] = scale;
            this.scaleY.typedArray[index] = scale;
            this.color.uint32![index] = Color.packColor(
                ani.color.get(index, 0),
                ani.color.get(index, 1),
                ani.color.get(index, 2),
                ani.color.get(index, 3),
                this.rapid.premultipliedAlpha,
            );

            this.x.typedArray[index] += (speed * Math.cos(rotation) + ani.velocity.get(index, 0)) * deltaTime
            this.y.typedArray[index] += (speed * Math.sin(rotation) + ani.velocity.get(index, 1)) * deltaTime
        }

        return removeIndex
    }

    /**
     * Renders all live particles.
     * In local-space mode the emitter's own transform is applied around the batch.
     */
    render() {
        const options = this.options
        this.rapid.drawParticles({
            texture: options.texture,
            shader: options.shader,

            x: this.x.typedArray,
            y: this.y.typedArray,
            scaleX: this.scaleX.typedArray,
            scaleY: this.scaleY.typedArray,
            rotation: this.rotation.typedArray,
            color: this.color.typedArray,
            count: this.count,
            reverseOrder: true,

            originX: options.origin?.x ?? 0.5,
            originY: options.origin?.y ?? 0.5,
        })
    }

    /** Returns `true` if the emitter is running or still has live particles. */
    isActive(): boolean {
        return this.emitting || this.count > 0;
    }

    /**
     * Convenience: emit `emitRate` particles in one shot (fire-and-forget burst).
     */
    oneShot() {
        this.emit(this.emitRate);
    }
}
