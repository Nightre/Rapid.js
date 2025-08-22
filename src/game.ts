import EventEmitter from "eventemitter3";
import AssetsLoader from "./assets";
import AudioManager from "./audio";
import { InputManager } from "./input";
import { IAnimation, ICameraOptions, IComponentOptions, ICreateEntity, IEntityOptions, IGameOptions, ILabelEntityOptions, IMathObject, ISpriteOptions } from "./interface";
import { Color, MatrixStack, Vec2 } from "./math";
import Rapid from "./render";
import { Text, Texture, TextureCache } from "./texture";
import { Easing, EasingFunction, Timer, Tween } from "./utils";
import { PhysicsManager } from "./collision";
import { Component } from "./component";

/**
 * Base class for game entities with transform and rendering capabilities.
 */
export class GameObject {
    position: Vec2;
    scale: Vec2;
    rotation: number;

    parent: GameObject | null = null;

    globalZindex: number = 0;
    localZindex: number = 0;
    tags: string[];
    transform = new MatrixStack();

    readonly children: GameObject[] = [];
    rapid: Rapid;
    game: Game;
    camera: GameObject | null = null
    screenTransform!: Float32Array

    get x() {
        return this.position.x
    }

    get y() {
        return this.position.y
    }

    set x(nx: number) {
        this.position.x = nx
    }

    set y(ny: number) {
        this.position.y = ny
    }

    /**
     * Creates an entity with optional transform properties.
     * @param game - The game instance this entity belongs to.
     * @param options - Configuration options for position, scale, rotation, and tags.
     */
    constructor(game: Game, options: IEntityOptions = {}) {
        this.transform.pushIdentity();
        this.game = game;
        this.rapid = game.render;

        this.tags = options.tags ?? [];
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

    private components: Map<string, Component> = new Map();

    /**
     * Adds a component to this entity.
     * @param component - The component instance to add.
     * @returns The added component.
     */
    public addComponent<T extends Component>(component: T): T {
        const name = component.name;
        if (component.unique && this.components.has(name)) {
            throw new Error(`Component with name '${name}' already exists on entity.`);
        }
        this.components.set(name, component);
        component.onAttach(this);
        return component;
    }

    /**
     * Removes a component by name or class.
     * @param key - The component name (string) or class (constructor).
     * @returns True if a component was removed, false otherwise.
     */
    public removeComponent(key: string | (new (...args: any[]) => Component)): boolean {
        const name = typeof key === "string" ? key : key.name;
        const comp = this.components.get(name);
        if (comp) {
            comp.onDetach();
            comp.onDispose();
            this.components.delete(name);
            return true;
        }
        return false;
    }

    /**
     * Gets a component by name.
     * @param name - The component name.
     * @returns The component or null if not found.
     */
    public getComponentByName<T extends Component>(name: string): T | null {
        return (this.components.get(name) as T) ?? null;
    }

    /**
     * Gets a component by class.
     * @param ctor - The component class.
     * @returns The component or null if not found.
     */
    public getComponent<T extends Component>(ctor: new (...args: any[]) => T): T | null {
        for (const comp of this.components.values()) {
            if (comp instanceof ctor) {
                return comp as T;
            }
        }
        return null;
    }

    /**
     * Checks if a component exists by name or class.
     */
    public hasComponent(key: string | (new (...args: any[]) => Component)): boolean {
        return typeof key === "string"
            ? this.components.has(key)
            : this.getComponent(key) !== null;
    }


    getScene() {
        return this.game.getMainScene()
    }

    /**
     * Gets the parent transform or the renderer's matrix stack if no parent exists.
     * @returns The transform matrix stack.
     */
    getParentTransform(): MatrixStack {
        return this.parent ? this.parent.transform : this.rapid.matrixStack;
    }

    /**
     * Renders the entity and its components.
     * @param render - The rendering engine instance.
     */
    onRender(render: Rapid): void {
        const transform = this.transform;
        
        if (this.camera) {
            this.rapid.matrixStack.setTransform(this.camera.transform.getTransform());
            this.rapid.matrixStack.multiply(transform.getTransform())
        }else{
            this.rapid.matrixStack.setTransform(transform.getTransform());
        }
        this.screenTransform = this.rapid.matrixStack.getTransform()
        this.components.forEach(c => c.onRender(render))
    }
    onRenderQueue(queue: GameObject[]) {
        this.components.forEach(c => c.onRenderQueue(queue))
        queue.push(this)
    }
    onUpdate(deltaTime: number) {
        this.components.forEach(c => c.onUpdate(deltaTime))
    }
    onPhysics(deltaTime: number) {
        this.components.forEach(c => c.onPhysics(deltaTime))
    }
    onDispose(): void {
        this.components.forEach(c => c.onDispose())
    }

    /**
     * Updates the entity's transform, optionally updating parent transforms.
     * @param deep - If true, recursively updates parent transforms.
     */
    public updateTransform(deep: boolean = false): void {
        if (deep && this.parent) {
            this.parent.updateTransform(deep);
        }
        const transform = this.transform;
        const parentTransform = this.getParentTransform();
        transform.setTransform(parentTransform.getTransform());

        transform.translate(this.position);
        transform.rotate(this.rotation);
        transform.scale(this.scale);
    }

    /**
     * Adds a child entity to this entity.
     * @param child - The entity to add as a child.
     */
    public addChild(child: GameObject) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
        return this
    }

    /**
     * Removes a child entity from this entity.
     * @param child - The entity to remove.
     */
    public removeChild(child: GameObject) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
        return this
    }

    /**
     * Finds descendant entities matching a predicate.
     * @param predicate - Function to test each entity.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if no matches are found.
     */
    public findDescendant(predicate: (entity: GameObject) => boolean, onlyFirst: boolean = true): GameObject[] | GameObject | null {
        const results: GameObject[] = [];
        for (const child of this.children) {
            if (predicate(child)) {
                if (onlyFirst) {
                    return child;
                }
                results.push(child);
            }
            const childFind = child.findDescendant(predicate, onlyFirst);
            if (onlyFirst) {
                if (childFind) {
                    return childFind;
                }
            } else {
                results.push(...(childFind as GameObject[]));
            }
        }
        return onlyFirst ? null : results;
    }

    /**
     * Finds descendant entities with all specified tags.
     * @param tags - Array of tags to match.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if not found.
     */
    public findDescendantByTag(tags: string[], onlyFirst: boolean = false): GameObject[] | GameObject | null {
        const predicate = (entity: GameObject) => {
            if (tags.length === 0) return false;
            return tags.every(tag => entity.tags.includes(tag));
        };
        return this.findDescendant(predicate, onlyFirst);
    }

    /**
     * Disposes of the entity, its components, and its children.
     */
    public dispose(): void {
        this.postDispose();
        this.onDispose()
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    /**
     * Updates the entity, its components, and its children.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    public processUpdate(deltaTime: number): void {
        this.onUpdate(deltaTime)
        for (const child of this.children) {
            child.processUpdate(deltaTime);
        }
    }

    /**
     * Updates the entity, its components, and its children.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    public processPhysics(deltaTime: number): void {
        this.onPhysics(deltaTime)
        for (const child of this.children) {
            child.processPhysics(deltaTime);
        }
    }
    /**
     * Collects entities and components that need rendering.
     * @param queue - The array to collect renderable entities.
     * @ignore
     */
    public render(queue: GameObject[]): void {
        this.updateTransform();
        this.onRenderQueue(queue)
        if (this.onRender !== GameObject.prototype.onRender) {
            queue.push(this);
        }
        for (const child of this.children) {
            child.render(queue);
        }
    }

    /**
     * Hook for custom cleanup logic before disposal.
     */
    protected postDispose(): void {
        this.children.forEach(child => {
            child.dispose();
        });
    }

    getMouseLocalPosition() {
        return this.game.input.getMouseLocal(this)
    }

    getMouseGlobalPosition() {
        return this.game.input.mousePosition
    }

    static create(game: Game, options: ICreateEntity) {
        const entity = new GameObject(game, options)
        options.components.forEach(c => {
            entity.addComponent(c)
        })
        return entity
    }
}

/**
 * A layer that renders its children directly to the screen, ignoring any camera transforms.
 * Ideal for UI elements like HUDs, menus, and scores.
 *
 * CanvasLayer 是一个特殊的层，它会直接将其子节点渲染到屏幕上，忽略任何摄像机的变换。
 * 非常适合用于UI元素，如HUD（状态栏）、菜单和分数显示。
 */
export class CanvasLayer extends Component {
    protected override patchMethods: (keyof GameObject)[] = ['updateTransform'];

    constructor(options: IComponentOptions) {
        super(options);
    }

    override onAttach(entity: GameObject): void {
        super.onAttach(entity)
    }

    updateTransform(): void {
        this.entity.transform.identity();
    }
}

/**
 * Camera entity for managing the view transform in the game.
 */
export class Camera extends Component {
    protected override patchMethods: (keyof GameObject)[] = ['updateTransform'];

    enable: boolean = false;
    center: boolean = false;

    declare options: ICameraOptions;

    /**
     * 设置此摄像机是否为当前场景的主摄像机。
     * @param isEnable 
     */
    setEnable(isEnable: boolean) {
        this.enable = isEnable;
        if (isEnable) {
            this.game.setMainCamera(this);
        } else if (this.game.mainCamera === this) {
            this.game.setMainCamera(null);
        }
    }

    constructor(options: ICameraOptions = {}) {
        super(options);
    }

    override onAttach(entity: GameObject): void {
        super.onAttach(entity)
        const options = this.options
        this.center = options.center ?? true;

        this.setEnable(options.enable ?? false);
    }

    updateTransform(): void {
        const entity = this.entity
        const render = this.rapid

        // --- Part 1: 计算摄像机在世界中的真实全局变换矩阵 ---
        const parentTransform = entity.getParentTransform();
        const globalTransform = entity.transform; // 使用 this.transform 作为临时计算器

        // 1a. 从父节点继承变换
        globalTransform.setTransform(parentTransform.getTransform());

        // 1b. 应用自己的局部变换（直接用 position/rotation/scale）
        globalTransform.translate(entity.position);
        globalTransform.rotate(entity.rotation);
        globalTransform.scale(entity.scale);

        // --- Part 2: 将全局变换转换为视图矩阵 ---
        const viewMatrix = globalTransform.getInverse();

        // --- Part 3: 应用屏幕居中偏移 ---
        if (this.center) {
            const centerX = render.logicWidth / 2;
            const centerY = render.logicHeight / 2;

            viewMatrix[4] = viewMatrix[0] * centerX + viewMatrix[2] * centerY + viewMatrix[4];
            viewMatrix[5] = viewMatrix[1] * centerX + viewMatrix[3] * centerY + viewMatrix[5];
        }

        // --- Part 4: 存回 ---
        entity.transform.setTransform(viewMatrix);
    }

    getTransform() {
        return this.entity.transform.getTransform()
    }
}


/**
 * Scene class representing a game scene with entities.
 */
export class Scene extends GameObject {
    /**
     * Initializes the scene.
     */
    public create(): void { }
}

/**
 * Main game class managing the game loop, rendering, and input.
 */
export class Game {
    render: Rapid;
    mainScene: Scene | null = null;
    input: InputManager;
    asset: AssetsLoader;
    audio: AudioManager;
    texture: TextureCache;
    physics: PhysicsManager
    private isRunning: boolean = false;
    private lastTime: number = 0;
    private tweens: Tween<any>[] = [];
    private timers: Timer[] = [];
    mainCamera: Camera | null = null
    renderQueue: GameObject[] = [];
    worldTransform = new MatrixStack()

    /**
     * Creates a new game instance.
     * @param options - Configuration options for the game.
     */
    constructor(options: IGameOptions) {
        this.render = new Rapid(options);
        this.input = new InputManager(this.render);
        this.asset = new AssetsLoader(this)
        this.audio = new AudioManager()
        this.physics = new PhysicsManager(this)
        this.texture = this.render.texture

        this.start()
    }

    getMainScene() {
        return this.mainScene
    }

    setMainCamera(camera: Camera | null) {
        this.mainCamera = camera
    }

    /**
     * Switches to a new scene, disposing of the current one.
     * @param newScene - The new scene to switch to.
     */
    public switchScene(newScene: Scene): void {
        if (this.mainScene) {
            this.mainScene.dispose();
        }
        this.mainScene = newScene;
        newScene.create();
    }

    /**
     * Starts the game loop.
     */
    public start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    /**
     * Stops the game loop.
     */
    public stop(): void {
        this.isRunning = false;
    }

    /**
     * Adds an entity to the render queue.
     * @param entity - The entity to add.
     */
    public addEntityRenderQueue(entity: GameObject): void {
        this.renderQueue.push(entity);
    }

    /**
     * Runs the game loop, updating and rendering the scene.
     * @private
     */
    private gameLoop(): void {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.render.startRender();

        if (this.mainScene) {
            // if (this.mainCamera && this.mainCamera.enable) {
            //     this.render.matrixStack.setTransform(this.mainCamera.getTransform());
            // }
            this.worldTransform.setTransform(this.render.matrixStack.getTransform());

            this.mainScene.processUpdate(deltaTime);
            this.mainScene.processPhysics(deltaTime)
            this.mainScene.render(this.renderQueue);

            this.renderQueue.sort((a, b) => {
                const isBrother = a.parent && a.parent === b.parent;
                const global = a.globalZindex - b.globalZindex;
                if (global !== 0) {
                    return global;
                }
                if (isBrother) {
                    return a.localZindex - b.localZindex;
                }
                return 0;
            });

            this.renderQueue.forEach(entity => {
                entity.onRender(this.render);
            });

            this.renderQueue.length = 0;
        }

        this.render.endRender();
        this.input.updateNextFrame()
        this.updateTweens(deltaTime)
        this.updateTimers(deltaTime)
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    destroy() {
        this.audio.destroy()
        this.input.destroy()
    }

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
    public createTimer(duration: number, repeat: boolean = false): Timer {
        const timer = new Timer(duration, repeat);
        this.timers.push(timer);
        timer.start(); // Timers start automatically upon creation
        return timer;
    }
    /**
     * Updates all active timers and removes completed ones.
     * @param deltaTime - The time elapsed since the last frame.
     * @private
     */
    private updateTimers(deltaTime: number): void {
        for (const timer of this.timers) {
            timer.update(deltaTime);
        }
        // Filter out finished timers to prevent the array from growing indefinitely
        this.timers = this.timers.filter(timer => !timer.isFinished);
    }
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
    public createTween<T extends IMathObject<T> | number>(
        target: any,
        property: string,
        to: T,
        duration: number,
        easing: EasingFunction = Easing.Linear
    ): Tween<T> {
        const tween = new Tween(target, property, to, duration, easing);
        this.tweens.push(tween);
        tween.start();
        return tween;
    }

    /**
     * Updates all active tweens and removes completed ones.
     * @param deltaTime - The time elapsed since the last frame.
     * @private
     */
    private updateTweens(deltaTime: number): void {
        for (const tween of this.tweens) {
            tween.update(deltaTime);
        }
        // Filter out finished tweens to prevent the array from growing indefinitely
        this.tweens = this.tweens.filter(tween => !tween.isFinished);
    }
}

/**
 * An entity that displays a texture (a "sprite") and can play animations.
 * Animations are defined as a sequence of textures.
 */
export class Sprite extends Component {
    /** The current texture being displayed. This can be a static texture or a frame from an animation. */
    public texture: Texture | null;
    /** Whether the sprite is flipped horizontally. */
    public flipX: boolean;
    /** Whether the sprite is flipped vertically. */
    public flipY: boolean;

    public color: Color
    public offset: Vec2

    private animations = new Map<string, IAnimation>();
    private currentAnimation: IAnimation | null = null;
    private currentFrame: number = 0;
    private frameTimer: number = 0;
    private isPlaying: boolean = false;

    /**
     * Creates a new Sprite entity.
     * @param game - The game instance.
     * @param options - Configuration for the sprite's transform and initial texture.
     */
    constructor(options: ISpriteOptions = {}) {
        super(options);
        this.texture = options.texture ?? null;
        this.flipX = options.flipX ?? false;
        this.flipY = options.flipY ?? false;

        this.color = options.color ?? Color.White()
        this.offset = options.offset ?? Vec2.ZERO()

        if (options.animations) {
            this.setAnimations(options.animations)
        }
    }

    setAnimations(animations: Record<string, IAnimation>) {
        this.animations = new Map(Object.entries(animations))
    }

    /**
     * Defines a new animation sequence.
     * @param name - A unique name for the animation (e.g., "walk", "jump").
     * @param frames - An array of Textures to use as frames.
     * @param fps - The playback speed in frames per second.
     * @param loop - Whether the animation should repeat.
     */
    public addAnimation(name: string, frames: Texture[], fps: number = 10, loop: boolean = true): void {
        this.animations.set(name, { frames, fps, loop });
    }

    /**
     * Plays an animation that has been previously defined with `addAnimation`.
     * @param name - The name of the animation to play.
     * @param forceRestart - If true, the animation will restart from the first frame even if it's already playing.
     */
    public play(name: string, forceRestart: boolean = false): void {
        const animation = this.animations.get(name);
        if (!animation) {
            console.warn(`Animation "${name}" not found.`);
            return;
        }

        if (this.currentAnimation === animation && !forceRestart) {
            // If it's the same animation and it was paused, just resume it.
            if (!this.isPlaying) this.isPlaying = true;
            return;
        }

        this.currentAnimation = animation;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isPlaying = true;
        this.texture = this.currentAnimation.frames[this.currentFrame];
    }

    /**
     * Stops the currently playing animation.
     * The sprite will remain on the current frame.
     */
    public stop(): void {
        this.isPlaying = false;
    }

    /**
     * Updates the animation frame based on the elapsed time.
     * @param deltaTime - Time in seconds since the last frame.
     * @override
     */
    override onUpdate(deltaTime: number): void {
        if (!this.isPlaying || !this.currentAnimation) {
            return;
        }

        const frameDuration = 1 / (this.currentAnimation.fps ?? 1);
        this.frameTimer += deltaTime;

        // Advance frames if enough time has passed
        while (this.frameTimer >= frameDuration) {
            this.frameTimer -= frameDuration;
            this.currentFrame++;

            // Check if the animation has ended
            if (this.currentFrame >= this.currentAnimation.frames.length) {
                if (this.currentAnimation.loop) {
                    this.currentFrame = 0;
                } else {
                    // Clamp to the last frame and stop
                    this.currentFrame = this.currentAnimation.frames.length - 1;
                    this.isPlaying = false;
                    break; // Exit the while loop
                }
            }
        }

        // Update the visible texture to the current frame
        this.texture = this.currentAnimation.frames[this.currentFrame];
    }

    /**
     * Renders the sprite's current texture to the screen.
     * @param render - The Rapid rendering instance.
     * @override
     */
    override onRender(render: Rapid): void {
        if (this.texture) {
            render.renderSprite({
                texture: this.texture,
                flipX: this.flipX,
                flipY: this.flipY,
                offset: this.offset,
                color: this.color
            });
        }
    }
}

/**
 * An entity designed specifically to display text on the screen.
 * It encapsulates a `Text` texture, giving it position, scale, rotation,
 * and other entity-based properties.
 */
export class Label extends Component {
    text: Text
    constructor(options: ILabelEntityOptions) {
        super(options)
        this.text = new Text(this.game.render, options)
    }
    override onRender(render: Rapid): void {
        render.renderSprite({
            texture: this.text,
        });
    }
    /**
     * Updates the displayed text. Re-renders the texture if the text has changed.
     * @param text - The new text to display.
     */
    setText(text: string) {
        this.text.setText(text)
    }
}