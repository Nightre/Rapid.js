import { ILineOptions, CapTyps, JoinTyps } from "./interface";
import { Vec2 } from "./math";

const EPSILON = 0.0001;

const createSquareCap = (p0: Vec2, p1: Vec2, dir: Vec2, verts: Vec2[]): void => {
    verts.push(p0);
    verts.push(Vec2.Add(p0, dir));
    verts.push(Vec2.Add(p1, dir));

    verts.push(p1);
    verts.push(Vec2.Add(p1, dir));
    verts.push(p0);
}

const createRoundCap = (center: Vec2, _p0: Vec2, _p1: Vec2, nextPointInLine: Vec2, verts: Vec2[]): void => {
    const radius = Vec2.Sub(center, _p0).length();

    let angle0 = Math.atan2((_p1.y - center.y), (_p1.x - center.x));
    let angle1 = Math.atan2((_p0.y - center.y), (_p0.x - center.x));

    const orgAngle0 = angle0;

    if (angle1 > angle0) {
        if (angle1 - angle0 >= Math.PI - EPSILON) {
            angle1 = angle1 - 2 * Math.PI;
        }
    } else {
        if (angle0 - angle1 >= Math.PI - EPSILON) {
            angle0 = angle0 - 2 * Math.PI;
        }
    }

    let angleDiff = angle1 - angle0;

    if (Math.abs(angleDiff) >= Math.PI - EPSILON && Math.abs(angleDiff) <= Math.PI + EPSILON) {
        const r1 = Vec2.Sub(center, nextPointInLine);
        if (r1.x === 0) {
            if (r1.y > 0) {
                angleDiff = -angleDiff;
            }
        } else if (r1.x >= -EPSILON) {
            angleDiff = -angleDiff;
        }
    }

    const nsegments = (Math.abs(angleDiff * radius) / 7) >> 0;
    const nsegmentsInc = nsegments + 1;
    const angleInc = angleDiff / nsegmentsInc;

    for (let i = 0; i < nsegmentsInc; i++) {
        verts.push(new Vec2(center.x, center.y));
        verts.push(new Vec2(
            center.x + radius * Math.cos(orgAngle0 + angleInc * i),
            center.y + radius * Math.sin(orgAngle0 + angleInc * i)
        ));
        verts.push(new Vec2(
            center.x + radius * Math.cos(orgAngle0 + angleInc * (1 + i)),
            center.y + radius * Math.sin(orgAngle0 + angleInc * (1 + i))
        ));
    }
}

const signedArea = (p0: Vec2, p1: Vec2, p2: Vec2): number => {
    return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y);
}

const lineIntersection = (p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2): Vec2 | null => {
    const a0 = p1.y - p0.y;
    const b0 = p0.x - p1.x;

    const a1 = p3.y - p2.y;
    const b1 = p2.x - p3.x;

    const det = a0 * b1 - a1 * b0;
    if (det > -EPSILON && det < EPSILON) {
        return null;
    } else {
        const c0 = a0 * p0.x + b0 * p0.y;
        const c1 = a1 * p2.x + b1 * p2.y;

        const x = (b1 * c0 - b0 * c1) / det;
        const y = (a0 * c1 - a1 * c0) / det;
        return new Vec2(x, y);
    }
}

const createTriangles = (p0: Vec2, p1: Vec2, p2: Vec2, verts: Vec2[], width: number, join: JoinTyps, miterLimit: number): void => {
    const t0 = Vec2.Sub(p1, p0).perpendicular();
    const t2 = Vec2.Sub(p2, p1).perpendicular();

    if (signedArea(p0, p1, p2) > 0) {
        t0.invert();
        t2.invert();
    }

    t0.normalize().scalarMult(width);
    t2.normalize().scalarMult(width);

    const pintersect = lineIntersection(Vec2.Add(t0, p0), Vec2.Add(t0, p1), Vec2.Add(t2, p2), Vec2.Add(t2, p1));

    let anchor: Vec2 | null = null;
    let anchorLength = Number.MAX_VALUE;
    if (pintersect) {
        anchor = Vec2.Sub(pintersect, p1);
        anchorLength = anchor.length();
    }
    const dd = (anchorLength / width) | 0;
    const p0p1 = Vec2.Sub(p0, p1).length();
    const p1p2 = Vec2.Sub(p1, p2).length();

    if (anchorLength > p0p1 || anchorLength > p1p2) {
        verts.push(Vec2.Add(p0, t0));
        verts.push(Vec2.Sub(p0, t0));
        verts.push(Vec2.Add(p1, t0));

        verts.push(Vec2.Sub(p0, t0));
        verts.push(Vec2.Add(p1, t0));
        verts.push(Vec2.Sub(p1, t0));

        if (join === JoinTyps.ROUND) {
            createRoundCap(p1, Vec2.Add(p1, t0), Vec2.Add(p1, t2), p2, verts);
        } else if (join === JoinTyps.BEVEL || (join === JoinTyps.MITER && dd >= miterLimit)) {
            verts.push(p1);
            verts.push(Vec2.Add(p1, t0));
            verts.push(Vec2.Add(p1, t2));
        } else if (join === JoinTyps.MITER && dd < miterLimit && pintersect) {
            verts.push(Vec2.Add(p1, t0));
            verts.push(p1);
            verts.push(pintersect);

            verts.push(Vec2.Add(p1, t2));
            verts.push(p1);
            verts.push(pintersect);
        }

        verts.push(Vec2.Add(p2, t2));
        verts.push(Vec2.Sub(p1, t2));
        verts.push(Vec2.Add(p1, t2));

        verts.push(Vec2.Add(p2, t2));
        verts.push(Vec2.Sub(p1, t2));
        verts.push(Vec2.Sub(p2, t2));
    } else {
        verts.push(Vec2.Add(p0, t0));
        verts.push(Vec2.Sub(p0, t0));
        verts.push(Vec2.Sub(p1, anchor!));

        verts.push(Vec2.Add(p0, t0));
        verts.push(Vec2.Sub(p1, anchor!));
        verts.push(Vec2.Add(p1, t0));

        if (join === JoinTyps.ROUND) {
            const _p0 = Vec2.Add(p1, t0);
            const _p1 = Vec2.Add(p1, t2);
            const _p2 = Vec2.Sub(p1, anchor!);

            const center = p1;

            verts.push(_p0);
            verts.push(center);
            verts.push(_p2);

            createRoundCap(center, _p0, _p1, _p2, verts);

            verts.push(center);
            verts.push(_p1);
            verts.push(_p2);
        } else {
            if (join === JoinTyps.BEVEL || (join === JoinTyps.MITER && dd >= miterLimit)) {
                verts.push(Vec2.Add(p1, t0));
                verts.push(Vec2.Add(p1, t2));
                verts.push(Vec2.Sub(p1, anchor!));
            }

            if (join === JoinTyps.MITER && dd < miterLimit) {
                verts.push(pintersect!);
                verts.push(Vec2.Add(p1, t0));
                verts.push(Vec2.Add(p1, t2));
            }
        }

        verts.push(Vec2.Add(p2, t2));
        verts.push(Vec2.Sub(p1, anchor!));
        verts.push(Vec2.Add(p1, t2));

        verts.push(Vec2.Add(p2, t2));
        verts.push(Vec2.Sub(p1, anchor!));
        verts.push(Vec2.Sub(p2, t2));
    }
}

export const getStrokeGeometry = (points: Vec2[], attrs: ILineOptions): Vec2[] => {
    if (points.length < 2) {
        return [];
    }

    let cap = attrs.cap || CapTyps.BUTT;
    let join = attrs.join || JoinTyps.BEVEL;
    let lineWidth = (attrs.width || 1) / 2;
    let miterLimit = attrs.miterLimit || 10;
    let vertices: Vec2[] = [];
    let middlePoints: Vec2[] = [];
    let closed = false;

    if (points.length === 2) {
        join = JoinTyps.BEVEL;
        createTriangles(points[0], Vec2.Middle(points[0], points[1]), points[1], vertices, lineWidth, join, miterLimit);
    } else {
        for (let i = 0; i < points.length - 1; i++) {
            if (i === 0) {
                middlePoints.push(points[0]);
            } else if (i === points.length - 2) {
                middlePoints.push(points[points.length - 1]);
            } else {
                middlePoints.push(Vec2.Middle(points[i], points[i + 1]));
            }
        }

        for (let i = 1; i < middlePoints.length; i++) {
            createTriangles(middlePoints[i - 1], points[i], middlePoints[i], vertices, lineWidth, join, miterLimit);
        }
    }

    if (!closed) {
        if (cap === CapTyps.ROUND) {
            let p00 = vertices[0];
            let p01 = vertices[1];
            let p02 = points[1];
            let p10 = vertices[vertices.length - 1];
            let p11 = vertices[vertices.length - 3];
            let p12 = points[points.length - 2];

            createRoundCap(points[0], p00, p01, p02, vertices);
            createRoundCap(points[points.length - 1], p10, p11, p12, vertices);
        } else if (cap === CapTyps.SQUARE) {
            let p00 = vertices[vertices.length - 1];
            let p01 = vertices[vertices.length - 3];

            createSquareCap(
                vertices[0],
                vertices[1],
                Vec2.Sub(points[0], points[1]).normalize().scalarMult(Vec2.Sub(points[0], vertices[0]).length()),
                vertices
            );
            createSquareCap(
                p00,
                p01,
                Vec2.Sub(points[points.length - 1], points[points.length - 2]).normalize().scalarMult(Vec2.Sub(p01, points[points.length - 1]).length()),
                vertices
            );
        }
    }

    return vertices;
}

