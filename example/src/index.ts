import performanceCode from './performance.ts?raw';
import shaderCode from './shader.ts?raw';
import blendCode from './blend.ts?raw';
import outlineCode from './outline.ts?raw';
import filtersCode from './filters.ts?raw';
import waterCode from './water.ts?raw';
import lineCode from './line.ts?raw';
import particleCode from './particle.ts?raw';

import * as performanceModule from './performance.ts';
import * as shaderModule from './shader.ts';
import * as blendModule from './blend.ts';
import * as outlineModule from './outline.ts';
import * as filtersModule from './filters.ts';
import * as waterModule from './water.ts';
import * as lineModule from './line.ts';
import * as particleModule from './particle.ts';
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
    {
        name: 'Outline Shader',
        code: outlineCode,
        init: async () => outlineModule.init(),
    },
    {
        name: 'Multi Filters',
        code: filtersCode,
        init: async () => filtersModule.init(),
    },
    {
        name: 'Render Texture',
        code: waterCode,
        init: async () => waterModule.init(),
    },
    {
        name: 'Line Drawing',
        code: lineCode,
        init: async () => lineModule.init(),
    },
    {
        name: 'Particles',
        code: particleCode,
        init: async () => particleModule.init(),
    },
];

