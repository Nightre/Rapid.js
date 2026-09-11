import { SpriteRegion } from "./spriteRegion";
import VsShaderSource from "../shader/sprite.vert?raw";
import AtlasFsShaderSource from "../shader/sprite_atlas.frag?raw";
import type { Rapid } from "../render";

export class AtlasSpriteRegion extends SpriteRegion {
    KEY = "AtlasSprite"
    constructor(rapid: Rapid) {
        super(rapid)
    }

    createDefaultShader() {
        this.vs = VsShaderSource;
        this.fs = AtlasFsShaderSource;
        this.defaultShader = this.createShader(VsShaderSource, AtlasFsShaderSource)
        return this.defaultShader;
    }
}
