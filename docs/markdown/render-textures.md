# Render Textures

A `RenderTexture` is a texture that can be rendered into (underpinned by a WebGL FramebufferObject). You can draw contents offscreen into a `RenderTexture` first, then draw it onto the screen like a standard texture. It is commonly used for offscreen compositing, caching complex scenes, and post-processing FX chains.

## Creation

Create a render texture using `rapid.texture.createRenderTexture(options)`, specifying width and height.

```ts
const rt = rapid.texture.createRenderTexture({
  width: 320,
  height: 240,
});
```

## drawToRenderTexture

The most convenient API is `drawToRenderTexture(rt, callback)`. It automatically switches render targets, clears background, executes callback draw commands, and switches back to the main canvas framebuffer.

```ts
rapid.drawToRenderTexture(rt, () => {
  rapid.drawSprite({ texture: toycar, x: 40, y: 40 });
  rapid.drawCircle({ radius: 30, x: 160, y: 120, color: new Color(95, 195, 122) });
});

// Afterward, draw rt like a normal texture
rapid.clear();
rapid.drawSprite({ texture: rt, x: 0, y: 0 });
rapid.flush();
```

The 3rd argument is clear color, defaulting to transparent black `(0, 0, 0, 0)`. Passing `null` skips clearing, allowing accumulative drawing on top of existing contents.

```ts
rapid.drawToRenderTexture(rt, () => {
  rapid.drawSprite({ texture: spark, x, y });
}, null); // Skip clear, accumulate draw pass
```

## Manual Target Switching

For lower-level control, use paired calls `enterRenderTexture` / `leaveRenderTexture`, with `clearRenderTexture` in between. `drawToRenderTexture` is a wrapper around these methods.

```ts
rapid.enterRenderTexture(rt);
rapid.clearRenderTexture(new Color(0, 0, 0, 0));

rapid.drawSprite({ texture: hero });

rapid.leaveRenderTexture();
```

Remember that `enterRenderTexture` and `leaveRenderTexture` must strictly pair together; otherwise subsequent rendering will continue rendering to offscreen textures.

## Resizing

`RenderTexture` supports `resize` using a **grow-only GPU allocation strategy**: VRAM memory is re-allocated only when the new dimensions exceed historical maximum allocations. Shrinking dimensions merely updates logical dimensions and UV bounds without GPU re-allocations. Thus, calling `resize` per frame is safe and performant.

```ts
rt.resize(newWidth, newHeight);
```
