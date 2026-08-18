# Masks and Clipping

Masking allows you to clip subsequent draw calls using arbitrary shapes: first, you render a geometry shape into the WebGL stencil buffer, then restrict target contents to render only `inside` or `outside` that shape. Rapid.js implements masking via WebGL stencil testing, meaning any geometry (rectangles, circles, polygons, or even image alpha channels) can serve as a mask shape.

## withMask

The simplest approach is `withMask(maskCb, drawCb)`. The first callback draws the mask shape (writes to stencil only, invisible), while the second callback draws the clipped content.

```ts
rapid.withMask(
  () => {
    // Mask shape: a circle
    rapid.drawCircle({ radius: 100, x: 160, y: 120 });
  },
  () => {
    // Only content inside the circle will render
    rapid.drawSprite({ texture: background });
  },
);
```

## Inside vs Outside: MaskType

The 3rd argument `type` controls which side of the mask renders content:

- `MaskType.EQUAL`: Draws inside the mask shape (default).
- `MaskType.NOT_EQUAL`: Draws outside the mask shape (hole-punch cutout effect).

```ts
import { MaskType } from "rapid-render";

rapid.withMask(
  () => rapid.drawCircle({ radius: 80, x: 160, y: 120 }),
  () => rapid.drawRect({ width: 320, height: 240, color: new Color(36, 49, 66) }),
  MaskType.NOT_EQUAL, // The circular area is cut out
);
```

## Using Image Alpha as Mask

`drawSprite` is skipped during the mask writing phase; instead, use `drawMaskImage`, which uses a texture's alpha channel as the stencil mask shape—ideal for irregular cutouts.

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

## Lower-Level Control

`withMask` wraps the following underlying methods. When you need to reuse the same mask across multiple draw passes or manage stencil reference values manually, call them directly:

```ts
rapid.clearMask();          // Clear stencil buffer
rapid.startDrawMask(1);     // Begin writing mask, ref value = 1
rapid.drawCircle({ radius: 100, x: 160, y: 120 });
rapid.endDrawMask();        // End writing mask, restore color buffer writes

rapid.enterMask(MaskType.EQUAL, 1); // Enter mask-constrained rendering
rapid.drawSprite({ texture: background });
rapid.exitMask();           // Exit, restore normal rendering
```

- `startDrawMask(ref, mask)` / `endDrawMask()`: Defines the mask shape phase.
- `enterMask(type, ref, mask)` / `exitMask()`: Renders contents constrained by the mask.
- `clearMask(mask)`: Clears the stencil buffer for a brand new mask.

`ref` is the stencil reference value. Using distinct reference values enables layered multi-level masks. For most cases, `withMask` is sufficient.

## Difference from Scissor Rectangular Clipping

If you only need to restrict rendering within a rectangular boundary, [Scissor](#advanced) clipping is lighter and faster. Stencil masks suit arbitrary shapes, while scissor clipping suits regular rectangular viewports.
