// A 2D vector utility
export class Vec {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  // utilities
  dist_from(v: Vec): number {
    return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
  }

  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  // new vector returning operations
  add(v: Vec): Vec { return new Vec(this.x + v.x, this.y + v.y); }
  sub(v: Vec): Vec { return new Vec(this.x - v.x, this.y - v.y); }
  rotate(a: number): Vec {  // CLOCKWISE
    return new Vec(this.x * Math.cos(a) + this.y * Math.sin(a),
      -this.x * Math.sin(a) + this.y * Math.cos(a));
  }

  // in place operations
  scale(s: number): void {
    this.x *= s;
    this.y *= s;
  }

  normalize(): void {
    const d = this.length();
    this.scale(1 / d);
  }
}
