# 遮罩与裁剪

遮罩让你用任意形状去裁剪后续的绘制：先画出一个形状写入模板缓冲，再让真正的内容只在这个形状`里面`或`外面`显示。Rapid.js 用 WebGL 的模板测试实现遮罩，任何几何体（矩形、圆、多边形、甚至一张图的 alpha）都能当遮罩形状。

## withMask

最简单的方式是 `withMask(maskCb, drawCb)`。第一个回调画遮罩形状（只写模板，不可见），第二个回调画被裁剪的内容。

```ts
rapid.withMask(
  () => {
    // 遮罩形状：一个圆
    rapid.drawCircle({ radius: 100, x: 160, y: 120 });
  },
  () => {
    // 只有圆内部会显示出来
    rapid.drawSprite({ texture: background });
  },
);
```

## 里面还是外面：MaskType

第三个参数 `type` 控制内容画在遮罩的哪一侧：

- `MaskType.EQUAL`：只画遮罩内部（默认）。
- `MaskType.NOT_EQUAL`：只画遮罩外部，也就是`挖洞`效果。

```ts
import { MaskType } from "rapid-render";

rapid.withMask(
  () => rapid.drawCircle({ radius: 80, x: 160, y: 120 }),
  () => rapid.drawRect({ width: 320, height: 240, color: new Color(36, 49, 66) }),
  MaskType.NOT_EQUAL, // 圆的位置被挖空
);
```

## 用图片的 alpha 当遮罩

`drawSprite` 在写遮罩阶段会被跳过，请使用 `drawMaskImage`，它会用一张纹理的 alpha 通道作为遮罩形状，适合不规则的镂空图案。

```ts
rapid.withMask(
  () => {
    rapid.drawMaskImage({ texture: maskShape, x: 60, y: 40 });
  },
  () => {
    rapid.drawSprite({ texture: photo });
  },
);
```

## 底层控制

`withMask` 封装了下面这套底层调用。需要跨多次绘制复用同一个遮罩、或自定义模板参考值时，可以直接用它们：

```ts
rapid.clearMask();          // 清空模板缓冲
rapid.startDrawMask(1);     // 开始写遮罩，参考值 = 1
rapid.drawCircle({ radius: 100, x: 160, y: 120 });
rapid.endDrawMask();        // 结束写遮罩，恢复颜色写入

rapid.enterMask(MaskType.EQUAL, 1); // 进入受遮罩约束的绘制
rapid.drawSprite({ texture: background });
rapid.exitMask();           // 退出，恢复正常的全屏绘制
```

- `startDrawMask(ref, mask)` / `endDrawMask()`  -  定义遮罩形状阶段。
- `enterMask(type, ref, mask)` / `exitMask()`  -  在已有遮罩内绘制内容。
- `clearMask(mask)`  -  清空模板缓冲，开始一个全新的遮罩。

`ref` 是模板参考值，配合不同的值可以叠出多层遮罩。多数情况下用 `withMask` 就够了。

## 和矩形裁剪的区别

如果只是想把绘制限制在一个矩形区域内，用 [Scissor](#advanced) 更轻量、更快。遮罩适合任意形状；矩形裁剪适合规则的矩形窗口。
