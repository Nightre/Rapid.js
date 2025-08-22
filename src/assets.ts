// src/AssetsLoader.ts

// Assume Game has an 'audio' property of type AudioManager
import { AudioManager, AudioPlayer } from "./audio"; 
import { Game } from "./game";
import { IAsset, IAssets } from "./interface";
import EventEmitter from "eventemitter3";

/**
 * Events emitted by AssetsLoader.
 */
interface AssetsLoaderEvents {
    progress: (progress: number, loaded: number, total: number) => void;
    complete: (assets: IAssets) => void;
    error: (error: { name: string; url:string; error: any }) => void;
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
    async loadJson(name: string, url: string) {
        this.totalAsset++;
        return await fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                this.assets.json[name] = data;
                this.assetLoaded();
                return this.assets.json[name]
            })
            .catch(error => this.handleError(name, url, error));
    }

    /**
     * Loads an audio file asynchronously using the AudioManager.
     * The AudioManager will handle fetching and caching.
     * @param name - The unique identifier for the audio asset.
     * @param url - The URL of the audio file.
     */
    async loadAudio(name: string, url: string) {
        this.totalAsset++; 

        try {
            const audioPlayer = await this.game.audio.audioFromUrl(url);
            this.assets.audio[name] = audioPlayer;
            
            this.assetLoaded();
            return this.assets.audio[name]
        } catch (error) {
            this.handleError(name, url, error);
            // Even on error, we count it as "processed" to avoid the loader getting stuck.
            this.assetLoaded();
        }
    }

    /**
     * Loads an image file asynchronously using the TextureManager.
     * @param name - The unique identifier for the image asset.
     * @param url - The URL of the image file.
     */
    async loadImage(name: string, url: string) {
        this.totalAsset++;

        try {
            // Assuming `game.render.texture` is your TextureCache instance.
            this.assets.images[name] = await this.game.render.texture.textureFromUrl(url);
            this.assetLoaded();
            return this.assets.images[name]
        } catch (error) {
            this.handleError(name, url, error);
            this.assetLoaded();
        }
    }

    /**
     * Loads multiple assets from a list.
     * @param assetList - Array of assets to load.
     */
    loadAssets(assetList: IAsset[]): void {
        if (assetList.length === 0) {
            // Handle case with no assets to prevent division by zero.
            this.emit('progress', 1, 0, 0);
            this.emit('complete', this.assets);
            return;
        }

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
                    console.warn(`Unknown asset type: ${(asset as any).type}`);
            }
        });
    }

    /**
     * Handles the completion of an asset load.
     * Updates progress and triggers completion event if all assets are loaded.
     */
    private assetLoaded(): void {
        this.loadedAssets++;
        const progress = this.totalAsset > 0 ? this.loadedAssets / this.totalAsset : 1;
        this.emit('progress', progress, this.loadedAssets, this.totalAsset);

        if (this.loadedAssets >= this.totalAsset) {
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
        console.error(`Failed to load asset '${name}' from ${url}:`, error);
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