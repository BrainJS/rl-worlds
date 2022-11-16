export abstract class Transformable {
  x: number = 0;
  y: number = 0;
  w: number = 0;
  h: number = 0;
  transform(x: number, y: number, w: number, h: number): this {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    return this;
  }
  update(dt: number) {}
  updateAll(dt: number) {}
  draw() {}
  drawAll() {}
}
