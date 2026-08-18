# 快速开始

这是一个入门教程，这个示例只做一件事：加载 `toycar.png`，然后把它渲染到 canvas 上。

## HTML

```html
<canvas id="game" width="480" height="300"></canvas>
<script type="module" src="./main.ts"></script>
```

## TypeScript

```ts
import { Rapid, Color } from "rapid-render";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const rapid = new Rapid({ canvas });

// 加载纹理
const toycar = await rapid.texture.load("./image/toycar.png");

rapid.clear(); // 1.清空渲染器。开始渲染

// 2.提交绘制指令
rapid.drawSprite({
  texture: toycar,
  x: 160,
  y: 100,
});

rapid.flush(); // 3.刷新渲染队列。渲染完毕
```

## 让图片旋转

`rapid.js` 并不会帮你处理游戏循环与调度帧，所以接下来你要自己添加`gameloop`。
如果需要让图片动起来，把绘制代码放进 `requestAnimationFrame`。

```js
let rotation = 0;

function frame() {
  rotation += 0.02;

  rapid.clear();
  rapid.drawSprite({
    texture: toycar,
    x: 240,
    y: 150,
    rotation,
    origin: 0.5,
  });
  rapid.flush();

  requestAnimationFrame(frame);
}

frame();
```

如果要销毁掉 Rapid.js 实例，可以使用：

```ts
rapid.destroy()
```