import { canvasRenderer } from "./canvas2d.js";
import { excaliburRenderer } from "./excalibur.js";
import { phaserRenderer } from "./phaser.js";
import { pixiRenderer } from "./pixijs.js";
import { rapidRenderer } from "./rapid.js";

export const renderers = [
    rapidRenderer,
    pixiRenderer,
    phaserRenderer,
    excaliburRenderer,
    canvasRenderer,
];
