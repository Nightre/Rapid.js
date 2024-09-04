import { TilemapOptions } from "./interface";
import Rapid from "./render";
import { Texture } from "./texture";
export declare class Tileset {
    private textures;
    constructor(textures: Texture[]);
    getTexture(index: number): Texture | null;
}
declare class Tilemap {
    private tileset;
    private tileIndices;
    private tileWidth;
    private tileHeight;
    private columns;
    private rows;
    private type;
    constructor(options: TilemapOptions);
    getTileIndex(x: number, y: number): number | null;
    render(rapid: Rapid, offsetX?: number, offsetY?: number): void;
    private renderOrthogonal;
    private renderHex;
    private renderIsometric;
}
export default Tilemap;
