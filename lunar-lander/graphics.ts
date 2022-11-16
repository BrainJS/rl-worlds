import {color} from "d3";

export type Matrix = [number,number,number,number,number,number,number,number,number];
export type Color = [number,number,number,number];
export type Mode = "fill" | "line";

export class Graphics {
  transforms: Matrix[] = [[1, 0, 0, 0, 1, 0, 0, 0, 1]];
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  _color: Color = [1,1,1,1];
  _colorHex: string = "#ffffffff";
  _lineWidth: number = 1;
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }
  _reset() {
    this.transforms = [[1, 0, 0, 0, 1, 0, 0, 0, 1]];
    this.setColor(1, 1, 1, 1);
    this.setLineWidth(1);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  _transform(matrix: Matrix) {
    const [a1, a2, a3, a4, a5, a6, a7, a8, a9] = this.pop();
    const [b1, b2, b3, b4, b5, b6, b7, b8, b9] = matrix;
    this.transforms.push([
      a1 * b1 + a2 * b4 + a3 * b7,
      a1 * b2 + a2 * b5 + a3 * b8,
      a1 * b3 + a2 * b6 + a3 * b9,
      a4 * b1 + a5 * b4 + a6 * b7,
      a4 * b2 + a5 * b5 + a6 * b8,
      a4 * b3 + a5 * b6 + a6 * b9,
      a7 * b1 + a8 * b4 + a9 * b7,
      a7 * b2 + a8 * b5 + a9 * b8,
      a7 * b3 + a8 * b6 + a9 * b9
    ]);
  }
  _apply(b1: number, b2: number) {
    if (typeof b1 === "undefined") throw new Error("b1 not defined");
    if (typeof b2 === "undefined") throw new Error("b2 not defined");
    const [a1, a2, a3, a4, a5, a6, a7, a8, a9] = this.transforms[
    this.transforms.length - 1
      ];
    const b3 = 1;
    const [x, y, s] = [
      a1 * b1 + a2 * b2 + a3 * b3,
      a4 * b1 + a5 * b2 + a6 * b3,
      a7 * b1 + a8 * b2 + a9 * b3
    ];
    return [x / s, y / s];
  }
  _getScale() {
    const point = this._apply(1, 0);
    return Math.sqrt(point[0] ** 2 + point[1] ** 2);
  }
  push(): this {
    this.transforms.push(this.transforms[this.transforms.length - 1]);
    return this;
  }
  pop(): Matrix {
    const matrix = this.transforms.pop();
    if (!matrix) throw new Error("Cannot pop on transforms");
    return matrix;
  }
  rotate(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    this._transform([c, -s, 0, s, c, 0, 0, 0, 1]);
    return this;
  }
  scale(x: number, y: number): this {
    this._transform([x, 0, 0, 0, y, 0, 0, 0, 1]);
    return this;
  }
  translate(x: number, y: number): this {
    this._transform([1, 0, x, 0, 1, y, 0, 0, 1]);
    return this;
  }
  getColor() {
    return this._color;
  }
  setColor(r: number, g: number, b: number, a = 1): this {
    this._color = [r, g, b, a];
    this._colorHex =
      "#" +
      colorCode(r) +
      colorCode(g) +
      colorCode(b) +
      colorCode(a);
    return this;
  }
  getLineWidth() {
    return this._lineWidth;
  }
  setLineWidth(lineWidth: number): this {
    this._lineWidth = lineWidth;
    this.ctx.lineWidth = lineWidth * this._getScale();
    return this;
  }
  circle(mode: Mode, x: number, y: number, radius: number): this {
    const point = this._apply(x, y);
    x = point[0];
    y = point[1];
    radius *= this._getScale();
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, -Math.PI, Math.PI);
    if (mode === "fill") {
      this.ctx.fillStyle = this._colorHex;
      this.ctx.fill();
    } else if (mode === "line") {
      this.ctx.strokeStyle = this._colorHex;
      this.ctx.stroke();
    }
    return this;
  }
  line(points: number[]): this {
    let created = false;
    for (let i = 0; i < points.length; i+=2) {
      const point = this._apply(points[i], points[i+1]);
      const x = point[0];
      const y = point[1];
      if (!created) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        created = true;
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.strokeStyle = this._colorHex;
    this.ctx.stroke();
    return this;
  }
  points(points: number[]): this {
    this.ctx.fillStyle = this._colorHex;
    for (let i = 0; i < points.length; i+=2) {
      const [x, y] = this._apply(points[i], points[i+1]);
      this.ctx.fillRect(x | 0, y | 0, 1, 1);
    }
    return this;
  }
  polygon(mode: Mode, points: number[]): this {
    let created = false;
    for (let i = 0; i < points.length; i+=2) {
      const point = this._apply(points[i], points[i+1]);
      const x = point[0];
      const y = point[1];
      if (!created) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        created = true;
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    if (mode === "fill") {
      this.ctx.fillStyle = this._colorHex;
      this.ctx.fill();
    } else if (mode === "line") {
      this.ctx.strokeStyle = this._colorHex;
      this.ctx.stroke();
    }
    return this;
  }
  rectangle(mode: Mode, x: number, y: number, w: number, h: number) {
    this.polygon(mode, [
      x, y,
      x + w, y,
      x + w, y + h,
      x, y + h
    ]);
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function colorCode(color: number): string {
  return ((color * 255) | 0).toString(16).padStart(2, "0");
}
