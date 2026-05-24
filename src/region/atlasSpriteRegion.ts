import { generateShader } from "../webgl/utils";
import { SpriteRegion } from "./spriteRegion";
import VsShaderSource from "../shader/sprite.vert?raw";
import AtlasFsShaderSource from "../shader/sprite_atlas.frag?raw";
import { Rapid } from "../render";
import { CustomGlShader } from "../webgl/glshader";

export class AtlasSprtieRegion extends SpriteRegion {
    KEY = "AtlasSprite"
    constructor(rapid:Rapid) {
        super(rapid)
    }

    createCustomShader(customShader: CustomGlShader) {
        // override sprite Region
        const fs = generateShader(AtlasFsShaderSource, this.rapid.maxTextureUnits - customShader.usedTextureUnitNum);
        const vs = generateShader(VsShaderSource, this.rapid.maxTextureUnits - customShader.usedTextureUnitNum);

        return customShader.getGLShader(this, this.KEY, vs, fs)
    }

    createDefaultShader() {
        const rapid = this.rapid
        const fs = generateShader(AtlasFsShaderSource, rapid.maxTextureUnits);
        const vs = generateShader(VsShaderSource, rapid.maxTextureUnits);
        this.vs = vs;
        this.fs = fs;
        this.defaultShader = this.createShader(vs, fs)
        return this.defaultShader;
    }
}