# 渲染纹理

RenderTexture 是一张可以被绘制到的纹理（底层是 WebGL 的 FramebufferObject）。你可以先把一批内容画进 RenderTexture，再把它当成普通纹理画到屏幕上。常用于离屏合成、缓存复杂画面、做后期特效等。

## 创建

用 `rapid.texture.createRenderTexture(options)` 创建，必须指定宽高。

```ts
const rt = rapid.texture.createRenderTexture({
  width: 320,
  height: 240,
});
```

## drawToRenderTexture

最方便的写法是 `drawToRenderTexture(rt, callback)`。它会自动切换渲染目标、清空、执行回调里的绘制，最后切回主画布。

```ts
rapid.drawToRenderTexture(rt, () => {
  rapid.drawSprite({ texture: toycar, x: 40, y: 40 });
  rapid.drawCircle({ radius: 30, x: 160, y: 120, color: new Color(95, 195, 122) });
});

// 之后就能把 rt 当普通纹理用
rapid.clear();
rapid.drawSprite({ texture: rt, x: 0, y: 0 });
rapid.flush();
```

第三个参数是清空颜色，默认透明黑 `(0, 0, 0, 0)`。传 `null` 可以跳过清空，在已有内容上继续叠加绘制。

```ts
rapid.drawToRenderTexture(rt, () => {
  rapid.drawSprite({ texture: spark, x, y });
}, null); // 不清空，累积绘制
```

## 手动进出

需要更细控制时，可以手动配对使用 `enterRenderTexture` / `leaveRenderTexture`，中间用 `clearRenderTexture` 清空。`drawToRenderTexture` 就是对它们的封装。

```ts
rapid.enterRenderTexture(rt);
rapid.clearRenderTexture(new Color(0, 0, 0, 0));

rapid.drawSprite({ texture: hero });

rapid.leaveRenderTexture();
```

记得 `enterRenderTexture` 和 `leaveRenderTexture` 必须成对出现，否则后续绘制会继续画到离屏纹理上。

## 调整大小

RenderTexture 支持 `resize`，采用 `只增不减` 的显存策略：只有当新尺寸超过历史最大分配时才会重新申请显存，缩小时只更新逻辑尺寸和 UV。所以可以放心地每帧调用。

```ts
rt.resize(newWidth, newHeight);
```