import {Graphics} from "./graphics";
import {Transformable} from "./transformable";

export class RocketWorld {
  cancelled: boolean = false;
  constructor(
    private size: number,
    private graphics: Graphics,
    private transformables: Transformable[],
    private onTick: () => void,
  ) {
    let lastTime = Date.now();
    const draw = () => {
      if (this.cancelled) return;
      const time = Date.now();
      const dt = time - lastTime;
      lastTime = time;
      this.graphics._reset();
      this.update(dt / 1000);
      this.draw();
      onTick();
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
  update(dt: number) {
    for (let i = 0; i < this.transformables.length; i++) {
      if (this.cancelled) break;
      const transformable = this.transformables[i];
      transformable.updateAll(dt);
      transformable.update(dt);
    }
  }
  draw() {
    this.graphics
      .scale(this.size, -this.size)
      .translate(0, -1)
      .setLineWidth(1 / this.size);
    for (let i = 0; i < this.transformables.length; i++) {
      if (this.cancelled) break;
      const transformable = this.transformables[i];
      transformable.drawAll();
      transformable.draw();
    }
  }
  cancel() {
    this.graphics.clear();
    this.cancelled = true;
  }
}
