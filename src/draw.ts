import { Color } from "./color";
import { ITransformOptions } from "./matrix-engine";
import { Vec2 } from "./math";
import { Texture } from "./texture";
import GLShader, { CustomGlShader } from "./webgl/glshader";
import { ILineRenderOptions, getLineGeometry } from "./line";
import type { Rapid } from "./render";

export type DrawShader = GLShader | CustomGlShader;
export type DrawPoint = Vec2 | { x: number; y: number };

export interface IDrawOptions extends ITransformOptions {
    shader?: DrawShader;
    customMatrix?: number;
}

export interface IDrawParticleOptions {
    shader?: DrawShader;
    texture: Texture;
    color?: Color;
    flipX?: boolean;
    flipY?: boolean;

    x?: number;
    y?: number;
    position?: Vec2;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;

    isRotated?: boolean;
}

export interface IDrawParticleBatchOptions {
    shader?: DrawShader;
    texture: Texture;
    x: Array<number>;
    y: Array<number>;
    rotation: Array<number>;
    color: Array<Color>;
    count?: number;
    scaleX?: number;
    scaleY?: number;
    flipX?: boolean;
    flipY?: boolean;
    isRotated?: boolean;
}

export interface ISpriteOptions extends IDrawOptions {
    texture: Texture;
    color?: Color;
    flipX?: boolean;
    flipY?: boolean;
    padding?: number
}

export interface IGraphicOptions extends IDrawOptions {
    points: DrawPoint[];
    color?: Color | Color[];
    drawMode?: number;
    uv?: DrawPoint[];
    texture?: Texture;
}

export interface IMaskImageOptions extends IDrawOptions {
    texture: Texture;
}

export interface ILineOptions extends ILineRenderOptions, IDrawOptions { }

export interface IRectOptions extends IDrawOptions {
    width: number;
    height: number;
    color?: Color;
    texture?: Texture;
}

export interface ICircleOptions extends IDrawOptions {
    radius: number;
    color?: Color;
    segments?: number;
}

// const hasTransformOptions = (options: ITransformOptions): boolean => (
//     options.saveTransform !== undefined ||
//     options.afterSave !== undefined ||
//     options.x !== undefined ||
//     options.y !== undefined ||
//     options.position !== undefined ||
//     options.rotation !== undefined ||
//     options.scale !== undefined ||
//     options.offsetX !== undefined ||
//     options.offsetY !== undefined ||
//     options.offset !== undefined ||
//     options.origin !== undefined
// );

const withOptionsTransform = (
    rapid: Rapid,
    options: ITransformOptions,
    width: number,
    height: number,
    draw: () => void,
) => {
    // matrixStack save in applyTransform
    rapid.matrixStack.applyTransform(options, width, height);
    draw();

    try {
        draw();
    } finally {
        if (options.saveTransform !== false) {
            rapid.matrixStack.restore();
        }
    }
};

const getColorUint32 = (rapid: Rapid, color?: Color): number => {
    if (!color) return 0xFFFFFFFF;
    return rapid.premultipliedAlpha ? color.premultipliedUint32 : color.uint32;
};

const ATLAS_PADDING = 2
export const drawSpriteRaw = (rapid: Rapid, options: ISpriteOptions): void => {
    const texture = options.texture;
    if (!texture?.base || rapid.inCreateMask) {
        return;
    }

    const region = texture.isAtlas ? rapid.atlasSpriteRegion : rapid.spriteRegion
    rapid.enterRegion(region, options.shader);

    let u0 = texture.uvX;
    let v0 = texture.uvY;
    let u1 = texture.uvW;
    let v1 = texture.uvH;

    const flipX = !!options.flipX;
    const flipY = !!options.flipY !== !!texture.flipY; // XOR

    // pixel size
    let p = (options.padding ?? region.currentShader.padding);
    if (texture.isAtlas) {
        p += ATLAS_PADDING
    }

    // pass pixel size not uv size
    const paddingX = (u0 <= u1 ? p : -p);
    const paddingY = (v0 <= v1 ? p : -p);

    region.drawSprite(
        texture,
        options.customMatrix ?? rapid.matrixStack.curWorldM,
        u0,
        v0,
        u1,
        v1,
        getColorUint32(rapid, options.color),
        paddingX,
        paddingY,
        flipX,
        flipY,
        texture.isRotated,
    );
};

export const drawSprite = (rapid: Rapid, options: ISpriteOptions): void => {
    withOptionsTransform(rapid, options, options.texture.rawWidth, options.texture.rawHeight, () => {
        drawSpriteRaw(rapid, options);
    });
};

export const drawParticle = (rapid: Rapid, options: IDrawParticleOptions): void => {
    const region = rapid.particleRegion
    rapid.enterRegion(region, options.shader);
    const texture = options.texture

    const u0 = texture.uvX;
    const v0 = texture.uvY;
    const u1 = texture.uvW;
    const v1 = texture.uvH;

    region.drawParticle(
        texture,
        options.x,
        options.y,
        options.scaleX,
        options.scaleY,
        options.rotation,
        u0, v0, u1, v1,
        getColorUint32(rapid, options.color),
        options.flipX,
        options.flipY,
        options.isRotated
    )
};

export const drawParticles = (rapid: Rapid, options: IDrawParticleBatchOptions): void => {
    const region = rapid.particleRegion
    rapid.enterRegion(region, options.shader);
    const texture = options.texture

    const count = options.count ?? options.x.length;
    const color = options.color;

    const len = color.length;
    const numColor = new Array(len);

    if (rapid.premultipliedAlpha) {
        for (let i = 0; i < len; i++) {
            numColor[i] = color[i].premultipliedUint32;
        }
    } else {
        for (let i = 0; i < len; i++) {
            numColor[i] = color[i].uint32;
        }
    }

    region.drawParticles(
        texture,
        options.x,
        options.y,
        options.rotation,
        numColor,
        count,
        options.scaleX,
        options.scaleY,
        texture.uvX,
        texture.uvY,
        texture.uvW,
        texture.uvH,
        options.flipX,
        options.flipY,
        options.isRotated,
    )
};

export const drawGraphic = (rapid: Rapid, options: IGraphicOptions): void => {
    if (options.points.length === 0) return;

    withOptionsTransform(rapid, options, 0, 0, () => {
        rapid.startGraphic(
            options.drawMode ?? rapid.gl.TRIANGLES,
            options.texture,
            options.shader,
            options.customMatrix,
        );

        for (let i = 0; i < options.points.length; i++) {
            const point = options.points[i];
            const uv = options.uv?.[i];
            const color = Array.isArray(options.color) ? options.color[i] : options.color;

            rapid.addGraphicVertex(
                point.x,
                point.y,
                uv?.x ?? 0,
                uv?.y ?? 0,
                getColorUint32(rapid, color),
            );
        }

        rapid.endGraphic();
    });
};

export const drawLine = (rapid: Rapid, options: ILineOptions): void => {
    if (rapid.inCreateMask) {
        return;
    }

    const { vertices, uv } = getLineGeometry(options);
    drawGraphic(rapid, {
        ...options,
        points: vertices,
        uv,
        drawMode: rapid.gl.TRIANGLES,
    });
};

export const drawMaskImage = (rapid: Rapid, options: IMaskImageOptions): void => {
    withOptionsTransform(rapid, options, options.texture.rawWidth, options.texture.rawHeight, () => {
        rapid.startMaskGraphic(
            rapid.gl.TRIANGLE_FAN,
            options.texture,
            options.customMatrix,
        );
        rapid.addRectVertex(options.texture.rawWidth, options.texture.rawHeight);
        rapid.endGraphic();
    });
};

export const drawRect = (rapid: Rapid, options: IRectOptions): void => {
    withOptionsTransform(rapid, options, options.width, options.height, () => {
        rapid.startGraphic(
            rapid.gl.TRIANGLE_FAN,
            options.texture,
            options.shader,
            options.customMatrix,
        );
        rapid.addRectVertex(options.width, options.height, options.color);
        rapid.endGraphic();
    });
};

export const drawCircle = (rapid: Rapid, options: ICircleOptions): void => {
    const segments = options.segments ?? 32;

    withOptionsTransform(rapid, options, 0, 0, () => {
        rapid.startGraphic(
            rapid.gl.TRIANGLE_FAN,
            undefined,
            options.shader,
            options.customMatrix,
        );

        const unitColor = getColorUint32(rapid, options.color);
        rapid.addGraphicVertex(0, 0, 0.5, 0.5, unitColor);
        rapid.addCircleVertex(options.radius, options.color, segments);
        rapid.addGraphicVertex(options.radius, 0, 1, 0.5, unitColor);
        rapid.endGraphic();
    });
};
