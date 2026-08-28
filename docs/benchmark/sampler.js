export function createSampler({
    warmupMs,
    sampleMs,
    externalTimeoutMs = warmupMs + sampleMs + 10000,
}) {
    validateDuration("warmupMs", warmupMs, true);
    validateDuration("sampleMs", sampleMs, false);
    validateDuration("externalTimeoutMs", externalTimeoutMs, false);
    if (externalTimeoutMs <= warmupMs + sampleMs) {
        throw new RangeError(
            "externalTimeoutMs must exceed warmupMs + sampleMs.",
        );
    }

    return Object.freeze({
        sampleLoop: (draw, options) => sampleDrivenFrames(
            draw,
            warmupMs,
            sampleMs,
            options?.signal,
        ),
        sampleExternalLoop: (subscribe, options) => sampleObservedFrames(
            subscribe,
            warmupMs,
            sampleMs,
            externalTimeoutMs,
            options?.signal,
        ),
    });
}

function sampleDrivenFrames(draw, warmupMs, sampleMs, signal) {
    return new Promise((resolve, reject) => {
        if (typeof draw !== "function") {
            reject(new TypeError("sampleLoop requires a draw function."));
            return;
        }

        let warmupStart = null;
        let sampleStart = null;
        let previousSampleFrame = null;
        let previous = null;
        let frames = 0;
        const frameTimes = [];
        let completed = false;
        let frameRequest = 0;

        const cleanup = () => {
            if (frameRequest) cancelAnimationFrame(frameRequest);
            signal?.removeEventListener("abort", abort);
        };

        const fail = (error) => {
            if (completed) return;
            completed = true;
            cleanup();
            reject(error);
        };

        const finish = (measurement) => {
            if (completed) return;
            completed = true;
            cleanup();
            resolve(measurement);
        };

        const abort = () => fail(getAbortError(signal));

        const schedule = () => {
            frameRequest = requestAnimationFrame(step);
        };

        const step = (frameTime) => {
            frameRequest = 0;
            if (completed) return;

            const delta = previous === null
                ? 0
                : Math.min((frameTime - previous) / 1000, 0.05);
            previous = frameTime;
            try {
                draw(delta);
            } catch (error) {
                fail(error);
                return;
            }
            const completedAt = performance.now();

            if (warmupStart === null) {
                // Both sampling paths begin warm-up after their first
                // renderer frame has fully completed.
                warmupStart = completedAt;
                schedule();
                return;
            }

            if (sampleStart === null) {
                if (completedAt - warmupStart >= warmupMs) {
                    // Start between frames. The warm-up frame above is not
                    // counted, so N measured frames span N complete intervals.
                    sampleStart = completedAt;
                    previousSampleFrame = completedAt;
                }
                schedule();
                return;
            }

            frames++;
            const elapsed = completedAt - sampleStart;
            frameTimes.push(completedAt - previousSampleFrame);
            previousSampleFrame = completedAt;
            if (elapsed >= sampleMs) {
                finish(createMeasurement(frames, elapsed, frameTimes));
                return;
            }

            schedule();
        };

        if (signal?.aborted) {
            fail(getAbortError(signal));
            return;
        }
        signal?.addEventListener("abort", abort, { once: true });
        schedule();
    });
}

function sampleObservedFrames(
    subscribe,
    warmupMs,
    sampleMs,
    timeoutMs,
    signal,
) {
    return new Promise((resolve, reject) => {
        if (typeof subscribe !== "function") {
            reject(new TypeError("sampleExternalLoop requires a frame subscription."));
            return;
        }

        let warmupStart = null;
        let sampleStart = null;
        let previousSampleFrame = null;
        let frames = 0;
        const frameTimes = [];
        let unsubscribe = null;
        let completed = false;
        let timeout = 0;

        const cleanup = () => {
            clearTimeout(timeout);
            signal?.removeEventListener("abort", abort);
            const stopObserving = unsubscribe;
            unsubscribe = null;
            stopObserving?.();
        };

        const fail = (error) => {
            if (completed) return;
            completed = true;
            try {
                cleanup();
            } catch (cleanupError) {
                reject(cleanupError);
                return;
            }
            reject(error);
        };

        const finish = (measurement) => {
            if (completed) return;
            completed = true;
            try {
                cleanup();
            } catch (error) {
                reject(error);
                return;
            }
            resolve(measurement);
        };

        const frameCompleted = () => {
            if (completed) return;

            const completedAt = performance.now();
            if (warmupStart === null) {
                warmupStart = completedAt;
                return;
            }

            if (sampleStart === null) {
                if (completedAt - warmupStart >= warmupMs) {
                    // This event closes the warm-up window. Counting begins
                    // with the next completed renderer frame.
                    sampleStart = completedAt;
                    previousSampleFrame = completedAt;
                }
                return;
            }

            frames++;
            frameTimes.push(completedAt - previousSampleFrame);
            previousSampleFrame = completedAt;
            const elapsed = completedAt - sampleStart;
            if (elapsed >= sampleMs) {
                finish(createMeasurement(frames, elapsed, frameTimes));
            }
        };

        const abort = () => fail(getAbortError(signal));

        if (signal?.aborted) {
            fail(getAbortError(signal));
            return;
        }
        signal?.addEventListener("abort", abort, { once: true });
        try {
            const stopObserving = subscribe(frameCompleted);
            if (typeof stopObserving === "function") unsubscribe = stopObserving;
            if (completed) {
                unsubscribe?.();
                return;
            }
        } catch (error) {
            fail(error);
            return;
        }

        timeout = setTimeout(() => {
            fail(new Error(
                `Renderer frame sampling timed out after ${timeoutMs} ms.`,
            ));
        }, timeoutMs);
    });
}

function createMeasurement(frames, elapsed, frameTimes) {
    return Object.freeze({
        fps: (frames * 1000) / elapsed,
        p99: percentile(frameTimes, 0.99),
    });
}

function percentile(values, ratio) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
    return sorted[index];
}

function getAbortError(signal) {
    if (signal?.reason instanceof Error) return signal.reason;
    const error = new Error(signal?.reason || "Benchmark sampling aborted.");
    error.name = "AbortError";
    return error;
}

function validateDuration(name, value, allowZero) {
    const minimum = allowZero ? 0 : Number.EPSILON;
    if (!Number.isFinite(value) || value < minimum) {
        throw new RangeError(`${name} must be a finite ${
            allowZero ? "non-negative" : "positive"
        } number.`);
    }
}
