# 精灵

精灵就是把一个 Texture 画到画布上。接口是 `rapid.drawSprite(options)`。

## 基础例子

```ts
const texture = await rapid.texture.load("./image/player.png");

rapid.clear();
rapid.drawSprite({
  texture,
  x: 160,
  y: 120,
});
rapid.flush();
```

`drawSprite` 不会立刻提交到 GPU，它会先进渲染队列。通常一帧里可以调用很多次 `drawSprite`，最后再调用一次 `rapid.flush()`。

## Options

`drawSprite` 可以接受这些参数，只有 `texture` 是必须的

```ts
import { Color, Vec2 } from "rapid-render";

rapid.drawSprite({
  texture,                              // 要绘制的 Texture

  x: 160,                               // x 位置
  y: 120,                               // y 位置
  // position: new Vec2(160, 120),         也可以用 position 传位置

  rotation: Math.PI / 4,                // 旋转角度，单位是弧度
  scale: new Vec2(2, 1),                // 缩放。也可以直接写数字：scale: 2

  origin: new Vec2(0.5, 1),             // 锚点。也可以直接写数字：origin: 0.5

  offsetX: -8,                          // 像素偏移
  offsetY: -4,
  // offset: new Vec2(-8, -4),             也可以用 offset 传偏移

  flipX: true,                          // 水平翻转
  flipY: false,                         // 垂直翻转

  color: new Color(255, 255, 255, 180), // 颜色叠加和透明度，白色是不改变原图

  shader: customShader,                 // 使用自定义 shader
  customMatrix: matrixIndex,            // 直接指定矩阵索引

  modifyStack: false,                   // 是否修改矩阵堆栈，默认 false
});
```

## Padding

`padding` 会让 Sprite 的绘制范围向外扩一点，单位是像素。普通图片一般不需要传；滤镜或自定义 shader 采样到边缘时可以用。比如制作 `Outline Shader` 时。

```ts
rapid.drawSprite({
  texture,
  x: 160,
  y: 120,
  padding: 2,
});
```

## 动画帧

Sprite 动画通常就是每帧切换 Texture。

```ts
const sheet = await rapid.texture.load("./image/player_run.png");
const frames = sheet.splitGrid(32, 32, 6, 1, 1);

let index = 0;

function frame() {
  index = (index + 1) % frames.length;

  rapid.clear();
  rapid.drawSprite({
    texture: frames[index],
    x: 160,
    y: 120,
    origin: 0.5,
  });
  rapid.flush();

  requestAnimationFrame(frame);
}

frame();
```
