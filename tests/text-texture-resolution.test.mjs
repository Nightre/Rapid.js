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
    it("keeps fractional resolution below 2x and updates at font-pixel boundaries", () => {
        const { texture, setMatrixScale } = createTextTextureStub();

        setMatrixScale(1.25);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(1.25);
        expect(texture.update).toHaveBeenCalledTimes(1);

        setMatrixScale(1.29);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(1.25);
        expect(texture.update).toHaveBeenCalledTimes(1);

        setMatrixScale(1.31);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(1.31);
        expect(texture.update).toHaveBeenCalledTimes(2);
    });

    it("uses power-of-two levels above 2x", () => {
        const { texture, setMatrixScale } = createTextTextureStub();

        setMatrixScale(5);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(8);

        setMatrixScale(6);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(8);
        expect(texture.update).toHaveBeenCalledTimes(1);
    });

    it("ignores tiny resolution changes within the same font-pixel size", () => {
        const { texture, setMatrixScale } = createTextTextureStub();

        setMatrixScale(0.05);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(0.05);

        setMatrixScale(0.09);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(0.05);
        expect(texture.update).toHaveBeenCalledTimes(1);

        setMatrixScale(0.11);
        texture.updateResolution(0);
        expect(texture.resolution).toBe(0.11);
        expect(texture.update).toHaveBeenCalledTimes(2);
    });
});
