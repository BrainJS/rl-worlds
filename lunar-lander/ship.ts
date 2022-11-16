import {Graphics} from "./graphics";
import {Booster} from "./booster";
import {Transformable} from "./transformable";
import {Explosion} from "./explosion";

export class Ship extends Transformable {
  fuel: number = 3;
  fuelMax: number = 3;
  collision: boolean = false;
  grounded: boolean = false;
  vx: number = 0;
  vy: number = 0;
  ax: number = 0;
  ay: number = 0;
  constructor(
    private graphics: Graphics,
    private explosion: Explosion,
    private boosters: Booster[],
  ) {
    super();
  }
  update(dt: number) {
    if (this.collision) return;
    const gravity = -0.2;
    this.vx += this.ax * dt;
    this.vy += (this.ay + gravity) * dt;
    if (this.grounded) {
      if (this.vy <= 0) {
        this.vx = 0;
        this.vy = 0;
      } else {
        this.grounded = false;
      }
    }
    this.transform(this.x + this.vx * dt, this.y + this.vy * dt, this.w, this.h);
    this.ax = 0;
    this.ay = 0;
    const boosters = this.boosters;
    for (let i = 0; i < boosters.length; i++) {
      const booster = boosters[i];
      this.ax += booster.throttle * booster.ax;
      this.ay += booster.throttle * booster.ay;
    }
    this.explosion.transform(this.x, this.y, this.w, this.h);
    this.explosion.time = 0;
  }
  draw() {
    this.graphics
      .push()
      .translate(this.x, this.y);
    const [
      oldColorR,
      oldColorG,
      oldColorB,
      oldColorA
    ] = this.graphics.getColor();
    // guides
    const xx = this.w / 12;
    const yy = this.h / 12;
    const xTop = 3 * xx;
    const xBottom = 6 * xx;
    const xLegStart = 4 * xx;
    const xLegEnd = 5 * xx; // reused in shipPadCollider.update
    const yTop = 6 * yy;
    const yAngle = yy;
    const yBottom = -4 * yy; // reused in booster1.transform
    const yLeg = -6 * yy;
    // body
    const body = [
      -xBottom,
      yBottom, // bottom left
      -xBottom,
      yAngle, // angle left
      -xTop,
      yTop, // top left
      xTop,
      yTop, // top right
      xBottom,
      yAngle, // angle right
      xBottom,
      yBottom // bottom right
    ];
    this.graphics
      .setColor(0, 0, 0)
      .polygon("fill", body)
      .setColor(1, 1, 1)
      .polygon("line", body)
      // leg left
      .line([-xLegStart, yBottom, -xLegEnd, yLeg])
      // leg right
      .line([xLegStart, yBottom, xLegEnd, yLeg])
      .setColor(oldColorR, oldColorG, oldColorB, oldColorA)
      .pop();
  }
}
