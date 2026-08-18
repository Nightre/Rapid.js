import { Color } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default function (rapid) {
  rapid.clear();

  // Triangle
  rapid.drawGraphic({
    points: [
      { x: 60, y: 110 },
      { x: 140, y: 110 },
      { x: 100, y: 40 },
    ],
    color: new Color(52, 152, 219),
  });

  // Quad, wound as a fan from the first point
  rapid.drawGraphic({
    points: [
      { x: 190, y: 45 },
      { x: 290, y: 45 },
      { x: 290, y: 110 },
      { x: 190, y: 110 },
    ],
    color: new Color(46, 204, 113),
    drawMode: rapid.gl.TRIANGLE_FAN,
  });

  // Pentagon, generated on the unit circle
  const pentagon = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    pentagon.push({
      x: 390 + Math.cos(angle) * 40,
      y: 78 + Math.sin(angle) * 40,
    });
  }
  rapid.drawGraphic({
    points: pentagon,
    color: new Color(155, 89, 182),
    drawMode: rapid.gl.TRIANGLE_FAN,
  });

  // A colour per vertex blends across the surface
  rapid.drawGraphic({
    points: [
      { x: 60, y: 250 },
      { x: 140, y: 250 },
      { x: 100, y: 180 },
    ],
    color: [
      new Color(231, 76, 60),
      new Color(241, 196, 15),
      new Color(52, 152, 219),
    ],
  });

  rapid.drawRect({
    x: 190,
    y: 185,
    width: 100,
    height: 65,
    color: new Color(52, 73, 94),
  });

  // Fewer segments makes the approximation visible
  rapid.drawCircle({ x: 360, y: 215, radius: 34, color: new Color(230, 126, 34) });
  rapid.drawCircle({
    x: 430,
    y: 215,
    radius: 34,
    segments: 6,
    color: new Color(41, 128, 185),
  });

  rapid.flush();
}
