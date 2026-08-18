# Transformations

Rapid.js 的变换系统由 `MatrixStore`（矩阵数据本体）和 `MatrixStack`（栈 + 层级管理）组成，定义在 `matrix-engine.ts`。大多数场景只需要 draw 方法的 transform 参数，或者手动用 `rapid.matrixStack`；理解 local/world 和 `updateMatrix` 是为了应付更复杂的层级动画。

## 直接传参数

```ts
rapid.drawSprite({
  texture,
  x: 120,
  y: 80,
  rotation: Math.PI / 4,
  scale: 1.5,
  origin: 0.5,
});
```

`drawSprite`/`drawRect`/`drawCircle`/`drawLine`/`drawGraphic`/`drawMaskImage` 都吃这套字段（定义在 `ITransformOptions`）：

- `x`, `y` / `position`（`Vec2`）：平移，两者会叠加
- `rotation`：弧度制旋转
- `scale`：数字或 `Vec2`
- `origin`：按宽高换算的锚点（0~1），`drawCircle`/`drawGraphic`/`drawLine` 没有固定宽高，不生效
- `offsetX`, `offsetY` / `offset`（`Vec2`）：额外像素偏移，在 origin 换算完之后叠加
- `saveTransform`：是否自动 save/restore，默认 `true`
- `afterSave`：save 之后、变换生效之前的回调

这些字段最终都走同一个函数：`matrixStack.applyTransform(transform, width, height)`。`drawSprite` 这类 API、`withTransform`、甚至 `Rapid.renderCamera` 内部都是在调它——所以也可以跳过 options，自己直接调：

```ts
rapid.matrixStack.applyTransform({ x: 120, y: 80, rotation: time }, texture.width, texture.height);
rapid.drawSprite({ texture });
rapid.matrixStack.restore(); // applyTransform 默认帮你 save 了，别忘了 restore
```

## local 和 world

每次 `matrixStack.save()`，其实同时分配了两个矩阵：

- **local**：从单位矩阵开始，只累积这次 save 之后调用的 translate/rotate/scale —— 相对父节点的变换。
- **world**：从父节点当前 world 矩阵的一份拷贝开始累积 —— 直接就是能拿去画的世界矩阵。

```ts
const node = rapid.matrixStack.save(); // { local, world, step }
rapid.matrixStack.translate(100, 0);
rapid.matrixStack.rotate(0.5);
// node.local 此时只有这一次 translate + rotate
// node.world = 父矩阵 * node.local
```

`translate`/`rotate`/`scale`/`rotateWithOffset` 这几个便捷方法会同时更新 `curLocalM` 和 `curWorldM`。绘制默认用的是 `curWorldM`（`drawSprite` 不传 `customMatrix` 时，取的就是 `matrixStack.curWorldM`）。

## save / restore

```ts
const ms = rapid.matrixStack;

ms.save();
ms.translate(200, 100);
rapid.drawSprite({ texture: parent });

ms.save();
ms.translate(60, 0); // 相对父节点的偏移
rapid.drawSprite({ texture: child });
ms.restore();

ms.restore();
```

子节点的 world 矩阵天然继承父节点，嵌套 save/restore 就是最简单的场景树写法。

## updateMatrix：只改一个节点，整棵子树跟着动

`save()`/`restore()` 会把整个调用过程记成一条“进栈/出栈”记录（`stepAction`），同时记下每个节点分配到的 world 矩阵、以及它当时的父 world 矩阵（`stepWorldM`/`stepParentM`）。这就是为什么 `save()` 会把 `{ local, world, step }` 返回给你——`step` 就是这个节点在这条记录里的位置。

正常情况下不用管这些：一次 save → transform → draw → restore，world 矩阵每一步都已经算好了。但如果维护的是一个长期存在的层级结构（骨骼、关节、机械臂……），不想每次都重新跑一遍整棵树的 JS 逻辑，只想改某一个节点的角度，`updateMatrix` 就是干这个的：

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

换句话说：`local` 矩阵可以随便改，`updateMatrix` 负责把这个改动正确传播到 world 矩阵上，不用重新走一遍 save/translate/rotate/draw/restore 的完整流程。

## customMatrix

绘制方法的 options 里都有 `customMatrix?: number`，传了它就完全不管 `matrixStack` 当前状态，直接用指定的矩阵索引渲染：

```ts
rapid.drawSprite({ texture, customMatrix: child.world });
```

两个坑：

- `rapid.clear()` 会整体重置 `matrixStack`（连带 `stepAction`/`stepWorldM` 这套记录一起清空），上面 `updateMatrix` 例子里长期持有的 `root`/`child` 只在同一次 `clear()` 之后有效，下一次 `clear()` 要重新 save 搭一遍层级。
- 传了 `customMatrix` 之后，其它变换参数（`x`/`y`/`rotation`/`scale`/`offset`/`origin`）不会再影响到实际画出来的位置，混着传等于白写。

## 坐标换算

`matrixStack` 提供 local ↔ world 的换算，比如把一次点击换算成某个旋转过的节点内部的坐标：

```ts
const world = rapid.matrixStack.localToWorld(10, 20);
const local = rapid.matrixStack.worldToLocal(mouseX, mouseY);
```

`Rapid` 本身还提供几个坐标系换算，处理 CSS 像素、设备像素（`physicsWidth`/`physicsHeight`）、逻辑像素（`logicWidth`/`logicHeight`，也就是 draw 调用里用的坐标系）之间可能存在的缩放差异：

```ts
const devicePixel = rapid.cssToDevicePixel(cssPoint);  // CSS 像素 → 设备像素（乘 dpr）
const logicPoint = rapid.physicsToLogic(devicePixel);  // 设备像素 → 逻辑像素（draw 调用用这个）
const back = rapid.logicToPhysics(logicPoint);          // 逻辑像素 → 设备像素
const css = rapid.devicePixelToCss(devicePixel);         // 设备像素 → CSS 像素
```

只有 `logicWidth`/`logicHeight` 跟 `physicsWidth`/`physicsHeight` 不一致时（比如像素风游戏固定一个较低的逻辑分辨率）才需要 `physicsToLogic`/`logicToPhysics`；普通情况下 `cssToDevicePixel`/`devicePixelToCss` 配合鼠标事件坐标就够用。

## 鼠标坐标 → 逻辑坐标

浏览器事件（`clientX`/`clientY`）给的是相对视口的 CSS 像素，得先减去 canvas 自身的偏移，再走一遍 CSS → 设备 → 逻辑的换算，才是 `drawSprite` 那套 `x`/`y` 能直接用的坐标：

```ts
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect(); // canvas 相对视口的 CSS 像素位置
  const cssPoint = new Vec2(e.clientX - rect.left, e.clientY - rect.top);

  const devicePixel = rapid.cssToDevicePixel(cssPoint);
  const logicPoint = rapid.physicsToLogic(devicePixel); // 和 drawSprite 的 x/y 同一套坐标系

  rapid.drawSprite({ texture: cursor, x: logicPoint.x, y: logicPoint.y });
});
```

如果要判断这个点有没有落在某个旋转/缩放过的节点上，用节点自己的 `world` 矩阵索引做 `worldToLocal`，不用依赖 `matrixStack` 当前指到哪：

```ts
const local = rapid.matrix.worldToLocal(node.world, logicPoint.x, logicPoint.y);
if (local.x >= 0 && local.x <= texture.width && local.y >= 0 && local.y <= texture.height) {
  // 命中
}
```

## toCSSMatrix：把变换同步给真实 DOM 元素

有时候画面上某个位置需要一个真的 HTML 元素（输入框、超链接、富文本），而不是画在 canvas 里的 Sprite——这时可以把当前 world 矩阵导出成 CSS 的 `matrix(...)`，直接赋给叠在 canvas 上面的 DOM 元素，让它跟着一起平移/旋转/缩放：

```html
<div style="position: relative;">
  <canvas id="game"></canvas>
  <div id="label" style="position: absolute; left: 0; top: 0; transform-origin: 0 0;">Player</div>
</div>
```

```ts
rapid.matrixStack.save();
rapid.matrixStack.translate(player.x, player.y);
rapid.matrixStack.rotate(player.rotation);

rapid.drawSprite({ texture: player.texture, origin: 0.5 });
label.style.transform = rapid.matrixStack.toCSSMatrix();

rapid.matrixStack.restore();
```

前提是 DOM 元素和 canvas 左上角对齐、`transform-origin: 0 0`，并且没有自定义 `logicWidth`（逻辑像素就是 CSS 像素）——`toCSSMatrix` 导出的六个分量本来就是逻辑坐标系下的值，不用再乘 dpr。如果用了自定义 `logicWidth`（比如像素风固定分辨率），还需要在 CSS 里额外叠一个 `scale(canvas 的 CSS 宽 / logicWidth)`。

## Vec2

`position`、`scale`、`offset`、`origin` 都可以传 `Vec2`，通用二维向量类，从 `rapid-render` 导入：

```ts
import { Vec2 } from "rapid-render";

const position = new Vec2(160, 120);
const velocity = new Vec2(1, 0).mul(200);

position = position.add(velocity.mul(deltaTime));
```

大部分方法都会返回一个新的 `Vec2`，不修改原对象。详见 [Vec2 的 API](api/classes/Vec2.html)。
