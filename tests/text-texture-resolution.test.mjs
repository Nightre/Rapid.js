import { describe, expect, it, vi } from "vitest";
import { TextTexture } from "../src/texture.ts";

const createTextTextureStub = () => {
    const texture = Object.create(TextTexture.prototype);
    const viewport = { resolution: 1 };

    Object.assign(texture, {
        render: {
            viewport,
        },
        resolution: 1,
        scale: 1,
        _style: { fontSize: 10 },
        update: vi.fn(),
    });

    return {
        texture,
        setViewportResolution(value) {
            viewport.resolution = value;
        },
    };
};

describe("TextTexture resolution levels", () => {
    it("tracks fractional viewport resolution exactly", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(1.25);
        texture.updateResolution();
        expect(texture.resolution).toBe(1.25);
        expect(texture.update).toHaveBeenCalledTimes(1);

        setViewportResolution(1.29);
        texture.updateResolution();
        expect(texture.resolution).toBe(1.29);
        expect(texture.update).toHaveBeenCalledTimes(2);

        setViewportResolution(1.31);
        texture.updateResolution();
        expect(texture.resolution).toBe(1.31);
        expect(texture.update).toHaveBeenCalledTimes(3);
    });

    it("tracks large viewport resolutions exactly", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(5);
        texture.updateResolution();
        expect(texture.resolution).toBe(5);

        setViewportResolution(6);
        texture.updateResolution();
        expect(texture.resolution).toBe(6);
        expect(texture.update).toHaveBeenCalledTimes(2);
    });

    it("updates for small resolution changes", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(0.05);
        texture.updateResolution();
        expect(texture.resolution).toBe(0.05);

        setViewportResolution(0.09);
        texture.updateResolution();
        expect(texture.resolution).toBe(0.09);
        expect(texture.update).toHaveBeenCalledTimes(2);

        setViewportResolution(0.11);
        texture.updateResolution();
        expect(texture.resolution).toBe(0.11);
        expect(texture.update).toHaveBeenCalledTimes(3);
    });

    it("does not rerender when the viewport resolution is unchanged", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(2);
        texture.updateResolution();
        texture.updateResolution();

        expect(texture.resolution).toBe(2);
        expect(texture.update).toHaveBeenCalledTimes(1);
    });
});
