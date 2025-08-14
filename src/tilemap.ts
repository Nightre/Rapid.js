import Rapid from "./render";
import { IRegisterTileOptions, ILayerRenderOptions, YSortCallback, TilemapShape, ISpriteRenderOptions } from "./interface";
import { Texture } from "./texture";
import { Vec2 } from "./math";
import warn from "./log";

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
     * 将需要 y-sort 的回调根据它们的 y 坐标分组到一个 Map 中。
     * 使用 Map 是为了避免因地图坐标过大而创建稀疏数组，从而优化内存使用。
     *
     * @param ySortCallbacks - Array of y-sort callbacks to process.
     * @param height - The effective height of a tile row, used for grouping.
     * @returns A Map where keys are row indices (y) and values are arrays of y-sort callbacks for that row.
     * @private
     */
    private getYSortRow(ySortCallbacks: YSortCallback[] | undefined, height: number): Map<number, YSortCallback[]> {
        const rows = new Map<number, YSortCallback[]>();
        if (!ySortCallbacks) {
            return rows;
        }

        for (const ySort of ySortCallbacks) {
            // 计算这个对象属于哪一行
            const y = Math.floor(ySort.ySort / height);

            // 如果这一行在 Map 中还不存在，则初始化一个空数组
            if (!rows.has(y)) {
                rows.set(y, []);
            }

            // 将对象添加到对应的行数组中
            rows.get(y)!.push(ySort);
        }
        return rows;
    }
    /**
     * Calculates the error offset values for tile rendering.
     * @param options - Layer rendering options containing error values.
     * @returns Object containing x and y error offsets.
     * @private
     */
    private getOffset(options: ILayerRenderOptions) {
        let errorX = (options.errorX ?? 2) + 1
        let errorY = (options.errorY ?? 2) + 1
        if (typeof options.error === 'number') {
            const error = (options.error ?? 2) + 1
            errorX = error
            errorY = error
        } else if (options.error) {
            errorX = options.error.x + 1
            errorY = options.error.y + 1
        }
        return { errorX, errorY }
    }

    /**
     * Renders a row of y-sorted entities.
     * @param rapid - The Rapid rendering instance.
     * @param ySortRow - Array of y-sort callbacks to render.
     * @private
     */
    private renderYSortRow(rapid: Rapid, ySortRow: YSortCallback[]) {
        if (!ySortRow || ySortRow.length === 0) { // 加一个安全检查
            return;
        }
        for (const ySort of ySortRow) {
            if (ySort.render) {
                ySort.render();
            } else if (ySort.entity) {
                ySort.entity.onRender(rapid)
            } else if (ySort.renderSprite) {
                rapid.renderSprite(ySort.renderSprite);
            }
        }
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
            height,
        };
    }

    /**
     * Renders the tilemap layer based on the provided data and options.
     * 
     * @param data - A 2D array representing the tilemap data.
     * @param options - The rendering options for the tilemap layer.
     * @returns 
     */
    renderLayer(data: (number | string)[][], options: ILayerRenderOptions): void {
        this.rapid.matrixStack.applyTransform(options);
        const tileSet = options.tileSet;

        // 使用支持旋转的 getTileData 版本
        const {
            startTile,
            viewportWidth,
            viewportHeight,
            height
        } = this.getTileData(tileSet, options);

        // --- 这里是改动点 ---
        // 1. 调用新的 getYSortRow，它返回一个 Map
        const ySortRowsMap = this.getYSortRow(options.ySortCallback, height);
        const enableYSort = options.ySortCallback && options.ySortCallback.length > 0;

        for (let y = 0; y < viewportHeight; y++) {
            const mapY = y + startTile.y;

            // 2. 从 Map 中获取当前行的回调，如果不存在则返回一个空数组
            const currentRow: YSortCallback[] = ySortRowsMap.get(mapY) ?? [];

            // 后续逻辑保持不变...
            if (mapY < 0 || mapY >= data.length) {
                // 即使地图瓦片不存在，也可能需要渲染这一行的独立实体
                this.renderYSortRow(this.rapid, currentRow);
                continue;
            }

            for (let x = 0; x < viewportWidth; x++) {
                const mapX = x + startTile.x;
                if (mapX < 0 || mapX >= data[mapY].length) continue;

                const tileId = data[mapY][mapX];
                const tile = tileSet.getTile(tileId);
                if (!tile) continue;

                // 使用矩阵计算坐标的逻辑
                const localPos = this.mapToLocal(new Vec2(mapX, mapY), options);
                const screenPos = this.rapid.matrixStack.localToGlobal(localPos);
                const ySort = screenPos.y + (tile.ySortOffset ?? 0);
                const edata = options.eachTile ? (options.eachTile(tileId, mapX, mapY) || {}) : {};

                currentRow.push({
                    ySort,
                    renderSprite: {
                        ...tile,
                        x: localPos.x + (tile.x || 0),
                        y: localPos.y + (tile.y || 0),
                        ...edata,
                    }
                });
            }

            if (enableYSort) {
                currentRow.sort((a, b) => a.ySort! - b.ySort!);
            }
            this.renderYSortRow(this.rapid, currentRow);
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
