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
        _scaleResolution: 1,
        dirty: false,
        scale: 1,
        _text: "Rapid",
        _style: { fontSize: 10 },
        update: vi.fn(function () {
            this.dirty = false;
        }),
    });

    return {
        texture,
        setViewportResolution(value) {
            viewport.resolution = value;
        },
    };
};

describe("TextTexture resolution levels", () => {
    it("defers scale resolution updates and skips unchanged values", () => {
        const { texture } = createTextTextureStub();

        texture.scaleResolution = 2;
        expect(texture.scaleResolution).toBe(2);
        expect(texture.update).not.toHaveBeenCalled();
        texture.ensureUpdated();
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(1);

        texture.scaleResolution = 2;
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(1);

        texture.scaleResolution = 0.5;
        expect(texture.scaleResolution).toBe(0.5);
        expect(texture.update).toHaveBeenCalledTimes(1);
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(2);
    });

    it("coalesces text, style and resolution changes before rendering", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        texture.text = "First";
        texture.text = "Final";
        texture.style = { fontSize: 32 };
        texture.scaleResolution = 3;
        setViewportResolution(2);
        texture.updateResolution();

        expect(texture.update).not.toHaveBeenCalled();
        texture.ensureUpdated();
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(1);
        expect(texture.text).toBe("Final");
        expect(texture.style.fontSize).toBe(32);
        expect(texture.scaleResolution).toBe(3);
        expect(texture.resolution).toBe(2);

        texture.text = "Final";
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(1);
    });

    it("uses the effective resolution without enlarging logical dimensions", () => {
        const { texture } = createTextTextureStub();
        Object.assign(texture, {
            resolution: 2,
            canvas: { width: 1, height: 1 },
            ctx: {
                measureText: () => ({
                    width: 80,
                    actualBoundingBoxAscent: 24,
                    actualBoundingBoxDescent: 8,
                    fontBoundingBoxDescent: 8,
                }),
                setTransform: vi.fn(),
                clearRect: vi.fn(),
                fillText: vi.fn(),
            },
            _text: "Rapid",
            _style: { fontSize: 32, lineHeight: 1, fill: "white" },
            options: {},
            base: { width: 0, height: 0, updateSource: vi.fn() },
            update: TextTexture.prototype.update,
        });
        texture.base.updateSource.mockImplementation(() => {
            texture.base.width = texture.canvas.width;
            texture.base.height = texture.canvas.height;
        });

        texture.update();
        expect(texture.width).toBe(82);
        texture.scaleResolution = 3;
        expect(texture.canvas.width).toBe(164);
        texture.ensureUpdated();
        texture.ensureUpdated();

        expect(texture.ctx.setTransform).toHaveBeenLastCalledWith(6, 0, 0, -6, 0, 196);
        expect(texture.canvas.width).toBe(484);
        expect(texture.scale).toBe(1 / 6);
        expect(texture.width).toBeCloseTo(80 + 4 / 6);
        expect(texture.height).toBeCloseTo(32 + 4 / 6);
        expect(texture.base.updateSource).toHaveBeenCalledTimes(2);

        // Explicit update() still refreshes changes made through the style getter.
        texture.style.fill = "red";
        texture.update();
        expect(texture.ctx.fillStyle).toBe("red");
        expect(texture.base.updateSource).toHaveBeenCalledTimes(3);
    });

    it("tracks fractional viewport resolution exactly", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(1.25);
        texture.updateResolution();
        expect(texture.resolution).toBe(1.25);
        expect(texture.update).not.toHaveBeenCalled();
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(1);

        setViewportResolution(1.29);
        texture.updateResolution();
        expect(texture.resolution).toBe(1.29);
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(2);

        setViewportResolution(1.31);
        texture.updateResolution();
        expect(texture.resolution).toBe(1.31);
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(3);
    });

    it("tracks large viewport resolutions exactly", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(5);
        texture.updateResolution();
        expect(texture.resolution).toBe(5);
        texture.ensureUpdated();

        setViewportResolution(6);
        texture.updateResolution();
        expect(texture.resolution).toBe(6);
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(2);
    });

    it("updates for small resolution changes", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(0.05);
        texture.updateResolution();
        expect(texture.resolution).toBe(0.05);
        texture.ensureUpdated();

        setViewportResolution(0.09);
        texture.updateResolution();
        expect(texture.resolution).toBe(0.09);
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(2);

        setViewportResolution(0.11);
        texture.updateResolution();
        expect(texture.resolution).toBe(0.11);
        texture.ensureUpdated();
        expect(texture.update).toHaveBeenCalledTimes(3);
    });

    it("does not rerender when the viewport resolution is unchanged", () => {
        const { texture, setViewportResolution } = createTextTextureStub();

        setViewportResolution(2);
        texture.updateResolution();
        texture.ensureUpdated();
        texture.updateResolution();
        texture.ensureUpdated();

        expect(texture.resolution).toBe(2);
        expect(texture.update).toHaveBeenCalledTimes(1);
    });
});
