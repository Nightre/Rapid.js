import assert from "node:assert/strict";
import test from "node:test";

import { MatrixStack } from "../dist/rapid-render.js";

test("MatrixStack recomputes a transformed subtree", () => {
    const rapid = { flush() {} };
    const stack = new MatrixStack(rapid);

    const parent = stack.save();
    stack.translate(10, 20);

    stack.save();
    stack.translate(5, 3);

    assert.deepEqual(stack.localToWorld(0, 0), { x: 15, y: 23 });
    assert.deepEqual(stack.worldToLocal(15, 23), { x: 0, y: 0 });

    // Change the recorded parent transform after traversal, then update only
    // that branch. The child's world matrix must inherit the new parent.
    stack.matrix.identity(parent.local);
    stack.matrix.translate(parent.local, 30, 40);
    stack.updateMatrixSubtree(parent);

    assert.deepEqual(stack.localToWorld(0, 0), { x: 35, y: 43 });
    assert.deepEqual(stack.worldToLocal(35, 43), { x: 0, y: 0 });
});
