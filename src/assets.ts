import { AudioPlayer } from "./audio";
import { Game } from "./game";
import { IAsset as IAsset, IAssets } from "./interface";
import EventEmitter from "eventemitter3";

/**
 * Events emitted by AssetsLoader.
 */
interface AssetsLoaderEvents {
  progress: (progress: number, loaded: number, total: number) => void;
  complete: (assets: IAssets) => void;
  error: (error: { name: string; url: string; error: any }) => void;
}

/**
 * AssetsLoader class for loading game assets (JSON, audio, images).
 * Supports asynchronous loading with progress tracking and error handling.
 */
class AssetsLoader extends EventEmitter<AssetsLoaderEvents> {
    private assets: IAssets;
    private totalAsset: number = 0;
    private loadedAssets: number = 0;
    private game: Game;

    /**
     * Creates an instance of AssetsLoader.
     * Initializes the asset storage and counters.
     */
    constructor(game: Game) {
        super();
        this.game = game;
        this.assets = {
            json: {},
            audio: {},
            images: {}
        };
    }

    /**
     * Loads a JSON file asynchronously.
     * @param name - The unique identifier for the JSON asset.
     * @param url - The URL of the JSON file.
     */
    loadJson(name: string, url: string): void {
        this.totalAsset++;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                this.assets.json[name] = data;
                this.assetLoaded();
            })
            .catch(error => this.handleError(name, url, error));
    }

    /**
     * Loads an audio file asynchronously.
     * @param name - The unique identifier for the audio asset.
     * @param url - The URL of the audio file.
     */
    loadAudio(name: string, url: string): void {
        this.totalAsset++;
        const audio = new Audio();
        audio.src = url;
        audio.oncanplaythrough = () => {
            this.assets.audio[name] = new AudioPlayer(audio, this.game.audio.audioContext);
            this.assetLoaded();
            audio.oncanplaythrough = null; // Clear event
        };
        audio.onerror = () => this.handleError(name, url, 'Audio load error');
    }

    /**
     * Loads an image file asynchronously.
     * @param name - The unique identifier for the image asset.
     * @param url - The URL of the image file.
     */
    loadImage(name: string, url: string): void {
        this.totalAsset++;
        const img = new Image();
        img.src = url;
        img.onload = () => {
            this.assets.images[name] = this.game.render.texture.textureFromSource(img);
            this.assetLoaded();
        };
        img.onerror = () => this.handleError(name, url, 'Image load error');
    }

    /**
     * Loads multiple assets from a list.
     * @param assetList - Array of assets to load.
     */
    loadAssets(assetList: IAsset[]): void {
        assetList.forEach(asset => {
            switch (asset.type) {
                case 'json':
                    this.loadJson(asset.name, asset.url);
                    break;
                case 'audio':
                    this.loadAudio(asset.name, asset.url);
                    break;
                case 'image':
                    this.loadImage(asset.name, asset.url);
                    break;
                default:
                    console.warn(`Unknown asset type: ${asset.type}`);
            }
        });
    }

    /**
     * Handles the completion of an asset load.
     * Updates progress and triggers completion event if all assets are loaded.
     */
    private assetLoaded(): void {
        this.loadedAssets++;
        const progress = this.loadedAssets / this.totalAsset;
        this.emit('progress', progress, this.loadedAssets, this.totalAsset);
        if (this.loadedAssets === this.totalAsset) {
            this.emit('complete', this.assets);
        }
    }

    /**
     * Handles errors during asset loading.
     * @param name - The name of the asset.
     * @param url - The URL of the asset.
     * @param error - The error object or message.
     */
    private handleError(name: string, url: string, error: any): void {
        this.emit('error', { name, url, error });
        console.error(`Failed to load asset ${name} from ${url}:`, error);
    }

    /**
     * Retrieves a loaded asset by type and name.
     * @param type - The type of asset ('json', 'audio', or 'images').
     * @param name - The name of the asset.
     * @returns The loaded asset or undefined if not found.
     */
    get<T extends keyof IAssets>(type: T, name: string): IAssets[T][string] | undefined {
        return this.assets[type]?.[name];
    }

    /**
     * Retrieves a loaded JSON asset by name.
     * @param name - The name of the JSON asset.
     * @returns The loaded JSON data or undefined if not found.
     */
    getJSON(name: string): any | undefined {
        return this.assets.json[name];
    }

    /**
     * Retrieves a loaded audio asset by name.
     * @param name - The name of the audio asset.
     * @returns The loaded AudioPlayer instance or undefined if not found.
     */
    getAudio(name: string): AudioPlayer | undefined {
        return this.assets.audio[name];
    }

    /**
     * Retrieves a loaded texture (image) asset by name.
     * @param name - The name of the texture asset.
     * @returns The loaded texture or undefined if not found.
     */
    getTexture(name: string): any | undefined {
        return this.assets.images[name];
    }
}
 
export default AssetsLoader;