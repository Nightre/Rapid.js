import Rapid from "./render";
import { IRegisterTileOptions, ILayerRenderOptions } from "./interface";
import { Texture } from "./texture";
import { Vec2 } from "./math";
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
     * Gets the y-sorted rows for rendering entities at specific y positions.
     * @param ySortRow - Array of y-sort callbacks to process.
     * @param height - Height of each tile.
     * @param renderRow - Number of rows to render.
     * @returns Array of y-sort callbacks grouped by row.
     * @private
     */
    private getYSortRow;
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
     * Renders a row of y-sorted entities.
     * @param rapid - The Rapid rendering instance.
     * @param ySortRow - Array of y-sort callbacks to render.
     * @private
     */
    private renderYSortRow;
    /**
     * Renders the tilemap layer based on the provided data and options.
     *
     * @param data - A 2D array representing the tilemap data.
     * @param options - The rendering options for the tilemap layer.
     * @returns
     */
    renderLayer(data: (number | string)[][], options: ILayerRenderOptions): void;
    /**
     * Converts local coordinates to map coordinates.
     * @param local - The local coordinates.
     * @param options - The rendering options.
     * @returns The map coordinates.
     */
    localToMap(local: Vec2, options: ILayerRenderOptions): Vec2;
    /**
     * Converts map coordinates to local coordinates.
     * @param map - The map coordinates.
     * @param options - The rendering options.
     * @returns The local coordinates.
     */
    mapToLocal(map: Vec2, options: ILayerRenderOptions): Vec2;
}
