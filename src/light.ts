import { Vec2 } from "./math";
import Rapid from "./render";

export class LightManager {
    render: Rapid
    constructor(render: Rapid) {
        this.render = render
    }

    createLightShadowMaskPolygon(occlusion: Vec2[][], lightSource: Vec2, baseProjectionLength?: number) {
        const occlusionSide: Array<[Vec2, Vec2]> = []
        occlusion.forEach(shape => {
            for (let i = 0; i < shape.length; i++) {
                const start = shape[i]
                const end = shape[(i + 1) % shape.length]
                occlusionSide.push([start, end])
            }
        })
        baseProjectionLength = baseProjectionLength || Math.sqrt(Math.pow(this.render.width, 2) + Math.pow(this.render.height, 2))
        const shadowPolygons: Vec2[][] = [];
        occlusionSide.forEach(([start, end]) => {
            const toStart = new Vec2(start.x - lightSource.x, start.y - lightSource.y);
            const toEnd = new Vec2(end.x - lightSource.x, end.y - lightSource.y);

            const edge = end.subtract(start);
            const normal = edge.perpendicular();

            // 求 COS 值
            const rateStart = Math.abs(normal.dot(toStart)) / (normal.length() * toStart.length()) + 0.01;
            const rateEnd = Math.abs(normal.dot(toEnd)) / (normal.length() * toEnd.length()) + 0.01;

            const startProjectionLength = baseProjectionLength / rateStart;
            const endProjectionLength = baseProjectionLength / rateEnd;

            const startRay = new Vec2(toStart.x, toStart.y).normalize();
            const endRay = new Vec2(toEnd.x, toEnd.y).normalize();

            const startProjection = new Vec2(
                start.x + startRay.x * startProjectionLength,
                start.y + startRay.y * startProjectionLength
            );

            const endProjection = new Vec2(
                end.x + endRay.x * endProjectionLength,
                end.y + endRay.y * endProjectionLength
            );

            shadowPolygons.push([
                start,
                end,
                endProjection,
                startProjection
            ]);
        });

        return shadowPolygons;
    }
}