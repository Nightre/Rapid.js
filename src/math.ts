export class Vec2 {
    constructor(public x: number, public y: number) { }

    add(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    subtract(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    multiply(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    distanceTo(v: Vec2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    normalize(): Vec2 {
        const len = Math.sqrt(this.x * this.x + this.y * this.y);
        if (len === 0) return new Vec2(0, 0);
        return new Vec2(this.x / len, this.y / len);
    }

    dot(v: Vec2): number {
        return this.x * v.x + this.y * v.y;
    }

    perpendicular(): Vec2 {
        return new Vec2(-this.y, this.x);
    }

    cross(v: Vec2): number {
        return this.x * v.y - this.y * v.x;
    }
}
