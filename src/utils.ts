import { InputManager } from "./input";
import { IEntityTransformOptions, IGameOptions, ITransformOptions } from "./interface";
import { MatrixStack, Vec2 } from "./math";
import Rapid from "./render";

export const isPlainObject = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.getPrototypeOf(obj) === Object.prototype;
}

export class Entity {
    position: Vec2;
    scale: Vec2;
    rotation: number;

    parent: Entity | null = null;
    readonly children: Entity[] = [];
    transform = new MatrixStack();
    rapid: Rapid;
    game: Game

    tags: string[];

    constructor(game: Game, options: IEntityTransformOptions = {}) {
        this.transform.pushIdentity()
        this.game = game
        this.rapid = game.render;

        this.tags = options.tags ?? []
        // Position
        if (options.position) {
            this.position = options.position;
        } else {
            this.position = new Vec2(options.x ?? 0, options.y ?? 0);
        }

        // Scale
        if (typeof options.scale === 'number') {
            this.scale = new Vec2(options.scale, options.scale);
        } else if (options.scale) {
            this.scale = options.scale;
        } else {
            this.scale = new Vec2(1, 1);
        }

        // Rotation
        this.rotation = options.rotation ?? 0;
    }

    getParentTransform() {
        return this.parent ? this.parent.transform : this.rapid.matrixStack;
    }

    public update(deltaTime: number): void {
        this.onUpdate(deltaTime);

        for (const child of this.children) {
            child.update(deltaTime);
        }
    }
    onUpdate(deltaTime: number) { }

    public render(): void {
        this.updateTransform();

        this.onRender();

        for (const child of this.children) {
            child.render();
        }
    }
    onRender() { }

    updateTransform(deep: boolean = false) {
        if (deep && this.parent) {
            this.parent.updateTransform(deep)
        }
        const transform = this.transform;
        const parentTransform = this.getParentTransform();
        transform.setTransform(parentTransform.getTransform());

        transform.translate(this.position);
        transform.rotate(this.rotation);
        transform.scale(this.scale);

        this.rapid.matrixStack.setTransform(transform.getTransform())
    }

    addChild(child: Entity): void {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child: Entity): void {
        const index = this.children.indexOf(child);
        if (index > -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    findDescendant(predicate: (entity: Entity) => boolean, onlyFirst = true): Entity[] | Entity | null {
        const results: Entity[] = [];
        for (const child of this.children) {
            if (predicate(child)) {
                if (onlyFirst) {
                    return child;
                }
                results.push(child);
            }
            const childFind = child.findDescendant(predicate, onlyFirst)
            if (onlyFirst) {
                if (childFind) {
                    return childFind
                }
            } else {
                results.push(...(childFind as Entity[]));
            }
        }
        return onlyFirst ? null : results;
    }

    findDescendantByTag(tags: string[], onlyFirst: boolean = false) {
        const predicate = (entity: Entity) => {
            if (tags.length === 0) return false;
            return tags.every(tag => entity.tags.includes(tag));
        };
        return this.findDescendant(predicate, onlyFirst);
    }

    dispose() {
        this.postDispose();
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    postDispose() {
        this.children.forEach(child => {
            child.dispose();
        })
    }
}

export class Camera extends Entity {
    override updateTransform() {
        const transform = this.transform;
        transform.identity()
        
        const centerdPosition = new Vec2(
            -this.rapid.logicWidth,
            -this.rapid.logicHeight
        ).divide(2)

        transform.translate(centerdPosition);
        transform.translate(this.position);

        transform.rotate(this.rotation);
        transform.scale(this.scale);

        transform.setTransform(transform.getInverse())
    }
}

export class Scene extends Entity {
    create() {

    }
}

export class Game {
    render: Rapid;
    mainScene: Scene | null = null;
    input: InputManager;
    private isRunning: boolean = false;
    private lastTime: number = 0;

    constructor(options: IGameOptions) {
        this.render = new Rapid(options);
        this.input = new InputManager(this.render);
    }

    switchScene(newScene: Scene): void {
        if (this.mainScene) {
            this.mainScene.dispose();
        }
        this.mainScene = newScene;
        newScene.create();
    }

    start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    stop(): void {
        this.isRunning = false;
    }

    private gameLoop(): void {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        this.render.startRender();

        if (this.mainScene) {
            this.mainScene.update(deltaTime)
            this.mainScene.render()
        }

        this.render.endRender();

        requestAnimationFrame(this.gameLoop.bind(this));
    }
}