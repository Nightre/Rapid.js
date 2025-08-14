import typescript from 'rollup-plugin-typescript2';
import { string } from "rollup-plugin-string";
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
    input: `src/index.ts`,
    output: [
        {
            file: "./dist/rapid.js",
            format: 'es',
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
        resolve(),
        commonjs()
    ],
};