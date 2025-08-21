import EventEmitter from "eventemitter3";
import { Component, GameObject, Game } from "./game";
import { BodyType, IBodyOptions, IComponentOptions, IParticleBodyOptions, ITilemapBodyOptions } from "./interface";
import { Vec2 } from "./math";
import { Particle, ParticleEmitter } from "./particle"; // Assuming Particle type is exported from here
import { Tilemap } from "./tilemap";

/**
 * Interface defining the result of a collision check between two colliders.
 */
export interface CollisionResult {
    collided: boolean;
    mtv?: Vec2;
}

/**
 * Interface defining the detailed results for a collision event,
 * including the specific colliders involved.
 */
export interface DetailedCollisionResult {
    /** The collider on the body receiving the event. */
    colliderA: Collider;
    /** The collider on the other body. */
    colliderB: Collider;
    /** The MTV to resolve this specific collider-pair collision. */
    mtv: Vec2;
    /** The other entity involved in the collision. */
    otherEntity: GameObject;
}


/**
 * Abstract base class for all colliders.
 * Each collider is attached to an Entity.
 */
export abstract class Collider {
    entity: GameObject;
    offset: Vec2;
    /** A place to store extra data, useful for linking back to parent objects like individual particles. */
    extraData: any

    constructor(parent: Body | GameObject, offset: Vec2 = new Vec2(0, 0)) {
        if (parent instanceof Body) {
            this.entity = parent.entity!;
        } else {
            this.entity = parent;
        }
        this.offset = offset;
    }

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

    constructor(parent: Body | GameObject, radius: number, offset?: Vec2) {
        super(parent, offset);
        this.radius = radius;
    }

    getWorldRadius(): number {
        const scale = this.entity.scale;
        return this.radius * Math.max(Math.abs(scale.x), Math.abs(scale.y));
    }
}

/**
 * Point collider, treated as a circle with zero radius.
 */
export class PointCollider extends CircleCollider {
    constructor(parent: Body | GameObject, offset?: Vec2) {
        super(parent, 0, offset);
    }
}

/**
 * Convex polygon collider.
 * Requires vertices to form a convex shape for SAT algorithm.
 */
export class PolygonCollider extends Collider {
    localVertices: Vec2[];

    constructor(parent: Body | GameObject, vertices: Vec2[], offset?: Vec2) {
        super(parent, offset);
        this.localVertices = vertices;
    }

    getWorldVertices(): Vec2[] {
        this.entity.updateTransform(true);
        const transform = this.entity.transform;
        return this.localVertices.map(v => transform.transformPoint(v.add(this.offset))) as Vec2[];
    }

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

function projectCircle(center: Vec2, radius: number, axis: Vec2): Projection {
    const centerProjection = center.dot(axis);
    return {
        min: centerProjection - radius,
        max: centerProjection + radius
    };
}

function checkPolygonPolygon(polyA: PolygonCollider, polyB: PolygonCollider): CollisionResult {
    const axes = polyA.getAxes().concat(polyB.getAxes());
    let overlap = Infinity;
    let smallestAxis: Vec2 | null = null;

    for (const axis of axes) {
        const projA = projectVertices(polyA.getWorldVertices(), axis);
        const projB = projectVertices(polyB.getWorldVertices(), axis);
        const currentOverlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
        if (currentOverlap <= 0) return { collided: false };
        if (currentOverlap < overlap) {
            overlap = currentOverlap;
            smallestAxis = axis;
        }
    }

    if (!smallestAxis) return { collided: false };

    const direction = polyA.getWorldPosition().subtract(polyB.getWorldPosition());
    if (direction.dot(smallestAxis) < 0) smallestAxis.invert();
    return { collided: true, mtv: smallestAxis.multiply(overlap) };
}

function checkCircleCircle(circleA: CircleCollider, circleB: CircleCollider): CollisionResult {
    const centerA = circleA.getWorldPosition();
    const centerB = circleB.getWorldPosition();
    const radiusA = circleA.getWorldRadius();
    const radiusB = circleB.getWorldRadius();

    const delta = centerA.subtract(centerB);
    const distanceSq = delta.x * delta.x + delta.y * delta.y;
    const radiiSum = radiusA + radiusB;

    if (distanceSq >= radiiSum * radiiSum) return { collided: false };

    const distance = Math.sqrt(distanceSq);
    const overlap = radiiSum - distance;
    if (distance === 0) return { collided: true, mtv: new Vec2(overlap, 0) };
    return { collided: true, mtv: delta.normalize().multiply(overlap) };
}

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
        if (currentOverlap <= 0) return { collided: false };
        if (currentOverlap < overlap) {
            overlap = currentOverlap;
            smallestAxis = axis;
        }
    }

    if (!smallestAxis) return { collided: false };

    const direction = poly.getWorldPosition().subtract(circleCenter);
    if (direction.dot(smallestAxis) < 0) smallestAxis.invert();
    return { collided: true, mtv: smallestAxis.multiply(overlap) };
}

export function checkCollision(colliderA: Collider, colliderB: Collider): CollisionResult {
    if (!colliderA || !colliderB || colliderA.entity === colliderB.entity) {
        return { collided: false };
    }

    if (colliderA instanceof PolygonCollider) {
        if (colliderB instanceof PolygonCollider) return checkPolygonPolygon(colliderA, colliderB);
        if (colliderB instanceof CircleCollider) return checkPolygonCircle(colliderA, colliderB);
    } else if (colliderA instanceof CircleCollider) {
        if (colliderB instanceof PolygonCollider) {
            const result = checkPolygonCircle(colliderB, colliderA);
            if (result.mtv) result.mtv.invert();
            return result;
        }
        if (colliderB instanceof CircleCollider) return checkCircleCircle(colliderA, colliderB);
    }
    return { collided: false };
}

export class PhysicsManager {
    game: Game;
    components: Set<Body> = new Set();

    constructor(game: Game) {
        this.game = game;
    }

    addComponent(component: Body) {
        this.components.add(component);
    }

    removeComponent(component: Body) {
        this.components.delete(component);
    }

    onPhysics(dt: number) {
        const componentArray = Array.from(this.components);
        if (componentArray.length < 2) return;

        // **CHANGE**: Store detailed collision results for each body.
        const collisionEvents = new Map<Body, DetailedCollisionResult[]>();
        componentArray.forEach(c => collisionEvents.set(c, []));

        for (let i = 0; i < componentArray.length; i++) {
            for (let j = i + 1; j < componentArray.length; j++) {
                const compA = componentArray[i];
                const compB = componentArray[j];

                if (compA.disabled || compB.disabled) continue;

                for (const colliderA of compA.colliders) {
                    for (const colliderB of compB.colliders) {
                        const result = checkCollision(colliderA, colliderB);
                        if (result.collided) {
                            const mtvA = result.mtv!;
                            const mtvB = mtvA.clone().invert();

                            // **CHANGE**: Instead of a simple MTV, push a detailed result object.
                            collisionEvents.get(compA)!.push({
                                colliderA: colliderA,
                                colliderB: colliderB,
                                mtv: mtvA,
                                otherEntity: compB.entity!
                            });
                            collisionEvents.get(compB)!.push({
                                colliderA: colliderB,
                                colliderB: colliderA,
                                mtv: mtvB,
                                otherEntity: compA.entity!
                            });
                        }
                    }
                }
            }
        }

        // Now, process the results to fire enter/exit events
        for (const component of this.components) {
            const allFrameCollisions = collisionEvents.get(component)!;
            const oldCollisions = component.activeCollisions;

            // **CHANGE**: Group new collisions by the other entity to manage enter/exit events.
            const newCollisionsGrouped = new Map<GameObject, DetailedCollisionResult[]>();
            for (const collision of allFrameCollisions) {
                if (!newCollisionsGrouped.has(collision.otherEntity)) {
                    newCollisionsGrouped.set(collision.otherEntity, []);
                }
                newCollisionsGrouped.get(collision.otherEntity)!.push(collision);
            }

            // Check for new collisions (onBodyEnter)
            for (const [entity, results] of newCollisionsGrouped.entries()) {
                if (!oldCollisions.has(entity)) {
                    component.onBodyEnter?.(entity, results);
                }
            }

            // Check for ended collisions (onBodyExit)
            for (const entity of oldCollisions.keys()) {
                if (!newCollisionsGrouped.has(entity)) {
                    component.onBodyExit?.(entity);
                }
            }

            // Update the component's state for the next frame
            component.activeCollisions = newCollisionsGrouped;
        }
    }
}

type BodyEvents = {
    onBodyEnter: (otherEntity: GameObject, results: DetailedCollisionResult[]) => void
    onBodyExit: (entity: GameObject) => void
}

export class Body extends Component {
    colliders: Collider[] = [];
    declare options: IBodyOptions;
    declare event: EventEmitter<BodyEvents>

    // **CHANGE**: The active collisions map now stores a list of detailed results for each colliding entity.
    activeCollisions: Map<GameObject, DetailedCollisionResult[]> = new Map();

    velocity: Vec2 = Vec2.ZERO;
    acceleration: Vec2 = Vec2.ZERO;
    bodyType: BodyType;
    disabled: boolean = false;

    constructor(options: IBodyOptions) {
        super(options);
        this.bodyType = options.bodyType ?? BodyType.STATIC;
    }

    getCollidedObjects(){
        return this.activeCollisions.keys()
    }

    override onAttach(entity: GameObject): void {
        super.onAttach(entity);
        const options = this.options;
        this.colliders.length = 0;
        if (Array.isArray(options.colliders)) {
            this.colliders.push(...options.colliders);
        } else {
            this.colliders.push(options.colliders);
        }
        this.game.physics.addComponent(this);
    }

    override onDetach(): void {
        this.game.physics.removeComponent(this);
        this.colliders = [];
        this.activeCollisions.clear();
        super.onDetach();
    }

    onBodyEnter(otherEntity: GameObject, results: DetailedCollisionResult[]) {
        this.event.emit("onBodyEnter", otherEntity, results)
        if (this.bodyType === BodyType.DYNAMIC) {
            // Default behavior: sum all MTVs from this collision partner and apply it.
            const totalMtv = new Vec2(0, 0);
            for (const result of results) {
                totalMtv.addSelf(result.mtv);
            }
            this.entity.position.addSelf(totalMtv);
        }
    }

    onBodyExit(entity: GameObject) {
        this.event.emit("onBodyExit", entity)
    }

    override onPhysics(dt: number): void {
        if (this.disabled) return;
        const entity = this.entity;

        switch (this.bodyType) {
            case BodyType.STATIC:
                break;
            case BodyType.KINEMATIC:
                if (!this.velocity.equal(Vec2.ZERO)) {
                    entity.position.addSelf(this.velocity.multiply(dt));
                }
                break;

            case BodyType.DYNAMIC:
                this.velocity.addSelf(this.acceleration.multiply(dt));
                entity.position.addSelf(this.velocity.multiply(dt));
                break;
        }
    }
}

export class TilemapBody extends Body {
    tilemap: Tilemap;
    constructor(options: ITilemapBodyOptions) {
        super(options);
        this.tilemap = options.tilemap;
    }
    override onUpdate(_dt: number): void {
        super.onUpdate(_dt);
        this.colliders.length = 0;
        this.tilemap.displayTiles.forEach(tiles => {
            if (Array.isArray(tiles.colliders)) {
                this.colliders.push(...tiles.colliders);
            } else if (tiles.colliders) {
                this.colliders.push(tiles.colliders);
            }
        });
    }
}

export class PartcileBody extends Body {
    particle: ParticleEmitter;
    constructor(options: IParticleBodyOptions) {
        super(options);
        this.particle = options.particle;
    }

    override onUpdate(_dt: number): void {
        super.onUpdate(_dt);

        this.colliders.length = 0;
        this.particle.particles.forEach(particle => {
            if (particle) {
                particle.updateOffset();
                // **IMPORTANT**: Link the collider back to the particle instance.
                particle.collider.extraData = particle;
                this.colliders.push(particle.collider);
            }
        });
    }

    override onBodyEnter(otherEntity: GameObject, results: DetailedCollisionResult[]): void {
        for (const result of results) {
            const particle = result.colliderA.extraData as Particle;
            particle.position.addSelf(result.mtv);
        }
    }
}