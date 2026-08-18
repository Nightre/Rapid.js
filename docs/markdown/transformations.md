# Transformations

在 Rapid 引擎中，2D 变换（平移、缩放、旋转等）由底层高性能的矩阵栈驱动。
允许你通过简单的配置对象或灵活底层的 API 来控制图形的变换

## 直接传参数

```ts
rapid.drawSprite({
  // ITransformOptions

  x: 120,
  y: 80,
  // position: new Vec2(120, 80),
  rotation: Math.PI / 4,
  scale: 1.5, // 数字或者 Vec2
  origin: 0.5, // 数字或者 Vec2

  offsetX: 0,
  offsetY: 0,
  // offset: new Vec2(0, 0),

  saveTransform: true, // 是否自动调用 matrixstack 创建一个新的状态来渲染
  afterSave: () => {
    // 在状态入栈后、应用当前变换前触发的回调
    // 可以再次绘制子精灵，继承父的变换
    rapid.drawSprite({...})
  }
});
```

Rapidjs 的渲染函数均可以使用这些参数（定义在 [ITransformOptions](api/interfaces/ITransformOptions.html)。）
`applyTransform`和`withTransform` 都可以使用该参数

```ts
rapid.matrixStack.applyTransform({ x: 120, y: 80, rotation: time }, texture.width, texture.height);
rapid.drawSprite({ texture }); // drawSprite 默认帮你 save + restore
rapid.matrixStack.restore(); // applyTransform 默认帮你 save 了，别忘了 restore

rapid.withTransform(() => {
    rapid.drawSprite({ texture: myTexture1 });
    rapid.drawSprite({ texture: myTexture2 });

    // 继续渲染子节点
    rapid.withTransform(() => {
        ...
    });

}, { x: 100, y: 50, rotation: Math.PI / 4 });
```

## 直接控制 MatrixStack

以上嵌套的写法会在复杂场景树的情况下变得十分繁杂。Rapid.js 可以直接扁平的操作 `matrixStack`

```ts
const ms = rapid.matrixStack;

ms.save();
ms.translate(200, 100);
rapid.drawSprite({ texture: parent });

ms.save();
ms.rotate(Math.PI / 8);
ms.translate(60, 0); // 相对父节点的偏移
ms.scale(0.5)
rapid.drawSprite({ texture: child });
ms.restore();

ms.restore();
```

子节点的 world 矩阵天然继承父节点，嵌套 save/restore 就是最简单的场景树写法。


## local 和 world

可以把当前局部变换和世界变换转化

```ts
const ms = rapid.matrixStack;

// 转换屏幕上的逻辑坐标
ms.localToWorld(0, 0);
ms.worldToLocal(0, 0);

// 获取当前变换的全局位置
const pos = ms.getGlobalPosition();
```

## 操作 Matrix

所有矩阵都存储于 `MatrixStore` ， `MatrixStack` 仅仅存储 矩阵位于`MatrixStore`的ID
如果你需要对具体的矩阵进行更细节的操作可以使用 `rapid.matrix` 的方法并传递 矩阵的ID。

```ts
const ms = rapid.matrixStack;
const m = rapid.matrix;

const child = ms.save();
child.local // 局部矩阵的ID 等于 ms.curLocalM
child.world // 全局矩阵的ID 等于 ms.curWorldM

m.translate(child.local, 0, 10) // 用 id 去修改 Matrix
m.transformPoint(child.local, 10, 10) // 用 id 使用 Matrix 去变换一个点
const matrixarray = m.getMatrix(child.local) // 用 id 去获取 Matrix 的Float32Array
```

## updateMatrix：只改一个节点，整棵子树跟着动

`save()`和`restore()` 会把整个调用过程记成一条“进栈/出栈”记录，同时记下每个节点分配到的 world 矩阵、以及它当时的父 world 矩阵。
正常情况下不用管这些：一次 save → transform → draw → restore，world 矩阵每一步都已经算好了。
但如果维护的是一个长期存在的层级结构（骨骼、关节、机械臂），不想每次都重新跑一遍整棵树的 JS 逻辑，只想改某一个节点的角度并影响其他Matrix
`updateMatrix` 就是干这个的：

```ts
const root = ms.save();
ms.translate(200, 200);

const child = ms.save();
ms.translate(80, 0);
ms.restore();

ms.restore();

// —— 之后只有 child 的角度变了 ——
rapid.matrix.rotateWithOffset(child.local, angle, 0, 16); // 直接改 child 的 local 矩阵
ms.updateMatrix(child);                                    // 从 child 开始重新算它自己和所有子孙的 world

rapid.drawSprite({ texture: stick, customMatrix: child.world });
```

`updateMatrix(step)` 具体做的事：从 `step` 对应的节点出发，拿它记录下来的父 world 矩阵，重新算一遍 `world = parent.world * local`；然后顺着当初记录的进栈/出栈顺序往下走，用同样方式重新算每一个子孙节点的 world，直到这个节点对应的“出栈”位置为止——只重算这一整棵子树，不会碰它的兄弟节点或祖先节点。传 `child` 只重算 child 自己和它底下的子树；如果传更靠外层的 `root`，就会连 root 一起重新算再往下传。

换句话说：`local` 矩阵可以随便改，`updateMatrix` 负责把这个改动正确传播到 world 矩阵上，不用重新走一遍完整流程。

## customMatrix：跳过 MatrixStack 直接使用 Matrix

绘制方法的 options 里都有 `customMatrix?: number`，传了它就完全不管 `matrixStack` 当前状态，直接用指定的矩阵索引渲染：

```ts
rapid.drawSprite({ texture, customMatrix: child.world });
```

## Vec2

`position`、`scale`、`offset`、`origin` 都可以传 `Vec2`，通用二维向量类，从 `rapid-render` 导入：

```ts
import { Vec2 } from "rapid-render";

const position = new Vec2(160, 120);
const velocity = new Vec2(1, 0).mul(200);

position = position.add(velocity.mul(deltaTime));
```

大部分方法都会返回一个新的 `Vec2`，不修改原对象。详见 [Vec2 的 API](api/classes/Vec2.html)。