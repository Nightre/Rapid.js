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

export interface ISpriteOptions extends IDrawOptions {
    texture: Texture;
    color?: Color;
    flipX?: boolean;
    flipY?: boolean;
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

const hasTransformOptions = (options: ITransformOptions): boolean => (
    options.saveTransform !== undefined ||
    options.afterSave !== undefined ||
    options.x !== undefined ||
    options.y !== undefined ||
    options.position !== undefined ||
    options.rotation !== undefined ||
    options.scale !== undefined ||
    options.offsetX !== undefined ||
    options.offsetY !== undefined ||
    options.offset !== undefined ||
    options.origin !== undefined
);

const withOptionsTransform = (
    rapid: Rapid,
    options: ITransformOptions,
    width: number,
    height: number,
    draw: () => void,
) => {
    if (!hasTransformOptions(options)) {
        draw();
        return;
    }

    // matrixStack save in applyTransform
    rapid.matrixStack.applyTransform(options, width, height);
    try {
        draw();
    } finally {
        if (options.saveTransform ?? true) {
            rapid.matrixStack.restore();
        }
    }
};

const getColorUint32 = (rapid: Rapid, color?: Color): number => {
    if (!color) return 0xFFFFFFFF;
    return rapid.premultipliedAlpha ? color.premultipliedUint32 : color.uint32;
};

export const drawSpriteRaw = (rapid: Rapid, options: ISpriteOptions): void => {
    const texture = options.texture;
    if (!texture?.base || rapid.inCreateMask) {
        return;
    }

    rapid.enterRegion(rapid.spriteRegion, options.shader);

    let u0 = texture.uvX;
    let v0 = texture.uvY;
    let u1 = texture.uvW;
    let v1 = texture.uvH;

    if (options.flipX) {
        [u0, u1] = [u1, u0];
    }
    if (options.flipY) {
        [v0, v1] = [v1, v0];
    }

    rapid.spriteRegion.drawSprite(
        texture,
        options.customMatrix ?? rapid.matrixStack.curWorldM,
        u0,
        v0,
        u1,
        v1,
        getColorUint32(rapid, options.color),
    );
};

export const drawSprite = (rapid: Rapid, options: ISpriteOptions): void => {
    withOptionsTransform(rapid, options, options.texture.width, options.texture.height, () => {
        drawSpriteRaw(rapid, options);
    });
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
    withOptionsTransform(rapid, options, options.texture.width, options.texture.height, () => {
        rapid.startMaskGraphic(
            rapid.gl.TRIANGLE_FAN,
            options.texture,
            options.customMatrix,
        );
        rapid.addRectVertex(options.texture.width, options.texture.height);
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
