import { describe, expect, it, vi } from "vitest";
import { CanvasScaleMode } from "../src/render.ts";
import { ExpandMode, ViewPort } from "../src/viewport.ts";

const resizeViewport = (expandMode, cssWidth, cssHeight) => {
    const updateResolution = vi.fn();
    const rapid = {
        flush() {},
        canvas: {
            clientWidth: cssWidth,
            clientHeight: cssHeight,
            width: 0,
            height: 0,
            style: {},
        },
        dpr: 1,
        physicsWidth: cssWidth,
        physicsHeight: cssHeight,
        logicWidth: 400,
        logicHeight: 300,
        scaleMode: CanvasScaleMode.CanvasItem,
        gl: { viewport() {} },
        texture: {
            texture: new Set([{ updateResolution }]),
        },
    };
    const viewport = new ViewPort(rapid, { expand: expandMode });

    // These tests target resize's logical clip calculation, not WebGL state.
    viewport.updateProjection = () => {};
    viewport.restoreViewportScissor = () => {};
    viewport.resize(400, 300, cssWidth, cssHeight);

    return viewport;
};

describe("ViewPort scissor bounds", () => {
    it("clips KEEP to the original logical rectangle on a wide screen", () => {
        const viewport = resizeViewport(ExpandMode.KEEP, 1600, 900);

        expect(viewport.viewLeft).toBeLessThan(0);
        expect(viewport.viewRight).toBeGreaterThan(400);
        expect(viewport.scissorViewport).toEqual({
            x: 0,
            y: 0,
            width: 400,
            height: 300,
        });
    });

    it("clips only the axis that KEEP_W does not expand", () => {
        const viewport = resizeViewport(ExpandMode.KEEP_W, 1600, 900);

        expect(viewport.scissorViewport).toEqual({
            x: 0,
            y: 0,
            width: 400,
            height: 300,
        });
    });

    it("does not clip an axis that the mode allows to expand", () => {
        const viewport = resizeViewport(ExpandMode.KEEP_H, 1600, 900);

        expect(viewport.scissorViewport).toBeNull();
    });
});

describe("ViewPort resolution", () => {
    it("updates registered textures when the canvas resolution changes", () => {
        const viewport = resizeViewport(ExpandMode.KEEP, 1600, 900);
        const texture = [...viewport.rapid.texture.texture][0];

        expect(viewport.resolution).toBe(3);
        expect(texture.updateResolution).toHaveBeenCalledTimes(1);

        viewport.resize(400, 300, 1600, 900);
        expect(texture.updateResolution).toHaveBeenCalledTimes(1);

        viewport.resize(400, 300, 800, 600);
        expect(viewport.resolution).toBe(2);
        expect(texture.updateResolution).toHaveBeenCalledTimes(2);
    });
});
