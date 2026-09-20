import { describe, expect, it, vi } from "vitest";
import { TextTexture } from "../src/texture.ts";

const createTextTextureStub = () => {
    let matrixScale = 1;
    const texture = Object.create(TextTexture.prototype);

    Object.assign(texture, {
        render: {
            matrix: {
                getScale: () => ({ x: matrixScale, y: matrixScale }),
            },
            viewport: { resolution: 1 },
        },
        resolutionLevel: 0,
        resolution: 1,
        scale: 1,
        _style: { fontSize: 10 },
        update: vi.fn(),
    });

    return {
        texture,
        setMatrixScale(value) {
            matrixScale = value;
        },
    };
};

describe("TextTexture resolution levels", () => {
    it("tracks fractional matrix scale exactly", () => {
        const { texture, setMatrixScale } = createTextTextureStub();

        setMatrixScale(1.25);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(1.25);
        expect(texture.update).toHaveBeenCalledTimes(1);

        setMatrixScale(1.29);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(1.29);
        expect(texture.update).toHaveBeenCalledTimes(2);

        setMatrixScale(1.31);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(1.31);
        expect(texture.update).toHaveBeenCalledTimes(3);
    });

    it("tracks large matrix scales exactly", () => {
        const { texture, setMatrixScale } = createTextTextureStub();

        setMatrixScale(5);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(5);

        setMatrixScale(6);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(6);
        expect(texture.update).toHaveBeenCalledTimes(2);
    });

    it("updates for small resolution changes", () => {
        const { texture, setMatrixScale } = createTextTextureStub();

        setMatrixScale(0.05);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(0.05);

        setMatrixScale(0.09);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(0.09);
        expect(texture.update).toHaveBeenCalledTimes(2);

        setMatrixScale(0.11);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(0.11);
        expect(texture.update).toHaveBeenCalledTimes(3);
    });
});
