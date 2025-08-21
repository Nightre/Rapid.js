import { default as Rapid } from './render';
import { IRegisterTileOptions, YSortCallback, TilemapShape, ISpriteRenderOptions, IEntityTilemapLayerOptions as ITilemapComponentOptions, ITilemapLayerOptions } from './interface';
import { Texture } from './texture';
import { Vec2 } from './math';
import { Component, GameObject } from './game';
/**
 * Represents a tileset that manages tile textures and their properties.
 */
export declare class TileSet {
    /** Map storing tile textures and their associated options */
    private textures;
    /** Width of each tile in the tileset */
    width: number;
    /** Height of each tile in the tileset */
    height: number;
    /**
     * Creates a new TileSet instance.
     * @param width - The width of each tile in pixels
     * @param height - The height of each tile in pixels
     */
    constructor(width: number, height: number);
    /**
     * Registers a new tile with the given ID and options.
     * @param id - The unique identifier for the tile
     * @param options - The tile options or texture to register
     */
    setTile(id: string | number, options: IRegisterTileOptions | Texture): void;
    /**
     * Retrieves the registered tile options for the given ID.
     * @param id - The unique identifier of the tile to retrieve
     * @returns The registered tile options, or undefined if not found
     */
    getTile(id: string | number): IRegisterTileOptions | undefined;
}
/**
 * Represents a tilemap renderer that handles rendering of tile-based maps.
 */
export declare class TileMapRender {
    private rapid;
    /**
     * Creates a new TileMapRender instance.
     * @param rapid - The Rapid rendering instance to use.
     */
    constructor(rapid: Rapid);
    /**
     * Calculates the error offset values for tile rendering.
     * @param options - Layer rendering options containing error values.
     * @returns Object containing x and y error offsets.
     * @private
     */
    private getOffset;
    /**
     * Calculates tile rendering data based on the viewport and tileset.
     * @param tileSet - The tileset to use for rendering.
     * @param options - Layer rendering options.
     * @returns Object containing calculated tile rendering data.
     * @private
     */
    private getTileData;
    /**
     * Renders the tilemap layer based on the provided data and options.
     * This method collects all visible tiles and y-sortable objects into a single queue,
     * sorts them once by their y-coordinate, and then renders them in the correct order.
     *
     * @param data - A 2D array representing the tilemap data.
     * @param options - The rendering options for the tilemap layer.
     */
    renderLayer(data: (number | string)[][], options: ITilemapLayerOptions): IRegisterTileOptions[];
    /**
     * Converts local coordinates to map coordinates.
     * @param local - The local coordinates.
     * @param options - The rendering options.
     * @returns The map coordinates.
     */
    localToMap(local: Vec2, options: ITilemapLayerOptions): Vec2;
    /**
     * Converts map coordinates to local coordinates.
     * @param map - The map coordinates.
     * @param options - The rendering options.
     * @returns The local coordinates.
     */
    mapToLocal(map: Vec2, options: ITilemapLayerOptions): Vec2;
}
/**
 * Tilemap entity for rendering tiled maps.
 */
export declare class Tilemap extends Component {
    static readonly DEFAULT_ERROR = 0;
    static readonly EMPTY_TILE = -1;
    error: Vec2;
    shape: TilemapShape;
    tileSet: TileSet;
    data: (number | string)[][];
    eachTile?: (tileId: string | number, mapX: number, mapY: number) => ISpriteRenderOptions | undefined | void;
    ySortCallback: YSortCallback[];
    enableYsort: boolean;
    options: ITilemapComponentOptions;
    displayTiles: IRegisterTileOptions[];
    protected patchMethods: (keyof GameObject)[];
    /**
     * Creates a tilemap entity.
     * @param game - The game instance this tilemap belongs to.
     * @param options - Configuration options for the tilemap.
     */
    constructor(options: ITilemapComponentOptions);
    /**
     * Collects renderable entities, excluding children unless they override onRender.
     * @param queue - The array to collect renderable entities.
     */
    render(queue: GameObject[]): void;
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
