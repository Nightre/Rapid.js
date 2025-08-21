import { Vec2 } from "./math";
import Rapid from "./render";
import { GameObject } from "./game";

/**
 * Manages user input for keyboard and mouse events.
 * Tracks key and button states, including pressed/released states for the current and previous frames.
 */
export class InputManager {
  private rapid: Rapid;
  private canvas: HTMLCanvasElement;
  mousePosition: Vec2 = Vec2.ZERO;

  // Tracks keys pressed in the current frame (e.g., "KeyW", "Space", "ArrowUp").
  private keysDown: Set<string> = new Set();
  // Tracks keys pressed in the previous frame.
  private keysDownLastFrame: Set<string> = new Set();

  // Tracks mouse buttons pressed in the current frame (0: left, 1: middle, 2: right).
  private buttonsDown: Set<number> = new Set();
  // Tracks mouse buttons pressed in the previous frame.
  private buttonsDownLastFrame: Set<number> = new Set();

  /**
   * Creates an instance of InputManager.
   * @param rapid - The Rapid instance for rendering and coordinate conversion.
   */
  constructor(rapid: Rapid) {
    this.rapid = rapid;
    this.canvas = rapid.canvas;
    this.attachEventListeners();
  }

  /**
   * Attaches all necessary event listeners for keyboard and mouse input.
   * @private
   */
  private attachEventListeners(): void {
    const rect = this.canvas.getBoundingClientRect();

    // Handle mouse movement
    this.canvas.addEventListener('mousemove', this.handleMouseMove = (event) => {
      this.mousePosition = this.rapid.cssToGameCoords(event.clientX - rect.left, event.clientY - rect.top);
    });

    // Handle key press
    window.addEventListener('keydown', this.handleKeyDown = (event) => {
      this.keysDown.add(event.code);
    });

    // Handle key release
    window.addEventListener('keyup', this.handleKeyUp = (event) => {
      this.keysDown.delete(event.code);
    });

    // Handle mouse button press
    this.canvas.addEventListener('mousedown', this.handleMouseDown = (event) => {
      this.buttonsDown.add(event.button);
    });

    // Handle mouse button release
    this.canvas.addEventListener('mouseup', this.handleMouseUp = (event) => {
      this.buttonsDown.delete(event.button);
    });
  }

  /**
   * Updates the state of keys and buttons for the next frame.
   */
  public updateNextFrame(): void {
    this.keysDownLastFrame = new Set(this.keysDown);
    this.buttonsDownLastFrame = new Set(this.buttonsDown);
  }

  /**
   * Checks if a key is currently pressed (continuous detection).
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key is pressed, false otherwise.
   */
  isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  /**
   * Checks if a key is currently released.
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key is released, false otherwise.
   */
  isKeyUp(key: string): boolean {
    return !this.keysDown.has(key);
  }

  /**
   * Checks if a key was pressed in the current frame (single trigger).
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key was just pressed, false otherwise.
   */
  wasKeyPressed(key: string): boolean {
    return this.keysDown.has(key) && !this.keysDownLastFrame.has(key);
  }

  /**
   * Checks if a key was released in the current frame (single trigger).
   * @param key - The key code (e.g., "KeyW", "Space").
   * @returns True if the key was just released, false otherwise.
   */
  wasKeyReleased(key: string): boolean {
    return !this.keysDown.has(key) && this.keysDownLastFrame.has(key);
  }

  /**
   * Checks if a mouse button is currently pressed (continuous detection).
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button is pressed, false otherwise.
   */
  isButtonDown(button: number): boolean {
    return this.buttonsDown.has(button);
  }

  /**
   * Checks if a mouse button is currently released.
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button is released, false otherwise.
   */
  isButtonUp(button: number): boolean {
    return !this.buttonsDown.has(button);
  }

  /**
   * Checks if a mouse button was pressed in the current frame (single trigger).
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button was just pressed, false otherwise.
   */
  wasButtonPressed(button: number): boolean {
    return this.buttonsDown.has(button) && !this.buttonsDownLastFrame.has(button);
  }

  /**
   * Checks if a mouse button was released in the current frame (single trigger).
   * @param button - The mouse button number (0: left, 1: middle, 2: right).
   * @returns True if the button was just released, false otherwise.
   */
  wasButtonReleased(button: number): boolean {
    return !this.buttonsDown.has(button) && this.buttonsDownLastFrame.has(button);
  }

  /**
   * Converts the mouse position to local coordinates relative to an entity.
   * @param entity - The entity to convert coordinates for.
   * @returns The mouse position in the entity's local coordinate system.
   */
  getMouseLocal(entity: GameObject): Vec2 {
    return entity.transform.globalToLocal(this.mousePosition);
  }

  getAxis(negativeAction: string, positiveAction: string): number {
    let value = 0;
    if (this.isKeyDown(positiveAction)) {
      value += 1;
    }
    if (this.isKeyDown(negativeAction)) {
      value -= 1;
    }
    return value;
  }

  getVector(negativeX: string, positiveX: string, negativeY: string, positiveY: string): Vec2 {
    const x = this.getAxis(negativeX, positiveX);
    const y = this.getAxis(negativeY, positiveY);

    const vector = new Vec2(x, y);

    return vector.normalize();
  }

  /**
   * Removes all event listeners and cleans up resources.
   */
  public destroy(): void {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.keysDown.clear();
    this.keysDownLastFrame.clear();
    this.buttonsDown.clear();
    this.buttonsDownLastFrame.clear();
  }

  // Event handler references for cleanup
  private handleMouseMove!: (event: MouseEvent) => void;
  private handleKeyDown!: (event: KeyboardEvent) => void;
  private handleKeyUp!: (event: KeyboardEvent) => void;
  private handleMouseDown!: (event: MouseEvent) => void;
  private handleMouseUp!: (event: MouseEvent) => void;
}