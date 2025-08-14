import EventEmitter from 'eventemitter3';
import { IMathObject } from './interface';

interface TweenrEvents {
  complete: () => void;
}

/**
 * Manages the interpolation of a property on a target object over a specific duration.
 * @template T - The type of the value being tweened (e.g., number, Vec2, Color).
 */
export class Tween<T extends IMathObject<T> | number> extends EventEmitter<TweenrEvents> {
    private target: any;
    private property: string;
    private to: T;
    private from!: T;
    private duration: number;
    private easing: EasingFunction;

    private elapsed: number = 0;

    public isRunning: boolean = false;
    public isFinished: boolean = false;

    /**
     * Creates an instance of Tween.
     * @param target - The object whose property will be animated.
     * @param property - The name of the property to animate.
     * @param to - The target value of the property.
     * @param duration - The duration of the animation in seconds.
     * @param easing - The easing function to use for the animation.
     */
    constructor(target: any, property: string, to: T, duration: number, easing: EasingFunction) {
        super()
        this.target = target;
        this.property = property;
        this.to = to;
        this.duration = duration;
        this.easing = easing;
    }

    /**
     * Starts the tween animation.
     * It captures the initial state of the property.
     */
    public start(): void {
        const initialValue = this.target[this.property];
        if (typeof initialValue === 'number') {
            this.from = initialValue as T;
        } else if (typeof initialValue.clone === 'function') {
            this.from = initialValue.clone();
        } else {
            console.error("Tween target property is not a 'number' or does not have a 'clone' method.");
            this.isFinished = true;
            return;
        }

        this.elapsed = 0;
        this.isRunning = true;
        this.isFinished = false;
    }

    /**
     * Updates the tween's state. This should be called every frame.
     * @param deltaTime - The time elapsed since the last frame, in seconds.
     */
    public update(deltaTime: number): void {
        if (!this.isRunning || this.isFinished) {
            return;
        }

        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);
        const easedProgress = this.easing(progress);

        let currentValue: IMathObject<T> | number;

        // Type guard to handle numbers and IMathObject types differently
        if (typeof this.from === 'number' && typeof this.to === 'number') {
            currentValue = (this.from + (this.to - this.from) * easedProgress);
        } else {
            const from = this.from as IMathObject<T>;
            const to = this.to as IMathObject<T>;
            // Linear interpolation: from + (to - from) * progress
            const range = to.subtract(from);
            const step = range.multiply(easedProgress);
            currentValue = (from as IMathObject<T>).add(step);
        }

        this.target[this.property] = currentValue;


        if (progress >= 1) {
            this.isFinished = true;
            this.isRunning = false;
            // Ensure the final value is set precisely
            this.target[this.property] = this.to;
            this.emit("complete")
        }
    }
}

export const isPlainObject = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.getPrototypeOf(obj) === Object.prototype;
}

/**
 * A type definition for an easing function.
 * It takes a progress ratio (0 to 1) and returns a modified ratio.
 * @param t - The linear progress of the animation, from 0 to 1.
 * @returns The eased progress, typically also from 0 to 1.
 */
export type EasingFunction = (t: number) => number;

/**
 * A collection of common easing functions for tweening.
 * Reference: https://easings.net/
 */
export class Easing {
    public static Linear: EasingFunction = (t) => t;
    public static EaseInQuad: EasingFunction = (t) => t * t;
    public static EaseOutQuad: EasingFunction = (t) => t * (2 - t);
    public static EaseInOutQuad: EasingFunction = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    public static EaseInCubic: EasingFunction = (t) => t * t * t;
    public static EaseOutCubic: EasingFunction = (t) => (--t) * t * t + 1;
    public static EaseInOutCubic: EasingFunction = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    public static EaseInQuart: EasingFunction = (t) => t * t * t * t;
    public static EaseOutQuart: EasingFunction = (t) => 1 - (--t) * t * t * t;
    public static EaseInOutQuart: EasingFunction = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
}

interface TimerEvents {
    timeout: () => void;
}
/**
 * Represents a timer that executes a callback after a specified duration.
 * The timer can be set to repeat. It is managed and updated by the Game's main loop.
 */
export class Timer extends EventEmitter<TimerEvents> {
    private duration: number;
    private repeat: boolean;

    private elapsedTime: number = 0;

    /** Indicates whether the timer is currently active and counting down. */
    public isRunning: boolean = false;

    /** Indicates whether the timer has finished its lifecycle (for non-repeating timers). */
    public isFinished: boolean = false;

    /**
     * Creates an instance of a Timer.
     * @param duration - The duration of the timer in seconds.
     * @param onComplete - The callback function to execute when the timer completes a cycle.
     * @param repeat - Whether the timer should restart automatically after completion. Defaults to false.
     */
    constructor(duration: number, repeat: boolean = false) {
        super()
        this.duration = duration;
        this.repeat = repeat;
    }

    /**
     * Starts or resumes the timer.
     */
    public start(): void {
        this.isRunning = true;
    }

    /**
     * Stops (pauses) the timer. It can be resumed with start().
     */
    public stop(): void {
        this.isRunning = false;
    }

    /**
     * Updates the timer's state. This is called by the Game loop every frame.
     * @param deltaTime - The time elapsed since the last frame, in seconds.
     * @internal
     */
    public update(deltaTime: number): void {
        if (!this.isRunning || this.isFinished) {
            return;
        }

        this.elapsedTime += deltaTime;

        if (this.elapsedTime >= this.duration) {
            this.emit("timeout")

            if (this.repeat) {
                // Reset for the next cycle, carrying over any excess time for accuracy
                this.elapsedTime -= this.duration;
            } else {
                this.isFinished = true;
                this.isRunning = false;
            }
        }
    }

    /**
     * Immediately stops the timer and marks it as finished, preventing any further execution.
     * This is used for cleanup to avoid memory leaks from stale callbacks.
     */
    public destroy(): void {
        this.isFinished = true;
        this.isRunning = false;
    }
}