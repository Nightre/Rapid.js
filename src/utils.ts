import { Color } from "./color";
import { Vec2 } from "./math";

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== "object") return false;
    if (Array.isArray(value)) return false;
    if (value instanceof Vec2) return false;
    if (value instanceof Color) return false;
    return true;
}

export class Random {
    /** Random float in [min, max). */
    static float(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }

    /** Random integer in [min, max] (inclusive). */
    static int(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Random angle in [0, 2π). */
    static angle(): number {
        return Math.random() * Math.PI * 2;
    }

    /** Random Vec2 with components in the supplied per-axis ranges. */
    static vector(minX: number, maxX: number, minY: number, maxY: number): Vec2 {
        return new Vec2(Random.float(minX, maxX), Random.float(minY, maxY));
    }

    /** Random Color with each component interpolated between minColor and maxColor. */
    static randomColor(minColor: Color, maxColor: Color): Color {
        return new Color(
            Random.float(minColor.r, maxColor.r),
            Random.float(minColor.g, maxColor.g),
            Random.float(minColor.b, maxColor.b),
            Random.float(minColor.a, maxColor.a),
        );
    }

    /** Pick a random element from an array with uniform probability. */
    static pick<T>(array: T[]): T {
        return array[Random.int(0, array.length - 1)];
    }

    /**
     * Pick a random element using weighted probability.
     * @param array - Pairs of [item, weight]. Higher weight = more likely.
     */
    static pickWeight<T>(array: [T, number][]): T {
        if (!array || array.length === 0) return null as unknown as T;

        let total = 0;
        for (const [, w] of array) total += w;

        let r = Math.random() * total;
        for (const [item, w] of array) {
            r -= w;
            if (r <= 0) return item;
        }
        return array[array.length - 1][0];
    }

    /**
     * Resolves a scalar-or-range value to a concrete T.
     * - `undefined`  → `defaultValue`
     * - `T`          → `T` (or a clone for objects)
     * - `[T, T]`     → random value between the two bounds
     */
    static scalarOrRange<T extends number | Vec2 | Color>(
        range?: T | [T, T],
        defaultValue?: T,
    ): T {
        if (range === undefined || range === null) return defaultValue as T;

        if (Array.isArray(range)) {
            const [lo, hi] = range;
            if (typeof lo === "number") {
                return Random.float(lo as number, hi as number) as T;
            } else if (lo instanceof Vec2) {
                return Random.vector(lo.x, (hi as Vec2).x, lo.y, (hi as Vec2).y) as T;
            } else if (lo instanceof Color) {
                return Random.randomColor(lo as Color, hi as Color) as T;
            }
        }

        if (typeof range === "number") return range as T;

        // Vec2 or Color — clone so particles don't share references
        return (range as Vec2 | Color).clone() as T;
    }
}
