export class Vec2 {
    x: number;
    y: number;

    static ZERO = new Vec2(0, 0);
    static ONE = new Vec2(1, 1);
    static UP = new Vec2(0, 1);
    static DOWN = new Vec2(0, -1);
    static LEFT = new Vec2(-1, 0);
    static RIGHT = new Vec2(1, 0);

    constructor(x?: number, y?: number) {
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }

    set(x: number, y?: number): Vec2 {
        if (y === undefined) {
            this.x = x;
            this.y = x;
        } else {
            this.x = x;
            this.y = y;
        }
        return this;
    }

    add(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    subtract(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    sub(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    multiply(f: number | Vec2): Vec2 {
        if (f instanceof Vec2) {
            return new Vec2(this.x * f.x, this.y * f.y);
        }
        return new Vec2(this.x * f, this.y * f);
    }

    mul(f: number | Vec2): Vec2 {
        return this.multiply(f);
    }

    divide(f: number | Vec2): Vec2 {
        if (f instanceof Vec2) {
            return new Vec2(this.x / f.x, this.y / f.y);
        }
        return new Vec2(this.x / f, this.y / f);
    }

    dot(v: Vec2): number {
        return this.x * v.x + this.y * v.y;
    }

    cross(v: Vec2): number {
        return this.x * v.y - this.y * v.x;
    }

    distanceTo(v: Vec2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    to(vec: Vec2): void {
        this.x = vec.x;
        this.y = vec.y;
    }

    copy(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    equals(vec: Vec2): boolean {
        return vec.x == this.x && vec.y == this.y;
    }

    perpendicular(): this {
        const x = this.x;
        this.x = -this.y;
        this.y = x;
        return this;
    }

    invert(): this {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    inverted(): Vec2 {
        return new Vec2(this.x * -1, this.y * -1);
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    squaredLength(): number {
        return this.x * this.x + this.y * this.y;
    }

    normalize(): this {
        const mod = this.length();
        this.x = this.x / mod || 0;
        this.y = this.y / mod || 0;
        return this;
    }

    normalized(): Vec2 {
        const mod = this.length();
        return new Vec2(this.x / mod || 0, this.y / mod || 0);
    }

    angle(): number {
        return Math.atan2(this.y, this.x);
    }

    abs(): Vec2 {
        return new Vec2(Math.abs(this.x), Math.abs(this.y));
    }

    floor(): Vec2 {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }

    ceil(): Vec2 {
        return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
    }

    stringify(): string {
        return `Vec2(${this.x}, ${this.y})`;
    }

    clear(): void {
        this.x = 0;
        this.y = 0;
    }

    isPrettyMuchZero(): boolean {
        return Math.abs(this.x) < 0.0001 && Math.abs(this.y) < 0.0001;
    }

    isZero(): boolean {
        return this.x == 0 && this.y == 0;
    }

    isNotZero(): boolean {
        return this.x !== 0 || this.y !== 0;
    }

    setToPolar(azimuth: number, radius: number = 1): this {
        this.x = Math.cos(azimuth) * radius;
        this.y = Math.sin(azimuth) * radius;
        return this;
    }

    static FromArray(array: number[][]): Vec2[] {
        return array.map(pair => new Vec2(pair[0], pair[1]));
    }

    static fromAngle(angle: number): Vec2 {
        return new Vec2(Math.cos(angle), Math.sin(angle));
    }
}
