import { Color } from "rapid-render";

/** @param {import("rapid-render").Rapid} rapid */
export default function (rapid) {
  rapid.clear();

  rapid.drawRect({
    x: 190,
    y: 100,
    width: 100,
    height: 100,
    color: new Color(52, 152, 219),
  });

  rapid.flush();
}
