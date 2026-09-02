# 粒子绘制

`drawParticles` 是 Rapid.js 直接的粒子绘制 API。适合你已经自己管理粒子状态，只想让 Rapid.js 用很小的开销把它们画出来。

## 适用场景：

常用于粒子特效、瓦片地图等海量元素的绘制。
与 `drawSprite` 的区别：

- 限制：仅适用于绘制基于同一张基础纹理（BaseTexture，可使用图集内的不同子区域Atlas）的大量元素。

- 收益：规避了复杂的节点计算，从而获得极其显著的性能提升。

如果你希望 Rapid.js 帮你创建、更新、回收和绘制粒子，用 [ParticleEmitter](#particles)。

它和 PixiJS 的 `ParticleContainer` 很像：你把一组紧凑的粒子属性交给渲染器，渲染器用同一张纹理高效地画出大量 sprite。

## drawParticles

```ts
const count = 10000;
const x = new Array(count);
const y = new Array(count);
const rotation = new Array(count);
const color = new Array(count);

for (let i = 0; i < count; i++) {
  x[i] = Math.random() * rapid.width;
  y[i] = Math.random() * rapid.height;
  rotation[i] = Math.random() * Math.PI * 2;
  color[i] = new Color(255, 255, 255);
}

function frame() {
  rapid.clear();

  rapid.drawParticles({
    texture: spark,
    x,
    y,
    rotation,
    color, // 传入 ArrayLike
    scaleX: 1, // 传入标量
    scaleY: 1, // 标量或 ArrayLike 都可以 drawParticles 会自动识别
    // 可以指定每个粒子的独立uv，这在制作瓦片地图时十分有用
    // u0: [...]
    // v0: [...]
    // u1: [...]
    // v1: [...]
  }); 

  rapid.flush();
  requestAnimationFrame(frame);
}
```
