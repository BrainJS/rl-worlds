import {Graphics} from "./graphics";
import {Transformable} from "./transformable";
import {generate, sharpen} from "./terrain-generator";

export class Wall extends Transformable {
  constructor(private graphics: Graphics) {
    super();
  }
  updateAll() {}
  draw() {
    this.graphics
      .push()
      .line([this.x, this.y, this.x + this.w, this.y + this.h])
      .pop();
  }
  static generate(width: number, height: number, graphics: Graphics): Wall[] {
    let x = 0;
    let y = 0;
    let w = 1;
    let h = 0.5;
    let walls = generate(graphics, new Wall(graphics).transform(x, y, w, h));
    for (let i = 0; i < 5; i++) {
      walls = sharpen(graphics, walls);
    }
    return walls;
  }
}
