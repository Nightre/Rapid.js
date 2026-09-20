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

test("MatrixStack.retainMatrix removes matrices from automatic recycling", () => {
    const stack = createStack();
    const saved = stack.save();
    stack.translate(12, 34);
    stack.restore();

    assert.equal(stack.retainMatrix(saved), saved);

    // Two resets normally move the saved matrices to prevStack and then free
    // them. Retained IDs must remain allocated instead.
    stack.reset();
    stack.reset();

    assert.equal(stack.matrix.freeFlag.typedArray[saved.local], 1);
    assert.equal(stack.matrix.freeFlag.typedArray[saved.world], 1);
    assertPointClose(stack.matrix.getPosition(saved.world), { x: 12, y: 34 });

    stack.matrix.free(saved.local);
    stack.matrix.free(saved.world);
    assert.equal(stack.matrix.freeFlag.typedArray[saved.local], 0);
    assert.equal(stack.matrix.freeFlag.typedArray[saved.world], 0);
});

test("MatrixStack.retainMatrix can retain one matrix from prevStack", () => {
    const stack = createStack();
    const saved = stack.save();
    stack.translate(12, 34);
    stack.restore();

    stack.reset();
    assert.equal(stack.retainMatrix(saved.world), saved.world);
    stack.reset();

    assert.equal(stack.matrix.freeFlag.typedArray[saved.world], 1);
    assertPointClose(stack.matrix.getPosition(saved.world), { x: 12, y: 34 }, "retained world");

    // The unretained local ID has been recycled as the new root and reset.
    assert.equal(saved.local, stack.curLocalM);
    assertPointClose(stack.matrix.getPosition(saved.local), { x: 0, y: 0 }, "recycled local");

    stack.matrix.free(saved.world);
});
