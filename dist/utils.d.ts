import { IEntityTransformOptions } from "./interface";
import { MatrixStack, Vec2 } from "./math";
import Rapid from "./render";
export declare const isPlainObject: (obj: any) => boolean;
export declare class Entity {
    position: Vec2;
    scale: Vec2;
    rotation: number;
    parent: Entity | null;
    readonly children: Entity[];
    transform: MatrixStack;
    rapid: Rapid;
    tags: string[];
    constructor(rapid: Rapid, options: IEntityTransformOptions);
    getParentTransform(): MatrixStack;
    update(deltaTime: number): void;
    updateTransform(deep?: boolean): void;
    render(): void;
    postRender(): void;
    postUpdate(deltaTime: number): void;
    addChild(child: Entity): void;
    removeChild(child: Entity): void;
    root(dt: number): void;
    findDescendant(predicate: (entity: Entity) => boolean, onlyFirst?: boolean): Entity[] | Entity | null;
    findDescendantByTag(tags: string[], onlyFirst?: boolean): Entity | Entity[] | null;
}
