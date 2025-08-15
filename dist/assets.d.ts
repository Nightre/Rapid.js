import { AudioPlayer } from './audio';
import { Game } from './game';
import { IAsset as IAsset, IAssets } from './interface';
import { default as EventEmitter } from 'eventemitter3';
/**
 * Events emitted by AssetsLoader.
 */
interface AssetsLoaderEvents {
    progress: (progress: number, loaded: number, total: number) => void;
    complete: (assets: IAssets) => void;
    error: (error: {
        name: string;
        url: string;
        error: any;
    }) => void;
}
/**
 * AssetsLoader class for loading game assets (JSON, audio, images).
 * Supports asynchronous loading with progress tracking and error handling.
 */
declare class AssetsLoader extends EventEmitter<AssetsLoaderEvents> {
    private assets;
    private totalAsset;
    private loadedAssets;
    private game;
    /**
     * Creates an instance of AssetsLoader.
     * Initializes the asset storage and counters.
     */
    constructor(game: Game);
    /**
     * Loads a JSON file asynchronously.
     * @param name - The unique identifier for the JSON asset.
     * @param url - The URL of the JSON file.
     */
    loadJson(name: string, url: string): void;
    /**
     * Loads an audio file asynchronously.
     * @param name - The unique identifier for the audio asset.
     * @param url - The URL of the audio file.
     */
    loadAudio(name: string, url: string): void;
    /**
     * Loads an image file asynchronously.
     * @param name - The unique identifier for the image asset.
     * @param url - The URL of the image file.
     */
    loadImage(name: string, url: string): void;
    /**
     * Loads multiple assets from a list.
     * @param assetList - Array of assets to load.
     */
    loadAssets(assetList: IAsset[]): void;
    /**
     * Handles the completion of an asset load.
     * Updates progress and triggers completion event if all assets are loaded.
     */
    private assetLoaded;
    /**
     * Handles errors during asset loading.
     * @param name - The name of the asset.
     * @param url - The URL of the asset.
     * @param error - The error object or message.
     */
    private handleError;
    /**
     * Retrieves a loaded asset by type and name.
     * @param type - The type of asset ('json', 'audio', or 'images').
     * @param name - The name of the asset.
     * @returns The loaded asset or undefined if not found.
     */
    get<T extends keyof IAssets>(type: T, name: string): IAssets[T][string] | undefined;
    /**
     * Retrieves a loaded JSON asset by name.
     * @param name - The name of the JSON asset.
     * @returns The loaded JSON data or undefined if not found.
     */
    getJSON(name: string): any | undefined;
    /**
     * Retrieves a loaded audio asset by name.
     * @param name - The name of the audio asset.
     * @returns The loaded AudioPlayer instance or undefined if not found.
     */
    getAudio(name: string): AudioPlayer | undefined;
    /**
     * Retrieves a loaded texture (image) asset by name.
     * @param name - The name of the texture asset.
     * @returns The loaded texture or undefined if not found.
     */
    getTexture(name: string): any | undefined;
}
export default AssetsLoader;
