import {Graphics} from "./graphics";
import {Transformable} from "./transformable";

export class Explosion extends Transformable {
  time: number = 0;
  exploded: boolean = false;
  constructor(private graphics: Graphics) {
    super();
  }
  update(dt: number) {
    this.time += dt;

  }
  draw() {
    if (!this.exploded) return;
    const oldLineWidth = this.graphics.getLineWidth();
    this.graphics.setLineWidth(0.5);
    const [
      oldColorR,
      oldColorG,
      oldColorB,
      oldColorA
    ] = this.graphics.getColor();
    this.graphics
      .setColor(1, 2 * this.time, 0)
      .circle("line", this.x, this.y, 3 * this.time)
      .setColor(oldColorR, oldColorG, oldColorB, oldColorA)
      .setLineWidth(oldLineWidth);
  }
}
