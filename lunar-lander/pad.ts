import {Graphics} from "./graphics";
import {Transformable} from "./transformable";
import {Wall} from "./wall";

export class Pad extends Transformable {
  groundPoint: Wall;
  constructor(
    private graphics: Graphics,
    private walls: Wall[]
  ) {
    super();
    const groundPoints = [];
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      if (wall.x > 0.2 && wall.x < 0.8) {
        groundPoints.push(wall);
      }
    }
    this.groundPoint = groundPoints[Math.round(Math.random() * (groundPoints.length - 1))];
    this.transform(
      this.groundPoint.x,
      this.groundPoint.y + 0.05,
      0.07,
      0.05
    );
  }
  draw(): void {
    const lineWidth = this.graphics.getLineWidth();
    this.graphics
      .setLineWidth(2 * lineWidth)
      .line([this.x - this.w / 2, this.y, this.x + this.w / 2, this.y])
      .line([this.x, this.y, this.x, this.y - this.h])
      .setLineWidth(lineWidth);
  }
}
