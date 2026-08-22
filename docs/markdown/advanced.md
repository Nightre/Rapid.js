# Advanced Rendering

This chapter covers lower-level rendering controls: rectangular scissor clipping, blend modes, and fast raw rendering bypassing transform parsing. These are useful for visual FX and optimizing hot loop bottlenecks.

## Scissor Rectangular Clipping

Scissor restricts rendering to a rectangular boundary; pixels outside the rectangle are discarded immediately. Coordinates use the same logical coordinate system as draw calls (top-left origin).

The most convenient syntax is `withScissor(x, y, width, height, cb)`—all draw calls inside the callback will be clipped:

```ts
rapid.withScissor(50, 50, 300, 200, () => {
  rapid.drawSprite({ texture: background, x: 0, y: 0 });
  rapid.drawSprite({ texture: hero, x: heroX, y: heroY });
});
```

You can also use manual paired calls `startScissor` / `endScissor`:

```ts
rapid.startScissor(50, 50, 300, 200);
rapid.drawSprite({ texture: background });
rapid.endScissor();
```

Scissor clipping is ideal for minimaps, scroll lists, and split-screen viewports. For arbitrary shape clipping, use [Masks](#masks).

> `startScissor` and `withScissor` will `flush` previous queued draw calls first.

## Blend Modes

Blend modes dictate how newly rendered pixels combine with existing canvas pixels. `BlendMode` provides the following modes:

- `BlendMode.NORMAL`: Standard alpha blending (default).
- `BlendMode.ADD`: Additive blending; ideal for glows, fire, and energy effects.
- `BlendMode.MULTIPLY`: Multiply blending; ideal for shadows and darkening.
- `BlendMode.SCREEN`: Screen blending; softer brightening than additive blending.
- `BlendMode.ERASE`: Erase blending; reduces target alpha using source alpha.

The most convenient syntax is `withBlendMode(mode, cb)`, which restores `NORMAL` blend mode automatically after the callback finishes:

```ts
import { BlendMode } from "rapid-render";

rapid.withBlendMode(BlendMode.ADD, () => {
  rapid.drawSprite({ texture: glow, x: 100, y: 80 });
  rapid.drawSprite({ texture: glow, x: 160, y: 120 });
});
```

You can also switch manually with `setBlendMode`; remember to switch back to `NORMAL` afterwards:

```ts
rapid.setBlendMode(BlendMode.MULTIPLY);
rapid.drawSprite({ texture: shadow });
rapid.setBlendMode(BlendMode.NORMAL);
```

> `setBlendMode` will `flush` previous queued draw calls first.