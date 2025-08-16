import { Entity } from "./game";
import { Vec2 } from "./math";

/**
 * Interface defining the result of a collision check.
 */
export interface CollisionResult {
    /**
     * Indicates whether a collision occurred.
     */
    collided: boolean;
    /**
     * The Minimum Translation Vector (MTV).
     * If a collision occurred (collided is true), this vector indicates the direction
     * to move the first object (A) to resolve the collision, with its magnitude being the overlap depth.
     * Undefined if no collision occurred.
     */
    mtv?: Vec2;
}

/**
 * Abstract base class for all colliders.
 * Each collider is attached to an Entity.
 */
export abstract class Collider {
    entity: Entity;
    offset: Vec2;

    constructor(entity: Entity, offset: Vec2 = new Vec2(0, 0)) {
        this.entity = entity;
        this.offset = offset;
    }

    /**
     * Gets the world-space position of the collider's center.
     * @returns The world position as a Vec2.
     */
    getWorldPosition(): Vec2 {
        this.entity.updateTransform(true);
        return this.entity.transform.transformPoint(this.offset) as Vec2;
    }
}

/**
 * Circular collider.
 */
export class CircleCollider extends Collider {
    radius: number;

    constructor(entity: Entity, radius: number, offset?: Vec2) {
        super(entity, offset);
        this.radius = radius;
    }

    /**
     * Gets the world-space radius, accounting for entity scaling.
     * Uses the larger absolute value of the entity's x or y scale.
     * @returns The world radius.
     */
    getWorldRadius(): number {
        const scale = this.entity.scale;
        return this.radius * Math.max(Math.abs(scale.x), Math.abs(scale.y));
    }
}

/**
 * Point collider, treated as a circle with zero radius.
 */
export class PointCollider extends CircleCollider {
    constructor(entity: Entity, offset?: Vec2) {
        super(entity, 0, offset);
    }
}

/**
 * Convex polygon collider.
 * Requires vertices to form a convex shape for SAT algorithm.
 */
export class PolygonCollider extends Collider {
    localVertices: Vec2[];

    constructor(entity: Entity, vertices: Vec2[], offset?: Vec2) {
        super(entity, offset);
        this.localVertices = vertices;
    }

    /**
     * Gets the world-space vertices of the polygon.
     * @returns Array of vertices in world coordinates.
     */
    getWorldVertices(): Vec2[] {
        this.entity.updateTransform(true);
        const transform = this.entity.transform;
        return this.localVertices.map(v => transform.transformPoint(v.add(this.offset))) as Vec2[];
    }

    /**
     * Gets normalized axes (normals) for SAT collision detection.
     * @returns Array of normalized axis vectors.
     */
    getAxes(): Vec2[] {
        const vertices = this.getWorldVertices();
        const axes: Vec2[] = [];

        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[i + 1] || vertices[0];
            const edge = p2.subtract(p1);
            const normal = new Vec2(-edge.y, edge.x).normalize();

            let unique = true;
            for (const axis of axes) {
                if (Math.abs(axis.dot(normal)) > 0.9999) {
                    unique = false;
                    break;
                }
            }
            if (unique) {
                axes.push(normal);
            }
        }

        return axes;
    }
}

type Projection = { min: number; max: number };

/**
 * Projects vertices onto an axis and returns the projection range.
 * @param vertices Array of vertices to project.
 * @param axis Normalized axis vector.
 * @returns Projection range with min and max values.
 */
function projectVertices(vertices: Vec2[], axis: Vec2): Projection {
    let min = Infinity;
    let max = -Infinity;
    for (const vertex of vertices) {
        const projection = vertex.dot(axis);
        if (projection < min) min = projection;
        if (projection > max) max = projection;
    }
    return { min, max };
}

/**
 * Projects a circle onto an axis.
 * @param center Center of the circle.
 * @param radius Radius of the circle.
 * @param axis Normalized axis vector.
 * @returns Projection range with min and max values.
 */
function projectCircle(center: Vec2, radius: number, axis: Vec2): Projection {
    const centerProjection = center.dot(axis);
    return {
        min: centerProjection - radius,
        max: centerProjection + radius
    };
}

/**
 * Checks collision between two polygon colliders using SAT.
 * @param polyA First polygon collider.
 * @param polyB Second polygon collider.
 * @returns Collision result with MTV if collision occurred.
 */
function checkPolygonPolygon(polyA: PolygonCollider, polyB: PolygonCollider): CollisionResult {
    const axes = polyA.getAxes().concat(polyB.getAxes());
    let overlap = Infinity;
    let smallestAxis: Vec2 | null = null;

    for (const axis of axes) {
        const projA = projectVertices(polyA.getWorldVertices(), axis);
        const projB = projectVertices(polyB.getWorldVertices(), axis);

        const currentOverlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);

        if (currentOverlap <= 0) {
            return { collided: false };
        }

        if (currentOverlap < overlap) {
            overlap = currentOverlap;
            smallestAxis = axis;
        }
    }

    if (!smallestAxis) return { collided: false };

    const centerA = polyA.getWorldPosition();
    const centerB = polyB.getWorldPosition();
    const direction = centerA.subtract(centerB);

    if (direction.dot(smallestAxis) < 0) {
        smallestAxis.invert();
    }

    const mtv = smallestAxis.multiply(overlap);
    return { collided: true, mtv: mtv };
}

/**
 * Checks collision between two circle colliders.
 * @param circleA First circle collider.
 * @param circleB Second circle collider.
 * @returns Collision result with MTV if collision occurred.
 */
function checkCircleCircle(circleA: CircleCollider, circleB: CircleCollider): CollisionResult {
    const centerA = circleA.getWorldPosition();
    const centerB = circleB.getWorldPosition();
    const radiusA = circleA.getWorldRadius();
    const radiusB = circleB.getWorldRadius();

    const delta = centerA.subtract(centerB);
    const distanceSq = delta.x * delta.x + delta.y * delta.y;
    const radiiSum = radiusA + radiusB;

    if (distanceSq >= radiiSum * radiiSum) {
        return { collided: false };
    }

    const distance = Math.sqrt(distanceSq);
    const overlap = radiiSum - distance;

    if (distance === 0) {
        return { collided: true, mtv: new Vec2(overlap, 0) };
    }

    const mtv = delta.normalize().multiply(overlap);
    return { collided: true, mtv: mtv };
}

/**
 * Checks collision between a polygon and a circle using SAT.
 * @param poly Polygon collider.
 * @param circle Circle collider.
 * @returns Collision result with MTV if collision occurred.
 */
function checkPolygonCircle(poly: PolygonCollider, circle: CircleCollider): CollisionResult {
    const vertices = poly.getWorldVertices();
    const axes = poly.getAxes();
    const circleCenter = circle.getWorldPosition();
    const circleRadius = circle.getWorldRadius();

    let closestVertex = vertices[0];
    let minDistanceSq = Infinity;

    for (const vertex of vertices) {
        const distSq = circleCenter.distanceTo(vertex) ** 2;
        if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            closestVertex = vertex;
        }
    }

    const axisToClosest = closestVertex.subtract(circleCenter);
    if (axisToClosest.length() > 1e-9) {
        axes.push(axisToClosest.normalize());
    }

    let overlap = Infinity;
    let smallestAxis: Vec2 | null = null;

    for (const axis of axes) {
        const projPoly = projectVertices(vertices, axis);
        const projCircle = projectCircle(circleCenter, circleRadius, axis);

        const currentOverlap = Math.min(projPoly.max, projCircle.max) - Math.max(projPoly.min, projCircle.min);

        if (currentOverlap <= 0) {
            return { collided: false };
        }

        if (currentOverlap < overlap) {
            overlap = currentOverlap;
            smallestAxis = axis;
        }
    }

    if (!smallestAxis) return { collided: false };

    const polyCenter = poly.getWorldPosition();
    const direction = polyCenter.subtract(circleCenter);

    if (direction.dot(smallestAxis) < 0) {
        smallestAxis.invert();
    }

    const mtv = smallestAxis.multiply(overlap);
    return { collided: true, mtv: mtv };
}

/**
 * Checks for collision between two entities or colliders and returns detailed results.
 * @param entityA First entity or collider (active participant).
 * @param entityB Second entity or collider (passive participant).
 * @returns Collision result with MTV to push entityA away from entityB.
 */
export function checkCollision(entityA: Entity | Collider, entityB: Entity | Collider): CollisionResult {
    const colliderA = entityA instanceof Entity ? entityA.collider : entityA;
    const colliderB = entityB instanceof Entity ? entityB.collider : entityB;

    if (!colliderA || !colliderB) {
        return { collided: false };
    }

    if (colliderA instanceof PolygonCollider) {
        if (colliderB instanceof PolygonCollider) {
            return checkPolygonPolygon(colliderA, colliderB);
        }
        else if (colliderB instanceof CircleCollider) {
            return checkPolygonCircle(colliderA, colliderB);
        }
    }
    else if (colliderA instanceof CircleCollider) {
        if (colliderB instanceof PolygonCollider) {
            const result = checkPolygonCircle(colliderB, colliderA);
            if (result.mtv) {
                result.mtv.invert();
            }
            return result;
        }
        else if (colliderB instanceof CircleCollider) {
            return checkCircleCircle(colliderA, colliderB);
        }
    }

    return { collided: false };
}