import { Vec2 } from "./math";
import { Texture } from "./texture";

export enum LineTextureMode {
    STRETCH,
    REPEAT
}

export interface ILineRenderOptions {
    points: Vec2[];
    width?: number;
    closed?: boolean;
    roundCap?: boolean;
    textureMode?: LineTextureMode;
    texture?: Texture;
}

const LINE_ROUND_SEGMENTS = 10;

const addSemicircle = (center: Vec2, normal: Vec2, width: number, isStart: boolean, u: number, uvScaleU: number) => {
    const vertices: Vec2[] = [];
    const uv: Vec2[] = [];

    const startAngle = isStart ? Math.atan2(normal.y, normal.x) : Math.atan2(-normal.y, -normal.x);
    const totalAngle = Math.PI;
    const dir = new Vec2(normal.y, -normal.x); // 线段朝向方向

    for (let i = 0; i < LINE_ROUND_SEGMENTS; i++) {
        const t1 = i / LINE_ROUND_SEGMENTS;
        const t2 = (i + 1) / LINE_ROUND_SEGMENTS;
        const angle1 = startAngle + t1 * totalAngle;
        const angle2 = startAngle + t2 * totalAngle;

        const offset1 = new Vec2(Math.cos(angle1) * width, Math.sin(angle1) * width);
        const offset2 = new Vec2(Math.cos(angle2) * width, Math.sin(angle2) * width);

        vertices.push(center);
        uv.push(new Vec2(u, 0.5));

        vertices.push(center.add(offset1));
        uv.push(new Vec2(u + offset1.dot(dir) * uvScaleU, 0.5 - 0.5 * offset1.dot(normal) / width));

        vertices.push(center.add(offset2));
        uv.push(new Vec2(u + offset2.dot(dir) * uvScaleU, 0.5 - 0.5 * offset2.dot(normal) / width));
    }

    return { vertices, uv };
};
/**
 * @ignore
 */
export const getLineNormal = (points: Vec2[], closed: boolean = false): { normals: { normal: Vec2, miters: number }[], length: number } => {
    const normals: { normal: Vec2, miters: number }[] = [];
    if (points.length < 2 || (closed && points.length < 3)) return { normals, length: 0 };

    const maxMiterLength = 4; // 最大斜接长度限制
    const epsilon = 0.001; // 直线检测阈值
    const n = points.length;
    let length = 0;

    // 先计算总长度
    if (closed) {
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            length += p1.distanceTo(p2);
        }
    } else {
        for (let i = 0; i < n - 1; i++) {
            length += points[i].distanceTo(points[i + 1]);
        }
    }

    // 计算法线和斜接长度的通用函数
    const calculateNormal = (prev: Vec2, point: Vec2, next: Vec2) => {
        const dirA = point.subtract(prev).normalize();
        const dirB = point.subtract(next).normalize();
        const dot = dirB.dot(dirA);

        if (dot < -1 + epsilon) { // 近似直线
            return { normal: dirA.perpendicular(), miters: 1 };
        } else {
            let miter = dirB.add(dirA).normalize();
            if (dirA.cross(dirB) < 0) miter = miter.multiply(-1);
            let miterLength = 1 / Math.sqrt((1 - dot) / 2);
            return { normal: miter, miters: Math.min(miterLength, maxMiterLength) };
        }
    };

    if (closed) {
        // 处理闭合路径
        for (let i = 0; i < n; i++) {
            const prev = i === 0 ? points[n - 1] : points[i - 1];
            const point = points[i];
            const next = i === n - 1 ? points[0] : points[i + 1];
            normals.push(calculateNormal(prev, point, next));
        }
    } else {
        // 处理非闭合路径
        for (let i = 0; i < n; i++) {
            if (i === 0) {
                // 首点
                const direction = points[1].subtract(points[0]).normalize();
                normals.push({ normal: direction.perpendicular(), miters: 1 });
            } else if (i === n - 1) {
                // 尾点
                const direction = points[i].subtract(points[i - 1]).normalize();
                normals.push({ normal: direction.perpendicular(), miters: 1 });
            } else {
                // 中间点
                normals.push(calculateNormal(points[i - 1], points[i], points[i + 1]));
            }
        }
    }

    return { normals, length };
};


export const getLineGeometry = (options: ILineRenderOptions) => {
    const points = options.points;
    if (points.length < 2) return { vertices: [], uv: [] };

    const { normals, length } = getLineNormal(points, options.closed);
    const lineWidth = (options.width || 1.0) / 2; // 半宽
    const vertices: Vec2[] = [];
    const uv: Vec2[] = [];
    const roundCap = options.roundCap || false
    const textureMode = options.textureMode || LineTextureMode.STRETCH;
    let currentLength = 0;
    const textureWidth = options.texture?.width || 1;

    const segmentCount = options.closed ? points.length : points.length - 1;

    for (let i = 0; i < segmentCount; i++) {
        const point = points[i];
        const normal = normals[i].normal;
        const miters = normals[i].miters;

        const nextIdx = (i + 1) % points.length;
        const nextPoint = points[nextIdx];
        const nextNormal = normals[nextIdx].normal;
        const nextMiter = normals[nextIdx].miters;

        const top = point.add(normal.multiply(miters * lineWidth));
        const bottom = point.subtract(normal.multiply(miters * lineWidth));

        const nextTop = nextPoint.add(nextNormal.multiply(nextMiter * lineWidth));
        const nextBottom = nextPoint.subtract(nextNormal.multiply(nextMiter * lineWidth));

        // 计算当前线段长度
        const segmentLength = point.distanceTo(nextPoint);

        // 根据纹理模式计算UV
        let u1 = 0, u2 = 0;
        if (textureMode === LineTextureMode.STRETCH) {
            // 拉伸模式: UV坐标从0到1
            u1 = currentLength / length;
            u2 = (currentLength + segmentLength) / length;
        } else { // REPEAT模式
            // 重复模式: UV坐标根据线段长度重复
            u1 = currentLength / textureWidth;
            u2 = u1 + segmentLength / textureWidth;
        }

        // 确保逆时针缠绕（假设正面为逆时针）

        const topUv = new Vec2(u1, 0);
        const bottomUv = new Vec2(u1, 1);
        const nextTopUv = new Vec2(u2, 0);
        const nextBottomUv = new Vec2(u2, 1);

        vertices.push(top);
        uv.push(topUv);
        vertices.push(bottom);
        uv.push(bottomUv);
        vertices.push(nextTop);
        uv.push(nextTopUv);

        vertices.push(nextTop);
        uv.push(nextTopUv);
        vertices.push(nextBottom);
        uv.push(nextBottomUv);
        vertices.push(bottom);
        uv.push(bottomUv);

        currentLength += segmentLength;
    }

    if (roundCap && !options.closed) {
        const startPoint = points[0];
        const startNormal = normals[0].normal;
        const startUvScaleU = textureMode === LineTextureMode.STRETCH ? (length > 0 ? 1 / length : 0) : 1 / textureWidth;
        const startRes = addSemicircle(startPoint, startNormal, lineWidth, true, 0, startUvScaleU);
        vertices.push(...startRes.vertices);
        uv.push(...startRes.uv);

        const endPoint = points[points.length - 1];
        const endNormal = normals[points.length - 1].normal;
        const endU = textureMode === LineTextureMode.STRETCH ? 1 : currentLength / textureWidth;
        const endUvScaleU = textureMode === LineTextureMode.STRETCH ? (length > 0 ? 1 / length : 0) : 1 / textureWidth;
        const endRes = addSemicircle(endPoint, endNormal, lineWidth, false, endU, endUvScaleU);
        vertices.push(...endRes.vertices);
        uv.push(...endRes.uv);
    }

    return { vertices, uv };
};