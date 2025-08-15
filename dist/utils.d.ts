import { default as EventEmitter } from 'eventemitter3';
import { IMathObject } from './interface';
interface TweenrEvents {
    complete: () => void;
}
/**
 * Manages the interpolation of a property on a target object over a specific duration.
 * @template T - The type of the value being tweened (e.g., number, Vec2, Color).
 */
export declare class Tween<T extends IMathObject<T> | number> extends EventEmitter<TweenrEvents> {
    private target;
    private property;
    private to;
    private from;
    private duration;
    private easing;
    private elapsed;
    isRunning: boolean;
    isFinished: boolean;
    /**
     * Creates an instance of Tween.
     * @param target - The object whose property will be animated.
     * @param property - The name of the property to animate.
     * @param to - The target value of the property.
     * @param duration - The duration of the animation in seconds.
     * @param easing - The easing function to use for the animation.
     */
    constructor(target: any, property: string, to: T, duration: number, easing: EasingFunction);
    /**
     * Starts the tween animation.
     * It captures the initial state of the property.
     */
    start(): void;
    /**
     * Updates the tween's state. This should be called every frame.
     * @param deltaTime - The time elapsed since the last frame, in seconds.
     */
    update(deltaTime: number): void;
}
export declare const isPlainObject: (obj: any) => boolean;
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
export declare class Easing {
    static Linear: EasingFunction;
    static EaseInQuad: EasingFunction;
    static EaseOutQuad: EasingFunction;
    static EaseInOutQuad: EasingFunction;
    static EaseInCubic: EasingFunction;
    static EaseOutCubic: EasingFunction;
    static EaseInOutCubic: EasingFunction;
    static EaseInQuart: EasingFunction;
    static EaseOutQuart: EasingFunction;
    static EaseInOutQuart: EasingFunction;
}
interface TimerEvents {
    timeout: () => void;
}
/**
 * Represents a timer that executes a callback after a specified duration.
 * The timer can be set to repeat. It is managed and updated by the Game's main loop.
 */
export declare class Timer extends EventEmitter<TimerEvents> {
    private duration;
    private repeat;
    private elapsedTime;
    /** Indicates whether the timer is currently active and counting down. */
    isRunning: boolean;
    /** Indicates whether the timer has finished its lifecycle (for non-repeating timers). */
    isFinished: boolean;
    /**
     * Creates an instance of a Timer.
     * @param duration - The duration of the timer in seconds.
     * @param onComplete - The callback function to execute when the timer completes a cycle.
     * @param repeat - Whether the timer should restart automatically after completion. Defaults to false.
     */
    constructor(duration: number, repeat?: boolean);
    /**
     * Starts or resumes the timer.
     */
    start(): void;
    /**
     * Stops (pauses) the timer. It can be resumed with start().
     */
    stop(): void;
    /**
     * Updates the timer's state. This is called by the Game loop every frame.
     * @param deltaTime - The time elapsed since the last frame, in seconds.
     * @internal
     */
    update(deltaTime: number): void;
    /**
     * Immediately stops the timer and marks it as finished, preventing any further execution.
     * This is used for cleanup to avoid memory leaks from stale callbacks.
     */
    destroy(): void;
}
export {};
