import { default as EventEmitter } from 'eventemitter3';
import { default as AssetsLoader } from './assets';
import { default as AudioManager } from './audio';
import { InputManager } from './input';
import { IAnimation, ICameraOptions, IComponentOptions, ICreateEntity, IEntityOptions, IGameOptions, ILabelEntityOptions, IMathObject, ISpriteOptions } from './interface';
import { Color, MatrixStack, Vec2 } from './math';
import { default as Rapid } from './render';
import { Text, Texture, TextureCache } from './texture';
import { EasingFunction, Timer, Tween } from './utils';
import { PhysicsManager } from './collision';
export declare abstract class Component {
    entity: GameObject;
    game: Game;
    rapid: Rapid;
    readonly name: string;
    readonly unique: boolean;
    options: IComponentOptions;
    event: EventEmitter<any>;
    /**
     * @description 子类中需要覆盖的 Entity 方法名列表
     * @example protected patchMethods: (keyof Entity)[] = ['onUpdate', 'onRender'];
     */
    protected patchMethods: (keyof GameObject)[];
    private originalMethods;
    constructor(options?: IComponentOptions);
    onAttach(entity: GameObject): void;
    onDetach(): void;
    /**
     * 辅助方法，用于在组件方法中调用 Entity 的原始方法
     * @param methodName 要调用的原始方法名
     * @param args 传递给原始方法的参数
     */
    protected callOriginal<T extends keyof GameObject>(methodName: T, ...args: Parameters<GameObject[T] extends (...args: any[]) => any ? GameObject[T] : never>): ReturnType<GameObject[T] extends (...args: any[]) => any ? GameObject[T] : never> | undefined;
    private patchEntityMethods;
    private unpatchEntityMethods;
    onRenderQueue(queue: GameObject[]): void;
    onUpdate(_dt: number): void;
    onRender(_rapid: Rapid): void;
    onDispose(): void;
    onPhysics(_dt: number): void;
}
/**
 * Base class for game entities with transform and rendering capabilities.
 */
export declare class GameObject {
    position: Vec2;
    scale: Vec2;
    rotation: number;
    parent: GameObject | null;
    globalZindex: number;
    localZindex: number;
    tags: string[];
    transform: MatrixStack;
    readonly children: GameObject[];
    rapid: Rapid;
    game: Game;
    get x(): number;
    get y(): number;
    set x(nx: number);
    set y(ny: number);
    /**
     * Creates an entity with optional transform properties.
     * @param game - The game instance this entity belongs to.
     * @param options - Configuration options for position, scale, rotation, and tags.
     */
    constructor(game: Game, options?: IEntityOptions);
    private components;
    /**
     * Adds a component to this entity.
     * @param component - The component instance to add.
     * @returns The added component.
     */
    addComponent<T extends Component>(component: T): T;
    /**
     * Removes a component by name or class.
     * @param key - The component name (string) or class (constructor).
     * @returns True if a component was removed, false otherwise.
     */
    removeComponent(key: string | (new (...args: any[]) => Component)): boolean;
    /**
     * Gets a component by name.
     * @param name - The component name.
     * @returns The component or null if not found.
     */
    getComponentByName<T extends Component>(name: string): T | null;
    /**
     * Gets a component by class.
     * @param ctor - The component class.
     * @returns The component or null if not found.
     */
    getComponent<T extends Component>(ctor: new (...args: any[]) => T): T | null;
    /**
     * Checks if a component exists by name or class.
     */
    hasComponent(key: string | (new (...args: any[]) => Component)): boolean;
    getScene(): Scene | null;
    /**
     * Gets the parent transform or the renderer's matrix stack if no parent exists.
     * @returns The transform matrix stack.
     */
    getParentTransform(): MatrixStack;
    /**
     * Renders the entity and its components.
     * @param render - The rendering engine instance.
     */
    onRender(render: Rapid): void;
    onRenderQueue(queue: GameObject[]): void;
    onUpdate(deltaTime: number): void;
    onPhysics(deltaTime: number): void;
    onDispose(): void;
    /**
     * Updates the entity's transform, optionally updating parent transforms.
     * @param deep - If true, recursively updates parent transforms.
     */
    updateTransform(deep?: boolean): void;
    /**
     * Adds a child entity to this entity.
     * @param child - The entity to add as a child.
     */
    addChild(child: GameObject): this;
    /**
     * Removes a child entity from this entity.
     * @param child - The entity to remove.
     */
    removeChild(child: GameObject): this;
    /**
     * Finds descendant entities matching a predicate.
     * @param predicate - Function to test each entity.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if no matches are found.
     */
    findDescendant(predicate: (entity: GameObject) => boolean, onlyFirst?: boolean): GameObject[] | GameObject | null;
    /**
     * Finds descendant entities with all specified tags.
     * @param tags - Array of tags to match.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if not found.
     */
    findDescendantByTag(tags: string[], onlyFirst?: boolean): GameObject[] | GameObject | null;
    /**
     * Disposes of the entity, its components, and its children.
     */
    dispose(): void;
    /**
     * Updates the entity, its components, and its children.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    processUpdate(deltaTime: number): void;
    /**
     * Updates the entity, its components, and its children.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    processPhysics(deltaTime: number): void;
    /**
     * Collects entities and components that need rendering.
     * @param queue - The array to collect renderable entities.
     * @ignore
     */
    render(queue: GameObject[]): void;
    /**
     * Prepares the entity's transform before rendering.
     * @ignore
     */
    beforeRender(): void;
    /**
     * Hook for custom cleanup logic before disposal.
     */
    protected postDispose(): void;
    getMouseLocalPosition(): Vec2;
    getMouseGlobalPosition(): Vec2;
    static create(game: Game, options: ICreateEntity): GameObject;
}
/**
 * A layer that renders its children directly to the screen, ignoring any camera transforms.
 * Ideal for UI elements like HUDs, menus, and scores.
 *
 * CanvasLayer 是一个特殊的层，它会直接将其子节点渲染到屏幕上，忽略任何摄像机的变换。
 * 非常适合用于UI元素，如HUD（状态栏）、菜单和分数显示。
 */
export declare class CanvasLayer extends Component {
    protected patchMethods: (keyof GameObject)[];
    constructor(options: IComponentOptions);
    onAttach(entity: GameObject): void;
    updateTransform(): void;
}
/**
 * Camera entity for managing the view transform in the game.
 */
export declare class Camera extends Component {
    protected patchMethods: (keyof GameObject)[];
    enable: boolean;
    center: boolean;
    positionSmoothingSpeed: number;
    rotationSmoothingSpeed: number;
    private _currentRenderPosition;
    private _currentRenderRotation;
    /**
     * 设置此摄像机是否为当前场景的主摄像机。
     * @param isEnable
     */
    setEnable(isEnable: boolean): void;
    constructor(options?: ICameraOptions);
    onAttach(entity: GameObject): void;
    /**
     * 每帧更新，用于平滑摄像机的【局部】变换属性。
     * @param deltaTime
     */
    onUpdate(deltaTime: number): void;
    /**
     * 根据摄像机的【全局】变换计算最终的视图矩阵。
     * 这个方法现在正确地处理了父子关系。
     */
    updateTransform(): void;
    getTransform(): Float32Array;
}
/**
 * Scene class representing a game scene with entities.
 */
export declare class Scene extends GameObject {
    /**
     * Initializes the scene.
     */
    create(): void;
}
/**
 * Main game class managing the game loop, rendering, and input.
 */
export declare class Game {
    render: Rapid;
    mainScene: Scene | null;
    input: InputManager;
    asset: AssetsLoader;
    audio: AudioManager;
    texture: TextureCache;
    physics: PhysicsManager;
    private isRunning;
    private lastTime;
    private tweens;
    private timers;
    mainCamera: Camera | null;
    renderQueue: GameObject[];
    worldTransform: MatrixStack;
    /**
     * Creates a new game instance.
     * @param options - Configuration options for the game.
     */
    constructor(options: IGameOptions);
    getMainScene(): Scene | null;
    setMainCamera(camera: Camera | null): void;
    /**
     * Switches to a new scene, disposing of the current one.
     * @param newScene - The new scene to switch to.
     */
    switchScene(newScene: Scene): void;
    /**
     * Starts the game loop.
     */
    start(): void;
    /**
     * Stops the game loop.
     */
    stop(): void;
    /**
     * Adds an entity to the render queue.
     * @param entity - The entity to add.
     */
    addEntityRenderQueue(entity: GameObject): void;
    /**
     * Runs the game loop, updating and rendering the scene.
     * @private
     */
    private gameLoop;
    destroy(): void;
    /**
     * Creates and starts a new timer that will be automatically updated by the game loop.
     * @param duration - The duration in seconds before the timer triggers.
     * @param onComplete - The function to call when the timer finishes.
     * @param repeat - If true, the timer will restart after completing. Defaults to false.
     * @returns The created Timer instance, allowing you to `stop()` it manually if needed.
     * @example
     * // Log a message after 2.5 seconds
     * game.createTimer(2.5, () => {
     *     console.log('Timer finished!');
     * });
     *
     * // Spawn an enemy every 5 seconds
     * const enemySpawner = game.createTimer(5, () => {
     *     scene.spawnEnemy();
     * }, true);
     */
    createTimer(duration: number, repeat?: boolean): Timer;
    /**
     * Updates all active timers and removes completed ones.
     * @param deltaTime - The time elapsed since the last frame.
     * @private
     */
    private updateTimers;
    /**
     * Creates and starts a new tween animation.
     * The tween will be automatically updated by the game loop.
     * @template T - The type of the value being animated (e.g., Vec2, Color, number).
     * @param target - The object to animate.
     * @param property - The name of the property on the target to animate.
     * @param to - The final value of the property.
     * @param duration - The duration of the animation in seconds.
     * @param easing - The easing function to use. Defaults to Linear.
     * @returns The created Tween instance, allowing you to chain calls like .onComplete().
     * @example
     * // Tween a sprite's position over 2 seconds
     * game.createTween(mySprite, 'position', new Vec2(500, 300), 2, Easing.EaseOutQuad);
     *
     * // Tween a shape's color to red and do something on completion
     * game.createTween(myShape, 'color', Color.Red, 1.5)
     *     .onComplete(() => {
     *         console.log('Color tween finished!');
     *     });
     */
    createTween<T extends IMathObject<T> | number>(target: any, property: string, to: T, duration: number, easing?: EasingFunction): Tween<T>;
    /**
     * Updates all active tweens and removes completed ones.
     * @param deltaTime - The time elapsed since the last frame.
     * @private
     */
    private updateTweens;
}
/**
 * An entity that displays a texture (a "sprite") and can play animations.
 * Animations are defined as a sequence of textures.
 */
export declare class Sprite extends Component {
    /** The current texture being displayed. This can be a static texture or a frame from an animation. */
    texture: Texture | null;
    /** Whether the sprite is flipped horizontally. */
    flipX: boolean;
    /** Whether the sprite is flipped vertically. */
    flipY: boolean;
    color: Color;
    offset: Vec2;
    private animations;
    private currentAnimation;
    private currentFrame;
    private frameTimer;
    private isPlaying;
    /**
     * Creates a new Sprite entity.
     * @param game - The game instance.
     * @param options - Configuration for the sprite's transform and initial texture.
     */
    constructor(options?: ISpriteOptions);
    setAnimations(animations: IAnimation): void;
    /**
     * Defines a new animation sequence.
     * @param name - A unique name for the animation (e.g., "walk", "jump").
     * @param frames - An array of Textures to use as frames.
     * @param fps - The playback speed in frames per second.
     * @param loop - Whether the animation should repeat.
     */
    addAnimation(name: string, frames: Texture[], fps?: number, loop?: boolean): void;
    /**
     * Plays an animation that has been previously defined with `addAnimation`.
     * @param name - The name of the animation to play.
     * @param forceRestart - If true, the animation will restart from the first frame even if it's already playing.
     */
    play(name: string, forceRestart?: boolean): void;
    /**
     * Stops the currently playing animation.
     * The sprite will remain on the current frame.
     */
    stop(): void;
    /**
     * Updates the animation frame based on the elapsed time.
     * @param deltaTime - Time in seconds since the last frame.
     * @override
     */
    onUpdate(deltaTime: number): void;
    /**
     * Renders the sprite's current texture to the screen.
     * @param render - The Rapid rendering instance.
     * @override
     */
    onRender(render: Rapid): void;
}
/**
 * An entity designed specifically to display text on the screen.
 * It encapsulates a `Text` texture, giving it position, scale, rotation,
 * and other entity-based properties.
 */
export declare class Label extends Component {
    text: Text;
    constructor(options: ILabelEntityOptions);
    onRender(render: Rapid): void;
    /**
     * Updates the displayed text. Re-renders the texture if the text has changed.
     * @param text - The new text to display.
     */
    setText(text: string): void;
}
