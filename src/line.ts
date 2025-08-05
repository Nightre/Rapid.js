import { ILineStyleOptions, LineTextureMode } from "./interface";
import { Vec2 } from "./math";

const LINE_ROUND_SEGMENTS = 10;

const addSemicircle = (center: Vec2, normal: Vec2, width: number, isStart: boolean) => {
    const result: Vec2[] = [];

    const startAngle = isStart ? Math.atan2(normal.y, normal.x) : Math.atan2(-normal.y, -normal.x);
    const totalAngle = Math.PI;

    for (let i = 0; i < LINE_ROUND_SEGMENTS; i++) {
        const t1 = i / LINE_ROUND_SEGMENTS;
        const t2 = (i + 1) / LINE_ROUND_SEGMENTS;
        const angle1 = startAngle + t1 * totalAngle;
        const angle2 = startAngle + t2 * totalAngle;

        const x1 = Math.cos(angle1) * width;
        const y1 = Math.sin(angle1) * width;
        const x2 = Math.cos(angle2) * width;
        const y2 = Math.sin(angle2) * width;

        result.push(center);
        result.push(center.add(new Vec2(x1, y1)));
        result.push(center.add(new Vec2(x2, y2)));
    }

    return result;
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
        for (let i = 0; i < n - 1; i++) {
            const prev = i === 0 ? points[n - 2] : points[i - 1];
            const point = points[i];
            const next = points[i + 1];
            normals.push(calculateNormal(prev, point, next));
        }
        normals.push(normals[0]); // 复制首点法线到尾点
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


export const getLineGeometry = (options: ILineStyleOptions) => {
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
    
    for (let i = 0; i < points.length - 1; i++) {
        const point = points[i];
        const normal = normals[i].normal;
        const miters = normals[i].miters;

        const top = point.add(normal.multiply(miters * lineWidth));
        const bottom = point.subtract(normal.multiply(miters * lineWidth));

        const nextPoint = points[i + 1];
        const nextNormal = normals[i + 1].normal;
        const nextMiter = normals[i + 1].miters;

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
        const startVertices = addSemicircle(startPoint, startNormal, lineWidth, true);
        vertices.push(...startVertices);

        const endPoint = points[points.length - 1];
        const endNormal = normals[points.length - 1].normal;
        const endVertices = addSemicircle(endPoint, endNormal, lineWidth, false);
        vertices.push(...endVertices);

    }
    
    return { vertices, uv };
};