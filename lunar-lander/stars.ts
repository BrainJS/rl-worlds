import {Graphics} from "./graphics";
import {Transformable} from "./transformable";
import {Wall} from "./wall";

export class Stars extends Transformable {
  points: number[] = [];
  constructor(
    private starsCount: number,
    private graphics: Graphics,
    private walls: Wall[],
  ) {
    super();
  }
  update() {
    while (this.points.length < this.starsCount) {
      const x = Math.random();
      let y = Math.random();
      let distanceMin = 1 / 0;
      let heightMin = 0;
      for (let i = 0; i < this.walls.length; i++) {
        const wall = this.walls[i];
        const distance = Math.abs(wall.x - x);
        if (distance < distanceMin) {
          distanceMin = distance;
          heightMin = wall.y;
        }
      }
      y = y + heightMin;
      this.points.push(x, y);
    }
  }
  draw() {
    this.graphics.points(this.points);
  }
}
