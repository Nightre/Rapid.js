import AssetsLoader from "./assets";
import AudioManager from "./audio";
import { InputManager } from "./input";
import { IEntityTilemapLayerOptions, IEntityTransformOptions, IGameOptions, ISpriteRenderOptions, ITilemapLayerOptions, ITransformOptions, TilemapShape, YSortCallback } from "./interface";
import { MatrixStack, Vec2 } from "./math";
import Rapid from "./render";
import { TextureCache } from "./texture";
import { TileSet } from "./tilemap";

export const isPlainObject = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.getPrototypeOf(obj) === Object.prototype;
}

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
        return this.position.x
    }

    set x(nx: number) {
        this.x = nx
    }

    set y(ny: number) {
        this.y = ny
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
    beforOnRender(): void {
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
}

/**
 * Camera entity for managing the view transform in the game.
 */
export class Camera extends Entity {
    /**
     * Updates the camera's transform to center the view and apply transformations.
     */
    override updateTransform(): void {
        const transform = this.transform;
        transform.identity();

        const centeredPosition = new Vec2(
            -this.rapid.logicWidth,
            -this.rapid.logicHeight
        ).divide(2);

        transform.translate(centeredPosition);
        transform.translate(this.position);
        transform.rotate(this.rotation);
        transform.scale(this.scale);

        transform.setTransform(transform.getInverse());
    }
}

/**
 * Tilemap entity for rendering tiled maps.
 */
export class Tilemap extends Entity {
    static readonly DEFAULT_ERROR = 0;
    static readonly EMPTY_TILE = -1;

    error: Vec2 = new Vec2(Tilemap.DEFAULT_ERROR);
    shape: TilemapShape;
    tileSet: TileSet;
    data: (number | string)[][] = [[]];
    eachTile?: (tileId: string | number, mapX: number, mapY: number) => ISpriteRenderOptions | undefined | void;
    ySortCallback: YSortCallback[] = [];

    /**
     * Creates a tilemap entity.
     * @param game - The game instance this tilemap belongs to.
     * @param options - Configuration options for the tilemap.
     */
    constructor(game: Game, options: IEntityTilemapLayerOptions) {
        super(game, options);
        if (options.error) {
            if (typeof options.error === "number") {
                this.error = new Vec2(options.error);
            } else {
                this.error = options.error;
            }
        } else {
            this.error = new Vec2(options.errorX ?? Tilemap.DEFAULT_ERROR, options.errorY ?? Tilemap.DEFAULT_ERROR);
        }
        this.tileSet = options.tileSet;
        this.shape = options.shape ?? TilemapShape.SQUARE;
        this.eachTile = options.eachTile;
    }

    /**
     * Collects renderable entities, excluding children unless they override onRender.
     * @param queue - The array to collect renderable entities.
     */
    override collectRenderables(queue: Entity[]): void {
        if (this.onRender !== Entity.prototype.onRender) {
            queue.push(this);
        }
    }

    /**
     * Sets a tile at the specified map coordinates.
     * @param x - The X coordinate (column) on the map.
     * @param y - The Y coordinate (row) on the map.
     * @param tileId - The tile ID to set (number or string).
     * @returns True if the tile was set successfully, false if coordinates are out of bounds.
     */
    public setTile(x: number, y: number, tileId: number | string): boolean {
        if (y < 0 || y >= this.data.length || x < 0 || x >= this.data[y].length) {
            console.warn(`Tilemap.setTile: Coordinates (${x}, ${y}) are out of bounds.`);
            return false;
        }
        this.data[y][x] = tileId;
        return true;
    }

    /**
     * Gets the tile ID at the specified map coordinates.
     * @param x - The X coordinate (column) on the map.
     * @param y - The Y coordinate (row) on the map.
     * @returns The tile ID (number or string) or undefined if coordinates are out of bounds.
     */
    public getTile(x: number, y: number): number | string | undefined {
        if (y < 0 || y >= this.data.length || x < 0 || x >= this.data[y].length) {
            return undefined;
        }
        return this.data[y][x];
    }

    /**
     * Removes a tile at the specified map coordinates (sets it to EMPTY_TILE).
     * @param x - The X coordinate (column) on the map.
     * @param y - The Y coordinate (row) on the map.
     * @returns True if the tile was removed successfully, false if coordinates are out of bounds.
     */
    public removeTile(x: number, y: number): boolean {
        return this.setTile(x, y, Tilemap.EMPTY_TILE);
    }

    /**
     * Fills a rectangular area with a specified tile ID.
     * @param tileId - The tile ID to use for filling.
     * @param startX - The starting X coordinate.
     * @param startY - The starting Y coordinate.
     * @param width - The width of the fill area.
     * @param height - The height of the fill area.
     */
    public fill(tileId: number | string, startX: number, startY: number, width: number, height: number): void {
        const endX = startX + width;
        const endY = startY + height;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                this.setTile(x, y, tileId);
            }
        }
    }

    /**
     * Replaces the entire tilemap data and updates dimensions.
     * @param newData - The new 2D array of tile data.
     */
    public setData(newData: (number | string)[][]): void {
        this.data = newData;
    }

    /**
     * Converts local coordinates to map coordinates.
     * @param local - The local coordinates to convert.
     */
    public localToMap(local: Vec2): void {
        this.rapid.tileMap.localToMap(local, { tileSet: this.tileSet });
    }

    /**
     * Converts map coordinates to local coordinates.
     * @param local - The map coordinates to convert.
     */
    public mapToLocal(local: Vec2): void {
        this.rapid.tileMap.mapToLocal(local, { tileSet: this.tileSet });
    }

    /**
     * Renders the tilemap layer.
     * @param render - The rendering engine instance.
     */
    override onRender(render: Rapid): void {
        const ySortCallback: YSortCallback[] = [...this.ySortCallback];

        this.children.forEach(child => {
            ySortCallback.push({
                ySort: child.localZindex,
                entity: child
            });
        });

        render.renderTileMapLayer(this.data, {
            error: this.error,
            tileSet: this.tileSet,
            eachTile: this.eachTile,
            ySortCallback
        });
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
    renderQueue: Entity[] = [];

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
            this.mainScene.update(deltaTime);
            this.mainScene.collectRenderables(this.renderQueue);
            this.renderQueue.sort((a, b) => {
                const isBrother = a.parent && a.parent === b.parent;
                const global = a.globalZindex - b.globalZindex;
                if (global !== 0 && !isBrother) {
                    return global;
                }
                if (isBrother) {
                    return a.localZindex - b.localZindex;
                }
                return 0;
            });

            this.renderQueue.forEach(entity => {
                entity.beforOnRender();
                entity.onRender(this.render);
            });

            this.renderQueue.length = 0;
        }

        this.render.endRender();
        this.input.updateNextFrame()
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    destroy(){
        this.audio.destroy()
        this.input.destroy()
    }
}