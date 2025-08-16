import Rapid from "./render";
import { IRegisterTileOptions, ILayerRenderOptions, YSortCallback, TilemapShape, ISpriteRenderOptions, IEntityTilemapLayerOptions } from "./interface";
import { Texture } from "./texture";
import { Vec2 } from "./math";
import warn from "./log";
import { Entity, Game } from "./game";

/**
 * Represents a tileset that manages tile textures and their properties.
 */
export class TileSet {
    /** Map storing tile textures and their associated options */
    private textures: Map<string | number, IRegisterTileOptions> = new Map;
    /** Width of each tile in the tileset */
    width: number;
    /** Height of each tile in the tileset */
    height: number;

    /**
     * Creates a new TileSet instance.
     * @param width - The width of each tile in pixels
     * @param height - The height of each tile in pixels
     */
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    /**
     * Registers a new tile with the given ID and options.
     * @param id - The unique identifier for the tile
     * @param options - The tile options or texture to register
     */
    setTile(id: string | number, options: IRegisterTileOptions | Texture) {
        if (options instanceof Texture) {
            options = {
                texture: options,
            }
        }
        this.textures.set(id, options);
    }

    /**
     * Retrieves the registered tile options for the given ID.
     * @param id - The unique identifier of the tile to retrieve
     * @returns The registered tile options, or undefined if not found
     */
    getTile(id: string | number) {
        return this.textures.get(id);
    }
}

/**
 * Represents a tilemap renderer that handles rendering of tile-based maps.
 */
export class TileMapRender {
    private rapid: Rapid;

    /**
     * Creates a new TileMapRender instance.
     * @param rapid - The Rapid rendering instance to use.
     */
    constructor(rapid: Rapid) {
        this.rapid = rapid;
    }

    /**
     * Calculates the error offset values for tile rendering.
     * @param options - Layer rendering options containing error values.
     * @returns Object containing x and y error offsets.
     * @private
     */
    private getOffset(options: ILayerRenderOptions) {
        let errorX = (options.errorX ?? 2) + 1;
        let errorY = (options.errorY ?? 2) + 1;
        if (typeof options.error === 'number') {
            const error = (options.error ?? 2) + 1;
            errorX = error;
            errorY = error;
        } else if (options.error) {
            errorX = options.error.x + 1;
            errorY = options.error.y + 1;
        }
        return { errorX, errorY };
    }

    /**
     * Calculates tile rendering data based on the viewport and tileset.
     * @param tileSet - The tileset to use for rendering.
     * @param options - Layer rendering options.
     * @returns Object containing calculated tile rendering data.
     * @private
     */
    private getTileData(tileSet: TileSet, options: ILayerRenderOptions) {
        const shape = options.shape ?? TilemapShape.SQUARE;
        const width = tileSet.width;
        const height = shape === TilemapShape.ISOMETRIC ? tileSet.height / 2 : tileSet.height;

        const matrix = this.rapid.matrixStack;
        const { errorX, errorY } = this.getOffset(options);

        // 1. 获取屏幕的四个角点
        const screenTopLeft = new Vec2(0, 0);
        const screenTopRight = new Vec2(this.rapid.width, 0);
        const screenBottomLeft = new Vec2(0, this.rapid.height);
        const screenBottomRight = new Vec2(this.rapid.width, this.rapid.height);

        // 2. 将这四个屏幕角点通过逆矩阵变换到瓦片地图的本地空间
        const localTopLeft = matrix.globalToLocal(screenTopLeft);
        const localTopRight = matrix.globalToLocal(screenTopRight);
        const localBottomLeft = matrix.globalToLocal(screenBottomLeft);
        const localBottomRight = matrix.globalToLocal(screenBottomRight);

        // 3. 找出这四个点在本地空间中的最小和最大坐标，形成AABB
        const minX = Math.min(localTopLeft.x, localTopRight.x, localBottomLeft.x, localBottomRight.x);
        const maxX = Math.max(localTopLeft.x, localTopRight.x, localBottomLeft.x, localBottomRight.x);
        const minY = Math.min(localTopLeft.y, localTopRight.y, localBottomLeft.y, localBottomRight.y);
        const maxY = Math.max(localTopLeft.y, localTopRight.y, localBottomLeft.y, localBottomRight.y);

        // 4. 根据AABB计算出瓦片的起始索引和需要渲染的瓦片数量
        const startTile = new Vec2(
            Math.floor(minX / width) - errorX,
            Math.floor(minY / height) - errorY
        );

        const endTile = new Vec2(
            Math.ceil(maxX / width) + errorX,
            Math.ceil(maxY / height) + errorY
        );

        const viewportWidth = endTile.x - startTile.x;
        const viewportHeight = endTile.y - startTile.y;

        return {
            startTile,
            viewportWidth,
            viewportHeight,
        };
    }

    /**
     * Renders the tilemap layer based on the provided data and options.
     * This method collects all visible tiles and y-sortable objects into a single queue,
     * sorts them once by their y-coordinate, and then renders them in the correct order.
     *
     * @param data - A 2D array representing the tilemap data.
     * @param options - The rendering options for the tilemap layer.
     */
    renderLayer(data: (number | string)[][], options: ILayerRenderOptions): void {
        this.rapid.matrixStack.applyTransform(options);
        const tileSet = options.tileSet;

        const {
            startTile,
            viewportWidth,
            viewportHeight,
        } = this.getTileData(tileSet, options);

        // --- 核心改动点 ---
        // 1. 创建一个统一的渲染队列，用于存放所有需要渲染的对象 (瓦片和其他实体)
        const renderQueue: YSortCallback[] = [];

        // 2. 首先，将所有外部传入的、需要 y-sort 的对象添加到队列中
        if (options.ySortCallback) {
            renderQueue.push(...options.ySortCallback);
        }

        // 3. 遍历所有可视范围内的瓦片，并将它们作为渲染任务添加到队列中
        for (let y = 0; y < viewportHeight; y++) {
            const mapY = y + startTile.y;
            if (mapY < 0 || mapY >= data.length) {
                continue;
            }

            for (let x = 0; x < viewportWidth; x++) {
                const mapX = x + startTile.x;
                if (mapX < 0 || mapX >= data[mapY].length) {
                    continue;
                }

                const tileId = data[mapY][mapX];
                const tile = tileSet.getTile(tileId);
                if (!tile) {
                    continue;
                }

                // 计算瓦片的最终渲染位置和 y-sort 值
                const localPos = this.mapToLocal(new Vec2(mapX, mapY), options);
                const ySort = localPos.y + (tile.ySortOffset ?? 0);
                const edata = options.eachTile ? (options.eachTile(tileId, mapX, mapY) || {}) : {};

                // 将瓦片封装成 YSortCallback 对象并推入队列
                renderQueue.push({
                    ySort,
                    renderSprite: {
                        ...tile,
                        x: localPos.x + (tile.x || 0),
                        y: localPos.y + (tile.y || 0),
                        ...edata,
                    }
                });
            }
        }

        // 4. 如果启用了 y-sort，对整个渲染队列进行一次排序
        const enableYSort = options.ySortCallback && options.ySortCallback.length > 0;
        if (enableYSort) {
            renderQueue.sort((a, b) => a.ySort - b.ySort);
        }

        // 5. 遍历排序后的队列，依次执行渲染
        for (const item of renderQueue) {
            if (item.render) {
                item.render();
            } else if (item.entity) {
                item.entity.onRender(this.rapid);
            } else if (item.renderSprite) {
                this.rapid.renderSprite(item.renderSprite);
            }
        }

        this.rapid.matrixStack.applyTransformAfter(options);
    }

    /**
     * Converts local coordinates to map coordinates.
     * @param local - The local coordinates.
     * @param options - The rendering options.
     * @returns The map coordinates.
     */
    localToMap(local: Vec2, options: ILayerRenderOptions) {
        const tileSet = options.tileSet
        if (options.shape === TilemapShape.ISOMETRIC) {

            let outputX = 0, outputY = 0

            // Half the height and width of a tile
            const H = tileSet.height / 2;
            const W = tileSet.width / 2;

            // Calculate mapY and check if it's even
            let mapY = Math.floor(local.y / H);
            const isYEven = mapY % 2 === 0

            // Calculate mapX and check if it's even
            let mapX = Math.floor(local.x / W);
            const isXEven = mapX % 2 === 0

            // Calculate the ratio of local x and y within the tile
            const xRatio = (local.x % W) / W
            const yRatio = (local.y % H) / H

            // Determine the position within the diamond shape
            const up2down = yRatio < xRatio
            const down2up = yRatio < (1 - xRatio)

            if (!isYEven) mapY -= 1 // If not an offset row, decrease y by 1 if in the lower half of the tile

            if (up2down && (!isXEven && isYEven)) { // 3 Offset row
                mapY -= 1
            }
            else if (!up2down && (isXEven && !isYEven)) { // 2 Offset row
                mapY += 1
                mapX -= 2
            }

            else if (down2up && (isXEven && isYEven)) { // 4 Offset row
                mapX -= 2
                mapY -= 1
            }
            else if (!down2up && (!isXEven && !isYEven)) { // 1 Offset row
                mapY += 1
            }

            //        /\       
            //       /  \      
            //  1   /    \    2   
            //     /      \    
            //    /        \   
            //   /          \
            //   \          / 
            //    \        /   
            //     \      /    
            //   3  \    /    4 
            //       \  /      
            //        \/      

            outputX = mapX
            outputY = mapY

            outputX = Math.floor(mapX / 2)

            return new Vec2(outputX, outputY);
        } else {
            return new Vec2(
                Math.floor(local.x / tileSet.width),
                Math.floor(local.y / tileSet.height)
            )
        }
    }

    /**
     * Converts map coordinates to local coordinates.
     * @param map - The map coordinates.
     * @param options - The rendering options.
     * @returns The local coordinates.
     */
    mapToLocal(map: Vec2, options: ILayerRenderOptions) {
        const tileSet = options.tileSet
        if (options.shape === TilemapShape.ISOMETRIC) {
            let pos = new Vec2(
                map.x * tileSet.width,
                map.y * tileSet.height / 2
            )
            if (map.y % 2 !== 0) {
                pos.x += tileSet.width / 2
            }
            return pos
        } else {
            return new Vec2(
                map.x * tileSet.width,
                map.y * tileSet.height
            )
        }
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
    enableYsort: boolean

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
        this.enableYsort = options.enableYsort ?? false
    }

    /**
     * Collects renderable entities, excluding children unless they override onRender.
     * @param queue - The array to collect renderable entities.
     */
    override render(queue: Entity[]): void {
        if (this.enableYsort) {
            if (this.onRender !== Entity.prototype.onRender) {
                queue.push(this);
            }
        } else {
            super.render(queue)
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

        if (this.enableYsort) {
            this.children.forEach(child => {
                ySortCallback.push({
                    ySort: child.localZindex,
                    entity: child
                });
            });
        }
        render.renderTileMapLayer(this.data, {
            error: this.error,
            tileSet: this.tileSet,
            eachTile: this.eachTile,
            ySortCallback
        });
    }
}