import typescript from 'rollup-plugin-typescript2';
import server from 'rollup-plugin-server'
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
        typescript(),
        string({
            include: [
                "**/*.frag",
                "**/*.vert"
            ]
        }),
        server({
            open: true,
            contentBase: '.',
            port:8080
        })
    ],
};