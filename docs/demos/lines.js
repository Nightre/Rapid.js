import { Color, LineTextureMode, TextureWrapMode, Vec2 } from "rapid-render";

/**
 * @param {import("rapid-render").Rapid} rapid
 * @param {{ loop: (cb: (time: number, delta: number) => void) => void }} ctx
 */
export default async function (rapid, { loop }) {
  // REPEAT wrap is what lets the texture tile along the line instead of
  // being clamped at the first copy.
  const ribbon = await rapid.texture.load("./image/line-texture.png", {
    wrap: TextureWrapMode.REPEAT,
  });

  loop((time) => {
    rapid.clear();

    // Two points, one segment. Line points must be Vec2.
    rapid.drawLine({
      points: [new Vec2(30, 45), new Vec2(200, 45)],
      width: 6,
      color: new Color(52, 152, 219),
    });

    // roundCap puts a semicircle on each end instead of a flat edge.
    rapid.drawLine({
      points: [new Vec2(30, 85), new Vec2(200, 85)],
      width: 6,
      roundCap: true,
      color: new Color(52, 152, 219),
    });

    // More points chain into a polyline; the joints are mitred.
    rapid.drawLine({
      points: [
        new Vec2(250, 85),
        new Vec2(300, 30),
        new Vec2(350, 85),
        new Vec2(400, 30),
        new Vec2(450, 85),
      ],
      width: 6,
      color: new Color(46, 204, 113),
    });

    // A curve is just a polyline with enough samples. Give it a texture and
    // the strip gets mapped along the line: REPEAT tiles one copy every
    // `texture.width` pixels of arc length, STRETCH would fit exactly one
    // copy across the whole thing. `width` here is the strip's thickness, so
    // matching the texture height keeps it from looking squashed.
    const wave = [];
    for (let x = 20; x <= 460; x += 6) {
      wave.push(new Vec2(x, 150 + Math.sin(x * 0.03 + time * 2) * 24));
    }
    rapid.drawLine({
      points: wave,
      width: 32,
      texture: ribbon,
      textureMode: LineTextureMode.REPEAT,
    });

    // closed joins the last point back to the first.
    const star = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + time;
      const radius = i % 2 === 0 ? 46 : 20;
      star.push(
        new Vec2(120 + Math.cos(angle) * radius, 230 + Math.sin(angle) * radius),
      );
    }
    rapid.drawLine({
      points: star,
      width: 3,
      closed: true,
      color: new Color(230, 126, 34),
    });

    // Width is uniform per line, but nothing stops it animating.
    const ring = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      ring.push(
        new Vec2(370 + Math.cos(angle) * 42, 225 + Math.sin(angle) * 42),
      );
    }
    rapid.drawLine({
      points: ring,
      width: 8 + Math.sin(time * 3) * 5,
      closed: true,
      color: new Color(52, 73, 94),
    });

    rapid.flush();
  });
}
