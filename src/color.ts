export class Color {
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;
    uint32!: number;

    /**
     * Creates an instance of Color.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    constructor(r: number, g: number, b: number, a: number = 255) {
        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a;
        this.updateUint();
    }

    /**
     * Gets the red component.
     */
    get r() {
        return this._r;
    }

    /**
     * Sets the red component and updates the uint32 representation.
     * @param value - The new red component (0-255).
     */
    set r(value: number) {
        this._r = value;
        this.updateUint();
    }

    /**
     * Gets the green component.
     */
    get g() {
        return this._g;
    }

    /**
     * Sets the green component and updates the uint32 representation.
     * @param value - The new green component (0-255).
     */
    set g(value: number) {
        this._g = value;
        this.updateUint();
    }

    /**
     * Gets the blue component.
     */
    get b() {
        return this._b;
    }

    /**
     * Sets the blue component and updates the uint32 representation.
     * @param value - The new blue component (0-255).
     */
    set b(value: number) {
        this._b = value;
        this.updateUint();
    }

    /**
     * Gets the alpha component.
     */
    get a() {
        return this._a;
    }

    /**
     * Sets the alpha component and updates the uint32 representation.
     * @param value - The new alpha component (0-255).
     */
    set a(value: number) {
        this._a = value;
        this.updateUint();
    }

    /**
     * Updates the uint32 representation of the color.
     * @private
     */
    private updateUint() {
        this.uint32 = ((this._a << 24) | (this._b << 16) | (this._g << 8) | this._r) >>> 0;
    }

    reset(): void {
        this._r = 0;
        this._g = 0;
        this._b = 0;
        this._a = 255;
        this.updateUint();
    }

    /**
     * Sets the RGBA values of the color and updates the uint32 representation.
     * @param r - The red component (0-255).
     * @param g - The green component (0-255).
     * @param b - The blue component (0-255).
     * @param a - The alpha component (0-255).
     */
    setRGBA(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.updateUint();
    }

    /**
     * Copies the RGBA values from another color.
     * @param color - The color to copy from.
     */
    copy(color: Color) {
        this.setRGBA(color.r, color.g, color.b, color.a);
    }

    /**
     * Clone the current color
     * @returns A new `Color` instance with the same RGBA values.
     */
    clone() {
        return new Color(this._r, this._g, this._b, this._a)
    }

    /**
     * Converts the color to a hexadecimal string representation (e.g., '#RRGGBBAA').
     * @param includeAlpha - Whether to include the alpha channel in the hex string.
     * @returns The hexadecimal string representation of the color.
     */
    toHexString(includeAlpha: boolean = true): string {
        const r = this.r.toString(16).padStart(2, '0');
        const g = this.g.toString(16).padStart(2, '0');
        const b = this.b.toString(16).padStart(2, '0');
        const a = this.a.toString(16).padStart(2, '0');

        return `#${r}${g}${b}${includeAlpha ? a : ''}`;
    }

    /**
     * Checks if the current color is equal to another color.
     * @param color - The color to compare with.
     * @returns True if the colors are equal, otherwise false.
     */
    equal(color: Color) {
        return color.r === this.r &&
            color.g === this.g &&
            color.b === this.b &&
            color.a === this.a;
    }

    /**
     * Creates a Color instance from normalized float components (0–1 range).
     * Use this instead of `new Color()` when working with shader-style 0.0–1.0 values.
     * @param r - Red channel (0.0–1.0)
     * @param g - Green channel (0.0–1.0)
     * @param b - Blue channel (0.0–1.0)
     * @param a - Alpha channel (0.0–1.0), defaults to 1.0
     * @returns A new Color instance with components scaled to 0–255.
     * @example
     * Color.fromNorm(0.9, 0.87, 0.55, 0.1) // moon glow
     */
    static fromNorm(r: number, g: number, b: number, a: number = 1.0): Color {
        return new Color(
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255),
            Math.round(a * 255)
        );
    }

    /**
     * Creates a Color instance from a hexadecimal color string.
     * @param hexString - The hexadecimal color string, e.g., '#RRGGBB' or '#RRGGBBAA'.
     * @returns A new Color instance.
     */
    static fromHex(hexString: string): Color {
        if (hexString.startsWith('#')) {
            hexString = hexString.slice(1);
        }
        const r = parseInt(hexString.slice(0, 2), 16);
        const g = parseInt(hexString.slice(2, 4), 16);
        const b = parseInt(hexString.slice(4, 6), 16);
        let a = 255;
        if (hexString.length >= 8) {
            a = parseInt(hexString.slice(6, 8), 16);
        }
        return new Color(r, g, b, a);
    }

    /**
     * Adds the components of another color to this color, clamping the result to 255.
     * @param color - The color to add.
     * @returns A new Color instance with the result of the addition.
     */
    add(color: Color) {
        return new Color(
            Math.min(this.r + color.r, 255),
            Math.min(this.g + color.g, 255),
            Math.min(this.b + color.b, 255),
            Math.min(this.a + color.a, 255)
        );
    }

    /**
     * Subtracts the components of another color from this color, clamping the result to 0.
     * @param color - The color to subtract.
     * @returns A new Color instance with the result of the subtraction.
     */
    subtract(color: Color) {
        return new Color(
            Math.max(0, this.r - color.r), // Clamp to 0
            Math.max(0, this.g - color.g), // Clamp to 0
            Math.max(0, this.b - color.b), // Clamp to 0
            Math.max(0, this.a - color.a)  // Clamp to 0
        );
    }
    divide(color: Color | number) {
        if (color instanceof Color) {
            return new Color(
                this.r / color.r,
                this.g / color.g,
                this.b / color.b,
                this.a / color.a
            );
        } else {
            return new Color(
                this.r / color,
                this.g / color,
                this.b / color,
                this.a / color
            );
        }
    }

    multiply(color: Color | number) {
        if (color instanceof Color) {
            return new Color(
                this.r * color.r,
                this.g * color.g,
                this.b * color.b,
                this.a * color.a
            );
        } else {
            return new Color(
                this.r * color,
                this.g * color,
                this.b * color,
                this.a * color
            );
        }
    }
    clamp() {
        this.r = Math.max(0, Math.min(255, this.r));
        this.g = Math.max(0, Math.min(255, this.g));
        this.b = Math.max(0, Math.min(255, this.b));
        this.a = Math.max(0, Math.min(255, this.a));
    }

    static Red(): Color { return new Color(255, 0, 0, 255); }
    static Green(): Color { return new Color(0, 255, 0, 255); }
    static Blue(): Color { return new Color(0, 0, 255, 255); }
    static Yellow(): Color { return new Color(255, 255, 0, 255); }
    static Purple(): Color { return new Color(128, 0, 128, 255); }
    static Orange(): Color { return new Color(255, 165, 0, 255); }
    static Pink(): Color { return new Color(255, 192, 203, 255); }
    static Gray(): Color { return new Color(128, 128, 128, 255); }
    static Brown(): Color { return new Color(139, 69, 19, 255); }
    static Cyan(): Color { return new Color(0, 255, 255, 255); }
    static Magenta(): Color { return new Color(255, 0, 255, 255); }
    static Lime(): Color { return new Color(192, 255, 0, 255); }
    static White(): Color { return new Color(255, 255, 255, 255); }
    static Black(): Color { return new Color(0, 0, 0, 255); }
    static Transparent(): Color { return new Color(0, 0, 0, 0); }
}