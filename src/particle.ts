import Rapid from "./render";
import { IParticleConfigOptions, ParticleShape, ITransformOptions, ParticleAttribute, ParticleAttributeTypes, ParticleAttributeData } from "./interface";
import { Color, Vec2, Random } from "./math";
import { Texture } from "./texture";
import { isPlainObject } from "./utils";
import { Component, GameObject, Game } from "./game";
import { CircleCollider, Collider } from "./collision";

// Define constants for magic numbers
const DEFAULT_EMIT_RATE = 10;
const DEFAULT_EMIT_TIME = 0;
const DEFAULT_LOCAL_SPACE = true;

/**
 * Represents a single particle's properties
 */
export class Particle {
    private life: number = 0;
    private maxLife: number;

    private texture!: Texture;
    private rapid: Rapid;
    private options: IParticleConfigOptions;
    private datas: Record<string, ParticleAttributeData<any>> = {};
    private emitter: ParticleEmitter

    position: Vec2;
    collider: Collider
    /**
     * Creates a new particle instance
     * @param rapid - The Rapid renderer instance
     * @param options - Particle configuration options
     */
    constructor(emitter: ParticleEmitter, options: IParticleConfigOptions) {
        this.emitter = emitter
        this.rapid = emitter.rapid;

        this.options = options;
        if (options.texture instanceof Texture) {
            this.texture = options.texture;
        } else if (options.texture instanceof Array && options.texture[0] instanceof Array) {
            this.texture = Random.pickWeight(options.texture as [Texture, number][]);
        } else if (options.texture instanceof Array) {
            this.texture = Random.pick(options.texture);
        }

        this.collider = new CircleCollider(emitter.entity, options.colliderRaduis ?? 10)
        this.collider.extraData = this
        this.maxLife = Random.scalarOrRange(options.life, 1);

        this.datas = {
            speed: this.processAttribute(options.animation.speed, 0)!,
            rotation: this.processAttribute(options.animation.rotation, 0)!,
            scale: this.processAttribute(options.animation.scale, 1)!,
            color: this.processAttribute(options.animation.color, Color.White)!,
            velocity: this.processAttribute(options.animation.velocity, Vec2.ZERO)!,
            acceleration: this.processAttribute(options.animation.acceleration, Vec2.ZERO)!,
        };

        this.position = Vec2.ZERO;

        this.initializePosition();
    }

    private processAttribute<T extends ParticleAttributeTypes>(attribute: ParticleAttribute<T> | undefined | ParticleAttributeTypes, defaultData: T): ParticleAttributeData<T> {
        if (!attribute) return { value: defaultData };
        if (isPlainObject(attribute)) {
            const attr = attribute as ParticleAttribute<T>;
            const start = Random.scalarOrRange(attr.start, defaultData);
            const end = Random.scalarOrRange(attr.end || start, defaultData);
            return {
                delta: attr.delta ?? this.getDelta(start, end, this.maxLife),
                value: start,
                damping: attr.damping
            };
        } else {
            return this.processAttribute({ start: attribute as T }, defaultData);
        }
    }

    private updateDamping(deltaTime: number) {
        for (const att of Object.values(this.datas)) {
            if (att.damping) {
                const value = att.value;
                const timeBasedDamping = Math.pow(att.damping, deltaTime);

                if (typeof value === 'number') {
                    att.value *= timeBasedDamping;
                } else if (value.multiply) { // Duck-typing for Vec2 and Color
                    att.value = value.multiply(timeBasedDamping);
                }
            }
        }
    }

    private updateDelta(deltaTime: number) {
        const datas = this.datas;

        for (const att of Object.values(datas)) {
            if (att.delta) {
                const value = att.value;

                if (typeof value === 'number') {
                    att.value += deltaTime * att.delta;
                } else if (value.add) { // Duck-typing for Vec2 and Color
                    att.value = value.add(att.delta.multiply(deltaTime));
                }
            }
        }

        datas.color.value.clamp();
        datas.velocity.value = datas.velocity.value.add(datas.acceleration.value.multiply(deltaTime));
        const direction = Vec2.fromAngle(datas.rotation.value);
        const speedOffset = direction.multiply(datas.speed.value * deltaTime);
        this.position = this.position.add(speedOffset).add(datas.velocity.value.multiply(deltaTime));
    }

    private getDelta<T extends ParticleAttributeTypes>(start: T, end: T, lifeTime: number): T {
        if (lifeTime === 0) return start as T; // Avoid division by zero
        if (typeof start === 'number' && typeof end === 'number') {
            return ((end - start) / lifeTime) as T;
        } else if ((start instanceof Vec2 && end instanceof Vec2)) {
            return end.subtract(start).divide(lifeTime) as T;
        } else if (start instanceof Color && end instanceof Color) {
            return end.subtract(start).divide(lifeTime) as T;
        }
        return start as T;
    }

    updateOffset() {
        if (this.options.localSpace) {
            this.collider.offset = this.position
        } else {
            const entityGlobalPos = this.emitter.entity.transform.getGlobalPosition()
            this.collider.offset = entityGlobalPos.subtract(this.position)
        }
    }

    /**
     * Updates particle state
     * @param deltaTime - Time in seconds since last update
     * @returns Whether the particle is still active
     */
    update(deltaTime: number): boolean {
        this.life += deltaTime;
        if (this.life >= this.maxLife) {
            return false;
        }
        this.updateDamping(deltaTime);
        this.updateDelta(deltaTime);

        return true;
    }

    /**
     * Renders the particle at a given position.
     */
    render() {
        this.rapid.renderSprite({
            ...this.options,
            position: this.position,
            scale: this.datas.scale.value,
            rotation: this.datas.rotation.value,
            color: this.datas.color.value,
            texture: this.texture,
        });
    }

    private initializePosition() {
        switch (this.options.emitShape) {
            case ParticleShape.POINT:
                this.position = Vec2.ZERO;
                break;
            case ParticleShape.CIRCLE:
                const angle = Math.random() * Math.PI * 2;
                const radius = (this.options.emitRadius || 0) * Math.sqrt(Math.random());
                this.position = new Vec2(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius
                );
                break;
            case ParticleShape.RECT:
                this.position = new Vec2(
                    (Math.random() - 0.5) * (this.options.emitRect?.width || 0),
                    (Math.random() - 0.5) * (this.options.emitRect?.height || 0)
                );
                break;
            default:
                break;
        }

        if (!this.options.localSpace) {
            this.position.addSelf(this.emitter.entity.transform.getGlobalPosition())
        }
    }
}

/**
 * Particle emitter for creating and managing particle systems
 */
export class ParticleEmitter extends Component {
    particles: Particle[] = [];
    declare options: IParticleConfigOptions;
    private emitting: boolean = false;
    private emitTimer: number = 0;
    private emitRate: number = DEFAULT_EMIT_RATE; // In continuous mode: particles/sec. In burst mode: particles/burst.
    private emitTime: number = DEFAULT_EMIT_TIME;  // Time interval between emissions (0 for continuous)
    private emitTimeCounter: number = 0;
    localSpace: boolean = DEFAULT_LOCAL_SPACE;

    /**
     * Creates a new particle emitter
     * @param rapid - The Rapid renderer instance
     * @param options - Emitter configuration options
     */
    constructor(options: IParticleConfigOptions) {
        super(options)
        this.emitRate = options.emitRate ?? DEFAULT_EMIT_RATE;
        this.emitTime = options.emitTime ?? DEFAULT_EMIT_TIME;
        this.localSpace = options.localSpace ?? DEFAULT_LOCAL_SPACE;
    }

    /**
     * Sets particle emission rate.
     * In continuous mode (`emitTime`=0), this is particles per second.
     * In burst mode (`emitTime`>0), this is particles per burst.
     * @param rate - The emission rate.
     */
    setEmitRate(rate: number) {
        this.emitRate = rate;
    }

    /**
     * Sets time interval between emissions. Set to 0 for continuous emission.
     * @param time - Time interval in seconds
     */
    setEmitTime(time: number) {
        this.emitTime = time;
    }

    /**
     * Starts emitting particles
     */
    start() {
        this.emitting = true;
        this.emitTimer = 0;
        this.emitTimeCounter = 0;
    }

    /**
     * Stops emitting new particles but allows existing ones to complete their lifecycle
     */
    stop() {
        this.emitting = false;
    }

    /**
     * Clears all particles and resets the emitter
     */
    clear() {
        this.particles = [];
        this.emitTimer = 0;
        this.emitTimeCounter = 0;
    }

    /**
     * Emits a specified number of particles immediately.
     * @param count - Number of particles to emit
     */
    emit(count: number) {
        const entity = this.entity
        const actualCount = Math.floor(Math.min(count, (this.options.maxParticles || Infinity) - this.particles.length));

        for (let i = 0; i < actualCount; i++) {
            //const position = this.localSpace ? Vec2.ZERO : entity.transform.getGlobalPosition()
            const particle = new Particle(this, { ...this.options, localSpace: this.localSpace });
            this.particles.unshift(particle);
        }
    }

    /**
     * Updates particle emitter state
     * @param deltaTime - Time in seconds since last update
     */
    override onUpdate(deltaTime: number) {
        if (this.emitting && this.emitRate > 0) {
            if (this.emitTime > 0) {
                // Burst emission logic
                this.emitTimeCounter += deltaTime;
                while (this.emitTimeCounter >= this.emitTime) {
                    this.emit(this.emitRate); // Emit a burst
                    this.emitTimeCounter -= this.emitTime;
                }
            } else {
                // Continuous emission logic
                this.emitTimer += deltaTime;
                const timePerParticle = 1 / this.emitRate;
                while (this.emitTimer >= timePerParticle) {
                    this.emit(1);
                    this.emitTimer -= timePerParticle;
                }
            }
        }

        // Update existing particles and remove dead ones
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(deltaTime)) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Renders all particles
     */
    override onRender() {
        this.rapid.save()
        if (!this.localSpace) {
            const worldTransform = this.game.worldTransform;
            this.rapid.matrixStack.setTransform(worldTransform.getTransform())
        }
        for (const particle of this.particles) {
            particle.render();
        }
        this.rapid.restore()
    }

    /**
     * Gets current particle count
     */
    getParticleCount(): number {
        return this.particles.length;
    }

    /**
     * Checks if the particle emitter is active (has particles or is emitting)
     */
    isActive(): boolean {
        return this.emitting || this.particles.length > 0;
    }

    /**
     * Triggers a single burst of particles, regardless of whether the emitter is running.
     * The number of particles is determined by `emitRate`.
     */
    oneShot() {
        this.emit(this.emitRate);
    }
}
