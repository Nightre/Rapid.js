import assert from "node:assert/strict";
import { test } from "vitest";

import { MatrixStack } from "../src/matrix-engine";

const EPSILON = 1e-5;

const assertNumbersClose = (actual, expected, message = "") => {
    assert.equal(actual.length, expected.length, message);
    for (let i = 0; i < expected.length; i++) {
        assert.ok(
            Math.abs(actual[i] - expected[i]) <= EPSILON,
            `${message} index ${i}: expected ${expected[i]}, received ${actual[i]}`,
        );
    }
};

const assertPointClose = (actual, expected, message = "") => {
    assertNumbersClose([actual.x, actual.y], [expected.x, expected.y], message);
};

const createStack = () => new MatrixStack({ flush() {} });

for (const [useWorld, useLocal] of [[false, false], [true, false], [false, true], [true, true]]) {
    test(`MatrixStack.save only recycles its own matrices (world=${useWorld}, local=${useLocal})`, () => {
        const stack = createStack();
        const world = stack.matrix.alloc();
        const local = stack.matrix.alloc();
        stack.matrix.translate(world, 100, 200);
        stack.matrix.translate(local, 3, 4);
        const released = [];
        const free = stack.matrix.free.bind(stack.matrix);
        stack.matrix.free = (index) => { released.push(index); free(index); };

        // Reuse the same caller-owned IDs across several frame resets without retainMatrix().
        for (let frame = 0; frame < 3; frame++) {
            stack.translate(10, 20);
            const parentWorld = stack.curWorldM;
            const saved = stack.save(useWorld ? world : undefined, useLocal ? local : undefined);
            const queued = stack.currStack.getArray(0, stack.currStack.length);
            assert.equal(queued.includes(saved.world), !useWorld);
            assert.equal(queued.includes(saved.local), !useLocal);
            assertPointClose(stack.localToWorld(0, 0), useWorld
                ? { x: 100, y: 200 }
                : { x: 10 + (useLocal ? 3 : 0), y: 20 + (useLocal ? 4 : 0) });

            stack.restore();
            assert.equal(stack.curWorldM, parentWorld);
            released.length = 0;
            stack.reset();

            assert.equal(released.includes(saved.world), !useWorld);
            assert.equal(released.includes(saved.local), !useLocal);
            assert.equal(stack.matrix.freeFlag.typedArray[world], 1);
            assert.equal(stack.matrix.freeFlag.typedArray[local], 1);
            assertPointClose(stack.matrix.getPosition(world), { x: 100, y: 200 });
            assertPointClose(stack.matrix.getPosition(local), { x: 3, y: 4 });
        }

        stack.matrix.free(world);
        stack.matrix.free(local);
    });
}

test("MatrixStack keeps local and world matrices correct across nesting", () => {
    const stack = createStack();
    const parent = stack.save();
    stack.applyTransform({ x: 10, y: 20, scale: { x: 2, y: 3 } });

    const child = stack.save();
    stack.applyTransform({ x: 5, y: 7 });

    assertNumbersClose(
        stack.matrix.getMatrix(parent.local),
        [2, 0, 0, 3, 10, 20],
        "parent local matrix",
    );
    assertNumbersClose(
        stack.matrix.getMatrix(parent.world),
        [2, 0, 0, 3, 10, 20],
        "parent world matrix",
    );
    assertNumbersClose(
        stack.matrix.getMatrix(child.local),
        [1, 0, 0, 1, 5, 7],
        "child local matrix",
    );
    assertNumbersClose(
        stack.matrix.getMatrix(child.world),
        [2, 0, 0, 3, 20, 41],
        "child world matrix",
    );

    // transformPoint uses the current local matrix; localToWorld uses world.
    assertPointClose(stack.transformPoint(4, 2), { x: 9, y: 9 }, "local transform");
    assertPointClose(stack.localToWorld(4, 2), { x: 28, y: 47 }, "localToWorld");
    assertPointClose(stack.worldToLocal(28, 47), { x: 4, y: 2 }, "worldToLocal");

    stack.restore();
    assertPointClose(stack.localToWorld(0, 0), { x: 10, y: 20 }, "restored parent");
    stack.restore();
    assertPointClose(stack.localToWorld(4, 2), { x: 4, y: 2 }, "restored root");
});

test("MatrixStack.applyTransform composes position, origin, scale and rotation", () => {
    const stack = createStack();
    stack.save();

    stack.applyTransform(
        {
            x: 100,
            y: 50,
            rotation: Math.PI / 2,
            scale: { x: 2, y: 3 },
            offset: { x: 4, y: 5 },
            origin: { x: 0.5, y: 0.25 },
        },
        20,
        40,
    );

    const localBeforeCustom = stack.matrix.getMatrix(stack.curLocalM);
    const worldBeforeCustom = stack.matrix.getMatrix(stack.curWorldM);
    assertNumbersClose(localBeforeCustom, [0, 2, -3, 0, 115, 38], "composed local");
    assertNumbersClose(worldBeforeCustom, [0, 2, -3, 0, 115, 38], "composed world");
    assertPointClose(stack.localToWorld(1, 2), { x: 109, y: 40 });

    // A custom output matrix is useful for drawing without mutating the stack.
    const customMatrix = stack.matrix.allocDirty();
    stack.applyTransform({ x: 5, y: 6 }, 0, 0, customMatrix);

    assertNumbersClose(stack.matrix.getMatrix(customMatrix), [0, 2, -3, 0, 97, 48]);
    assertNumbersClose(stack.matrix.getMatrix(stack.curLocalM), localBeforeCustom);
    assertNumbersClose(stack.matrix.getMatrix(stack.curWorldM), worldBeforeCustom);
});

test("MatrixStack save states remain usable after restore", () => {
    const stack = createStack();

    const parent = stack.save();
    stack.translate(10, 20);

    const child = stack.save();
    stack.translate(5, 0);

    stack.restore();
    stack.restore();

    assert.equal(child.parent, parent.world);
    assertPointClose(stack.matrix.getPosition(parent.world), { x: 10, y: 20 }, "saved parent");
    assertPointClose(stack.matrix.getPosition(child.world), { x: 15, y: 20 }, "saved child");
    assertPointClose(stack.localToWorld(0, 0), { x: 0, y: 0 }, "restored root");
});

test("MatrixStack.retainMatrix retains both matrices in a saved state", () => {
    const stack = createStack();
    const saved = stack.save();
    stack.translate(12, 34);
    stack.restore();

    assert.equal(stack.retainMatrix(saved), saved);

    const queuedMatrices = stack.currStack.getArray(0, stack.currStack.length);
    assert.equal(queuedMatrices.includes(saved.local), false);
    assert.equal(queuedMatrices.includes(saved.world), false);

    // reset() only recycles matrices that remain in currStack.
    stack.reset();

    assert.equal(stack.matrix.freeFlag.typedArray[saved.local], 1);
    assert.equal(stack.matrix.freeFlag.typedArray[saved.world], 1);
    assertPointClose(stack.matrix.getPosition(saved.local), { x: 12, y: 34 }, "retained local");
    assertPointClose(stack.matrix.getPosition(saved.world), { x: 12, y: 34 }, "retained world");

    stack.matrix.free(saved.local);
    stack.matrix.free(saved.world);
});

test("MatrixStack.retainMatrix can retain a single matrix ID", () => {
    const stack = createStack();
    const saved = stack.save();
    stack.translate(12, 34);
    stack.restore();

    assert.equal(stack.retainMatrix(saved.world), saved.world);
    stack.reset();

    assert.equal(stack.matrix.freeFlag.typedArray[saved.world], 1);
    assertPointClose(stack.matrix.getPosition(saved.world), { x: 12, y: 34 }, "retained world");

    // The unretained local matrix is available for reuse by the new root.
    assert.equal(saved.local, stack.curLocalM);
    assertPointClose(stack.matrix.getPosition(saved.local), { x: 0, y: 0 }, "recycled local");

    stack.matrix.free(saved.world);
});

test("A retained current world ID can be reused across frames with automatic local matrices", () => {
    const stack = createStack();
    stack.translate(100, 80);
    const world = stack.retainMatrix(stack.curWorldM);
    const released = [];
    const free = stack.matrix.free.bind(stack.matrix);
    stack.matrix.free = (index) => { released.push(index); free(index); };

    for (let frame = 0; frame < 20; frame++) {
        stack.reset();
        const parentWorld = stack.curWorldM;
        const cached = stack.save(world);
        assert.equal(cached.world, world);
        assertNumbersClose(stack.matrix.getMatrix(cached.local), [1, 0, 0, 1, 0, 0]);
        assertPointClose(stack.localToWorld(1, 2), { x: 101, y: 82 });

        stack.save();
        stack.translate(3, 4);
        assertPointClose(stack.localToWorld(1, 2), { x: 104, y: 86 });
        stack.restore();
        assert.equal(stack.curWorldM, world);
        stack.restore();
        assert.equal(stack.curWorldM, parentWorld);
    }

    assert.equal(released.includes(world), false);
    assertPointClose(stack.matrix.getPosition(world), { x: 100, y: 80 });
    assert.ok(stack.matrix.matrixCount <= 9, "Repeated frames must reuse automatic matrix slots");
    stack.matrix.free(world);
    assert.equal(stack.matrix.freeFlag.typedArray[world], 0);
});

test("A retained save state supports cached parent transforms and partial child inputs", () => {
    const stack = createStack();
    const cached = stack.retainMatrix(stack.save());
    stack.applyTransform({ x: 10, y: 20, scale: { x: 2, y: 3 } });
    stack.restore();
    const childLocal = stack.matrix.alloc();
    stack.matrix.translate(childLocal, 5, 7);
    const localData = stack.matrix.getMatrix(cached.local);
    const worldData = stack.matrix.getMatrix(cached.world);

    for (let frame = 0; frame < 20; frame++) {
        stack.reset();
        const parentWorld = stack.curWorldM;
        stack.save(cached.world, cached.local);
        const child = stack.save(undefined, childLocal);
        assert.equal(child.parent, cached.world);
        assertNumbersClose(stack.matrix.getMatrix(child.world), [2, 0, 0, 3, 20, 41]);
        assertPointClose(stack.localToWorld(4, 2), { x: 28, y: 47 });
        stack.restore();
        assert.equal(stack.curWorldM, cached.world);
        assert.equal(stack.curLocalM, cached.local);
        stack.restore();
        assert.equal(stack.curWorldM, parentWorld);
    }

    assertNumbersClose(stack.matrix.getMatrix(cached.local), localData);
    assertNumbersClose(stack.matrix.getMatrix(cached.world), worldData);
    assert.ok(stack.matrix.matrixCount <= 9, "Repeated frames must reuse automatic matrix slots");
    for (const index of [cached.world, cached.local, childLocal]) {
        assert.equal(stack.matrix.freeFlag.typedArray[index], 1);
        stack.matrix.free(index);
        assert.equal(stack.matrix.freeFlag.typedArray[index], 0);
    }
});
