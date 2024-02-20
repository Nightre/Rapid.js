import typescript from 'rollup-plugin-typescript2';
import { terser } from "rollup-plugin-terser";
import { string } from "rollup-plugin-string";

export default {
    input: `src/index.ts`,
    output: [
        {
            file: "./dist/rapid.umd.cjs",
            exports: 'named',
            format: 'cjs',
        },
        {
            file: "./dist/rapid.js",
            format: 'es',
        },
        {
            file: 'dist/rapid.global.js',
            name: 'rapid',
            format: 'iife',
        },
    ],
    plugins: [
        typescript({
            tsconfig: "./tsconfig.json",
            tsconfigOverride: {
                compilerOptions: {
                    emitDeclarationOnly: false
                }
            }
        }),
        string({
            include: [
                "**/*.frag",
                "**/*.vert"
            ]
        }),
        terser()
    ],
};