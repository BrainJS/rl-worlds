import {Graphics} from "./graphics";
import {Transformable} from "./transformable";
import {Ship} from "./ship";

export class FuelGauge extends Transformable {
  constructor(
    private graphics: Graphics,
    private getShip: () => Ship,
  ) {
    super();
  }
  draw() {
    this.graphics.rectangle(
      "line",
      this.x,
      this.y,
      this.w,
      this.h
    );
    const padding = this.h / 6;
    const ratio = this.remainingFuel();
    this.graphics.rectangle(
      "fill",
      this.x + padding,
      this.y + padding,
      (this.w - 2 * padding) * ratio,
      this.h - 2 * padding
    );
  }
  remainingFuel(): number {
    const ship = this.getShip();
    return ship.fuel / ship.fuelMax;
  }
}
