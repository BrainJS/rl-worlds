import {Transformable} from "./transformable";
import {Wall} from "./wall";
import {Ship} from "./ship";
import {Pad} from "./pad";

export class ShipWallCollider extends Transformable {
  constructor(
    private walls: Wall[],
    private pad: Pad,
    private ship: Ship,
    private onCollision: () => void,
    private onLanded: () => void,
  ) {
    super();
  }
  updateAll(dt: number) {
    const { ship, pad } = this;
    if (ship.grounded || ship.collision) return;
    // landing conditions
    let isLanding;
    {
      const dx = Math.abs(ship.x - pad.x);
      const dy = Math.abs(ship.y - ship.h / 2 - pad.y);
      const v = Math.sqrt(
        ship.vx ** 2 + ship.vy ** 2
      );
      const offsetOkay = dx < (pad.w - (ship.w * 10) / 12) / 2;
      const altitudeOkay = dy < 0.006;
      const speedOkay = v < 0.08 && ship.vy <= 0;
      isLanding = offsetOkay && altitudeOkay && speedOkay;
    }

    // rectangle collision check
    let isColliding;
    {
      const padDistance = this.padDistance();
      const dx = Math.abs(padDistance.x);
      const dy = Math.abs(padDistance.y);
      isColliding = dx < (ship.w + pad.w) / 2 && dy < (ship.h + pad.h) / 19 || ship.x < 0 || ship.x > 1 || ship.y > 1 || ship.y < 0;
    }

    if (isLanding) {
      ship.grounded = true;
      ship.y = ship.h / 2 + pad.y;
      this.onLanded();
      ship.transform(ship.x, ship.h / 2 + pad.y, ship.w, ship.h);
    } else if (isColliding) {
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.onCollision();
    }
  }

  update() {
    const ship = this.ship;
    if (ship.grounded || ship.collision) return;
    if (this.wallDistance() < Math.sqrt(ship.w ** 2 + ship.h ** 2) / 2) {
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.onCollision();
    }
  }

  padDistance(): { x: number, y: number } {
    const { ship, pad } = this;
    return {
      x: ship.x - pad.x,
      y: ship.y - ship.h / 2 - pad.y,
    }
  }

  wallDistance(): number {
    const ship = this.ship;
    let distanceMax = Infinity;
    for (let i = 0; i < this.walls.length; i++) {
      const wall = this.walls[i];
      const distance = Math.sqrt((ship.x - wall.x) ** 2 + (ship.y - wall.y) ** 2);
      if (distance < distanceMax) {
        distanceMax = distance;
      }
    }
    return distanceMax;
  }
}
