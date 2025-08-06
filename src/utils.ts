import { IEntityTransformOptions, ITransformOptions } from "./interface";
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

    tags: string[];

    constructor(rapid: Rapid, options: IEntityTransformOptions) {
        this.rapid = rapid;

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

    update(deltaTime: number): void {

    }

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
    }

    render(): void {
        this.updateTransform();
    }

    postRender(): void {
        for (const child of this.children) {
            child.render();
            child.postRender();
        }
    }

    postUpdate(deltaTime: number): void {
        for (const child of this.children) {
            child.update(deltaTime);
            child.postUpdate(deltaTime);
        }
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

    root(dt: number) {
        this.update(dt)
        this.postUpdate(dt)

        this.render()
        this.postRender()
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
}