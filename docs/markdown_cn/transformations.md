# 变换

Rapid.js 的 2D 变换由 `MatrixStack` 驱动。平移、旋转、缩放、锚点和偏移都可以直接写在绘制 options 里；需要更细控制时，也可以直接操作 `matrixStack` 或底层 `MatrixStore`。

## 直接传参数

大多数绘制方法都支持 [ITransformOptions](api/interfaces/ITransformOptions)，比如 `drawSprite`、`drawRect`、`drawCircle`、`drawLine`。

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

    modifyStack: false, // 是否修改 MatrixStack
});
```

`origin` 是归一化锚点。`0` 表示左上角，`0.5` 表示中心，`new Vec2(0.5, 1)` 表示底部中心。

## 直接控制 MatrixStack

复杂层级里，可以直接操作 `matrixStack`。`save()` 创建子节点状态，`restore()` 回到父节点。

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

子节点会继承父节点的 world 矩阵。嵌套的 `save` / `restore` 就是最直接的场景树写法。

## withTransform

如果你只想临时进入一个变换环境，可以用 `withTransform`。

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

`withTransform` 会自动 `save` 和 `restore`。第三、第四个参数是宽高，用来计算 `origin`。

## applyTransform

`matrixStack.applyTransform(options, width, height)` 和绘制 options 使用同一套参数。

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

如果传 `modifyStack: true`，它会直接改当前矩阵堆栈（不会自动创建新状态）

```ts
rapid.matrixStack.applyTransform({
  x: 20,
  y: 0,
  modifyStack: true,
});
```


## local 和 world

`MatrixStack` 同时维护当前 local 矩阵和 world 矩阵。可以用它做坐标转换，也可以读出当前全局变换。

```ts
const ms = rapid.matrixStack;

const worldPoint = ms.localToWorld(0, 0);
const localPoint = ms.worldToLocal(160, 120);

const position = ms.getGlobalPosition();
const scale = ms.getGlobalScale();
const rotation = ms.getGlobalRotation();
```

## 操作 Matrix

所有矩阵都存在 `rapid.matrix` 里。`MatrixStack` 保存的是矩阵 ID，所以你可以拿到某个节点的 local / world ID，再用 `MatrixStore` 直接操作。

```ts
const ms = rapid.matrixStack;
const matrix = rapid.matrix;

const node = ms.save();

// node.local 等于 ms.curLocalM
// node.world 等于 ms.curWorldM

matrix.translate(node.local, 0, 10);
matrix.rotateWithOffset(node.local, angle, 0, 16);

const point = matrix.transformPoint(node.local, 10, 10);
const raw = matrix.getMatrix(node.local);

ms.restore();
```

这种写法适合骨骼、关节、机械臂这类长期存在的层级结构。

## updateMatrixSubtree: 只改一个节点，整棵子树跟着动

有时候需要在一帧内重复修改创建好的matrixstack。但是重建整个matrixstack开销太大。此时就需要`updateMatrixSubtree`来局部更新受影响的matrixstack。

如果你直接改了某个节点的 local 矩阵，它的 world 与它下游的 world 矩阵不会自动全部重算。这个时候调用 `updateMatrixSubtree(child)`，就可以从这个节点开始，把会被它影响的 world 矩阵更新一遍。

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

// 后面只修改 root 的 local 矩阵
matrix.identity(root.local);
matrix.translate(root.local, 100, 100);
stack.updateMatrixSubtree(root); // 这会自动更新 root.world 和 child.world

rapid.drawSprite({
  texture: stick,
  customMatrix: child.world,
}); // (100 + 80, 100 + 0)
```

`updateMatrixSubtree(child)` 只会重算 `child` 和它下面的子节点，不会影响兄弟节点。它做的事情就是重新计算：

```ts
world = parent.world * local;
```

## customMatrix: 跳过 MatrixStack 直接使用 Matrix

绘制 options 里可以传 `customMatrix`。传了它之后，绘制时会直接使用指定的 world 矩阵 ID，而不是使用 `matrixStack` 当前状态。

```ts
rapid.drawSprite({
  texture,
  customMatrix: child.world,
});
```

它通常和 `MatrixStore`、`updateMatrixSubtree` 一起使用。

## Vec2

`position`、`scale`、`offset`、`origin` 都可以传 `Vec2`。`Vec2` 是 Rapid.js 的二维向量类。

```ts
import { Vec2 } from "rapid-render";

let position = new Vec2(160, 120);
const velocity = new Vec2(1, 0).mul(200);

position = position.add(velocity.mul(deltaTime));
```

大部分 `Vec2` 方法会返回一个新的 `Vec2`，不会修改原对象。需要原地修改时可以使用 `set`、`to`、`normalize` 等方法。详细方法见 [Vec2 API](api/classes/Vec2.html)。
