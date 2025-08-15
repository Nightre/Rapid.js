import { Vec2 } from './math';
import { default as Rapid } from './render';
import { Entity } from './game';
/**
 * Manages user input for keyboard and mouse events.
 * Tracks key and button states, including pressed/released states for the current and previous frames.
 */
export declare class InputManager {
    private rapid;
    private canvas;
    private mousePosition;
    private keysDown;
    private keysDownLastFrame;
    private buttonsDown;
    private buttonsDownLastFrame;
    /**
     * Creates an instance of InputManager.
     * @param rapid - The Rapid instance for rendering and coordinate conversion.
     */
    constructor(rapid: Rapid);
    /**
     * Attaches all necessary event listeners for keyboard and mouse input.
     * @private
     */
    private attachEventListeners;
    /**
     * Updates the state of keys and buttons for the next frame.
     */
    updateNextFrame(): void;
    /**
     * Checks if a key is currently pressed (continuous detection).
     * @param key - The key code (e.g., "KeyW", "Space").
     * @returns True if the key is pressed, false otherwise.
     */
    isKeyDown(key: string): boolean;
    /**
     * Checks if a key is currently released.
     * @param key - The key code (e.g., "KeyW", "Space").
     * @returns True if the key is released, false otherwise.
     */
    isKeyUp(key: string): boolean;
    /**
     * Checks if a key was pressed in the current frame (single trigger).
     * @param key - The key code (e.g., "KeyW", "Space").
     * @returns True if the key was just pressed, false otherwise.
     */
    wasKeyPressed(key: string): boolean;
    /**
     * Checks if a key was released in the current frame (single trigger).
     * @param key - The key code (e.g., "KeyW", "Space").
     * @returns True if the key was just released, false otherwise.
     */
    wasKeyReleased(key: string): boolean;
    /**
     * Checks if a mouse button is currently pressed (continuous detection).
     * @param button - The mouse button number (0: left, 1: middle, 2: right).
     * @returns True if the button is pressed, false otherwise.
     */
    isButtonDown(button: number): boolean;
    /**
     * Checks if a mouse button is currently released.
     * @param button - The mouse button number (0: left, 1: middle, 2: right).
     * @returns True if the button is released, false otherwise.
     */
    isButtonUp(button: number): boolean;
    /**
     * Checks if a mouse button was pressed in the current frame (single trigger).
     * @param button - The mouse button number (0: left, 1: middle, 2: right).
     * @returns True if the button was just pressed, false otherwise.
     */
    wasButtonPressed(button: number): boolean;
    /**
     * Checks if a mouse button was released in the current frame (single trigger).
     * @param button - The mouse button number (0: left, 1: middle, 2: right).
     * @returns True if the button was just released, false otherwise.
     */
    wasButtonReleased(button: number): boolean;
    /**
     * Converts the mouse position to local coordinates relative to an entity.
     * @param entity - The entity to convert coordinates for.
     * @returns The mouse position in the entity's local coordinate system.
     */
    getMouseLocal(entity: Entity): Vec2;
    /**
     * Removes all event listeners and cleans up resources.
     */
    destroy(): void;
    private handleMouseMove;
    private handleKeyDown;
    private handleKeyUp;
    private handleMouseDown;
    private handleMouseUp;
}
