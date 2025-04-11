import typescript from 'rollup-plugin-typescript2';
import { string } from "rollup-plugin-string";

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
    ],
};