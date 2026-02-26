import performanceCode from './performance.ts?raw';
import shaderCode from './shader.ts?raw';
import blendCode from './blend.ts?raw';

import * as performanceModule from './performance.ts';
import * as shaderModule from './shader.ts';
import * as blendModule from './blend.ts';

export interface Example {
    name: string;
    code: string;
    init: () => Promise<{
        loop: (dt: number) => void;
        resize?: (w: number, h: number) => void;
        destroy?: () => void;
    }>;
}

export const examples: Example[] = [
    {
        name: 'Benchmark',
        code: performanceCode,
        init: async () => performanceModule.init(),
    },
    {
        name: 'Blend Mode',
        code: blendCode,
        init: async () => blendModule.init(),
    },
    {
        name: 'Demo',
        code: shaderCode,
        init: async () => shaderModule.init(),
    },
];
