import { UniformType, WebGLContext } from '../interface';
export declare class Uniform {
    private data;
    isDirty: boolean;
    constructor(data: UniformType);
    setUniform(key: string, data: UniformType[string]): void;
    /**
     * @ignore
     */
    clearDirty(): void;
    getUnifromNames(): string[];
    bind(gl: WebGLContext, uniformName: string, loc: WebGLUniformLocation, usedTextureUnit: number): number;
}
