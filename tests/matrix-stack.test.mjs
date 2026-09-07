import assert from "node:assert/strict";
import test from "node:test";

import { MatrixStack } from "../dist/rapid-render.js";

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

test("MatrixStack.updateMatrixSubtree updates only the selected hierarchy", () => {
    const stack = createStack();

    const parent = stack.save();
    stack.translate(10, 20);

    const child = stack.save();
    stack.translate(5, 0);

    const grandchild = stack.save();
    stack.translate(0, 2);
    stack.restore();
    stack.restore();

    const sibling = stack.save();
    stack.translate(100, 0);
    stack.restore();
    stack.restore();

    // This branch is outside parent and must never be touched by its update.
    const external = stack.save();
    stack.translate(1000, 0);

    stack.matrix.identity(parent.local);
    stack.matrix.translate(parent.local, 30, 40);
    stack.updateMatrixSubtree(parent);

    assertPointClose(stack.matrix.getPosition(parent.world), { x: 30, y: 40 }, "parent");
    assertPointClose(stack.matrix.getPosition(child.world), { x: 35, y: 40 }, "child");
    assertPointClose(stack.matrix.getPosition(grandchild.world), { x: 35, y: 42 }, "grandchild");
    assertPointClose(stack.matrix.getPosition(sibling.world), { x: 130, y: 40 }, "sibling");
    assertPointClose(stack.matrix.getPosition(external.world), { x: 1000, y: 0 }, "external branch");

    // Updating child must include grandchild, but stop before parent's sibling.
    stack.matrix.identity(child.local);
    stack.matrix.translate(child.local, 7, 8);
    stack.updateMatrixSubtree(child);

    assertPointClose(stack.matrix.getPosition(child.world), { x: 37, y: 48 }, "updated child");
    assertPointClose(stack.matrix.getPosition(grandchild.world), { x: 37, y: 50 }, "updated grandchild");
    assertPointClose(stack.matrix.getPosition(sibling.world), { x: 130, y: 40 }, "untouched sibling");
    assertPointClose(stack.matrix.getPosition(external.world), { x: 1000, y: 0 }, "untouched external");
});
