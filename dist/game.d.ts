import AssetsLoader from "./assets";
import AudioManager from "./audio";
import { InputManager } from "./input";
import { IEntityTilemapLayerOptions, IEntityTransformOptions, IGameOptions, IMathObject, ISpriteRenderOptions, TilemapShape, YSortCallback } from "./interface";
import { MatrixStack, Vec2 } from "./math";
import Rapid from "./render";
import { TextureCache } from "./texture";
import { TileSet } from "./tilemap";
import { EasingFunction, Timer, Tween } from "./utils";
/**
 * Base class for game entities with transform and rendering capabilities.
 */
export declare class Entity {
    position: Vec2;
    scale: Vec2;
    rotation: number;
    parent: Entity | null;
    globalZindex: number;
    localZindex: number;
    tags: string[];
    transform: MatrixStack;
    readonly children: Entity[];
    protected rapid: Rapid;
    protected game: Game;
    get x(): number;
    get y(): number;
    set x(nx: number);
    set y(ny: number);
    /**
     * Creates an entity with optional transform properties.
     * @param game - The game instance this entity belongs to.
     * @param options - Configuration options for position, scale, rotation, and tags.
     */
    constructor(game: Game, options?: IEntityTransformOptions);
    /**
     * Gets the parent transform or the renderer's matrix stack if no parent exists.
     * @returns The transform matrix stack.
     */
    getParentTransform(): MatrixStack;
    /**
     * Updates the entity and its children.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    update(deltaTime: number): void;
    /**
     * Hook for custom update logic.
     * @param deltaTime - Time elapsed since the last update in seconds.
     */
    protected onUpdate(deltaTime: number): void;
    /**
     * Collects entities that need rendering.
     * @param queue - The array to collect renderable entities.
     * @ignore
     */
    collectRenderables(queue: Entity[]): void;
    /**
     * Prepares the entity's transform before rendering.
     * @ignore
     */
    beforOnRender(): void;
    /**
     * Hook for custom rendering logic.
     * @param render - The rendering engine instance.
     */
    onRender(render: Rapid): void;
    /**
     * Updates the entity's transform, optionally updating parent transforms.
     * @param deep - If true, recursively updates parent transforms.
     */
    updateTransform(deep?: boolean): void;
    /**
     * Adds a child entity to this entity.
     * @param child - The entity to add as a child.
     */
    addChild(child: Entity): void;
    /**
     * Removes a child entity from this entity.
     * @param child - The entity to remove.
     */
    removeChild(child: Entity): void;
    /**
     * Finds descendant entities matching a predicate.
     * @param predicate - Function to test each entity.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if no matches are found.
     */
    findDescendant(predicate: (entity: Entity) => boolean, onlyFirst?: boolean): Entity[] | Entity | null;
    /**
     * Finds descendant entities with all specified tags.
     * @param tags - Array of tags to match.
     * @param onlyFirst - If true, returns only the first match; otherwise, returns all matches.
     * @returns A single entity, an array of entities, or null if no matches are found.
     */
    findDescendantByTag(tags: string[], onlyFirst?: boolean): Entity[] | Entity | null;
    /**
     * Disposes of the entity and its children.
     */
    dispose(): void;
    /**
     * Hook for custom cleanup logic before disposal.
     */
    protected postDispose(): void;
}
/**
 * Camera entity for managing the view transform in the game.
 */
export declare class Camera extends Entity {
    /**
     * Updates the camera's transform to center the view and apply transformations.
     */
    updateTransform(): void;
}
/**
 * Tilemap entity for rendering tiled maps.
 */
export declare class Tilemap extends Entity {
    static readonly DEFAULT_ERROR = 0;
    static readonly EMPTY_TILE = -1;
    error: Vec2;
    shape: TilemapShape;
    tileSet: TileSet;
    data: (number | string)[][];
    eachTile?: (tileId: string | number, mapX: number, mapY: number) => ISpriteRenderOptions | undefined | void;
    ySortCallback: YSortCallback[];
    /**
     * Creates a tilemap entity.
     * @param game - The game instance this tilemap belongs to.
     * @param options - Configuration options for the tilemap.
     */
    constructor(game: Game, options: IEntityTilemapLayerOptions);
    /**
     * Collects renderable entities, excluding children unless they override onRender.
     * @param queue - The array to collect renderable entities.
     */
    collectRenderables(queue: Entity[]): void;
    /**
     * Sets a tile at the specified map coordinates.
     * @param x - The X coordinate (column) on the map.
     * @param y - The Y coordinate (row) on the map.
     * @param tileId - The tile ID to set (number or string).
     * @returns True if the tile was set successfully, false if coordinates are out of bounds.
     */
    setTile(x: number, y: number, tileId: number | string): boolean;
    /**
     * Gets the tile ID at the specified map coordinates.
     * @param x - The X coordinate (column) on the map.
     * @param y - The Y coordinate (row) on the map.
     * @returns The tile ID (number or string) or undefined if coordinates are out of bounds.
     */
    getTile(x: number, y: number): number | string | undefined;
    /**
     * Removes a tile at the specified map coordinates (sets it to EMPTY_TILE).
     * @param x - The X coordinate (column) on the map.
     * @param y - The Y coordinate (row) on the map.
     * @returns True if the tile was removed successfully, false if coordinates are out of bounds.
     */
    removeTile(x: number, y: number): boolean;
    /**
     * Fills a rectangular area with a specified tile ID.
     * @param tileId - The tile ID to use for filling.
     * @param startX - The starting X coordinate.
     * @param startY - The starting Y coordinate.
     * @param width - The width of the fill area.
     * @param height - The height of the fill area.
     */
    fill(tileId: number | string, startX: number, startY: number, width: number, height: number): void;
    /**
     * Replaces the entire tilemap data and updates dimensions.
     * @param newData - The new 2D array of tile data.
     */
    setData(newData: (number | string)[][]): void;
    /**
     * Converts local coordinates to map coordinates.
     * @param local - The local coordinates to convert.
     */
    localToMap(local: Vec2): void;
    /**
     * Converts map coordinates to local coordinates.
     * @param local - The map coordinates to convert.
     */
    mapToLocal(local: Vec2): void;
    /**
     * Renders the tilemap layer.
     * @param render - The rendering engine instance.
     */
    onRender(render: Rapid): void;
}
/**
 * Scene class representing a game scene with entities.
 */
export declare class Scene extends Entity {
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
    private isRunning;
    private lastTime;
    private tweens;
    private timers;
    renderQueue: Entity[];
    /**
     * Creates a new game instance.
     * @param options - Configuration options for the game.
     */
    constructor(options: IGameOptions);
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
    addEntityRenderQueue(entity: Entity): void;
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
