import Rapid from "./render";
import { IRegisterTileOptions, ILayerRender, YSortCallback, TilemapShape, IRenderSpriteOptions } from "./interface";
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
     * Gets the y-sorted rows for rendering entities at specific y positions.
     * @param ySortRow - Array of y-sort callbacks to process.
     * @param height - Height of each tile.
     * @param renderRow - Number of rows to render.
     * @returns Array of y-sort callbacks grouped by row.
     * @private
     */
    private getYSortRow(ySortRow: YSortCallback[] | undefined, height: number, renderRow: number) {
        if (!ySortRow) {
            return []
        }
        const rows: YSortCallback[][] = []

        for (const ySort of ySortRow) {
            const y = Math.floor(ySort.ySort / height)

            if (!rows[y]) rows[y] = []
            rows[y].push(ySort)
        }
        return rows
    }

    /**
     * Calculates the error offset values for tile rendering.
     * @param options - Layer rendering options containing error values.
     * @returns Object containing x and y error offsets.
     * @private
     */
    private getOffset(options: ILayerRender) {
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
     * Calculates tile rendering data based on the viewport and tileset.
     * @param tileSet - The tileset to use for rendering.
     * @param options - Layer rendering options.
     * @returns Object containing calculated tile rendering data.
     * @private
     */
    private getTileData(tileSet: TileSet, options: ILayerRender) {
        const shape = options.shape ?? TilemapShape.SQUARE
        const width = tileSet.width
        const height = shape === TilemapShape.ISOMETRIC ? tileSet.height / 2 : tileSet.height

        const matrix = this.rapid.matrixStack
        const view = matrix.globalToLocal(Vec2.ZERO)
        const globalScale = matrix.getGlobalScale()
        const { errorX, errorY } = this.getOffset(options)

        const viewportWidth = Math.ceil(this.rapid.width / width / globalScale.x) + errorX * 2
        const viewportHeight = Math.ceil(this.rapid.height / height / globalScale.y) + errorY * 2

        // Calculate starting tile position
        const startTile = new Vec2(
            view.x < 0 ? Math.ceil(view.x / width) : Math.floor(view.x / width),
            view.y < 0 ? Math.ceil(view.y / height) : Math.floor(view.y / height)
        )

        startTile.x -= errorX
        startTile.y -= errorY

        // Calculate precise pixel offset
        let offset = new Vec2(
            0 - (view.x % width) - errorX * width,
            0 - (view.y % height) - errorY * height
        )

        offset = offset.add(view)

        return {
            startTile,
            offset,
            viewportWidth,
            viewportHeight,
            height,
            width,
            shape,
        }
    }

    /**
     * Renders a row of y-sorted entities.
     * @param rapid - The Rapid rendering instance.
     * @param ySortRow - Array of y-sort callbacks to render.
     * @private
     */
    private renderYSortRow(rapid: Rapid, ySortRow: YSortCallback[]) {
        for (const ySort of ySortRow) {
            if (ySort.render) {
                ySort.render()
            } else if (ySort.renderSprite) {
                rapid.renderSprite(ySort.renderSprite)
            }
        }
    }
    /**
     * Renders the tilemap layer based on the provided data and options.
     * 
     * @param data - A 2D array representing the tilemap data.
     * @param options - The rendering options for the tilemap layer.
     * @returns 
     */
    renderLayer(data: (number | string)[][], options: ILayerRender): void {
        this.rapid.matrixStack.applyTransform(options)
        const tileSet = options.tileSet
        const {
            startTile,
            offset,
            viewportWidth,
            viewportHeight,
            shape,
            width,
            height
        } = this.getTileData(tileSet, options)
        const ySortRow = this.getYSortRow(options.ySortCallback, height, viewportHeight)
        const enableYSort = options.ySortCallback && options.ySortCallback.length > 0

        if (this.rapid.matrixStack.getGlobalRotation() !== 0) {
            warn("TileMapRender: tilemap is not supported rotation")
            this.rapid.matrixStack.setGlobalRotation(0)
        }

        for (let y = 0; y < viewportHeight; y++) {
            const mapY = y + startTile.y

            const currentRow: YSortCallback[] = ySortRow[mapY] ?? []
            if (mapY < 0 || mapY >= data.length) {
                this.renderYSortRow(this.rapid, currentRow)
                continue
            }

            for (let x = 0; x < viewportWidth; x++) {
                const mapX = x + startTile.x
                if (mapX < 0 || mapX >= data[mapY].length) continue

                const tileId = data[mapY][mapX]
                const tile = tileSet.getTile(tileId)
                if (!tile) continue

                let screenX = x * width + offset.x;
                let screenY = y * height + offset.y;
                let ySort = y * height + offset.y + (tile.ySortOffset ?? 0);

                if (mapY % 2 !== 0 && shape === TilemapShape.ISOMETRIC) {
                    screenX += width / 2
                }
                const edata = options.eachTile ? (options.eachTile(tileId, mapX, mapY) || {}) : {}

                currentRow.push({
                    ySort,
                    renderSprite: {
                        ...tile,
                        // 保证 SprtieOption 被覆盖后仍然有效果
                        x: screenX + (tile.x || 0),
                        y: screenY + (tile.y || 0),
                        ...edata,
                    }
                })
            }
            if (enableYSort) {
                currentRow.sort((a, b) => a.ySort! - b.ySort!)
            }
            this.renderYSortRow(this.rapid, currentRow)
        }
        this.rapid.matrixStack.applyTransform(options)
    }

    /**
     * Converts local coordinates to map coordinates.
     * @param local - The local coordinates.
     * @param options - The rendering options.
     * @returns The map coordinates.
     */
    localToMap(local: Vec2, options: ILayerRender) {
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
    mapToLocal(map: Vec2, options: ILayerRender) {
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
