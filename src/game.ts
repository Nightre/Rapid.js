import EventEmitter from "eventemitter3";
import AssetsLoader from "./assets";
import AudioManager from "./audio";
import { InputManager } from "./input";
import { IAnimation, ICameraOptions, IEntityTransformOptions, IGameOptions, ILabelEntityOptions, IMathObject, ISpriteOptions } from "./interface";
import { Color, MatrixStack, Vec2 } from "./math";
import Rapid from "./render";
import { Text, Texture, TextureCache } from "./texture";
import { Easing, EasingFunction, Timer, Tween } from "./utils";

/**
 * Base class for game entities with transform and rendering capabilities.
 */
export class Entity {
    position: Vec2;
    scale: Vec2;
    rotation: number;

    parent: Entity | null = null;

    globalZindex: number = 0;
    localZindex: number = 0;
    tags: string[];
    transform = new MatrixStack();

    readonly children: Entity[] = [];
    protected rapid: Rapid;
    protected game: Game;

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
    constructor(game: Game, options: IEntityTransformOptions = {}) {
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
     * Updates the entity and its children.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    public update(deltaTime: number): void {
        this.onUpdate(deltaTime);
        for (const child of this.children) {
            child.update(deltaTime);
        }
    }

    /**
     * Hook for custom update logic.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    protected onUpdate(deltaTime: number): void { }

    /**
     * Collects entities that need rendering.
     * @param queue - The array to collect renderable entities.
     * @ignore
     */
    public collectRenderables(queue: Entity[]): void {
        this.updateTransform()
        if (this.onRender !== Entity.prototype.onRender) {
            queue.push(this);
        }
        for (const child of this.children) {
            child.collectRenderables(queue);
        }
    }

    /**
     * Prepares the entity's transform before rendering.
     * @ignore
     */
    beforeOnRender(): void {
        const transform = this.transform;
        this.rapid.matrixStack.setTransform(transform.getTransform());
    }

    /**
     * Hook for custom rendering logic.
     * @param render - The rendering engine instance.
     */
    onRender(render: Rapid): void { }

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
    public addChild(child: Entity): void {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    /**
     * Removes a child entity from this entity.
     * @param child - The entity to remove.
     */
    public removeChild(child: Entity): void {
        const index = this.children.indexOf(child);
        if (index > -1) {
            child.parent = null;
            this.children.splice(index, 1);
        }
    }

    /**
     * Finds descendant entities matching a predicate.
     * @param predicate - Function to test each entity.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if no matches are found.
     */
    public findDescendant(predicate: (entity: Entity) => boolean, onlyFirst: boolean = true): Entity[] | Entity | null {
        const results: Entity[] = [];
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
                results.push(...(childFind as Entity[]));
            }
        }
        return onlyFirst ? null : results;
    }

    /**
     * Finds descendant entities with all specified tags.
     * @param tags - Array of tags to match.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if no matches are found.
     */
    public findDescendantByTag(tags: string[], onlyFirst: boolean = false): Entity[] | Entity | null {
        const predicate = (entity: Entity) => {
            if (tags.length === 0) return false;
            return tags.every(tag => entity.tags.includes(tag));
        };
        return this.findDescendant(predicate, onlyFirst);
    }

    /**
     * Disposes of the entity and its children.
     */
    public dispose(): void {
        this.postDispose();
        if (this.parent) {
            this.parent.removeChild(this);
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

    getMouseLocalPosition(){
        return this.game.input.getMouseLocal(this)
    }
    getMouseGlobalPosition(){
        return this.game.input.mousePosition
    }
}

/**
 * A layer that renders its children directly to the screen, ignoring any camera transforms.
 * Ideal for UI elements like HUDs, menus, and scores.
 *
 * CanvasLayer 是一个特殊的层，它会直接将其子节点渲染到屏幕上，忽略任何摄像机的变换。
 * 非常适合用于UI元素，如HUD（状态栏）、菜单和分数显示。
 */
export class CanvasLayer extends Entity {
    constructor(game: Game, options: IEntityTransformOptions) {
        super(game, options);
    }

    override updateTransform(): void {
        this.transform.identity();
    }
}

/**
 * Camera entity for managing the view transform in the game.
 */
export class Camera extends Entity {
    enable: boolean = false;
    center: boolean = false;

    positionSmoothingSpeed: number = 0;
    rotationSmoothingSpeed: number = 0;

    // 用于平滑处理的内部变量，代表摄像机当前实际渲染的【局部】位置和旋转
    private _currentRenderPosition: Vec2;
    private _currentRenderRotation: number;

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

    constructor(game: Game, options: ICameraOptions = {}) {
        super(game, options);
        this.center = options.center ?? true;
        this.positionSmoothingSpeed = options.positionSmoothingSpeed ?? 0;
        this.rotationSmoothingSpeed = options.rotationSmoothingSpeed ?? 0;

        // 初始化当前渲染位置为初始【局部】位置
        this._currentRenderPosition = this.position.clone();
        this._currentRenderRotation = this.rotation;

        this.setEnable(options.enable ?? false);
    }

    /**
     * 每帧更新，用于平滑摄像机的【局部】变换属性。
     * @param deltaTime 
     */
    override onUpdate(deltaTime: number): void {
        // --- 位置平滑 ---
        // 这里平滑的是 this.position (局部目标位置) 到 _currentRenderPosition (局部渲染位置)
        if (this.positionSmoothingSpeed > 0) {
            const factor = 1 - Math.exp(-this.positionSmoothingSpeed * deltaTime);
            this._currentRenderPosition.lerp(this.position, factor);
        } else {
            this._currentRenderPosition.copy(this.position);
        }

        // --- 旋转平滑 ---
        if (this.rotationSmoothingSpeed > 0) {
            const factor = 1 - Math.exp(-this.rotationSmoothingSpeed * deltaTime);
            let diff = this.rotation - this._currentRenderRotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this._currentRenderRotation += diff * factor;
        } else {
            this._currentRenderRotation = this.rotation;
        }
    }

    /**
     * 根据摄像机的【全局】变换计算最终的视图矩阵。
     * 这个方法现在正确地处理了父子关系。
     */
    override updateTransform(): void {
        // --- Part 1: 计算摄像机在世界中的真实全局变换矩阵 ---
        // 我们复用 Entity.updateTransform 的逻辑，但使用平滑后的局部值。
        const parentTransform = this.getParentTransform();
        const globalTransform = this.transform; // 使用 this.transform 作为临时计算器

        // 1a. 从父节点继承变换
        globalTransform.setTransform(parentTransform.getTransform());

        // 1b. 应用自己的局部变换（使用平滑值）
        globalTransform.translate(this._currentRenderPosition);
        globalTransform.rotate(this._currentRenderRotation);
        globalTransform.scale(this.scale);

        // 此刻, `globalTransform` (即 this.transform) 存储的是摄像机在世界中的精确变换。

        // --- Part 2: 将全局变换转换为视图矩阵 ---
        // 视图矩阵是全局变换的逆矩阵。
        const viewMatrix = globalTransform.getInverse();

        // --- Part 3: 应用屏幕居中偏移 ---
        // 我们需要将视图的原点(0,0)移动到屏幕中心。
        // 这相当于对视图矩阵进行一次【前乘】平移变换。
        if (this.center) {
            const centerX = this.rapid.logicWidth / 2;
            const centerY = this.rapid.logicHeight / 2;

            // 手动执行前乘平移： T(center) * M(view)
            // 只会影响最终矩阵的平移分量 (tx, ty)
            viewMatrix[4] = viewMatrix[0] * centerX + viewMatrix[2] * centerY + viewMatrix[4];
            viewMatrix[5] = viewMatrix[1] * centerX + viewMatrix[3] * centerY + viewMatrix[5];
        }

        // --- Part 4: 将最终计算出的视图矩阵存回 this.transform ---
        this.transform.setTransform(viewMatrix);
    }
}

/**
 * Scene class representing a game scene with entities.
 */
export class Scene extends Entity {
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
    texture: TextureCache
    private isRunning: boolean = false;
    private lastTime: number = 0;
    private tweens: Tween<any>[] = [];
    private timers: Timer[] = [];
    mainCamera: Camera | null = null
    renderQueue: Entity[] = [];
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
        this.texture = this.render.texture
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
    public addEntityRenderQueue(entity: Entity): void {
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
            if (this.mainCamera && this.mainCamera.enable) {
                this.render.matrixStack.setTransform(this.mainCamera.transform.getTransform());
            }
            this.worldTransform.setTransform(this.render.matrixStack.getTransform());

            this.mainScene.update(deltaTime);
            this.mainScene.collectRenderables(this.renderQueue);

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
                entity.beforeOnRender();
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
export class Sprite extends Entity {
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
    constructor(game: Game, options: ISpriteOptions = {}) {
        super(game, options);
        this.texture = options.texture ?? null;
        this.flipX = options.flipX ?? false;
        this.flipY = options.flipY ?? false;

        this.color = options.color ?? Color.White
        this.offset = options.offset ?? Vec2.ZERO

        if (options.animations) {
            this.setAnimations(options.animations)
        }
    }

    setAnimations(animations: IAnimation) {
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
        this.animations.set(name, { name, frames, fps, loop });
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

        const frameDuration = 1 / this.currentAnimation.fps;
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
export class Label extends Entity {
    text: Text
    constructor(game: Game, options: ILabelEntityOptions) {
        super(game, options)
        this.text = new Text(game.render, options)
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