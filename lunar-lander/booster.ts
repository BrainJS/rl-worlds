import {Graphics} from "./graphics";
import {Ship} from "./ship";
import {Transformable} from "./transformable";
import {Controller} from "./controller";

export class Booster extends Transformable {
  throttle: number = 0;
  ax: number = 0;
  ay: number = 0;
  constructor(
    public type: 'main' | 'left' | 'right',
    public angle: number,
    private graphics: Graphics,
    private controller: Controller,
    private getShip: () => Ship,
    private isBoosting: () => boolean,
  ) {
    super();
    if (type === "main") {
      this.ay = 0.4;
    } else if (type === "left") {
      this.ax = 0.1;
    } else if (type === "right") {
      this.ax = -0.1
    }
  }
  update(dt: number) {
    const ship = this.getShip();
    if (!this.isBoosting() || ship.grounded || ship.collision) {
      this.throttle = 0;
      return;
    }
    this.throttle = 1;
    const consumption = Math.abs(this.ax) + Math.abs(this.ay);
    ship.fuel -= consumption * dt;
    if (ship.fuel <= 0) {
      ship.fuel = 0;
      this.throttle = 0;
    }
  }
  draw() {
    if (this.throttle <= 0) return;
    const ship = this.getShip();
    this.graphics
      .push()
      .translate(
        ship.x,
        ship.y
      );
    this.graphics
      .translate(this.x, this.y)
      .rotate(this.angle);
    const [
      oldColorR,
      oldColorG,
      oldColorB,
      oldColorA
    ] = this.graphics.getColor();
    this.graphics.setColor(1, Math.random(), 0);
    const rand = Math.random() * 0.5 + 0.5;
    if (this.type === "main") {
      this.graphics
        .polygon(
          "fill",
          [
            -this.w / 2,
            0,
            -this.w / 3,
            (-this.h / 2) * rand,
            -this.w / 4,
            0
          ]
        )
        .polygon(
          "fill",
          [
            -this.w / 4,
            0,
            0,
            -this.h * rand,
            this.w / 4,
            0
          ]
        )
        .polygon(
          "fill",
          [
            this.w / 4,
            0,
            this.w / 3,
            (-this.h / 2) * rand,
            this.w / 2,
            0
          ]
        );
    } else {
      this.graphics.polygon(
        "fill",
          [
            -this.w / 2,
            0,
            0,
            (-this.h / 2) * rand,
            this.w / 2,
            0
          ]
      );
    }
    this.graphics
      .setColor(oldColorR, oldColorG, oldColorB, oldColorA)
      .pop();
  }
}
