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
        let previous = null;
        let frames = 0;
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

        const finish = (fps) => {
            if (completed) return;
            completed = true;
            cleanup();
            resolve(fps);
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
                }
                schedule();
                return;
            }

            frames++;
            const elapsed = completedAt - sampleStart;
            if (elapsed >= sampleMs) {
                finish((frames * 1000) / elapsed);
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
        let frames = 0;
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

        const finish = (fps) => {
            if (completed) return;
            completed = true;
            try {
                cleanup();
            } catch (error) {
                reject(error);
                return;
            }
            resolve(fps);
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
                }
                return;
            }

            frames++;
            const elapsed = completedAt - sampleStart;
            if (elapsed >= sampleMs) finish((frames * 1000) / elapsed);
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
