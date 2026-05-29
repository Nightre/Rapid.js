import { init } from './src/text.ts';

const demo = await init();
let lastTime = performance.now();

function tick(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    demo.loop(dt);
    requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
