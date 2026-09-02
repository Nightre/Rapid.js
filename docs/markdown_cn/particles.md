# 粒子辅助函数 Particle Emitter

Rapid.js 内置了一个轻量的粒子辅助系统。核心是 `ParticleEmitter`：你描述粒子的外观和随时间的变化，发射器负责生成、更新、回收和绘制这些粒子。
`ParticleEmitter`内部调用`drawParticles`，是`drawParticles`的一个辅助工具

## 快速开始

创建一个发射器，`start()` 开始发射，然后在游戏循环里每帧 `update(dt)` 和 `render()`。

```ts
import { ParticleEmitter, ParticleShape, Color, Vec2 } from "rapid-render";

const spark = await rapid.texture.load("./image/spark.png");

const emitter = new ParticleEmitter(rapid, {
  texture: spark,
  life: [0.6, 1.2],          // 每个粒子存活 0.6~1.2 秒
  emitRate: 60,              // 每秒发射 60 个
  emitShape: ParticleShape.CIRCLE,
  emitRadius: 20,
  animation: {
    speed: { start: 120, end: 0 },   // 初速 120，逐渐减速到 0
    rotation: [0, Math.PI * 2],      // 随机方向
    scale: { start: 1, end: 0 },     // 逐渐缩小消失
    color: {
      start: new Color(255, 220, 120),
      end: new Color(255, 80, 0),
    },
  },
});
emitter.position = new Vec2(160, 120);
emitter.start();

let lastTime = performance.now();

function frame(time: number) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  emitter.update(dt);

  rapid.clear();
  emitter.render();
  rapid.flush();
  
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

`update` 的参数是`距上一帧的秒数`（delta time），不是毫秒，注意换算。

## 动画属性 animation

`animation` 里每个属性都可以写成三种形式：

- 固定值：`scale: 1`
- 一个 `ParticleAttribute` 对象：`scale: { start: 1, end: 0 }`
- 一个随机 `[min, max]` 范围
- 组合起来使用：`speed: { start: [80, 160], end: 0 }`

`ParticleAttribute` 支持这些字段：

- `start`  -  初始值。
- `end`  -  结束值。
- `damping`  -  每秒的乘性衰减系数，比如 `0.9` 表示每秒乘以 `0.9`。
- `delta`  -  显式指定每秒变化量；不写时会根据 `start` 和 `end` 生命周期自动推算。

可动画的属性：

- `speed`  -  沿 `rotation` 方向的速度（像素/秒）。
- `rotation`  -  旋转角度（弧度），同时决定 `speed` 的方向。
- `scale`  -  统一缩放。
- `color`  -  染色（`Color`，0~255 分量）。
- `velocity`  -  附加速度向量（像素/秒）。用 `velocity.delta` 可以模拟恒定加速度（比如重力）。

```ts
animation: {
  velocity: { start: new Vec2(0, -60), delta: new Vec2(0, 200) },   // 初速向上，受重力影响
  color: {
    start: new Color(255, 255, 255),
    end: new Color(255, 255, 255, 0), // 淡出
  },
}
```

## 发射形状

`emitShape` 决定粒子从哪里生成：

- `ParticleShape.POINT`  -  从一个点（默认）。
- `ParticleShape.CIRCLE`  -  在半径 `emitRadius` 的圆内随机。
- `ParticleShape.RECT`  -  在 `emitRect`（`{ width, height }`）范围内随机。

```ts
const emitter = new ParticleEmitter(rapid, {
  texture: spark,
  life: 1,
  emitShape: ParticleShape.RECT,
  emitRect: { width: 200, height: 20 },
  animation: { /* ... */ },
});
```

## 发射节奏

- `emitRate`  -  连续模式下每秒发射的数量；突发模式下每次突发的数量。
- `emitTime`  -  大于 0 时进入突发模式，每隔 `emitTime` 秒发射一批，而不是连续发射。
- `maxParticles`  -  同时存在的粒子上限。

`setEmitRate` / `setEmitTime` 也可以在运行时调整：

```ts
emitter.setEmitRate(30);
emitter.setEmitTime(0.5); // 每 0.5 秒喷一次
```

需要一次性爆发时用 `emit(count)` 或 `oneShot()`：

```ts
emitter.emit(50);   // 立刻生成 50 个（受 maxParticles 限制）
emitter.oneShot();  // 立刻发射 emitRate 个
```

## 局部空间与世界空间

`localSpace`（默认 `true`）决定粒子跟随发射器还是留在世界里：

- `localSpace: true`  -  粒子相对发射器定位，移动 `emitter.position` 时整团粒子一起移动，适合火焰、拖尾等跟随效果。
- `localSpace: false`  -  粒子生成时记录世界位置，之后不再跟随发射器，适合喷溅、爆炸的碎屑。

## 控制发射器

```ts
emitter.start();   // 开始发射
emitter.stop();    // 停止发射，已有粒子继续走完生命周期
emitter.clear();   // 立刻清除所有粒子

emitter.getParticleCount(); // 当前存活粒子数
emitter.isActive();         // 是否还在发射或还有存活粒子
```
