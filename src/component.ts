import EventEmitter from "eventemitter3";
import { Game, GameObject } from "./game";
import Rapid from "./render";
import { IComponentOptions } from "./interface";

export abstract class Component {
    entity!: GameObject;
    game!: Game;
    rapid!: Rapid;
    readonly name: string;
    readonly unique: boolean = true;
    options: IComponentOptions
    event: EventEmitter<any> = new EventEmitter()

    /**
     * @description 子类中需要覆盖的 Entity 方法名列表
     * @example protected patchMethods: (keyof Entity)[] = ['onUpdate', 'onRender'];
     */
    protected patchMethods: (keyof GameObject)[] = [];
    private originalMethods: Map<string, Function> = new Map();

    constructor(options: IComponentOptions = {}) {
        this.options = options
        this.name = options.name ?? this.constructor.name;
    }

    onAttach(entity: GameObject): void {
        this.entity = entity;
        this.game = entity.game;
        this.rapid = entity.rapid;

        this.patchEntityMethods();
    }

    onDetach(): void {
        this.unpatchEntityMethods();
    }

    /**
     * 辅助方法，用于在组件方法中调用 Entity 的原始方法
     * @param methodName 要调用的原始方法名
     * @param args 传递给原始方法的参数
     */
    protected callOriginal<T extends keyof GameObject>(methodName: T, ...args: Parameters<GameObject[T] extends (...args: any[]) => any ? GameObject[T] : never>): ReturnType<GameObject[T] extends (...args: any[]) => any ? GameObject[T] : never> | undefined {
        const originalMethod = this.originalMethods.get(methodName as string);
        if (originalMethod) {
            return originalMethod(...args);
        } else {
            // 如果找不到原始方法，可以抛出错误或静默失败
            console.warn(`Original method "${methodName}" not found on entity.`);
        }
    }

    private patchEntityMethods(): void {
        for (const methodName of this.patchMethods) {
            const componentMethod = this[methodName as keyof this] as any;
            const entityMethod = this.entity[methodName as keyof GameObject] as any;

            // 确保组件和实体上都有这个方法，且它们都是函数
            if (typeof componentMethod === 'function' && typeof entityMethod === 'function') {
                // 1. 保存原始方法
                this.originalMethods.set(methodName as string, entityMethod.bind(this.entity));

                // 2. 用组件的方法覆盖实体的方法
                (this.entity[methodName as keyof GameObject] as any) = componentMethod.bind(this);
            }
        }
    }

    private unpatchEntityMethods(): void {
        for (const [methodName, originalMethod] of this.originalMethods.entries()) {
            (this.entity[methodName as keyof GameObject] as any) = originalMethod;
        }
        this.originalMethods.clear();
    }

    onRenderQueue(queue: GameObject[]): void { }
    onUpdate(_dt: number): void { }
    onRender(_rapid: Rapid): void { }
    onDispose(): void { }
    onPhysics(_dt: number): void { }
}