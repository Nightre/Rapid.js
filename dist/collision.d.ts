import { default as EventEmitter } from 'eventemitter3';
import { Component, GameObject, Game } from './game';
import { BodyType, IBodyOptions, IParticleBodyOptions, ITilemapBodyOptions } from './interface';
import { Vec2 } from './math';
import { ParticleEmitter } from './particle';
import { Tilemap } from './tilemap';
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
export declare abstract class Collider {
    entity: GameObject;
    offset: Vec2;
    /** A place to store extra data, useful for linking back to parent objects like individual particles. */
    extraData: any;
    constructor(parent: Body | GameObject, offset?: Vec2);
    getWorldPosition(): Vec2;
}
/**
 * Circular collider.
 */
export declare class CircleCollider extends Collider {
    radius: number;
    constructor(parent: Body | GameObject, radius: number, offset?: Vec2);
    getWorldRadius(): number;
}
/**
 * Point collider, treated as a circle with zero radius.
 */
export declare class PointCollider extends CircleCollider {
    constructor(parent: Body | GameObject, offset?: Vec2);
}
/**
 * Convex polygon collider.
 * Requires vertices to form a convex shape for SAT algorithm.
 */
export declare class PolygonCollider extends Collider {
    localVertices: Vec2[];
    constructor(parent: Body | GameObject, vertices: Vec2[], offset?: Vec2);
    getWorldVertices(): Vec2[];
    getAxes(): Vec2[];
}
export declare function checkCollision(colliderA: Collider, colliderB: Collider): CollisionResult;
export declare class PhysicsManager {
    game: Game;
    components: Set<Body>;
    constructor(game: Game);
    addComponent(component: Body): void;
    removeComponent(component: Body): void;
    onPhysics(dt: number): void;
}
type BodyEvents = {
    onBodyEnter: (otherEntity: GameObject, results: DetailedCollisionResult[]) => void;
    onBodyExit: (entity: GameObject) => void;
};
export declare class Body extends Component {
    colliders: Collider[];
    options: IBodyOptions;
    event: EventEmitter<BodyEvents>;
    activeCollisions: Map<GameObject, DetailedCollisionResult[]>;
    velocity: Vec2;
    acceleration: Vec2;
    bodyType: BodyType;
    disabled: boolean;
    constructor(options: IBodyOptions);
    getCollidedObjects(): IterableIterator<GameObject>;
    onAttach(entity: GameObject): void;
    onDetach(): void;
    onBodyEnter(otherEntity: GameObject, results: DetailedCollisionResult[]): void;
    onBodyExit(entity: GameObject): void;
    onPhysics(dt: number): void;
}
export declare class TilemapBody extends Body {
    tilemap: Tilemap;
    constructor(options: ITilemapBodyOptions);
    onUpdate(_dt: number): void;
}
export declare class PartcileBody extends Body {
    particle: ParticleEmitter;
    constructor(options: IParticleBodyOptions);
    onUpdate(_dt: number): void;
    onBodyEnter(otherEntity: GameObject, results: DetailedCollisionResult[]): void;
}
export {};
