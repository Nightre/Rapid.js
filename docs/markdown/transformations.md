# Transformations

Rapid.js 2D transformations are driven by `MatrixStack`. Translation, rotation, scaling, origin anchoring, and offsets can be passed directly via drawing options; for finer control, you can also manipulate `matrixStack` or the underlying `MatrixStore` directly.

## Passing Parameters Directly

Most drawing methods support [ITransformOptions](api/interfaces/ITransformOptions), such as `drawSprite`, `drawRect`, `drawCircle`, and `drawLine`.

```ts
import { Vec2 } from "rapid-render";

rapid.drawSprite({
    texture,

    x: 120,
    y: 80,
    // position: new Vec2(120, 80),

    rotation: Math.PI / 4,
    scale: 1.5,
    // scale: new Vec2(2, 1),

    origin: 0.5,
    // origin: new Vec2(0.5, 1),

    offsetX: 0,
    offsetY: 0,
    // offset: new Vec2(0, 0),

    modifyStack: true, // Whether to modify the MatrixStack
});
```

`origin` is normalized anchor point. `0` means top-left, `0.5` means center, and `new Vec2(0.5, 1)` means bottom-center.

## Controlling MatrixStack Directly

In complex hierarchies, you can operate `matrixStack` directly. `save()` creates a child node state, and `restore()` returns to the parent node.

```ts
const ms = rapid.matrixStack;

ms.save();
ms.translate(200, 100);
rapid.drawSprite({ texture: parent });

ms.save();
ms.translate(60, 0);
ms.rotate(Math.PI / 8);
ms.scale(0.5);
rapid.drawSprite({ texture: child });
ms.restore();

ms.restore();
```

Child nodes inherit parent world matrices. Nested `save` / `restore` calls form the most direct scene tree structure.

## withTransform

If you only want to temporarily enter a transformed context, use `withTransform`.

```ts
rapid.withTransform(() => {
    rapid.drawSprite({ texture: body });

    rapid.withTransform(() => {
        rapid.drawSprite({ texture: arm });
    }, {
        x: 32,
        y: 8,
        rotation: armRotation,
    });

}, {
  x: 160,
  y: 120,
});
```

`withTransform` handles `save` and `restore` automatically. The 3rd and 4th arguments are width and height, used for resolving `origin`.

## applyTransform

`matrixStack.applyTransform(options, width, height)` uses the same parameter options as drawing functions.

```ts
const ms = rapid.matrixStack;
ms.save();
ms.applyTransform({
  x: 120,
  y: 80,
  rotation: time,
  origin: 0.5,
}, texture.width, texture.height);

rapid.drawSprite({ texture });
ms.restore();
```

If you pass `modifyStack: true`, it modifies the current matrix stack directly (without automatically creating a new state).

```ts
rapid.matrixStack.applyTransform({
  x: 20,
  y: 0,
  modifyStack: true,
});
```

## Local and World Coordinates

`MatrixStack` maintains both current local and world matrices simultaneously. You can use it for coordinate conversions or reading global transform properties.

```ts
const ms = rapid.matrixStack;

const worldPoint = ms.localToWorld(0, 0);
const localPoint = ms.worldToLocal(160, 120);

const position = ms.getGlobalPosition();
const scale = ms.getGlobalScale();
const rotation = ms.getGlobalRotation();
```

## Operating Matrix Store

All matrices are stored flat in `rapid.matrix`. `MatrixStack` keeps track of matrix IDs, allowing you to retrieve local/world IDs of a node and manipulate them via `MatrixStore` directly.

```ts
const ms = rapid.matrixStack;
const matrix = rapid.matrix;

const node = ms.save();

// node.local equals ms.curLocalM
// node.world equals ms.curWorldM

matrix.translate(node.local, 0, 10);
matrix.rotateWithOffset(node.local, angle, 0, 16);

const point = matrix.transformPoint(node.local, 10, 10);
const raw = matrix.getMatrix(node.local);

ms.restore();
```

This pattern is ideal for long-lived hierarchical structures such as skeletons, joints, and robotic arms.

## updateMatrixSubtree: Modify One Node, Update Its Subtree

Sometimes you need to modify an already-built matrix stack repeatedly within the same frame. Rebuilding the entire matrix stack would be too expensive, so `updateMatrixSubtree` updates only the affected subtree.

If you directly modify a node's local matrix, neither its world matrix nor the world matrices of its descendants are recalculated automatically. Calling `updateMatrixSubtree(child)` recalculates the affected world matrices starting from that node.

```ts
const stack = rapid.matrixStack;
const matrix = rapid.matrix;

const root = stack.save();
stack.translate(200, 200);

const child = stack.save();
stack.translate(80, 0);
rapid.drawSprite({ texture: stick }); // (200 + 80, 200 + 0)
stack.restore();

stack.restore();

// Later, modify only root's local matrix
matrix.identity(root.local);
matrix.translate(root.local, 100, 100);
stack.updateMatrixSubtree(root); // This automatically updates root.world and child.world

rapid.drawSprite({
  texture: stick,
  customMatrix: child.world,
}); // (100 + 80, 100 + 0)
```

`updateMatrixSubtree(child)` only recalculates `child` and its descendant nodes without affecting sibling nodes. It performs the recalculation:

```ts
world = parent.world * local;
```

## customMatrix: Bypass MatrixStack and Use Matrix Directly

Drawing options accept `customMatrix`. When provided, rendering bypasses the current `matrixStack` state and uses the specified world matrix ID directly.

```ts
rapid.drawSprite({
  texture,
  customMatrix: child.world,
});
```

It is commonly used together with `MatrixStore` and `updateMatrixSubtree`.

## Vec2

`position`, `scale`, `offset`, and `origin` all accept `Vec2`. `Vec2` is the 2D vector class in Rapid.js.

```ts
import { Vec2 } from "rapid-render";

let position = new Vec2(160, 120);
const velocity = new Vec2(1, 0).mul(200);

position = position.add(velocity.mul(deltaTime));
```

Most `Vec2` methods return a new `Vec2` instance without mutating the original object. In-place modification methods include `set`, `to`, `normalize`, etc. See [Vec2 API](api/classes/Vec2.html) for detailed methods.
